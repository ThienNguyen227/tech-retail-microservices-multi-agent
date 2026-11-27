import os

import httpx
from dotenv import load_dotenv

load_dotenv()

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")


def _error_response(
    message: str,
    status_code: int | None = None,
    detail=None,
):
    response = {
        "success": False,
        "found": False,
        "total": 0,
        "users": [],
        "message": message,
    }

    if status_code is not None:
        response["status_code"] = status_code

    if detail is not None:
        response["detail"] = detail

    return response


# ============================================================
# SEARCH USER
# ============================================================

async def search_user(
    phone: str | None = None,
    email: str | None = None,
    access_token: str | None = None,
):
    """
    Gọi User Service để tra cứu tài khoản người dùng.
    """

    # ========================================================
    # 1. VALIDATE SERVICE CONFIGURATION
    # ========================================================

    if not USER_SERVICE_URL:
        return _error_response(
            "Chưa cấu hình USER_SERVICE_URL."
        )

    # ========================================================
    # 2. VALIDATE ACCESS TOKEN
    # ========================================================

    if (
        not isinstance(access_token, str)
        or not access_token.strip()
    ):
        return _error_response(
            "Không tìm thấy Access Token hợp lệ."
        )

    token = access_token.strip()

    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    if not token:
        return _error_response(
            "Access Token không hợp lệ."
        )

    # ========================================================
    # 3. BUILD REQUEST PARAMETERS
    # ========================================================

    params = {
        key: value
        for key, value in {
            "phone": phone,
            "email": email,
        }.items()
        if value is not None and value != ""
    }

    url = (
        f"{USER_SERVICE_URL.rstrip('/')}"
        "/api/v1/ai/user-service/search"
    )

    headers = {
        "Authorization": f"Bearer {token}",
    }

    # ========================================================
    # 4. CALL USER SERVICE
    # ========================================================

    try:
        async with httpx.AsyncClient(
            timeout=15.0
        ) as client:

            response = await client.get(
                url,
                params=params,
                headers=headers,
            )

        # ====================================================
        # 5. PARSE RESPONSE
        # ====================================================

        try:
            data = response.json()

        except ValueError:
            return _error_response(
                "User Service trả về dữ liệu không hợp lệ.",
                response.status_code,
            )

        # ====================================================
        # 6. HANDLE AUTHENTICATION ERRORS
        # ====================================================

        if response.status_code == 401:
            return _error_response(
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
                401,
                data,
            )

        if response.status_code == 403:
            return _error_response(
                "Bạn không có quyền thực hiện truy vấn này.",
                403,
                data,
            )

        # ====================================================
        # 7. HANDLE HTTP ERRORS
        # ====================================================

        if response.is_error:

            message = "Đã xảy ra lỗi khi tìm kiếm tài khoản."

            if isinstance(data, dict):
                api_message = data.get("message")

                if isinstance(api_message, str):
                    message = api_message

            return _error_response(
                message,
                response.status_code,
                data,
            )

        # ====================================================
        # 8. VALIDATE RESPONSE
        # ====================================================

        if not isinstance(data, dict):
            return _error_response(
                "Dữ liệu trả về từ User Service không hợp lệ."
            )

        users = data.get("users", [])

        if not isinstance(users, list):
            return _error_response(
                "Danh sách tài khoản trả về không hợp lệ."
            )

        total = data.get("total", len(users))

        if not isinstance(total, int):
            return _error_response(
                "Tổng số tài khoản trả về không hợp lệ."
            )

        # ====================================================
        # 9. RETURN RESULT
        # ====================================================

        return {
            "success": True,
            "found": len(users) > 0,
            "total": total,
            "users": users,
            "message": (
                "Tìm thấy tài khoản người dùng."
                if users
                else "Không tìm thấy tài khoản người dùng phù hợp."
            ),
        }

    except httpx.TimeoutException:
        return _error_response(
            "User Service phản hồi quá thời gian."
        )

    except httpx.RequestError:
        return _error_response(
            "Không thể kết nối đến User Service."
        )