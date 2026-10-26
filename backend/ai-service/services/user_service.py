import os

import httpx
from dotenv import load_dotenv

load_dotenv()

USER_SERVICE_URL = os.getenv("USER_SERVICE_URL")


async def search_user(
    phone: str | None = None,
    email: str | None = None,
):
    """Gọi User Service để tìm tài khoản theo số điện thoại hoặc email."""

    if not USER_SERVICE_URL:
        return {
            "found": False,
            "message": "Chưa cấu hình USER_SERVICE_URL.",
        }

    url = f"{USER_SERVICE_URL}/api/v1/ai/user-service/search"

    params = {
        "phone": phone,
        "email": email,
    }

    # Không gửi các tham số chưa được cung cấp
    params = {
        key: value
        for key, value in params.items()
        if value is not None and value != ""
    }

    if not params:
        return {
            "found": False,
            "message": "Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm.",
        }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params)

            if response.status_code == 404:
                return {
                    "found": False,
                    "message": "Không tìm thấy tài khoản người dùng phù hợp.",
                }

            response.raise_for_status()

            data = response.json()

            # Điều chỉnh theo cấu trúc response thực tế của User Service
            return {
                "found": bool(data.get("data")),
                "data": data,
            }

        except httpx.TimeoutException:
            return {
                "found": False,
                "message": "User Service phản hồi quá thời gian.",
            }

        except httpx.HTTPStatusError:
            return {
                "found": False,
                "message": "Đã xảy ra lỗi khi tìm kiếm tài khoản người dùng.",
            }

        except httpx.RequestError:
            return {
                "found": False,
                "message": "Không thể kết nối đến User Service.",
            }
