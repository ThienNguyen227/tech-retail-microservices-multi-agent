import os
import time
import logging
from typing import List, TypedDict

from dotenv import load_dotenv
from pymongo import MongoClient

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.mongodb import MongoDBSaver

from .single_agent_prompt import SINGLE_AGENT_PROMPT

# PRODUCT-SERVICE TOOLS
from tools.product_tools import (
    get_phone_detail,
    get_laptop_detail,
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
    search_products,
)

# USER-SERVICE TOOLS
from tools.user_tools import search_user

# CUSTOMER-SERVICE TOOLS
from tools.customer_tools import (
    search_customer,
    get_customer_addresses,
)

# ORDER-SERVICE TOOLS
# from tools.order_tools import create_order


load_dotenv()
logger = logging.getLogger(__name__)


# ============================================================
# LLM CONFIGURATION
# ============================================================

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")

if not OLLAMA_BASE_URL:
    raise RuntimeError("Thiếu biến môi trường OLLAMA_BASE_URL.")

# LLM chính: suy luận, quyết định gọi Tool và tạo câu trả lời cuối.
llm = ChatOllama(
    model="qwen3.5:4b",
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    reasoning=False,
    num_ctx=16384,
    num_predict=512,
    keep_alive="30m",
)

# LLM tóm tắt lịch sử hội thoại.
# Hiện tại dùng cùng model Ollama nhưng cấu hình context/output nhỏ hơn.
summarizer_llm = ChatOllama(
    model="qwen3.5:4b",
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    reasoning=False,
    num_ctx=16384,
    num_predict=256,
    keep_alive="30m",
)


# ============================================================
# TOOL CONFIGURATION
# ============================================================

tools = [
    # PRODUCT TOOLS
    get_phone_detail,
    get_laptop_detail,
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
    search_products,

    # USER TOOLS
    search_user,

    # CUSTOMER TOOLS
    search_customer,
    get_customer_addresses,

    # ORDER-TOOLS
    # create_order,
]

# Một LLM duy nhất có quyền lựa chọn các Tool.
llm_with_tools = llm.bind_tools(tools)

# ToolNode thực thi Tool calls do LLM yêu cầu.
tool_node = ToolNode(tools)

# ============================================================
# HISTORY CONFIGURATION
# ============================================================

# Giới hạn token dành cho các lượt hội thoại cũ chưa được tóm tắt.
# Lượt hỏi hiện tại và toàn bộ Tool calls thuộc lượt đó luôn được giữ nguyên.
MAX_HISTORY_TOKENS = 5000

# Khi lịch sử chưa tóm tắt vượt ngưỡng này, bắt đầu summarize.
SUMMARY_TRIGGER_TOKENS = 4000

# Cố gắng giữ lại các lượt hội thoại gần nhất trong khoảng token này.
KEEP_RECENT_TOKENS = 1500


# ============================================================
# STATE
# ============================================================

class SingleAgentState(MessagesState):
    summary: str
    summarized_message_count: int

# ============================================================
# RUNTIME CONTEXT
# ============================================================

class AgentRuntimeContext(TypedDict):
    user_id: str
    access_token: str

# ============================================================
# HELPER FUNCTIONS
# ============================================================

def content_to_text(content) -> str:
    """Chuyển nội dung message thành string, hỗ trợ string và list."""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []

        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)

        return "\n".join(parts)

    return str(content) if content is not None else ""


def count_tokens(messages) -> int:
    """Đếm token của danh sách LangChain messages."""

    if not messages:
        return 0

    try:
        return llm.get_num_tokens_from_messages(messages)
    except Exception:
        logger.exception("[TOKEN COUNT ERROR]")
        raise


def normalize_summarized_count(value, total_messages: int) -> int:
    """Đảm bảo summarized_message_count nằm trong phạm vi hợp lệ."""

    if not isinstance(value, int):
        return 0

    return max(0, min(value, total_messages))


def get_safe_summarized_count(messages, value) -> int:
    """
    Đưa vị trí bắt đầu phần chưa summarize về đầu một lượt hội thoại.

    Điều này giúp tránh trường hợp checkpoint cũ có summarized_message_count
    nằm giữa một cặp AI tool call và ToolMessage.
    """

    index = normalize_summarized_count(value, len(messages))

    if 0 < index < len(messages):
        while index > 0 and messages[index].type != "human":
            index -= 1

    return index


def split_messages_into_turns(messages) -> List[list]:
    """
    Chia lịch sử thành từng lượt hội thoại.

    Một lượt bắt đầu tại HumanMessage và bao gồm các AIMessage/ToolMessage
    phát sinh cho đến trước HumanMessage tiếp theo. Vì vậy một chuỗi Tool
    Calling được giữ nguyên, không bị cắt rời giữa AI tool call và ToolMessage.
    """

    turns = []
    current_turn = []

    for message in messages:
        if message.type == "human" and current_turn:
            turns.append(current_turn)
            current_turn = []

        current_turn.append(message)

    if current_turn:
        turns.append(current_turn)

    return turns


def select_recent_complete_turns(messages, max_tokens: int) -> list:
    """Giữ các lượt hội thoại hoàn chỉnh gần nhất trong giới hạn token."""

    if not messages:
        return []

    turns = split_messages_into_turns(messages)
    selected_turns = []
    used_tokens = 0

    for turn in reversed(turns):
        turn_tokens = count_tokens(turn)

        if used_tokens + turn_tokens <= max_tokens:
            selected_turns.insert(0, turn)
            used_tokens += turn_tokens
            continue

        # Nếu riêng lượt gần nhất đã vượt ngân sách, vẫn giữ nguyên lượt đó
        # để không làm mất cặp Tool call / Tool result.
        if not selected_turns:
            selected_turns = [turn]

        break

    return [message for turn in selected_turns for message in turn]


def build_model_messages(state: SingleAgentState) -> list:
    """
    Chuẩn bị input cho Agent LLM.

    - System Prompt và Tool Policy luôn nằm đầu input.
    - Đưa Summary vào nếu có.
    - Chỉ lấy phần lịch sử chưa được summarize.
    - Giới hạn các lượt hội thoại cũ bằng MAX_HISTORY_TOKENS.
    - Giữ nguyên toàn bộ lượt hiện tại, bao gồm các Tool calls/results.
    """

    history = state.get("messages", [])

    if not history:
        raise RuntimeError("Không có message trong hội thoại.")

    summary = state.get("summary", "")

    summarized_count = get_safe_summarized_count(
        history,
        state.get("summarized_message_count", 0),
    )

    # Tìm HumanMessage gần nhất, tức điểm bắt đầu lượt hiện tại.
    last_human_index = next(
        (
            index
            for index in range(len(history) - 1, -1, -1)
            if history[index].type == "human"
        ),
        None,
    )

    if last_human_index is None:
        raise RuntimeError("Không tìm thấy HumanMessage.")

    # Các lượt cũ chưa được summarize.
    previous_messages = history[
        min(summarized_count, last_human_index):last_human_index
    ]

    # Giữ các lượt cũ hoàn chỉnh gần nhất trong giới hạn token.
    recent_previous_messages = select_recent_complete_turns(
        previous_messages,
        MAX_HISTORY_TOKENS,
    )

    # Không trim lượt hiện tại để bảo toàn chuỗi Tool Calling.
    current_turn_messages = history[last_human_index:]

    model_messages = [
        SystemMessage(content=SINGLE_AGENT_PROMPT),
    ]

    if summary:
        model_messages.append(
            SystemMessage(
                content=(
                    "TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ:\n"
                    f"{summary}\n"
                    "Sử dụng thông tin này làm ngữ cảnh. "
                    "Nếu thông tin trong kết quả Tool mới nhất mâu thuẫn "
                    "với Summary, ưu tiên kết quả Tool mới nhất."
                )
            )
        )

    model_messages.extend(recent_previous_messages)
    model_messages.extend(current_turn_messages)

    return model_messages


# ============================================================
# SUMMARIZE NODE
# ============================================================

async def summarize_node(state: SingleAgentState):
    """Tóm tắt các lượt hội thoại cũ, giữ nguyên các lượt gần nhất."""

    messages = state.get("messages", [])
    summary = state.get("summary", "")

    summarized_count = get_safe_summarized_count(
        messages,
        state.get("summarized_message_count", 0),
    )

    unsummarized_messages = messages[summarized_count:]
    total_tokens = count_tokens(unsummarized_messages)

    print("\n========== SUMMARIZE NODE ==========")
    print("Token lịch sử chưa tóm tắt:", total_tokens)

    if total_tokens <= SUMMARY_TRIGGER_TOKENS:
        print("Chưa cần tóm tắt.")
        return {}

    # Chia theo lượt hội thoại để không cắt giữa Tool call và Tool result.
    turns = split_messages_into_turns(unsummarized_messages)

    recent_turns = []
    recent_tokens = 0

    for turn in reversed(turns):
        turn_tokens = count_tokens(turn)

        if recent_tokens + turn_tokens <= KEEP_RECENT_TOKENS:
            recent_turns.insert(0, turn)
            recent_tokens += turn_tokens
            continue

        # Một lượt riêng lẻ có thể lớn hơn KEEP_RECENT_TOKENS.
        # Vẫn giữ nguyên lượt gần nhất, không chia nhỏ Tool call sequence.
        if not recent_turns:
            recent_turns = [turn]

        break

    number_of_recent_messages = sum(len(turn) for turn in recent_turns)
    old_turns = turns[:len(turns) - len(recent_turns)] if recent_turns else turns
    old_messages = [message for turn in old_turns for message in turn]

    if not old_messages:
        print("Không có lượt hội thoại cũ hoàn chỉnh để tóm tắt.")
        return {}

    history_text = "\n".join(
        f"{message.type}: {content_to_text(message.content)}"
        for message in old_messages
    )

    start_time = time.perf_counter()

    try:
        response = await summarizer_llm.ainvoke(
            [
                SystemMessage(
                    content="""
                        Bạn là hệ thống tóm tắt lịch sử hội thoại.

                        Hãy kết hợp bản tóm tắt trước với lịch sử mới.

                        Giữ lại:
                        - Thông tin người dùng đã cung cấp.
                        - Nhu cầu, mục tiêu và sở thích đã nêu.
                        - Sản phẩm, thông số và kết quả đã được Tool xác nhận.
                        - Các quyết định và thông tin cần thiết để tiếp tục hội thoại.
                        - Những ID hoặc dữ liệu định danh đã được xác nhận và còn cần thiết
                        cho các bước nghiệp vụ tiếp theo.

                        Không tự suy diễn hoặc tạo thông tin không có trong lịch sử.
                        Không biến thông tin chưa xác nhận thành sự thật.
                        Tóm tắt ngắn gọn bằng tiếng Việt.
                        """
                ),
                HumanMessage(
                    content=f"""
BẢN TÓM TẮT TRƯỚC:

{summary or "Chưa có"}

LỊCH SỬ CẦN TÓM TẮT:

{history_text}
"""
                ),
            ]
        )

        summary_text = content_to_text(response.content).strip()

        if not summary_text:
            raise ValueError("Summarizer trả về nội dung rỗng.")

        # Chỉ tăng bộ đếm theo các message thuộc những lượt đã summarize.
        new_summarized_count = summarized_count + len(old_messages)
        elapsed = time.perf_counter() - start_time

        print(f"[SUMMARIZE LATENCY] {elapsed:.2f}s")
        print("Số message đã tóm tắt:", len(old_messages))
        print("Số message giữ lại:", number_of_recent_messages)
        print(
            "Summary tokens:",
            count_tokens([SystemMessage(content=summary_text)]),
        )

        return {
            "summary": summary_text,
            "summarized_message_count": new_summarized_count,
        }

    except Exception:
        logger.exception("[SUMMARIZER ERROR]")
        raise


# ============================================================
# AGENT NODE
# ============================================================

async def call_model(state: SingleAgentState):
    """
    Agent Node (ReAct-style).

    Mỗi lần chạy:
    - Đọc yêu cầu, Summary và lịch sử hội thoại.
    - Quan sát kết quả Tool trước đó nếu có.
    - Quyết định gọi Tool tiếp theo hoặc trả lời cuối cùng.

    Node này được gọi lặp lại sau mỗi lần Tool thực thi.
    """

    messages = build_model_messages(state)

    print("\n========== AGENT NODE ==========")
    print("Số message gửi vào LLM:", len(messages))

    start_time = time.perf_counter()

    try:
        response = await llm_with_tools.ainvoke(messages)

        elapsed = time.perf_counter() - start_time
        tool_calls = getattr(response, "tool_calls", []) or []

        print(f"[AGENT LLM LATENCY] {elapsed:.2f}s")
        print("Tool calls:", [call.get("name") for call in tool_calls])
        print(
            "Response content:",
            repr(content_to_text(response.content)[:500]),
        )

        if getattr(response, "invalid_tool_calls", None):
            logger.warning(
                "Invalid Tool calls: %s",
                response.invalid_tool_calls,
            )

        # Nếu không có Tool call, đây chính là câu trả lời cuối của Agent.
        return {"messages": [response]}

    except Exception:
        logger.exception("[AGENT LLM ERROR]")
        raise


# ============================================================
# ROUTER
# ============================================================

def route_after_agent(state: SingleAgentState):
    """
    Có Tool calls -> chuyển sang Tools.
    Không có Tool calls -> kết thúc Graph.

    Sau khi Tools chạy xong, Graph sẽ quay lại Agent Node.
    """

    messages = state.get("messages", [])

    if not messages:
        return END

    last_message = messages[-1]
    tool_calls = getattr(last_message, "tool_calls", []) or []

    if tool_calls:
        return "tools"

    return END

# ============================================================
# BUILD LANGGRAPH - REACT LOOP
# ============================================================

builder = StateGraph(SingleAgentState, context_schema=AgentRuntimeContext)

# Register Nodes
builder.add_node("summarize", summarize_node)
builder.add_node("agent", call_model)
builder.add_node("tools", tool_node)

# START -> SUMMARIZE -> AGENT
builder.add_edge(START, "summarize")
builder.add_edge("summarize", "agent")

# Agent quyết định gọi Tool hay trả lời cuối.
builder.add_conditional_edges(
    "agent",
    route_after_agent,
    {
        "tools": "tools",
        END: END,
    },
)

# QUAN TRỌNG:
# Sau khi Tool thực thi, quay lại Agent để đọc kết quả và quyết định bước tiếp.
builder.add_edge("tools", "agent")


# ============================================================
# MONGODB CHECKPOINTER
# ============================================================

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("Thiếu biến môi trường MONGODB_URI.")

mongo_client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="single_agent_service",
)

single_agent = builder.compile(checkpointer=checkpointer)

