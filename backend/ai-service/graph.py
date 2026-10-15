import os
from dotenv import load_dotenv

from langchain_core.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition

from prompt import PRODUCT_AGENT_PROMPT

from tools.product_tools import (get_phone_detail, get_laptop_detail, get_tablet_detail, compare_phones, compare_laptops)

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

product_agent = builder.compile()
