import os
import jwt

from typing import Any
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

load_dotenv()

# JWT CONFIGURATION
JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET")

# Chỉ chấp nhận Bearer Token
bearer_scheme = HTTPBearer(auto_error=False)


# ==================== VERIFY ACCESS TOKEN ====================

def verify_access_token(access_token: str) -> dict[str, Any]:
    """
    Xác thực Access Token được tạo từ User Service.

    - Verify chữ ký JWT bằng JWT_ACCESS_SECRET.
    - Chỉ chấp nhận thuật toán HS256.
    - Kiểm tra expiration.
    - Kiểm tra type = access.
    - Kiểm tra sub là user_id hợp lệ.
    """

    if not JWT_ACCESS_SECRET:
        raise RuntimeError(
            "Thiếu biến môi trường JWT_ACCESS_SECRET."
        )

    try:
        payload = jwt.decode(
            access_token,
            JWT_ACCESS_SECRET,
            algorithms=["HS256"],
            options={
                "require": ["exp", "sub", "type"],
            },
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Token đã hết hạn.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Token không hợp lệ.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Kiểm tra payload
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT Payload không hợp lệ.",
        )

    # Chỉ chấp nhận Access Token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không phải Access Token.",
        )

    # Kiểm tra User ID
    user_id = payload.get("sub")

    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không xác định được User ID.",
        )

    return payload


# ==================== GET CURRENT AUTH ====================

async def get_current_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> dict[str, Any]:
    """
    FastAPI Dependency:

    1. Nhận Bearer Token từ Authorization Header.
    2. Xác thực Access Token.
    3. Trả về JWT Payload và nguyên Access Token.

    Access Token được giữ riêng để truyền xuống LangGraph,
    không đưa vào MessagesState hoặc MongoDB Checkpoint.
    """

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng đăng nhập để sử dụng AI Service.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization Scheme không hợp lệ.",
        )

    access_token = credentials.credentials

    payload = verify_access_token(access_token)

    return {
        "user": payload,
        "access_token": access_token,
    }
