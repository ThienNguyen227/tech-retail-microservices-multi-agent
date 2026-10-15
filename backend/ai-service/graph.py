import os
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition

from pymongo import MongoClient
from langgraph.checkpoint.mongodb import MongoDBSaver

from prompt import PRODUCT_AGENT_PROMPT

from tools.product_tools import (get_phone_detail, get_laptop_detail, get_tablet_detail, compare_phones, compare_laptops, compare_tablets)

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash-lite",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    max_tokens=1024,
    timeout=60,
    max_retries=1,
)

tools = [
    get_phone_detail, 
    get_laptop_detail, 
    get_tablet_detail,
    compare_phones,
    compare_laptops,
    compare_tablets,
]

llm_with_tools = llm.bind_tools(tools)


async def call_model(state: MessagesState):
    messages = [
        SystemMessage(content=PRODUCT_AGENT_PROMPT),
        *state["messages"],
    ]

    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}


builder = StateGraph(MessagesState)

builder.add_node("llm", call_model)
builder.add_node("tools", ToolNode(tools))

builder.add_edge(START, "llm")

builder.add_conditional_edges(
    "llm",
    tools_condition,
    {
        "tools": "tools",
        END: END,
    },
)

builder.add_edge("tools", "llm")

# product_agent = builder.compile()

# Kết nối MongoDB
mongo_client = MongoClient(os.getenv("MONGODB_URI"))

# Khởi tạo Checkpointer
checkpointer = MongoDBSaver(mongo_client, db_name="ai_service")

# Compile graph có lưu trạng thái
product_agent = builder.compile(checkpointer=checkpointer)