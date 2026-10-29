import os
import json
from typing import Any, Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pymongo import MongoClient

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    AIMessage,
    trim_messages,
)
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.mongodb import MongoDBSaver

from prompt import SUPERVISOR_PROMPT
from user_service_graph import user_agent
from customer_service_graph import customer_agent

load_dotenv()


# ==================== SUPERVISOR OUTPUT SCHEMA ====================

class SupervisorDecision(BaseModel):
    """Schema quyết định điều phối của Supervisor."""

    task: Literal[
        "search_user",
        "search_customer",
        "get_customer_addresses",
        "general_chat",
        "clarify",
    ] = Field(description="Nghiệp vụ cần thực hiện")

    target_graph: Literal[
        "user_service",
        "customer_service",
        "general_chat",
        "end",
    ] = Field(description="Node tiếp theo cần thực thi")

    phone: str | None = None
    email: str | None = None
    user_id: str | None = None
    customer_code: str | None = None

    needs_customer_lookup: bool = False

    clarification: str | None = None


# ==================== LLM ====================

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    max_tokens=1024,
    timeout=60,
    max_retries=1,
)

summarizer_llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite",
    google_api_key=os.getenv("GOOGLE_SUMMARIZE_API_KEY"),
    max_tokens=500,
    timeout=60,
    max_retries=1,
)

# Model xử lý câu hỏi và gọi tool
# llm = ChatOllama(
#     model="deepseek-r1:1.5b",
#     max_tokens=1024,
#     temperature=0,
# )

# # Model tóm tắt lịch sử hội thoại
# summarizer_llm = ChatOllama(
#     model="deepseek-r1:1.5b",
#     max_tokens=500,
#     temperature=0,
# )

# Yêu cầu Gemini trả về dữ liệu theo schema thay vì tự parse JSON.
supervisor_llm = llm.with_structured_output(SupervisorDecision)


# ==================== CONFIG ====================

MAX_HISTORY_TOKENS = 5000
SUMMARY_TRIGGER_TOKENS = 4000
KEEP_RECENT_TOKENS = 1500


# ==================== STATE ====================

class SupervisorState(MessagesState):
    task: str
    target_graph: str

    phone: str | None
    email: str | None
    user_id: str | None
    customer_code: str | None

    needs_customer_lookup: bool

    result: Any
    error: str | None
    clarification: str | None

    summary: str
    summarized_message_count: int


# ==================== HELPER ====================

def count_tokens(messages) -> int:
    """Đếm token của danh sách message."""
    if not messages:
        return 0

    return llm.get_num_tokens_from_messages(messages)


def find_recent_start(messages, max_tokens: int) -> int:
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


def content_to_text(content: Any) -> str:
    """Chuyển nội dung message về chuỗi để lưu hoặc hiển thị."""
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []

        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(str(item.get("text", "")))

        return "\n".join(part for part in parts if part)

    return str(content)


def normalize_decision(decision: dict) -> dict:
    """Kiểm tra và chuẩn hóa quyết định của Supervisor."""

    valid_tasks = {
        "search_user",
        "search_customer",
        "get_customer_addresses",
        "general_chat",
        "clarify",
    }

    valid_targets = {
        "user_service",
        "customer_service",
        "general_chat",
        "end",
    }

    task = decision.get("task")
    target_graph = decision.get("target_graph")

    if task not in valid_tasks:
        raise ValueError(f"Task không hợp lệ: {task}")

    if target_graph not in valid_targets:
        raise ValueError(f"Target graph không hợp lệ: {target_graph}")

    needs_customer_lookup = decision.get(
        "needs_customer_lookup", False
    )

    if not isinstance(needs_customer_lookup, bool):
        raise ValueError("needs_customer_lookup phải là boolean.")

    # Tra cứu tài khoản người dùng.
    if task == "search_user":
        if target_graph != "user_service":
            raise ValueError(
                "Task search_user phải được chuyển đến User Agent."
            )

        if needs_customer_lookup:
            raise ValueError(
                "Task search_user không được bật needs_customer_lookup."
            )

    # Tra cứu hồ sơ khách hàng hoặc địa chỉ khách hàng.
    if task in {"search_customer", "get_customer_addresses"}:
        if target_graph == "user_service":
            if not needs_customer_lookup:
                raise ValueError(
                    f"Task {task} qua User Agent phải bật "
                    "needs_customer_lookup."
                )

        elif target_graph == "customer_service":
            if needs_customer_lookup:
                raise ValueError(
                    f"Task {task} gọi Customer Agent trực tiếp không "
                    "được bật needs_customer_lookup."
                )

        else:
            raise ValueError(
                f"Task {task} phải được chuyển đến User Agent "
                "hoặc Customer Agent."
            )

    # Câu hỏi thông thường không gọi các Agent nghiệp vụ.
    if task == "general_chat":
        if target_graph != "general_chat":
            raise ValueError(
                "Task general_chat phải chuyển đến node general_chat."
            )

        if needs_customer_lookup:
            raise ValueError(
                "Task general_chat không được bật needs_customer_lookup."
            )

    # Không có đủ thông tin để xử lý nghiệp vụ.
    if task == "clarify":
        target_graph = "end"

    return {
        "task": task,
        "target_graph": target_graph,
        "phone": decision.get("phone"),
        "email": decision.get("email"),
        "user_id": decision.get("user_id"),
        "customer_code": decision.get("customer_code"),
        "needs_customer_lookup": needs_customer_lookup,
        "clarification": decision.get("clarification"),
    }


# ==================== SUMMARIZE NODE ====================

async def summarize_node(state: SupervisorState):
    messages = state["messages"]

    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    # Bảo vệ chỉ số khi state được khôi phục từ checkpoint.
    summarized_count = max(
        0,
        min(summarized_count, len(messages)),
    )

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
        f"{msg.type}: {content_to_text(msg.content)}"
        for msg in old_messages
    )

    response = await summarizer_llm.ainvoke([
        SystemMessage(
            content="""
Bạn tóm tắt lịch sử hội thoại của Supervisor Agent.

Giữ lại:
- Yêu cầu và mục tiêu của người dùng.
- Nghiệp vụ đang xử lý và Agent đã được gọi.
- Các thông tin định danh như phone, email, user_id,
  customer_code khi cần thiết cho ngữ cảnh.
- Kết quả nghiệp vụ đã được xác minh.
- Những bước đã hoàn thành và bước còn cần thực hiện.
- Lỗi hoặc dữ liệu chưa xác minh nếu có.

Quy tắc:
- Không tự tạo dữ liệu hoặc suy diễn kết quả.
- Phân biệt dữ liệu đã xác minh và dữ liệu chưa xác minh.
- Không đưa mật khẩu, token hoặc thông tin xác thực nhạy cảm
  vào bản tóm tắt.
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

    new_summary = content_to_text(response.content)

    new_summarized_count = summarized_count + len(old_messages)

    print("Số message vừa tóm tắt:", len(old_messages))
    print("BẢN TÓM TẮT MỚI:")
    print(new_summary)

    return {
        "summary": new_summary,
        "summarized_message_count": new_summarized_count,
    }


# ==================== SUPERVISOR NODE ====================

async def supervisor_node(state: SupervisorState):
    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    summarized_count = max(
        0,
        min(summarized_count, len(state["messages"])),
    )

    recent_messages = state["messages"][summarized_count:]

    trimmed_messages = trim_messages(
        recent_messages,
        strategy="last",
        token_counter=llm,
        max_tokens=MAX_HISTORY_TOKENS,
        start_on="human",
        include_system=False,
    )

    supervisor_instructions = f"""
{SUPERVISOR_PROMPT}

QUY ĐỊNH ĐIỀU PHỐI:

Bạn phải trả về dữ liệu theo schema đã được cung cấp.
Không tự tạo phone, email, user_id hoặc customer_code.

CÁC TASK HỢP LỆ:

1. search_user:
   Tra cứu tài khoản theo số điện thoại hoặc email.
   target_graph = user_service.
   needs_customer_lookup = false.

2. search_customer:
   Tra cứu hồ sơ khách hàng theo customer_code hoặc user_id.
   Nếu đã có user_id hoặc customer_code:
   target_graph = customer_service.
   needs_customer_lookup = false.

   Nếu chỉ có số điện thoại hoặc email:
   target_graph = user_service.
   needs_customer_lookup = true.
   User Agent phải tra cứu user_id trước khi chuyển tiếp.

3. get_customer_addresses:
   Tra cứu địa chỉ khách hàng.
   Nếu đã có user_id hoặc customer_code:
   target_graph = customer_service.
   needs_customer_lookup = false.

   Nếu chỉ có số điện thoại hoặc email:
   target_graph = user_service.
   needs_customer_lookup = true.

4. general_chat:
   Dùng cho lời chào, giới thiệu bản thân, câu hỏi thông thường
   hoặc câu hỏi không cần tra cứu dữ liệu nghiệp vụ.
   target_graph = general_chat.
   needs_customer_lookup = false.

5. clarify:
   Dùng khi người dùng yêu cầu nghiệp vụ nhưng thiếu thông tin
   định danh cần thiết hoặc không thể xác định rõ yêu cầu.
   target_graph = end.
   Điền clarification bằng tiếng Việt.

QUY TẮC:
- "Bạn là ai?", "Xin chào", "Bạn có thể làm gì?" là general_chat.
- Không dùng clarify chỉ vì câu hỏi không liên quan đến user/customer.
- Không nhầm một câu hỏi thông thường với yêu cầu tra cứu nghiệp vụ.
- Không dùng dữ liệu trong summary để khẳng định kết quả nghiệp vụ.
- Giữ nguyên giá trị định danh theo thông tin có trong hội thoại.
- Nếu không có thông tin định danh, đặt trường tương ứng là null.
- Không trả lời nghiệp vụ thay cho User Agent hoặc Customer Agent.
"""

    messages = [
        SystemMessage(content=supervisor_instructions)
    ]

    if summary:
        messages.append(
            SystemMessage(
                content=(
                    "TÓM TẮT HỘI THOẠI:\n"
                    f"{summary}\n"
                    "Chỉ sử dụng để hiểu ngữ cảnh, không thay thế "
                    "dữ liệu nghiệp vụ đã được xác minh."
                )
            )
        )

    messages.extend(trimmed_messages)

    try:
        response = await supervisor_llm.ainvoke(messages)

        # with_structured_output trả về đối tượng Pydantic.
        if isinstance(response, BaseModel):
            raw_decision = response.model_dump()
        elif isinstance(response, dict):
            raw_decision = response
        else:
            raise ValueError(
                "Structured output của Supervisor không đúng định dạng."
            )

        decision = normalize_decision(raw_decision)

        print("\n========== SUPERVISOR DECISION ==========")
        print(json.dumps(decision, ensure_ascii=False, indent=2))

        result = {
            **decision,
            "error": None,
        }

        if decision["task"] == "clarify":
            clarification = (
                decision.get("clarification")
                or "Vui lòng cung cấp thêm thông tin để tôi xác định "
                   "đúng nghiệp vụ cần xử lý."
            )

            result["clarification"] = clarification
            result["messages"] = [
                AIMessage(content=clarification)
            ]

        return result

    except Exception as exc:
        error_message = (
            "Hiện tại tôi chưa thể xác định yêu cầu do gặp lỗi xử lý. "
            "Bạn vui lòng thử lại sau."
        )

        print(
            "\n========== SUPERVISOR ERROR ==========\n"
            f"Loại lỗi: {type(exc).__name__}\n"
            f"Chi tiết: {exc}"
        )

        return {
            "task": "clarify",
            "target_graph": "end",
            "phone": None,
            "email": None,
            "user_id": None,
            "customer_code": None,
            "needs_customer_lookup": False,
            "clarification": error_message,
            "error": str(exc),
            "messages": [AIMessage(content=error_message)],
        }


# ==================== GENERAL CHAT NODE ====================

async def general_chat_node(state: SupervisorState):
    """Trả lời hội thoại thông thường, không gọi Agent nghiệp vụ."""

    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    summarized_count = max(
        0,
        min(summarized_count, len(state["messages"])),
    )

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
        SystemMessage(
            content="""
Bạn là trợ lý AI của hệ thống quản lý chuỗi bán lẻ sản phẩm công nghệ.

Nhiệm vụ:
- Trả lời lời chào và câu hỏi thông thường bằng tiếng Việt.
- Khi được hỏi "Bạn là ai?", hãy giới thiệu bạn là trợ lý AI
  hỗ trợ người dùng hệ thống.
- Có thể giải thích các khả năng hỗ trợ như tra cứu tài khoản,
  hồ sơ khách hàng và địa chỉ khách hàng.
- Không tuyên bố đã tra cứu dữ liệu nếu chưa gọi Agent nghiệp vụ.
- Không bịa thông tin về hệ thống, dữ liệu hoặc kết quả truy vấn.
- Nếu câu hỏi cần tra cứu dữ liệu thực tế, hướng dẫn người dùng
  cung cấp thông tin cần thiết để thực hiện tra cứu.
- Trả lời ngắn gọn, rõ ràng và thân thiện.
"""
        )
    ]

    if summary:
        messages.append(
            SystemMessage(
                content=f"Ngữ cảnh hội thoại trước đây:\n{summary}"
            )
        )

    messages.extend(trimmed_messages)

    try:
        response = await llm.ainvoke(messages)
        answer = content_to_text(response.content).strip()

        if not answer:
            answer = "Xin lỗi, hiện tại tôi chưa thể tạo câu trả lời."

        return {
            "messages": [AIMessage(content=answer)],
            "result": answer,
            "error": None,
        }

    except Exception as exc:
        print(
            f"General chat error ({type(exc).__name__}): {exc}"
        )

        answer = (
            "Xin lỗi, hiện tại tôi chưa thể trả lời. "
            "Bạn vui lòng thử lại sau."
        )

        return {
            "messages": [AIMessage(content=answer)],
            "result": None,
            "error": str(exc),
        }


# ==================== ROUTING ====================

def route_after_supervisor(state: SupervisorState):
    target = state.get("target_graph")

    if target == "user_service":
        return "user_service"

    if target == "customer_service":
        return "customer_service"

    if target == "general_chat":
        return "general_chat"

    return END


def route_after_user_service(state: SupervisorState):
    if state.get("error"):
        return END

    if not state.get("needs_customer_lookup"):
        return END

    if not state.get("user_id"):
        return END

    return "customer_service"


# ==================== USER SERVICE NODE ====================

async def user_service_node(
    state: SupervisorState,
    config: RunnableConfig,
):
    needs_customer_lookup = state.get(
        "needs_customer_lookup", False
    )

    user_task = (
        "resolve_user_id"
        if needs_customer_lookup
        else "search_user"
    )

    task_message = HumanMessage(
        content=json.dumps(
            {
                "task": user_task,
                "phone": state.get("phone"),
                "email": state.get("email"),
            },
            ensure_ascii=False,
        )
    )

    parent_thread_id = config["configurable"]["thread_id"]
    child_thread_id = f"{parent_thread_id}:user_service"

    child_config = {
        **config,
        "configurable": {
            **config.get("configurable", {}),
            "thread_id": child_thread_id,
        },
    }

    child_result = await user_agent.ainvoke(
        {
            "messages": [task_message],
            "task": user_task,
        },
        config=child_config,
    )

    user_id = child_result.get("user_id")
    result = child_result.get("result")
    error = child_result.get("error")

    if needs_customer_lookup:
        assistant_message = AIMessage(
            content=(
                "Đã hoàn tất bước tra cứu định danh người dùng."
                if not error and user_id
                else (
                    error
                    or "Không thể xác định user_id từ kết quả tra cứu."
                )
            )
        )
    else:
        child_messages = child_result.get("messages", [])

        last_ai_message = next(
            (
                message
                for message in reversed(child_messages)
                if isinstance(message, AIMessage)
                and not message.tool_calls
            ),
            None,
        )

        assistant_message = (
            last_ai_message
            if last_ai_message is not None
            else AIMessage(
                content=(
                    content_to_text(result)
                    if result is not None
                    else error or "Không nhận được kết quả từ User Agent."
                )
            )
        )

    return {
        "messages": [assistant_message],
        "user_id": user_id,
        "result": result,
        "error": error,
    }


# ==================== CUSTOMER SERVICE NODE ====================

async def customer_service_node(
    state: SupervisorState,
    config: RunnableConfig,
):
    task_message = HumanMessage(
        content=json.dumps(
            {
                "task": state.get("task"),
                "user_id": state.get("user_id"),
                "customer_code": state.get("customer_code"),
            },
            ensure_ascii=False,
        )
    )

    parent_thread_id = config["configurable"]["thread_id"]
    child_thread_id = f"{parent_thread_id}:customer_service"

    child_config = {
        **config,
        "configurable": {
            **config.get("configurable", {}),
            "thread_id": child_thread_id,
        },
    }

    child_result = await customer_agent.ainvoke(
        {
            "messages": [task_message],
            "task": state.get("task"),
            "user_id": state.get("user_id"),
            "customer_code": state.get("customer_code"),
        },
        config=child_config,
    )

    child_messages = child_result.get("messages", [])

    last_ai_message = next(
        (
            message
            for message in reversed(child_messages)
            if isinstance(message, AIMessage)
            and not message.tool_calls
        ),
        None,
    )

    if last_ai_message is None:
        assistant_message = AIMessage(
            content="Customer Agent không trả về phản hồi cuối cùng."
        )
        error = "Không nhận được phản hồi cuối cùng từ Customer Agent."
        result = None
    else:
        assistant_message = last_ai_message
        result = content_to_text(last_ai_message.content)
        error = child_result.get("error")

    return {
        "messages": [assistant_message],
        "result": result,
        "error": error,
    }


# ==================== BUILD GRAPH ====================

builder = StateGraph(SupervisorState)

builder.add_node("summarize", summarize_node)
builder.add_node("supervisor", supervisor_node)
builder.add_node("user_service", user_service_node)
builder.add_node("customer_service", customer_service_node)
builder.add_node("general_chat", general_chat_node)

builder.add_edge(START, "summarize")
builder.add_edge("summarize", "supervisor")

builder.add_conditional_edges(
    "supervisor",
    route_after_supervisor,
    {
        "user_service": "user_service",
        "customer_service": "customer_service",
        "general_chat": "general_chat",
        END: END,
    },
)

builder.add_conditional_edges(
    "user_service",
    route_after_user_service,
    {
        "customer_service": "customer_service",
        END: END,
    },
)

builder.add_edge("customer_service", END)
builder.add_edge("general_chat", END)


# ==================== MONGODB CHECKPOINTER ====================

mongo_uri = os.getenv("MULTI_AGENT_MONGODB_URI")

if not mongo_uri:
    raise ValueError(
        "Thiếu biến môi trường MULTI_AGENT_MONGODB_URI."
    )

mongo_client = MongoClient(mongo_uri)

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="multi_agent",
)


# ==================== COMPILE GRAPH ====================

multi_agent = builder.compile(
    checkpointer=checkpointer,
)
