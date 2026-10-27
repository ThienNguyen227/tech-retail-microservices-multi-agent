import os

import httpx
from dotenv import load_dotenv

load_dotenv()

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")


def _error_response(message: str):
    return {
        "success": False,
        "found": False,
        "total": 0,
        "users": [],
        "message": message,
    }


async def search_user(
    phone: str | None = None,
    email: str | None = None,
):
    """Gọi User Service để tìm tài khoản theo số điện thoại hoặc email."""

    if not USER_SERVICE_URL:
        return _error_response("Chưa cấu hình USER_SERVICE_URL.")

    params = {
        key: value
        for key, value in {
            "phone": phone,
            "email": email,
        }.items()
        if value is not None and value != ""
    }

    if not params:
        return _error_response(
            "Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm."
        )

    url = f"{USER_SERVICE_URL}/api/v1/ai/user-service/search"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)

            if response.status_code == 404:
                return {
                    "success": True,
                    "found": False,
                    "total": 0,
                    "users": [],
                    "message": "Không tìm thấy tài khoản người dùng phù hợp.",
                }

            response.raise_for_status()
            data = response.json()

        if not isinstance(data, dict):
            return _error_response(
                "Dữ liệu trả về từ User Service không hợp lệ."
            )

        users = data.get("users", [])
        if not isinstance(users, list):
            return _error_response(
                "Danh sách tài khoản trả về từ User Service không hợp lệ."
            )

        total = data.get("total", len(users))
        if not isinstance(total, int):
            return _error_response(
                "Tổng số tài khoản trả về từ User Service không hợp lệ."
            )

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
        return _error_response("User Service phản hồi quá thời gian.")

    except httpx.HTTPStatusError:
        return _error_response(
            "Đã xảy ra lỗi khi tìm kiếm tài khoản người dùng."
        )

    except httpx.RequestError:
        return _error_response("Không thể kết nối đến User Service.")

    except ValueError:
        return _error_response(
            "Dữ liệu trả về từ User Service không hợp lệ."
        )