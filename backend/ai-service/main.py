from fastapi import FastAPI
from pydantic import BaseModel

from agents.product_agent.agent import product_agent


app = FastAPI(title="AI Service")


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

    return {
        "message": result["messages"][-1].content
    }