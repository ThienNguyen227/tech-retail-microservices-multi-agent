
# from langchain.agents import create_agent
# from langchain_ollama import ChatOllama

# from .prompt import PRODUCT_AGENT_PROMPT
# from tools.product_tools import search_product, get_product_detail


# llm = ChatOllama(
#     model="qwen3:4b",
#     temperature=0,
# )

# product_agent = create_agent(
#     model=llm,
#     tools=[
#         search_product,
#         get_product_detail,
#     ],
#     system_prompt=PRODUCT_AGENT_PROMPT,
# )


import os
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI

from .prompt import PRODUCT_AGENT_PROMPT
from tools.product_tools import get_product_detail

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0,
    max_tokens=1024,
    timeout=60,
    max_retries=1,
)

product_agent = create_agent(
    model=llm,
    tools=[get_product_detail],
    system_prompt=PRODUCT_AGENT_PROMPT,
)
