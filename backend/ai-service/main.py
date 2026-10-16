# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel

# from agent import product_agent

# app = FastAPI(title="AI Service")

# # Cho phép Next.js tại port 3000 gọi API
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# class ChatRequest(BaseModel):
#     message: str


# @app.post("/api/v1/agent/product")
# async def product_chat(request: ChatRequest):
#     result = await product_agent.ainvoke({
#         "messages": [
#             {
#                 "role": "user",
#                 "content": request.message,
#             }
#         ]
#     })

#     # DEBUG: Kiểm tra Agent có gọi Tool không
#     for msg in result["messages"]:
#         print("\nTYPE:", type(msg).__name__)
#         print("CONTENT:", msg.content)

#         if hasattr(msg, "tool_calls"):
#             print("TOOL CALLS:", msg.tool_calls)

#     # Lấy câu trả lời cuối cùng
#     last_message = result["messages"][-1]
#     content = last_message.content

#     # Chuyển content dạng list thành chuỗi text
#     if isinstance(content, list):
#         content = "".join(
#             item.get("text", "")
#             for item in content
#             if isinstance(item, dict) and item.get("type") == "text"
#         )

#     return {"message": content}

from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import product_agent

app = FastAPI(title="AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None

@app.post("/api/v1/agent/product")
async def product_chat(request: ChatRequest):
    conversation_id = request.conversation_id or str(uuid4())

    config = {
        "configurable": {
            "thread_id": conversation_id,
        }
    }

    snapshot = await product_agent.aget_state(config)

    old_count = len(snapshot.values.get("messages", [])) if snapshot.values else 0

    result = await product_agent.ainvoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": request.message,
                }
            ]
        },
        config=config,
    )

    # Chỉ kiểm tra các message mới của lượt hiện tại
    new_messages = result["messages"][old_count:]

    total_input = 0
    total_output = 0

    for msg in new_messages:
        usage = getattr(msg, "usage_metadata", None)

        if usage:
            input_tokens = usage.get("input_tokens", 0)
            output_tokens = usage.get("output_tokens", 0)

            total_input += input_tokens
            total_output += output_tokens

    print("\n========== TOKEN USAGE ==========")
    print(f"Total input tokens:  {total_input}")
    print(f"Total output tokens: {total_output}")
    print(f"Total tokens:        {total_input + total_output}")

    # DEBUG: Kiểm tra Agent có gọi Tool không
    for msg in new_messages:
        print("\nTYPE:", type(msg).__name__)
        print("CONTENT:", msg.content)

        if hasattr(msg, "tool_calls") and msg.tool_calls:
            print("TOOL CALLS:", msg.tool_calls)

    # Lấy câu trả lời cuối cùng
    last_message = result["messages"][-1]
    content = last_message.content

    if isinstance(content, list):
        content = "".join(
            item.get("text", "")
            for item in content
            if isinstance(item, dict)
            and item.get("type") == "text"
        )

    return {
        "conversation_id": conversation_id,
        "message": content,
    }
