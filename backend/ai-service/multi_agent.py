
from uuid import uuid4
from datetime import datetime, timezone

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from multi_agent_database import conversations_collection, messages_collection
from supervisor_graph import multi_agent


# ==================== FASTAPI ====================

app = FastAPI(title="Multi-Agent AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== CONSTANTS ====================

API_PREFIX = "/api/v1/ai-service/multi-agent"


# ==================== HELPERS ====================

def get_utc_now():
    return datetime.now(timezone.utc)


def extract_text(content) -> str:
    """Chuyển nội dung AIMessage thành chuỗi văn bản."""

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        return "".join(
            item.get("text", "")
            for item in content
            if isinstance(item, dict)
            and item.get("type") == "text"
        )

    return ""


def get_conversation(conversation_id: str, user_id: str):
    """Chỉ trả về conversation thuộc về user tương ứng."""

    return conversations_collection.find_one({
        "_id": conversation_id,
        "user_id": user_id,
    })


def get_last_assistant_message(messages):
    """Lấy câu trả lời cuối cùng của graph."""

    for msg in reversed(messages):
        if getattr(msg, "type", None) == "ai":
            # Bỏ qua AIMessage đang yêu cầu gọi tool.
            if getattr(msg, "tool_calls", None):
                continue

            content = extract_text(msg.content)

            if content.strip():
                return content

    return ""


# ==================== CHAT MULTI-AGENT ====================

@app.post(API_PREFIX)
async def multi_agent_chat(
    message: str = Query(..., min_length=1),
    user_id: str = Query(..., min_length=1),
    conversation_id: str | None = Query(default=None),
):
    message = message.strip()
    user_id = user_id.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message không được để trống.",
        )

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID không được để trống.",
        )

    is_new_conversation = conversation_id is None

    if is_new_conversation:
        conversation_id = str(uuid4())
    else:
        conversation = get_conversation(conversation_id, user_id)

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy conversation.",
            )

    # Dùng cùng conversation_id để khôi phục checkpoint
    # của Supervisor Agent qua các lượt hội thoại.
    config = {
        "configurable": {
            "thread_id": conversation_id,
        }
    }

    try:
        # Lấy trạng thái graph trước khi gửi tin nhắn mới.
        snapshot = await multi_agent.aget_state(config)

        old_count = (
            len(snapshot.values.get("messages", []))
            if snapshot.values
            else 0
        )

        # Gọi Supervisor Agent.
        result = await multi_agent.ainvoke(
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

        new_messages = result.get("messages", [])[old_count:]

        # Thống kê token nếu model cung cấp usage_metadata.
        total_input = 0
        total_output = 0

        for msg in new_messages:
            usage = getattr(msg, "usage_metadata", None)

            if usage:
                total_input += usage.get("input_tokens", 0)
                total_output += usage.get("output_tokens", 0)

        print("\n========== MULTI-AGENT TOKEN USAGE ==========")
        print(f"Conversation ID: {conversation_id}")
        print(f"Input tokens:    {total_input}")
        print(f"Output tokens:   {total_output}")
        print(f"Total tokens:    {total_input + total_output}")

        # Debug quá trình xử lý của graph.
        for msg in new_messages:
            print("\nTYPE:", type(msg).__name__)
            print("CONTENT:", getattr(msg, "content", ""))

            tool_calls = getattr(msg, "tool_calls", None)

            if tool_calls:
                print("TOOL CALLS:", tool_calls)

        # Lấy câu trả lời cuối cùng từ graph.
        content = get_last_assistant_message(
            result.get("messages", [])
        )

        if not content:
            raise RuntimeError(
                "Multi-Agent không trả về câu trả lời cuối cùng."
            )

    except Exception as e:
        print(
            f"\n[MULTI-AGENT ERROR] "
            f"{type(e).__name__}: {e}"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "AI đang gặp sự cố hoặc chưa thể trả lời. "
                "Bạn vui lòng thử lại sau nhé."
            ),
        ) from e

    now = get_utc_now()

    # Tạo conversation hoặc cập nhật thời gian.
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
            {
                "$set": {
                    "updated_at": now,
                }
            },
        )

    # Lưu tin nhắn người dùng.
    messages_collection.insert_one({
        "conversation_id": conversation_id,
        "role": "user",
        "content": message,
        "created_at": now,
    })

    # Lưu câu trả lời của Multi-Agent.
    messages_collection.insert_one({
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": content,
        "created_at": get_utc_now(),
    })

    return {
        "conversation_id": conversation_id,
        "message": content,
    }


# ==================== GET CONVERSATIONS ====================

@app.get(f"{API_PREFIX}/conversations")
async def get_conversations(
    user_id: str = Query(..., min_length=1),
):
    user_id = user_id.strip()

    conversations = list(
        conversations_collection.find(
            {
                "user_id": user_id,
            },
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
                "conversation_id": str(item["_id"]),
                "title": item.get("title", ""),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
            }
            for item in conversations
        ],
    }


# ==================== GET CONVERSATION MESSAGES ====================

@app.get(
    f"{API_PREFIX}/conversations/"
    "{conversation_id}/messages"
)
async def get_conversation_messages(
    conversation_id: str,
    user_id: str = Query(..., min_length=1),
):
    user_id = user_id.strip()

    conversation = get_conversation(conversation_id, user_id)

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy conversation.",
        )

    messages = list(
        messages_collection.find(
            {
                "conversation_id": conversation_id,
            },
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


# ==================== CREATE CONVERSATION ====================

@app.post(f"{API_PREFIX}/conversations")
async def create_conversation(
    user_id: str = Query(..., min_length=1),
    conversation_id: str | None = Query(default=None),
):
    user_id = user_id.strip()

    # Nếu frontend đang có conversation hiện tại,
    # kiểm tra conversation trước khi tạo cuộc trò chuyện mới.
    if conversation_id:
        conversation = get_conversation(conversation_id, user_id)

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy conversation.",
            )

        has_message = messages_collection.find_one({
            "conversation_id": conversation_id,
        })

        if not has_message:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cuộc trò chuyện hiện tại chưa có tin nhắn. "
                    "Không thể tạo cuộc trò chuyện mới."
                ),
            )

    new_conversation_id = str(uuid4())
    now = get_utc_now()

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


# ==================== DELETE CONVERSATION ====================

@app.delete(f"{API_PREFIX}/conversations/{{conversation_id}}")
async def delete_conversation(
    conversation_id: str,
    user_id: str = Query(..., min_length=1),
):
    user_id = user_id.strip()

    conversation = get_conversation(conversation_id, user_id)

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy conversation.",
        )

    # Xóa các tin nhắn trong collection lịch sử API.
    deleted_messages = messages_collection.delete_many({
        "conversation_id": conversation_id,
    })

    # Xóa conversation.
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


# ==================== RENAME CONVERSATION ====================

@app.patch(
    f"{API_PREFIX}/conversations/{{conversation_id}}/rename"
)
async def rename_conversation(
    conversation_id: str,
    user_id: str = Query(..., min_length=1),
    title: str = Query(..., min_length=1),
):
    user_id = user_id.strip()
    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Tên conversation không được để trống.",
        )

    conversation = get_conversation(conversation_id, user_id)

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy conversation.",
        )

    now = get_utc_now()

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

    if (
        result.matched_count == 0
        or (
            result.modified_count == 0
            and conversation.get("title") != title
        )
    ):
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
