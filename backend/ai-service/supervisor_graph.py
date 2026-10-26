import os
from typing import Any

from dotenv import load_dotenv
from pymongo import MongoClient

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    trim_messages,
)
from langchain_ollama import ChatOllama

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.mongodb import MongoDBSaver

from prompt import SUPERVISOR_PROMPT

from user_service_graph import user_agent
from customer_service_graph import customer_agent

load_dotenv()


# ==================== LLM ====================

llm = ChatOllama(
    model="deepseek-r1:7b",
    max_tokens=1024,
    temperature=0,
)

summarizer_llm = ChatOllama(
    model="deepseek-r1:7b",
    max_tokens=500,
    temperature=0,
)


# ==================== CONFIG ====================

MAX_HISTORY_TOKENS = 5000
SUMMARY_TRIGGER_TOKENS = 4000
KEEP_RECENT_TOKENS = 1500


# ==================== STATE ====================

class SupervisorState(MessagesState):
    # Context điều phối nghiệp vụ
    task: str
    target_graph: str
    phone: str | None
    email: str | None
    user_id: str | None
    result: Any
    error: str | None

    # Context quản lý lịch sử
    summary: str
    summarized_message_count: int


# ==================== HELPER ====================

def count_tokens(messages):
    return llm.get_num_tokens_from_messages(messages)


def find_recent_start(messages, max_tokens):
    total_tokens = 0
    start_index = len(messages)

    for i in range(len(messages) - 1, -1, -1):
        message_tokens = count_tokens([messages[i]])

        if total_tokens + message_tokens > max_tokens:
            break

        total_tokens += message_tokens
        start_index = i

    return start_index


# ==================== SUMMARIZE NODE ====================

async def summarize_node(state: SupervisorState):
    messages = state["messages"]

    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    unsummarized_messages = messages[summarized_count:]
    total_tokens = count_tokens(unsummarized_messages)

    print("\n========== SUPERVISOR SUMMARIZE ==========")
    print("Token lịch sử chưa tóm tắt:", total_tokens)

    if total_tokens <= SUMMARY_TRIGGER_TOKENS:
        return {}

    recent_start = find_recent_start(
        unsummarized_messages,
        KEEP_RECENT_TOKENS,
    )

    old_messages = unsummarized_messages[:recent_start]

    if not old_messages:
        return {}

    history_text = "\n".join(
        f"{msg.type}: {msg.content}"
        for msg in old_messages
    )

    response = await summarizer_llm.ainvoke([
        SystemMessage(
            content="""
Bạn tóm tắt lịch sử hội thoại của Supervisor Agent.

Giữ lại:
- Yêu cầu và mục tiêu của người dùng.
- Nghiệp vụ đang xử lý và graph đã được gọi.
- Các thông tin định danh như phone, email, user_id
  khi chúng xuất hiện trong lịch sử.
- Kết quả nghiệp vụ đã được xác minh.
- Những bước đã hoàn thành và bước còn cần thực hiện.
- Lỗi hoặc dữ liệu chưa xác minh nếu có.

Quy tắc:
- Không tự tạo dữ liệu hoặc suy diễn kết quả.
- Phân biệt dữ liệu đã xác minh và dữ liệu chưa xác minh.
- Không đưa mật khẩu, token hoặc thông tin xác thực
  nhạy cảm vào bản tóm tắt.
- Tóm tắt ngắn gọn bằng tiếng Việt.
- Không xem bản tóm tắt là nguồn xác minh dữ liệu nghiệp vụ.
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

    return {
        "summary": response.content,
        "summarized_message_count": (
            summarized_count + len(old_messages)
        ),
    }


# ==================== SUPERVISOR NODE ====================

async def supervisor_node(state: SupervisorState):
    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    recent_messages = state["messages"][summarized_count:]

    trimmed_messages = trim_messages(
        recent_messages,
        strategy="last",
        token_counter=llm,
        max_tokens=MAX_HISTORY_TOKENS,
        start_on="human",
        include_system=False,
    )

    messages = [
        SystemMessage(content=SUPERVISOR_PROMPT),
    ]

    if summary:
        messages.append(
            SystemMessage(
                content=(
                    "TÓM TẮT HỘI THOẠI:\n"
                    f"{summary}\n"
                    "Dùng bản tóm tắt để hiểu ngữ cảnh, "
                    "không dùng nó thay cho dữ liệu nghiệp vụ "
                    "đã được xác minh."
                )
            )
        )

    messages.extend(trimmed_messages)

    # Các trường state có cấu trúc vẫn được giữ riêng,
    # không phụ thuộc hoàn toàn vào nội dung summary.
    response = await llm.ainvoke(messages)

    # Node này kỳ vọng Supervisor trả về cấu trúc
    # task/target_graph/phone/email ở bước phân loại.
    # Xem phần lưu ý bên dưới về cách parse kết quả.
    return {"messages": [response]}


# ==================== ROUTING ====================

def route_after_supervisor(state: SupervisorState):
    """
    Hàm này cần đọc target_graph đã được phân loại
    và kiểm tra hợp lệ trước khi điều phối.
    """
    target = state.get("target_graph")

    if target == "user_service":
        return "user_service"

    if target == "customer_service":
        return "customer_service"

    return END


# ==================== USER SERVICE NODE ====================

async def user_service_node(state: SupervisorState):
    """
    Điều kiện: user_agent cần được điều chỉnh để trả
    user_id dưới dạng state có cấu trúc nếu nghiệp vụ cần ID.
    """
    input_state = {
        "messages": state["messages"],
    }

    if state.get("phone"):
        input_state["messages"] = [
            *state["messages"],
            HumanMessage(
                content=f"Tìm tài khoản theo số điện thoại: "
                        f"{state['phone']}"
            ),
        ]

    if state.get("email"):
        input_state["messages"] = [
            *input_state["messages"],
            HumanMessage(
                content=f"Tìm tài khoản theo email: "
                        f"{state['email']}"
            ),
        ]

    child_result = await user_agent.ainvoke(input_state)

    return {
        "user_id": child_result.get("user_id"),
        "result": child_result.get("result"),
        "error": child_result.get("error"),
    }


# ==================== CUSTOMER SERVICE NODE ====================

async def customer_service_node(state: SupervisorState):
    """
    customer_agent cần nhận task và user_id trong state.
    Customer Service tự ánh xạ user_id sang customer_id.
    """
    child_result = await customer_agent.ainvoke({
        "messages": state["messages"],
        "task": state.get("task", ""),
        "user_id": state.get("user_id"),
    })

    return {
        "result": child_result.get("result"),
        "error": child_result.get("error"),
    }


# ==================== BUILD GRAPH ====================

builder = StateGraph(SupervisorState)

builder.add_node("summarize", summarize_node)
builder.add_node("supervisor", supervisor_node)
builder.add_node("user_service", user_service_node)
builder.add_node("customer_service", customer_service_node)

builder.add_edge(START, "summarize")
builder.add_edge("summarize", "supervisor")

builder.add_conditional_edges(
    "supervisor",
    route_after_supervisor,
    {
        "user_service": "user_service",
        "customer_service": "customer_service",
        END: END,
    },
)

builder.add_edge("user_service", END)
builder.add_edge("customer_service", END)


# ==================== MONGODB CHECKPOINTER ====================

mongo_client = MongoClient(os.getenv("MONGODB_URI"))

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="supervisor_agent_db",
)


# ==================== COMPILE GRAPH ====================

supervisor_agent = builder.compile(
    checkpointer=checkpointer,
)
