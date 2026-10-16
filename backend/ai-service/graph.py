# import os
# from dotenv import load_dotenv

# from langchain_core.messages import SystemMessage
# from langchain_core.messages import SystemMessage, trim_messages
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langgraph.graph import StateGraph, MessagesState, START, END
# from langgraph.prebuilt import ToolNode, tools_condition
# from langchain_ollama import ChatOllama

# from pymongo import MongoClient
# from langgraph.checkpoint.mongodb import MongoDBSaver

# from prompt import PRODUCT_AGENT_PROMPT

# from tools.product_tools import (get_phone_detail, get_laptop_detail, get_tablet_detail, compare_phones, compare_laptops, compare_tablets)

# load_dotenv()

# llm = ChatGoogleGenerativeAI(
#     model="gemini-3.1-flash-lite",
#     google_api_key=os.getenv("GOOGLE_API_KEY"),
#     max_tokens=1024,
#     timeout=60,
#     max_retries=1,
# )

# summarizer_llm = ChatGoogleGenerativeAI(
#     model="gemini-3.1-flash-lite",
#     google_api_key=os.getenv("GOOGLE_SUMMARIZE_API_KEY"),
#     max_tokens=500,
#     timeout=60,
#     max_retries=1,
# )

# # llm = ChatOllama(
# #     model="qwen3:4b",
# #     temperature=0,
# # )

# tools = [
#     get_phone_detail, 
#     get_laptop_detail, 
#     get_tablet_detail,
#     compare_phones,
#     compare_laptops,
#     compare_tablets,
# ]

# llm_with_tools = llm.bind_tools(tools)


# MAX_HISTORY_TOKENS = 5000

# async def call_model(state: MessagesState):
#     # Cắt bớt lịch sử trước khi gửi vào LLM
#     trimmed_messages = trim_messages(
#         state["messages"],
#         strategy="last",
#         token_counter=llm,
#         max_tokens=MAX_HISTORY_TOKENS,
#         start_on="human",
#         include_system=False,
#     )

#     messages = [
#         SystemMessage(content=PRODUCT_AGENT_PROMPT),
#         *trimmed_messages,
#     ]

#     response = await llm_with_tools.ainvoke(messages)

#     return {"messages": [response]}


# builder = StateGraph(MessagesState)

# builder.add_node("llm", call_model)
# builder.add_node("tools", ToolNode(tools))

# builder.add_edge(START, "llm")

# builder.add_conditional_edges(
#     "llm",
#     tools_condition,
#     {
#         "tools": "tools",
#         END: END,
#     },
# )

# builder.add_edge("tools", "llm")

# # product_agent = builder.compile()

# # Kết nối MongoDB
# mongo_client = MongoClient(os.getenv("MONGODB_URI"))

# # Khởi tạo Checkpointer
# checkpointer = MongoDBSaver(mongo_client, db_name="ai_service")

# # Compile graph có lưu trạng thái
# product_agent = builder.compile(checkpointer=checkpointer)


import os
from typing import TypedDict

from dotenv import load_dotenv
from pymongo import MongoClient

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.messages import trim_messages
from langchain_google_genai import ChatGoogleGenerativeAI

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.mongodb import MongoDBSaver
from langchain_ollama import ChatOllama

from prompt import PRODUCT_AGENT_PROMPT

from tools.product_tools import (
    get_phone_detail,
    get_laptop_detail,
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
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
#     model="qwen3:4b",
#     max_tokens=1024,
#     temperature=0,
# )

# # # Model tóm tắt lịch sử hội thoại
# summarizer_llm = ChatOllama(
#     model="qwen3:4b",
#     max_tokens=500,
#     temperature=0,
# )

# ==================== TOOLS ====================

tools = [
    get_phone_detail,
    get_laptop_detail,
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
]

llm_with_tools = llm.bind_tools(tools)

# print("Tools đã đăng ký:")
# for tool in tools:
#     print(f"- {tool.name}: {tool.description}")


# ==================== CONFIG ====================

MAX_HISTORY_TOKENS = 5000
SUMMARY_TRIGGER_TOKENS = 4000
KEEP_RECENT_TOKENS = 1500


# ==================== STATE ====================

class ProductState(MessagesState):
    summary: str
    summarized_message_count: int


# ==================== HELPER ====================

def count_tokens(messages):
    """Đếm số token của danh sách message."""
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

async def summarize_node(state: ProductState):
    messages = state["messages"]

    summary = state.get("summary", "")
    summarized_count = state.get("summarized_message_count", 0)

    # Đếm token của lịch sử chưa được tóm tắt
    unsummarized_messages = messages[summarized_count:]
    total_tokens = count_tokens(unsummarized_messages)

    print("\n========== SUMMARIZE NODE ==========")
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

    # Không tóm tắt phần lịch sử gần nhất
    old_messages = unsummarized_messages[:recent_start]

    if not old_messages:
        print("Không có message cũ để tóm tắt.")
        return {}

    history_text = "\n".join(
        f"{msg.type}: {msg.content}"
        for msg in old_messages
    )

    response = await summarizer_llm.ainvoke([
        SystemMessage(content="""
Bạn là hệ thống tóm tắt lịch sử hội thoại.

Hãy kết hợp bản tóm tắt trước với lịch sử mới.
Giữ lại:
- Thông tin người dùng đã cung cấp.
- Nhu cầu, mục tiêu và sở thích đã nêu.
- Sản phẩm, thông số và kết quả đã xác nhận.
- Các quyết định và thông tin cần thiết để tiếp tục hội thoại.

Không tự suy diễn hoặc tạo thông tin không có trong lịch sử.
Tóm tắt ngắn gọn bằng tiếng Việt.
"""),
        HumanMessage(content=f"""
BẢN TÓM TẮT TRƯỚC:
{summary or "Chưa có"}

LỊCH SỬ CẦN TÓM TẮT:
{history_text}
"""),
    ])

    # Cập nhật số message đã được tóm tắt
    new_summarized_count = summarized_count + len(old_messages)

    print("Số message vừa tóm tắt:", len(old_messages))
    print("Token bản tóm tắt:", count_tokens([
        SystemMessage(content=response.content)
    ]))
    print("BẢN TÓM TẮT MỚI:")
    print(response.content)

    return {
        "summary": response.content,
        "summarized_message_count": new_summarized_count,
    }


# ==================== LLM NODE ====================

async def call_model(state: ProductState):
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
        SystemMessage(content=PRODUCT_AGENT_PROMPT),
    ]

    if summary:
        messages.append(
            SystemMessage(
                content=(
                    "TÓM TẮT HỘI THOẠI TRƯỚC ĐÓ:\n"
                    f"{summary}\n"
                    "Sử dụng thông tin này làm ngữ cảnh khi trả lời."
                )
            )
        )

    messages.extend(trimmed_messages)

    response = await llm_with_tools.ainvoke(messages)

    return {"messages": [response]}


# ==================== BUILD GRAPH ====================

builder = StateGraph(ProductState)

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

mongo_client = MongoClient(os.getenv("MONGODB_URI"))

checkpointer = MongoDBSaver(
    mongo_client,
    db_name="ai_service",
)

product_agent = builder.compile(
    checkpointer=checkpointer,
)
