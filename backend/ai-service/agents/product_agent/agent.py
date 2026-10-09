from langchain.agents import create_agent
from langchain_ollama import ChatOllama

from .prompt import PRODUCT_AGENT_PROMPT
from tools.product_tools import search_product


llm = ChatOllama(
    model="qwen3:4b",
    temperature=0,
)

product_agent = create_agent(
    model=llm,
    tools=[
        search_product,
    ],
    system_prompt=PRODUCT_AGENT_PROMPT,
)