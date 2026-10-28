import os

from dotenv import load_dotenv
from pymongo import MongoClient

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    ToolMessage,
    trim_messages,
)
from langchain_ollama import ChatOllama

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.mongodb import MongoDBSaver
from langchain_google_genai import ChatGoogleGenerativeAI
from prompt import USER_AGENT_PROMPT

from tools.user_tools import (
    search_user,
)


load_dotenv()


# ==================== LLM ====================

# Model xử lý câu hỏi và gọi tool
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    max_tokens=1024,
    timeout=60,
    max_retries=1,
)

# Model tóm tắt lịch sử hội thoại
summarizer_llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite",
    google_api_key=os.getenv("GOOGLE_SUMMARIZE_API_KEY"),
    max_tokens=500,
    timeout=60,
    max_retries=1,
)

# # Model xử lý câu hỏi và gọi tool
# llm = ChatOllama(
#     model="deepseek-r1:7b",
#     max_tokens=1024,
#     temperature=0,
# )

# # Model tóm tắt lịch sử hội thoại
# summarizer_llm = ChatOllama(
#     model="deepseek-r1:7b",
#     max_tokens=500,
#     temperature=0,
# )


# ==================== TOOLS ====================

tools = [
    search_user,
]

llm_with_tools = llm.bind_tools(tools)


# ==================== CONFIG ====================

MAX_HISTORY_TOKENS = 5000
SUMMARY_TRIGGER_TOKENS = 4000
KEEP_RECENT_TOKENS = 1500


# ==================== STATE ====================

class UserState(MessagesState):
    summary: str
    summarized_message_count: int

    # Thông tin phục vụ Supervisor
    task: str | None
    user_id: str | None
    result: dict | None
    error: str | None


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

async def summarize_node(state: UserState):
    messages = state["messages"]

    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    # Lịch sử chưa được tóm tắt
    unsummarized_messages = messages[summarized_count:]
    total_tokens = count_tokens(unsummarized_messages)

    print("\n========== USER SUMMARIZE NODE ==========")
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
của Agent hỗ trợ quản trị tài khoản và nhân viên.

Hãy kết hợp bản tóm tắt trước với lịch sử mới.

Giữ lại:
- Yêu cầu và câu hỏi của người dùng.
- Các mã tài khoản, mã nhân viên và thông tin tra cứu.
- Kết quả đã được API nghiệp vụ xác nhận.
- Những thông tin cần thiết để tiếp tục hội thoại.

Quy tắc:
- Không tự suy diễn hoặc tạo dữ liệu.
- Không biến thông tin chưa xác minh thành thông tin đã xác nhận.
- Không đưa mật khẩu, password hash, refresh token,
  refresh token hash hoặc thông tin xác thực nhạy cảm
  vào bản tóm tắt.
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

    # Cập nhật số message đã được tóm tắt
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

async def call_model(state: UserState):
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
        SystemMessage(content=USER_AGENT_PROMPT),
    ]

    if summary:
        messages.append(
            SystemMessage(
                content=(
                    "TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ:\n"
                    f"{summary}\n"
                    "Chỉ sử dụng bản tóm tắt làm ngữ cảnh hội thoại. "
                    "Không xem thông tin trong bản tóm tắt là "
                    "dữ liệu tài khoản mới được xác minh. "
                    "Khi cần thông tin thực tế, hãy gọi tool "
                    "để tra cứu qua API nghiệp vụ."
                )
            )
        )

    messages.extend(trimmed_messages)

    response = await llm_with_tools.ainvoke(messages)

    return {"messages": [response]}


# ==================== EXTRACT USER RESULT NODE ====================

def extract_user_result(state: UserState):
    messages = state["messages"]

    # Chỉ lấy ToolMessage cuối cùng trong lịch sử.
    # Node này chỉ được gọi khi route_after_tools xác nhận
    # message cuối cùng là kết quả của search_user.
    tool_message = messages[-1] if messages else None

    if (
        not isinstance(tool_message, ToolMessage)
        or tool_message.name != "search_user"
    ):
        return {
            "result": None,
            "error": "Không tìm thấy kết quả search_user của lượt xử lý hiện tại.",
            "user_id": None,
        }

    content = tool_message.content

    # ToolMessage có thể chứa kết quả dạng JSON string.
    if isinstance(content, str):
        import json

        try:
            content = json.loads(content)
        except (json.JSONDecodeError, TypeError):
            return {
                "result": None,
                "error": "Không thể đọc kết quả tra cứu tài khoản.",
                "user_id": None,
            }

    if not isinstance(content, dict):
        return {
            "result": None,
            "error": "Kết quả tra cứu tài khoản không hợp lệ.",
            "user_id": None,
        }

    if not content.get("success", False):
        return {
            "result": content,
            "error": content.get(
                "message",
                "Không thể tra cứu tài khoản người dùng.",
            ),
            "user_id": None,
        }

    users = content.get("users", [])

    if not isinstance(users, list):
        return {
            "result": content,
            "error": "Danh sách tài khoản trả về không hợp lệ.",
            "user_id": None,
        }

    if not users:
        return {
            "result": content,
            "error": content.get(
                "message",
                "Không tìm thấy tài khoản phù hợp.",
            ),
            "user_id": None,
        }

    if len(users) > 1:
        return {
            "result": content,
            "error": (
                "Tìm thấy nhiều tài khoản phù hợp; "
                "cần xác định tài khoản trước khi chuyển tiếp."
            ),
            "user_id": None,
        }

    user = users[0]

    if not isinstance(user, dict):
        return {
            "result": content,
            "error": "Thông tin tài khoản trả về không hợp lệ.",
            "user_id": None,
        }

    user_id = user.get("user_id")

    if user_id is None or not str(user_id).strip():
        return {
            "result": content,
            "error": "Kết quả không có user_id hợp lệ.",
            "user_id": None,
        }

    return {
        "result": content,
        "error": None,
        "user_id": str(user_id),
    }


# ==================== ROUTE AFTER TOOLS ====================

def route_after_tools(state: UserState):
    messages = state["messages"]

    # Chỉ xét những ToolMessage mới nhất
    last_message = messages[-1] if messages else None

    if (
        state.get("task") == "resolve_user_id"
        and isinstance(last_message, ToolMessage)
        and last_message.name == "search_user"
    ):
        return "extract_user_result"

    return "llm"


# ==================== BUILD GRAPH ====================

builder = StateGraph(UserState)

builder.add_node("summarize", summarize_node)
builder.add_node("llm", call_model)
builder.add_node("tools", ToolNode(tools))
builder.add_node("extract_user_result", extract_user_result)

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

builder.add_conditional_edges(
    "tools",
    route_after_tools,
    {
        "extract_user_result": "extract_user_result",
        "llm": "llm",
    },
)

# Khi đã lấy user_id cho Supervisor, kết thúc lượt xử lý
builder.add_edge("extract_user_result", END)


# ==================== MONGODB CHECKPOINTER ====================

mongo_client = MongoClient(
    os.getenv("USER_AI_SERVICE_MONGODB_URI")
)

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="user_ai_service",
)


# ==================== COMPILE GRAPH ====================

user_agent = builder.compile(
    checkpointer=checkpointer,
)