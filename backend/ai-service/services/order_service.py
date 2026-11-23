import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL")


def _error_response(
    message: str,
    status_code: int | None = None,
    detail: Any = None,
):
    response = {
        "success": False,
        "found": False,
        "data": None,
        "message": message,
    }

    if status_code is not None:
        response["status_code"] = status_code

    if detail is not None:
        response["detail"] = detail

    return response


# ==================== CREATE ORDER ====================

async def create_order(
    order_data: dict[str, Any],
    access_token: str | None = None,
):
    """
    Gọi Order Service để tạo đơn hàng.

    Args:
        order_data: Dữ liệu tạo đơn hàng theo CreateOrderDto.
        access_token: JWT access token của người dùng đang đăng nhập.
    """

    # 1. Kiểm tra cấu hình Order Service
    if not ORDER_SERVICE_URL:
        return _error_response(
            "Order Service chưa được cấu hình địa chỉ kết nối."
        )

    # 2. Kiểm tra dữ liệu đầu vào
    if not isinstance(order_data, dict) or not order_data:
        return _error_response(
            "Dữ liệu tạo đơn hàng không hợp lệ."
        )

    # 3. Kiểm tra JWT
    if not access_token or not access_token.strip():
        return _error_response(
            "Không tìm thấy access token. Vui lòng đăng nhập để tạo đơn hàng."
        )

    # Loại bỏ tiền tố Bearer nếu đã được truyền vào
    token = access_token.strip()

    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    if not token:
        return _error_response(
            "Access token không hợp lệ."
        )

    # 4. API endpoint
    url = (
        f"{ORDER_SERVICE_URL.rstrip('/')}"
        "/api/v1/customer-session/order-service/order"
    )

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            response = await client.post(
                url,
                json=order_data,
                headers=headers,
            )

        # 5. Xử lý dữ liệu phản hồi
        try:
            data = response.json()
        except ValueError:
            if response.is_error:
                return _error_response(
                    "Order Service trả về lỗi với dữ liệu không hợp lệ.",
                    response.status_code,
                    response.text,
                )

            return _error_response(
                "Order Service trả về dữ liệu không hợp lệ.",
                response.status_code,
            )

        # 6. Xử lý HTTP Error
        if response.is_error:
            return _error_response(
                "Không thể tạo đơn hàng.",
                response.status_code,
                data,
            )

        # 7. Tạo đơn hàng thành công
        return {
            "success": True,
            "found": True,
            "data": data,
            "message": "Tạo đơn hàng thành công.",
        }

    except httpx.TimeoutException:
        return _error_response(
            "Order Service phản hồi quá thời gian."
        )

    except httpx.RequestError:
        return _error_response(
            "Không thể kết nối đến Order Service."
        )
