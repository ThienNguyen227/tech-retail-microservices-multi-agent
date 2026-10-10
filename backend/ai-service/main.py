from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.product_agent.agent import product_agent

app = FastAPI(title="AI Service")

# Cho phép Next.js tại port 3000 gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.post("/api/v1/agent/product")
async def product_chat(request: ChatRequest):
    result = await product_agent.ainvoke({
        "messages": [
            {
                "role": "user",
                "content": request.message,
            }
        ]
    })

    # DEBUG: Kiểm tra Agent có gọi Tool không
    for msg in result["messages"]:
        print("\nTYPE:", type(msg).__name__)
        print("CONTENT:", msg.content)

        if hasattr(msg, "tool_calls"):
            print("TOOL CALLS:", msg.tool_calls)

    # Lấy câu trả lời cuối cùng
    last_message = result["messages"][-1]
    content = last_message.content

    # Chuyển content dạng list thành chuỗi text
    if isinstance(content, list):
        content = "".join(
            item.get("text", "")
            for item in content
            if isinstance(item, dict) and item.get("type") == "text"
        )

    return {"message": content}
