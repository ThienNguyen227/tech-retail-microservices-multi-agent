from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timezone
from database import conversations_collection, messages_collection
from fastapi import Query, HTTPException

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
#     conversation_id: str | None = None

# # SEND MESSAGE
# @app.post("/api/v1/ai-service/product")
# async def product_chat(request: ChatRequest):
#     conversation_id = request.conversation_id or str(uuid4())

#     config = {
#         "configurable": {
#             "thread_id": conversation_id,
#         }
#     }

#     snapshot = await product_agent.aget_state(config)

#     old_count = len(snapshot.values.get("messages", [])) if snapshot.values else 0

#     result = await product_agent.ainvoke(
#         {
#             "messages": [
#                 {
#                     "role": "user",
#                     "content": request.message,
#                 }
#             ]
#         },
#         config=config,
#     )

#     # Chỉ kiểm tra các message mới của lượt hiện tại
#     new_messages = result["messages"][old_count:]

#     total_input = 0
#     total_output = 0

#     for msg in new_messages:
#         usage = getattr(msg, "usage_metadata", None)

#         if usage:
#             input_tokens = usage.get("input_tokens", 0)
#             output_tokens = usage.get("output_tokens", 0)

#             total_input += input_tokens
#             total_output += output_tokens

#     print("\n========== TOKEN USAGE ==========")
#     print(f"Total input tokens:  {total_input}")
#     print(f"Total output tokens: {total_output}")
#     print(f"Total tokens:        {total_input + total_output}")

#     # DEBUG: Kiểm tra Agent có gọi Tool không
#     for msg in new_messages:
#         print("\nTYPE:", type(msg).__name__)
#         print("CONTENT:", msg.content)

#         if hasattr(msg, "tool_calls") and msg.tool_calls:
#             print("TOOL CALLS:", msg.tool_calls)

#     # Lấy câu trả lời cuối cùng
#     last_message = result["messages"][-1]
#     content = last_message.content

#     if isinstance(content, list):
#         content = "".join(
#             item.get("text", "")
#             for item in content
#             if isinstance(item, dict)
#             and item.get("type") == "text"
#         )

#     now = datetime.now(timezone.utc)

#     # Kiểm tra hội thoại đã tồn tại chưa
#     conversation = conversations_collection.find_one({
#         "_id": conversation_id
#     })

#     # Nếu chưa có thì tạo hội thoại trước
#     if not conversation:
#         conversations_collection.insert_one({
#             "_id": conversation_id,
#             "title": request.message[:50],
#             "user_id": 19,
#             "created_at": now,
#             "updated_at": now,
#         })
#     else:
#         conversations_collection.update_one(
#             {"_id": conversation_id},
#             {"$set": {"updated_at": now}},
#         )

#     # Lưu tin nhắn người dùng
#     messages_collection.insert_one({
#         "conversation_id": conversation_id,
#         "role": "user",
#         "content": request.message,
#         "created_at": now,
#     })

#     # Lưu câu trả lời của Agent
#     messages_collection.insert_one({
#         "conversation_id": conversation_id,
#         "role": "assistant",
#         "content": content,
#         "created_at": datetime.now(timezone.utc),
#     })

#     return {
#         "conversation_id": conversation_id,
#         "message": content,
#     }

@app.post("/api/v1/ai-service/product")
async def product_chat(
    message: str = Query(..., min_length=1),
    user_id: str = Query(...),
    conversation_id: str | None = Query(default=None),
):
    message = message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message không được để trống.",
        )

    is_new_conversation = conversation_id is None

    if is_new_conversation:
        conversation_id = str(uuid4())
    else:
        # Đảm bảo conversation tồn tại và thuộc về user
        conversation = conversations_collection.find_one({
            "_id": conversation_id,
            "user_id": user_id,
        })

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy conversation.",
            )

    config = {
        "configurable": {
            "thread_id": conversation_id,
        }
    }

    try:
        snapshot = await product_agent.aget_state(config)

        old_count = (
            len(snapshot.values.get("messages", []))
            if snapshot.values
            else 0
        )

        result = await product_agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": message,
                    }
                ]
            },
            config=config,
        )

        new_messages = result["messages"][old_count:]

        # Debug token usage
        total_input = 0
        total_output = 0

        for msg in new_messages:
            usage = getattr(msg, "usage_metadata", None)

            if usage:
                total_input += usage.get("input_tokens", 0)
                total_output += usage.get("output_tokens", 0)

        print("\n========== TOKEN USAGE ==========")
        print(f"Input tokens:  {total_input}")
        print(f"Output tokens: {total_output}")
        print(f"Total tokens:  {total_input + total_output}")

        for msg in new_messages:
            print("\nTYPE:", type(msg).__name__)
            print("CONTENT:", msg.content)

            if hasattr(msg, "tool_calls") and msg.tool_calls:
                print("TOOL CALLS:", msg.tool_calls)

        last_message = result["messages"][-1]
        content = last_message.content

        if isinstance(content, list):
            content = "".join(
                item.get("text", "")
                for item in content
                if isinstance(item, dict)
                and item.get("type") == "text"
            )

        if not isinstance(content, str) or not content.strip():
            content = "Xin lỗi, tôi chưa thể tạo câu trả lời. Bạn vui lòng thử lại nhé."

    except Exception as e:
        print(f"\n[PRODUCT AGENT ERROR] {type(e).__name__}: {e}")

        raise HTTPException(
            status_code=503,
            detail="AI đang gặp sự cố hoặc chưa thể trả lời. Bạn vui lòng thử lại sau nhé.",
        )

    now = datetime.now(timezone.utc)

    # Tạo conversation mới
    if is_new_conversation:
        conversations_collection.insert_one({
            "_id": conversation_id,
            "title": message[:50],
            "user_id": user_id,
            "created_at": now,
            "updated_at": now,
        })
    else:
        conversations_collection.update_one(
            {
                "_id": conversation_id,
                "user_id": user_id,
            },
            {"$set": {"updated_at": now}},
        )

    # Lưu tin nhắn user
    messages_collection.insert_one({
        "conversation_id": conversation_id,
        "role": "user",
        "content": message,
        "created_at": now,
    })

    # Lưu câu trả lời AI
    messages_collection.insert_one({
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": content,
        "created_at": datetime.now(timezone.utc),
    })

    return {
        "conversation_id": conversation_id,
        "message": content,
    }

# GET LIST CONVERSATION
@app.get("/api/v1/ai-service/product/conversations")
async def get_conversations(user_id: str = Query(...)):
    conversations = list(
        conversations_collection.find(
            {"user_id": user_id},
            {
                "_id": 1,
                "title": 1,
                "created_at": 1,
                "updated_at": 1,
            },
        ).sort("updated_at", -1)
    )

    return {
        "user_id": user_id,
        "total": len(conversations),
        "conversations": [
            {
                "conversation_id": str(conversation["_id"]),
                "title": conversation["title"],
                "created_at": conversation["created_at"],
                "updated_at": conversation["updated_at"],
            }
            for conversation in conversations
        ],
    }

# GET MESSAGES IN CONVERSAION
@app.get("/api/v1/ai-service/product/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str):
    messages = list(
        messages_collection.find(
            {"conversation_id": conversation_id},
            {
                "_id": 1,
                "role": 1,
                "content": 1,
                "created_at": 1,
            },
        ).sort([
            ("created_at", 1),
            ("_id", 1),
        ])
    )

    return {
        "conversation_id": conversation_id,
        "total": len(messages),
        "messages": [
            {
                "id": str(item["_id"]),
                "role": item.get("role", "assistant"),
                "content": item.get("content", ""),
                "created_at": item.get("created_at"),
            }
            for item in messages
        ],
    }

# CREATE NEW CONVERSATION
@app.post("/api/v1/ai-service/conversations")
async def create_conversation(
    user_id: str = Query(...),
    conversation_id: str | None = Query(default=None),
):
    # Nếu đang có conversation hiện tại, kiểm tra nó
    if conversation_id:
        conversation = conversations_collection.find_one({
            "_id": conversation_id,
            "user_id": user_id,
        })

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy conversation.",
            )

        # Kiểm tra conversation hiện tại đã có message chưa
        has_message = messages_collection.find_one({
            "conversation_id": conversation_id,
        })

        if not has_message:
            raise HTTPException(
                status_code=400,
                detail="Cuộc trò chuyện hiện tại chưa có tin nhắn. Không thể tạo cuộc trò chuyện mới.",
            )

    # Tạo conversation mới
    new_conversation_id = str(uuid4())
    now = datetime.now(timezone.utc)

    conversations_collection.insert_one({
        "_id": new_conversation_id,
        "title": "Cuộc trò chuyện mới",
        "user_id": user_id,
        "created_at": now,
        "updated_at": now,
    })

    return {
        "conversation_id": new_conversation_id,
        "title": "Cuộc trò chuyện mới",
        "message": "Tạo cuộc trò chuyện mới thành công.",
    }

# DELETE CONVERSATION AND ITS MESSAGES
@app.delete("/api/v1/ai-service/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Query(...),
):
    # 1. Kiểm tra conversation tồn tại và thuộc về user
    conversation = conversations_collection.find_one({
        "_id": conversation_id,
        "user_id": user_id,
    })

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy conversation.",
        )

    # 2. Xóa toàn bộ message thuộc conversation
    deleted_messages = messages_collection.delete_many({
        "conversation_id": conversation_id,
    })

    # 3. Xóa conversation
    deleted_conversation = conversations_collection.delete_one({
        "_id": conversation_id,
        "user_id": user_id,
    })

    if deleted_conversation.deleted_count == 0:
        raise HTTPException(
            status_code=500,
            detail="Không thể xóa conversation.",
        )

    return {
        "conversation_id": conversation_id,
        "deleted_messages": deleted_messages.deleted_count,
        "message": "Xóa conversation và toàn bộ message thành công.",
    }

# RENAME CONVERSATION
@app.patch("/api/v1/ai-service/conversations/{conversation_id}/rename")
async def rename_conversation(
    conversation_id: str,
    user_id: str = Query(...),
    title: str = Query(...),
):
    # 1. Kiểm tra title
    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Tên conversation không được để trống.",
        )

    # 2. Kiểm tra conversation tồn tại và thuộc về user
    conversation = conversations_collection.find_one({
        "_id": conversation_id,
        "user_id": user_id,
    })

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy conversation.",
        )

    # 3. Cập nhật tên conversation
    now = datetime.now(timezone.utc)

    result = conversations_collection.update_one(
        {
            "_id": conversation_id,
            "user_id": user_id,
        },
        {
            "$set": {
                "title": title,
                "updated_at": now,
            }
        },
    )

    if result.modified_count == 0 and conversation.get("title") != title:
        raise HTTPException(
            status_code=500,
            detail="Không thể đổi tên conversation.",
        )

    return {
        "conversation_id": conversation_id,
        "title": title,
        "updated_at": now,
        "message": "Đổi tên conversation thành công.",
    }