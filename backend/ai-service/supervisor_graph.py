import os
import json
import re
from typing import Any

from dotenv import load_dotenv
from pymongo import MongoClient

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
    AIMessage,
    trim_messages,
)
from langchain_core.runnables import RunnableConfig
from langchain_ollama import ChatOllama

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.checkpoint.mongodb import MongoDBSaver

from prompt import SUPERVISOR_PROMPT

from user_service_graph import user_agent
from customer_service_graph import customer_agent

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
    customer_code: str | None

    needs_customer_lookup: bool

    result: Any
    error: str | None
    clarification: str | None

    # Context quản lý lịch sử
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


def parse_supervisor_decision(content: str) -> dict:
    """
    Trích xuất JSON quyết định điều phối từ phản hồi LLM.
    Hỗ trợ trường hợp LLM đặt JSON trong code fence.
    """
    content = content.strip()

    # Loại bỏ code fence nếu có
    content = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        content,
        flags=re.IGNORECASE,
    ).strip()

    # Tìm JSON trong nội dung phản hồi
    start = content.find("{")
    end = content.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError(
            "Supervisor không trả về JSON quyết định điều phối hợp lệ."
        )

    decision = json.loads(content[start:end + 1])

    if not isinstance(decision, dict):
        raise ValueError("Quyết định điều phối phải là JSON object.")

    return decision


def normalize_decision(decision: dict) -> dict:
    """Kiểm tra và chuẩn hóa quyết định điều phối của Supervisor."""

    valid_tasks = {
        "search_user",
        "search_customer",
        "get_customer_addresses",
        "clarify",
    }

    valid_targets = {
        "user_service",
        "customer_service",
        "end",
    }

    task = decision.get("task")
    target_graph = decision.get("target_graph")

    if task not in valid_tasks:
        raise ValueError(f"Task không hợp lệ: {task}")

    if target_graph not in valid_targets:
        raise ValueError(f"Target graph không hợp lệ: {target_graph}")

    if task == "search_user":
        if target_graph != "user_service":
            raise ValueError(
                "Task search_user phải được chuyển đến User Agent."
            )

        if decision.get("needs_customer_lookup", False):
            raise ValueError(
                "Task search_user không được chuyển tiếp sang "
                "Customer Agent."
            )

    if task in {"search_customer", "get_customer_addresses"}:
        if target_graph not in {"user_service", "customer_service"}:
            raise ValueError(
                f"Task {task} phải được chuyển đến User Agent hoặc "
                "Customer Agent."
            )

        if target_graph == "user_service" and not decision.get(
            "needs_customer_lookup", False
        ):
            raise ValueError(
                f"Task {task} chuyển qua User Agent phải bật "
                "needs_customer_lookup."
            )

        if target_graph == "customer_service" and decision.get(
            "needs_customer_lookup", False
        ):
            raise ValueError(
                f"Task {task} chuyển trực tiếp đến Customer Agent không "
                "được bật needs_customer_lookup."
            )

    if task == "clarify":
        target_graph = "end"

    phone = decision.get("phone")
    email = decision.get("email")
    user_id = decision.get("user_id")
    customer_code = decision.get("customer_code")

    needs_customer_lookup = decision.get(
        "needs_customer_lookup", False
    )

    if not isinstance(needs_customer_lookup, bool):
        raise ValueError("needs_customer_lookup phải là boolean.")

    return {
        "task": task,
        "target_graph": target_graph,
        "phone": phone,
        "email": email,
        "user_id": user_id,
        "customer_code": customer_code,
        "needs_customer_lookup": needs_customer_lookup,
        "clarification": decision.get("clarification"),
    }


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
- Nghiệp vụ đang xử lý và Agent đã được gọi.
- Các thông tin định danh như phone, email, user_id,
  customer_code khi cần thiết cho ngữ cảnh.
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
        SystemMessage(
            content=(
                SUPERVISOR_PROMPT
                + """

QUY ĐỊNH ĐẦU RA CHO ĐIỀU PHỐI:

Hãy phân tích yêu cầu và trả về duy nhất một JSON object,
không thêm giải thích bên ngoài JSON.

Schema:
{
    "task": "search_user",
    "target_graph": "user_service",
    "phone": null,
    "email": null,
    "user_id": null,
    "customer_code": null,
    "needs_customer_lookup": false,
    "clarification": null
}

Giá trị task hợp lệ:
- search_user
- search_customer
- get_customer_addresses
- clarify

Giá trị target_graph hợp lệ:
- user_service
- customer_service
- end

Quy tắc định tuyến:
1. Tra cứu tài khoản người dùng theo số điện thoại hoặc email:
   task=search_user, target_graph=user_service.

2. Tra cứu hồ sơ khách hàng theo customer_code hoặc user_id:
   task=search_customer, target_graph=customer_service.

3. Tra cứu địa chỉ khách hàng:
   task=get_customer_addresses, target_graph=customer_service.

4. Nếu người dùng tìm thông tin khách hàng bằng số điện thoại
   hoặc email, trước tiên chuyển đến User Agent để tra cứu
   tài khoản; giữ task ban đầu và đặt
   target_graph=user_service, needs_customer_lookup=true.

5. Nếu thiếu thông tin định danh cần thiết hoặc yêu cầu chưa rõ:
   task=clarify, target_graph=end và điền clarification.

6. Chỉ điền các giá trị định danh có căn cứ từ hội thoại.
   Không tự tạo phone, email, user_id hoặc customer_code.

7. Giữ nguyên giá trị phone và email như xuất hiện trong
   yêu cầu. Không thực hiện chuẩn hóa dữ liệu ở Supervisor.

8. Không coi thông tin trong bản tóm tắt là bằng chứng
   xác minh dữ liệu nghiệp vụ.

9. Không trả về Markdown code fence; chỉ trả JSON.
"""
            )
        ),
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

    try:
        response = await llm.ainvoke(messages)

        decision = parse_supervisor_decision(
            str(response.content)
        )

        decision = normalize_decision(decision)

        print("\n========== SUPERVISOR DECISION ==========")
        print(json.dumps(decision, ensure_ascii=False, indent=2))

        result = {
            **decision,
            "error": None,
        }

        # Khi cần làm rõ, tạo câu trả lời để người dùng nhìn thấy.
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

    except (ValueError, json.JSONDecodeError) as exc:
        error_message = (
            "Tôi chưa xác định được chính xác yêu cầu cần xử lý. "
            "Bạn vui lòng mô tả rõ hơn thông tin muốn tra cứu."
        )

        print("Lỗi phân tích quyết định Supervisor:", str(exc))

        return {
            "task": "clarify",
            "target_graph": "end",
            "clarification": error_message,
            "error": str(exc),
            "messages": [AIMessage(content=error_message)],
        }


# ==================== ROUTING ====================

def route_after_supervisor(state: SupervisorState):
    """Định tuyến dựa trên quyết định đã được kiểm tra."""

    target = state.get("target_graph")

    if target == "user_service":
        return "user_service"

    if target == "customer_service":
        return "customer_service"

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

async def user_service_node(state: SupervisorState, config: RunnableConfig):
    task = state.get("task")
    needs_customer_lookup = state.get("needs_customer_lookup", False)

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

    # Với tác vụ resolve_user_id, Supervisor sử dụng
    # trạng thái có cấu trúc để quyết định bước tiếp theo.
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
        # Lấy phản hồi AI cuối cùng của Agent con.
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
                    str(result)
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
        result = last_ai_message.content
        error = None

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

builder.add_conditional_edges(
    "user_service",
    route_after_user_service,
    {
        "customer_service": "customer_service",
        END: END,
    },
)

builder.add_edge("customer_service", END)


# ==================== MONGODB CHECKPOINTER ====================

mongo_client = MongoClient(
    os.getenv("MONGODB_URI")
)

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="supervisor_agent_db",
)


# ==================== COMPILE GRAPH ====================

supervisor_agent = builder.compile(
    checkpointer=checkpointer,
)
