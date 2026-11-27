import os

import httpx
from dotenv import load_dotenv

load_dotenv()

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")

MAX_SEARCH_VALUES = 100


# ============================================================
# ERROR RESPONSE
# ============================================================

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
# NORMALIZE SEARCH VALUES
# ============================================================

def _normalize_values(
    values: list[str] | None,
    lowercase: bool = False,
) -> list[str]:

    if values is None:
        return []

    if not isinstance(values, list):
        raise ValueError(
            "Tham số tìm kiếm phải là danh sách."
        )

    normalized = []

    for value in values:

        if not isinstance(value, str):
            raise ValueError(
                "Giá trị tìm kiếm phải là chuỗi."
            )

        value = value.strip()

        if lowercase:
            value = value.lower()

        if value:
            normalized.append(value)

    # Loại bỏ giá trị trùng lặp
    return list(dict.fromkeys(normalized))


# ============================================================
# SEARCH USER
# ============================================================

async def search_user(
    phones: list[str] | None = None,
    emails: list[str] | None = None,
    access_token: str | None = None,
):
    """
    Gọi User Service để tra cứu một hoặc nhiều tài khoản.
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
            "Không tìm thấy Access Token hợp lệ.",
            401,
        )

    token = access_token.strip()

    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    if not token:
        return _error_response(
            "Access Token không hợp lệ.",
            401,
        )

    # ========================================================
    # 3. NORMALIZE SEARCH PARAMETERS
    # ========================================================

    try:
        normalized_phones = _normalize_values(
            phones
        )

        normalized_emails = _normalize_values(
            emails,
            lowercase=True,
        )

    except ValueError as error:
        return _error_response(
            str(error),
            400,
        )

    # ========================================================
    # 4. VALIDATE SEARCH LIMIT
    # ========================================================

    if (
        len(normalized_phones) +
        len(normalized_emails) > MAX_SEARCH_VALUES
    ):
        return _error_response(
            "Danh sách tìm kiếm không được vượt quá 100 phần tử.",
            400,
        )

    # Không bắt buộc phones hoặc emails vì CUSTOMER
    # có thể tra cứu chính mình thông qua JWT.

    # ========================================================
    # 5. BUILD REQUEST PARAMETERS
    # ========================================================

    params: list[tuple[str, str]] = []

    for phone in normalized_phones:
        params.append(("phones", phone))

    for email in normalized_emails:
        params.append(("emails", email))

    url = (
        f"{USER_SERVICE_URL.rstrip('/')}"
        "/api/v1/ai/user-service/search"
    )

    headers = {
        "Authorization": f"Bearer {token}",
    }

    # ========================================================
    # 6. CALL USER SERVICE
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
        # 7. PARSE RESPONSE
        # ====================================================

        try:
            data = response.json()

        except ValueError:
            data = None

        # ====================================================
        # 8. HANDLE AUTHENTICATION AND AUTHORIZATION
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
        # 9. HANDLE HTTP ERRORS
        # ====================================================

        if response.is_error:

            message = (
                "Đã xảy ra lỗi khi tìm kiếm tài khoản."
            )

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
        # 10. VALIDATE RESPONSE
        # ====================================================

        if not isinstance(data, dict):
            return _error_response(
                "Dữ liệu trả về từ User Service không hợp lệ."
            )

        users = data.get("users")

        if not isinstance(users, list):
            return _error_response(
                "Danh sách tài khoản trả về không hợp lệ."
            )

        total = data.get("total", len(users))

        if (
            isinstance(total, bool)
            or not isinstance(total, int)
            or total != len(users)
        ):
            return _error_response(
                "Tổng số tài khoản trả về không hợp lệ."
            )

        # ====================================================
        # 11. RETURN RESULT
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