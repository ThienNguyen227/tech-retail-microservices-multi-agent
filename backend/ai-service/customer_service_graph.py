import os

from dotenv import load_dotenv
from pymongo import MongoClient

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    trim_messages,
)
from langchain_ollama import ChatOllama

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.mongodb import MongoDBSaver

from prompt import CUSTOMER_AGENT_PROMPT

from tools.customer_tools import (
    search_customers,
    get_customer_detail,
    get_customer_addresses,
    get_customer_points,
    get_customer_membership,
    get_membership_tier_detail,
)

load_dotenv()


# ==================== LLM ====================

# # Model xử lý câu hỏi và gọi tool
# llm = ChatGoogleGenerativeAI(
#     model="gemini-3.1-flash-lite",
#     google_api_key=os.getenv("GOOGLE_API_KEY"),
#     max_tokens=1024,
#     timeout=60,
#     max_retries=1,
# )

# # Model tóm tắt lịch sử hội thoại
# summarizer_llm = ChatGoogleGenerativeAI(
#     model="gemini-3.5-flash-lite",
#     google_api_key=os.getenv("GOOGLE_SUMMARIZE_API_KEY"),
#     max_tokens=500,
#     timeout=60,
#     max_retries=1,
# )

# Model xử lý câu hỏi và gọi tool
llm = ChatOllama(
    model="deepseek-r1:7b",
    max_tokens=1024,
    temperature=0,
)

# Model tóm tắt lịch sử hội thoại
summarizer_llm = ChatOllama(
    model="deepseek-r1:7b",
    max_tokens=500,
    temperature=0,
)


# ==================== TOOLS ====================

tools = [
    search_customers,
    get_customer_detail,
    get_customer_addresses,
    get_customer_points,
    get_customer_membership,
    get_membership_tier_detail,
]

llm_with_tools = llm.bind_tools(tools)


# ==================== CONFIG ====================

MAX_HISTORY_TOKENS = 5000
SUMMARY_TRIGGER_TOKENS = 4000
KEEP_RECENT_TOKENS = 1500


# ==================== STATE ====================

class CustomerState(MessagesState):
    summary: str
    summarized_message_count: int


# ==================== HELPER ====================

def count_tokens(messages):
    """Đếm token của danh sách message."""
    return llm.get_num_tokens_from_messages(messages)


def find_recent_start(messages, max_tokens):
    """
    Tìm vị trí bắt đầu của phần lịch sử gần nhất
    sao cho tổng token không vượt max_tokens.
    """
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

async def summarize_node(state: CustomerState):
    messages = state["messages"]

    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    # Lịch sử chưa được tóm tắt
    unsummarized_messages = messages[summarized_count:]
    total_tokens = count_tokens(unsummarized_messages)

    print("\n========== CUSTOMER SUMMARIZE NODE ==========")
    print("Token lịch sử chưa tóm tắt:", total_tokens)

    # Chưa vượt ngưỡng thì không tóm tắt
    if total_tokens <= SUMMARY_TRIGGER_TOKENS:
        print("Chưa cần tóm tắt.")
        return {}

    # Xác định phần lịch sử gần nhất cần giữ lại
    recent_start = find_recent_start(
        unsummarized_messages,
        KEEP_RECENT_TOKENS,
    )

    # Chỉ tóm tắt phần lịch sử cũ
    old_messages = unsummarized_messages[:recent_start]

    if not old_messages:
        print("Không có message cũ để tóm tắt.")
        return {}

    history_text = "\n".join(
        f"{msg.type}: {msg.content}"
        for msg in old_messages
    )

    response = await summarizer_llm.ainvoke([
        SystemMessage(
            content="""
Bạn là hệ thống tóm tắt lịch sử hội thoại
của Customer Agent trong hệ thống bán lẻ.

Hãy kết hợp bản tóm tắt trước với lịch sử mới.

Giữ lại:
- Yêu cầu và mục tiêu tra cứu của người dùng.
- Mã khách hàng hoặc thông tin nhận diện cần thiết.
- Những kết quả tra cứu đã được API xác nhận.
- Thông tin hạng thành viên, điểm tích lũy và địa chỉ
  nếu thực sự cần thiết để tiếp tục hội thoại.
- Các thông tin còn thiếu cần làm rõ.

Quy tắc:
- Không tự suy diễn hoặc tạo dữ liệu khách hàng.
- Không biến thông tin chưa xác minh thành thông tin đã xác nhận.
- Không đưa dữ liệu cá nhân không cần thiết vào bản tóm tắt.
- Không lưu hoặc tóm tắt mật khẩu, token, thông tin xác thực.
- Phân biệt rõ kết quả truy vấn thành công và lỗi truy vấn.
- Tóm tắt ngắn gọn bằng tiếng Việt.
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

    new_summarized_count = (
        summarized_count + len(old_messages)
    )

    print("Số message vừa tóm tắt:", len(old_messages))
    print("BẢN TÓM TẮT MỚI:")
    print(response.content)

    return {
        "summary": response.content,
        "summarized_message_count": new_summarized_count,
    }


# ==================== LLM NODE ====================

async def call_model(state: CustomerState):
    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    # Lấy phần lịch sử chưa được đưa vào bản tóm tắt
    recent_messages = state["messages"][summarized_count:]

    # Giới hạn token lịch sử gửi vào LLM
    trimmed_messages = trim_messages(
        recent_messages,
        strategy="last",
        token_counter=llm,
        max_tokens=MAX_HISTORY_TOKENS,
        start_on="human",
        include_system=False,
    )

    messages = [
        SystemMessage(content=CUSTOMER_AGENT_PROMPT),
    ]

    if summary:
        messages.append(
            SystemMessage(
                content=(
                    "TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ:\n"
                    f"{summary}\n"
                    "Sử dụng thông tin này để hiểu ngữ cảnh hội thoại. "
                    "Không coi bản tóm tắt là dữ liệu khách hàng "
                    "đã được xác minh ở thời điểm hiện tại. "
                    "Khi cần xác nhận thông tin nghiệp vụ, "
                    "hãy gọi tool tương ứng."
                )
            )
        )

    messages.extend(trimmed_messages)

    response = await llm_with_tools.ainvoke(messages)

    return {"messages": [response]}


# ==================== BUILD GRAPH ====================

builder = StateGraph(CustomerState)

builder.add_node("summarize", summarize_node)
builder.add_node("llm", call_model)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "summarize")
builder.add_edge("summarize", "llm")

builder.add_conditional_edges(
    "llm",
    tools_condition,
    {
        "tools": "tools",
        END: END,
    },
)

builder.add_edge("tools", "llm")


# ==================== MONGODB CHECKPOINTER ====================

mongo_client = MongoClient(
    os.getenv("MONGODB_URI")
)

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="ai_service",
)


# ==================== COMPILE GRAPH ====================

customer_agent = builder.compile(
    checkpointer=checkpointer,
)