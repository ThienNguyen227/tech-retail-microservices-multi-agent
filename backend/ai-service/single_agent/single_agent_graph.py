import os
import time
import logging

from dotenv import load_dotenv
from pymongo import MongoClient
from langchain_ollama import ChatOllama

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    trim_messages,
)

from langchain_google_genai import ChatGoogleGenerativeAI

from langgraph.graph import (
    StateGraph,
    MessagesState,
    START,
    END,
)

from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.mongodb import MongoDBSaver

from .single_agent_prompt import SINGLE_AGENT_PROMPT

from tools.product_tools import (
    get_phone_detail,
    get_laptop_detail,
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
    search_products,
)

from tools.user_tools import (
    search_user,
)

from tools.customer_tools import (
    search_customer,
    get_customer_addresses,
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# LOGGING
# ============================================================

logger = logging.getLogger(__name__)


# ============================================================
# LLM CONFIGURATION
# ============================================================

# # Model chính: xử lý câu hỏi và quyết định gọi Tool
# llm = ChatGoogleGenerativeAI(
#     model="gemini-3.5-flash-lite",
#     google_api_key=os.getenv("GOOGLE_API_KEY"),
#     max_tokens=1024,
#     timeout=60,
#     max_retries=1,
#     reasoning_effort="minimal",
# )


# # Model tóm tắt lịch sử hội thoại
# summarizer_llm = ChatGoogleGenerativeAI(
#     model="gemini-3.1-flash-lite",
#     google_api_key=os.getenv("GOOGLE_SUMMARIZE_API_KEY"),
#     max_tokens=500,
#     timeout=60,
#     max_retries=1,
#     reasoning_effort="minimal",
# )

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")

# Model chính
llm = ChatOllama(
    model="qwen3.5:4b",
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    reasoning=False,
    num_ctx=16384,
    num_predict=512,
    keep_alive="30m",
)

# Model tóm tắt
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

]


# LLM có quyền quyết định gọi Tool
llm_with_tools = llm.bind_tools(tools)

# ToolNode thực thi các Tool được yêu cầu
tool_node = ToolNode(tools)


# ============================================================
# TOOL USAGE POLICY
# ============================================================

TOOL_USAGE_POLICY = """
QUY TẮC SỬ DỤNG TOOL:

1. Chọn Tool phù hợp và cụ thể nhất với yêu cầu người dùng.

2. Ưu tiên sử dụng một Tool duy nhất nếu Tool đó có thể
   xử lý đầy đủ yêu cầu.

3. Khi so sánh điện thoại:
   - Ưu tiên compare_phones.
   - Không gọi search_products trước nếu compare_phones
     đã có khả năng tìm và lấy dữ liệu của hai sản phẩm.
   - Không gọi lại compare_phones với cùng tham số.

4. Khi so sánh laptop:
   - Ưu tiên compare_laptops.

5. Khi so sánh tablet:
   - Ưu tiên compare_tablets.

6. Khi người dùng chỉ muốn xem thông tin chi tiết một sản phẩm:
   - Sử dụng Tool detail tương ứng.

7. Chỉ sử dụng search_products khi cần tìm kiếm sản phẩm
   hoặc khi không có Tool chuyên biệt phù hợp.

8. Không gọi lại Tool chỉ để kiểm tra dữ liệu đã có.

9. Không gọi nhiều Tool có chức năng trùng lặp.

10. Với User và Customer:
    - Chỉ gọi Tool thuộc nghiệp vụ tương ứng.
    - Không tự suy diễn dữ liệu cá nhân.

11. Ưu tiên sử dụng kết quả Tool đã trả về.
    Không tự tạo thông số hoặc giá sản phẩm.
"""


# ============================================================
# CONFIGURATION
# ============================================================

MAX_HISTORY_TOKENS = 5000

SUMMARY_TRIGGER_TOKENS = 4000

KEEP_RECENT_TOKENS = 1500


# ============================================================
# STATE
# ============================================================

class SingleAgentState(MessagesState):

    summary: str

    summarized_message_count: int


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def content_to_text(content):
    """
    Chuyển nội dung message thành string.
    Hỗ trợ string và content dạng list.
    """

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


def count_tokens(messages):
    """
    Đếm token của danh sách messages.
    """

    if not messages:
        return 0

    try:

        return llm.get_num_tokens_from_messages(messages)

    except Exception:

        logger.exception("[TOKEN COUNT ERROR]")

        raise


def normalize_summarized_count(value, total_messages):
    """
    Kiểm tra summarized_message_count.
    """

    if not isinstance(value, int):
        return 0

    return max(
        0,
        min(value, total_messages),
    )


def find_recent_start(messages, max_tokens):
    """
    Tìm vị trí bắt đầu của phần lịch sử gần nhất.

    Sử dụng Binary Search thay vì duyệt từng message.
    Giảm số lần gọi hàm đếm token.
    """

    left = 0

    right = len(messages)

    while left < right:

        mid = (left + right) // 2

        tokens = count_tokens(
            messages[mid:]
        )

        if tokens <= max_tokens:

            right = mid

        else:

            left = mid + 1

    return left


def build_model_messages(state):
    """
    Chuẩn bị lịch sử hội thoại cho LLM.

    - Đưa System Prompt vào đầu.
    - Đưa Summary nếu có.
    - Chỉ lấy lịch sử chưa được tóm tắt.
    - Giữ lại HumanMessage hiện tại.
    - Giới hạn token đầu vào.
    """

    history = state.get("messages", [])

    if not history:

        raise RuntimeError(
            "Không có message trong hội thoại."
        )

    summary = state.get("summary", "")

    summarized_count = normalize_summarized_count(
        state.get("summarized_message_count", 0),
        len(history),
    )

    # Tìm HumanMessage gần nhất
    last_human_index = next(
        (
            i
            for i in range(len(history) - 1, -1, -1)
            if history[i].type == "human"
        ),
        None,
    )

    if last_human_index is None:

        raise RuntimeError(
            "Không tìm thấy HumanMessage."
        )

    # Không loại bỏ câu hỏi hiện tại
    start_index = min(
        summarized_count,
        last_human_index,
    )

    recent_messages = history[start_index:]

    # Cắt lịch sử
    trimmed_messages = trim_messages(
        recent_messages,
        strategy="last",
        token_counter=llm,
        max_tokens=MAX_HISTORY_TOKENS,
        start_on="human",
        include_system=False,
    )

    # Fallback khi trim trả về rỗng
    if not trimmed_messages:

        logger.warning(
            "trim_messages trả về rỗng. "
            "Sử dụng lịch sử từ HumanMessage gần nhất."
        )

        trimmed_messages = history[last_human_index:]

    if not trimmed_messages:

        raise RuntimeError(
            "Không có nội dung hội thoại để gửi vào LLM."
        )

    # Xây dựng input
    messages = [

        SystemMessage(
            content=SINGLE_AGENT_PROMPT
        ),

        SystemMessage(
            content=TOOL_USAGE_POLICY
        ),

    ]

    if summary:

        messages.append(
            SystemMessage(
                content=(
                    "TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ:\n"
                    f"{summary}\n"
                    "Sử dụng thông tin này làm ngữ cảnh."
                )
            )
        )

    messages.extend(trimmed_messages)

    return messages


# ============================================================
# SUMMARIZE NODE
# ============================================================

async def summarize_node(state: SingleAgentState):

    messages = state["messages"]

    summary = state.get("summary", "")

    summarized_count = normalize_summarized_count(
        state.get("summarized_message_count", 0),
        len(messages),
    )

    unsummarized_messages = messages[summarized_count:]

    total_tokens = count_tokens(
        unsummarized_messages
    )

    print("\n========== SUMMARIZE NODE ==========")

    print(
        "Token lịch sử chưa tóm tắt:",
        total_tokens,
    )

    # Chưa cần summarize
    if total_tokens <= SUMMARY_TRIGGER_TOKENS:

        print("Chưa cần tóm tắt.")

        return {}

    # Giữ lại lịch sử gần nhất
    recent_start = find_recent_start(
        unsummarized_messages,
        KEEP_RECENT_TOKENS,
    )

    old_messages = unsummarized_messages[:recent_start]

    if not old_messages:

        print("Không có message cũ để tóm tắt.")

        return {}

    # Chuẩn bị lịch sử
    history_text = "\n".join(
        f"{msg.type}: {content_to_text(msg.content)}"
        for msg in old_messages
    )

    start_time = time.perf_counter()

    try:

        response = await summarizer_llm.ainvoke([

            SystemMessage(
                content="""
Bạn là hệ thống tóm tắt lịch sử hội thoại.

Hãy kết hợp bản tóm tắt trước với lịch sử mới.

Giữ lại:
- Thông tin người dùng đã cung cấp.
- Nhu cầu, mục tiêu và sở thích đã nêu.
- Sản phẩm, thông số và kết quả đã xác nhận.
- Các quyết định và thông tin cần thiết để tiếp tục hội thoại.

Không tự suy diễn hoặc tạo thông tin không có trong lịch sử.

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

        ])

        summary_text = content_to_text(
            response.content
        ).strip()

        if not summary_text:

            raise ValueError(
                "Summarizer trả về nội dung rỗng."
            )

        new_summarized_count = (
            summarized_count + len(old_messages)
        )

        elapsed = time.perf_counter() - start_time

        print(
            f"[SUMMARIZE LATENCY] {elapsed:.2f}s"
        )

        print(
            "Số message đã tóm tắt:",
            len(old_messages),
        )

        print(
            "Summary tokens:",
            count_tokens([
                SystemMessage(content=summary_text)
            ]),
        )

        return {

            "summary": summary_text,

            "summarized_message_count": new_summarized_count,

        }

    except Exception:

        logger.exception(
            "[SUMMARIZER ERROR]"
        )

        raise


# ============================================================
# LLM NODE
# ============================================================

async def call_model(state: SingleAgentState):
    """
    Lần gọi Gemini thứ nhất.

    Nhiệm vụ:
    - Phân tích câu hỏi.
    - Quyết định có cần Tool hay không.
    - Chọn Tool phù hợp.
    """

    messages = build_model_messages(state)

    print("\n========== LLM NODE ==========")

    print(
        "Số message gửi vào Gemini:",
        len(messages),
    )

    start_time = time.perf_counter()

    try:

        response = await llm_with_tools.ainvoke(
            messages
        )

        elapsed = time.perf_counter() - start_time

        print(
            f"[GEMINI LATENCY] {elapsed:.2f}s"
        )

        print(
            "Tool calls:",
            [
                call.get("name")
                for call in response.tool_calls
            ],
        )

        print(
            "Response content:",
            repr(content_to_text(response.content)[:300]),
        )

        if response.invalid_tool_calls:

            logger.warning(
                "Invalid Tool calls: %s",
                response.invalid_tool_calls,
            )

        return {
            "messages": [response]
        }

    except Exception:

        logger.exception(
            "[GEMINI LLM ERROR]"
        )

        raise


# ============================================================
# ROUTER
# ============================================================

def route_after_llm(state: SingleAgentState):
    """
    Nếu Gemini yêu cầu Tool:
        Chuyển sang Tool Node.

    Nếu Gemini đã trả lời:
        Kết thúc Graph.

    Không cho phép quay lại LLM sau Tool Node.
    """

    messages = state.get("messages", [])

    if not messages:
        return END

    last_message = messages[-1]

    tool_calls = getattr(
        last_message,
        "tool_calls",
        [],
    )

    if tool_calls:

        return "tools"

    return END


# ============================================================
# TOOL NODE
# ============================================================

async def execute_tools(state: SingleAgentState):
    """
    Thực thi các Tool được Gemini yêu cầu.

    ToolNode hỗ trợ thực thi nhiều Tool calls
    trong cùng một lượt.
    """

    print("\n========== TOOL NODE ==========")

    messages = state.get("messages", [])

    if messages:

        last_message = messages[-1]

        tool_calls = getattr(
            last_message,
            "tool_calls",
            [],
        )

        print(
            "Số Tool được yêu cầu:",
            len(tool_calls),
        )

        for call in tool_calls:

            logger.info(
                "Executing Tool: %s",
                call.get("name"),
            )

    start_time = time.perf_counter()

    try:

        result = await tool_node.ainvoke(
            state
        )

        elapsed = time.perf_counter() - start_time

        tool_messages = result.get(
            "messages",
            [],
        )

        print(
            f"[TOOL LATENCY] {elapsed:.2f}s"
        )

        print(
            "Số Tool đã thực thi:",
            len(tool_messages),
        )

        for message in tool_messages:

            logger.info(
                "Tool completed: name=%s, content_length=%s",
                getattr(message, "name", None),
                len(content_to_text(message.content)),
            )

        return result

    except Exception:

        logger.exception(
            "[TOOL EXECUTION ERROR]"
        )

        raise


# ============================================================
# FINAL ANSWER NODE
# ============================================================

async def final_answer(state: SingleAgentState):
    """
    Lần gọi Gemini thứ hai.

    Nhiệm vụ:
    - Đọc kết quả các Tool.
    - Tổng hợp thông tin.
    - Trả lời người dùng.

    Không bind Tool ở bước này.
    Vì vậy không thể tiếp tục gọi Tool.
    """

    print("\n========== FINAL ANSWER NODE ==========")

    messages = build_model_messages(state)

    messages.append(
        SystemMessage(
            content="""
BẠN ĐANG Ở BƯỚC TỔNG HỢP KẾT QUẢ TOOL.

Hãy sử dụng kết quả Tool đã có trong lịch sử hội thoại
để trả lời yêu cầu của người dùng.

Yêu cầu:
- Trả lời trực tiếp, rõ ràng và dễ hiểu.
- Không gọi thêm Tool.
- Không tự tạo dữ liệu sản phẩm.
- Không suy diễn thông số hoặc giá chưa được xác nhận.
- Nếu dữ liệu Tool trả về thiếu, hãy nói rõ phần còn thiếu.
- Không lặp lại quá nhiều thông tin không cần thiết.
"""
        )
    )

    start_time = time.perf_counter()

    try:

        # Sử dụng LLM không bind Tools
        response = await llm.ainvoke(
            messages
        )

        elapsed = time.perf_counter() - start_time

        print(
            f"[FINAL GEMINI LATENCY] {elapsed:.2f}s"
        )

        print(
            "Final response:",
            repr(content_to_text(response.content)[:500]),
        )

        return {
            "messages": [response]
        }

    except Exception:

        logger.exception(
            "[FINAL ANSWER ERROR]"
        )

        raise


# ============================================================
# BUILD LANGGRAPH
# ============================================================

builder = StateGraph(SingleAgentState)


# Register Nodes
builder.add_node(
    "summarize",
    summarize_node,
)

builder.add_node(
    "llm",
    call_model,
)

builder.add_node(
    "tools",
    execute_tools,
)

builder.add_node(
    "final_answer",
    final_answer,
)


# START -> SUMMARIZE -> LLM
builder.add_edge(
    START,
    "summarize",
)

builder.add_edge(
    "summarize",
    "llm",
)


# LLM -> TOOLS or END
builder.add_conditional_edges(
    "llm",
    route_after_llm,
    {
        "tools": "tools",
        END: END,
    },
)


# TOOLS -> FINAL ANSWER
builder.add_edge(
    "tools",
    "final_answer",
)


# FINAL ANSWER -> END
builder.add_edge(
    "final_answer",
    END,
)


# ============================================================
# MONGODB CHECKPOINTER
# ============================================================

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:

    raise RuntimeError(
        "Thiếu biến môi trường MONGODB_URI."
    )


mongo_client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000,
)


checkpointer = MongoDBSaver(
    mongo_client,
    db_name="single_agent_service",
)


# ============================================================
# COMPILE GRAPH
# ============================================================

single_agent = builder.compile(
    checkpointer=checkpointer,
)


print(
    "[SINGLE AGENT] Optimized Graph initialized successfully."
)

