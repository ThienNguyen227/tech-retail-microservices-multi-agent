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

# ============================================================
# CALCULATE FINAL PRICE
# ============================================================

async def calculate_final_price(
    items: list[dict],
    access_token: str | None = None,
):
    """
    Gọi Order Service để tính giá sản phẩm theo SKU và quantity.

    Order Service sẽ:
    - Gọi Product Service lấy giá bán.
    - Gọi Promotion Service lấy khuyến mãi trực tiếp.
    - Tính tiền giảm giá theo quantity.
    - Tính subtotal và totalAmount.

    Không xử lý coupon và phí vận chuyển tại API này.
    """

    order_service_url = os.getenv(
        "ORDER_SERVICE_URL",
        "http://localhost:3007",
    ).rstrip("/")

    # ========================================================
    # 1. VALIDATE ITEMS
    # ========================================================

    if not isinstance(items, list) or not items:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Danh sách sản phẩm không được để trống.",
        }

    if len(items) > 100:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Danh sách sản phẩm không được vượt quá 100 phần tử.",
        }

    normalized_items = []

    for index, item in enumerate(items):

        if not isinstance(item, dict):
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": f"Sản phẩm tại vị trí {index + 1} không hợp lệ.",
            }

        sku = item.get("sku")
        quantity = item.get("quantity")

        if not isinstance(sku, str) or not sku.strip():
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": f"SKU tại vị trí {index + 1} không hợp lệ.",
            }

        if (
            isinstance(quantity, bool)
            or not isinstance(quantity, int)
            or quantity < 1
        ):
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": (
                    f"Số lượng tại vị trí {index + 1} "
                    "phải là số nguyên dương."
                ),
            }

        normalized_items.append({
            "sku": sku.strip(),
            "quantity": quantity,
        })

    # ========================================================
    # 2. BUILD REQUEST
    # ========================================================

    url = (
        f"{order_service_url}"
        "/api/v1/ai/order-service/calculate-final-price"
    )

    payload = {
        "items": normalized_items,
    }

    headers = {
        "Content-Type": "application/json",
    }

    if isinstance(access_token, str) and access_token.strip():
        token = access_token.strip()

        if not token.startswith("Bearer "):
            token = f"Bearer {token}"

        headers["Authorization"] = token

    # ========================================================
    # 3. CALL ORDER SERVICE
    # ========================================================

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            response = await client.post(
                url,
                json=payload,
                headers=headers,
            )

            response.raise_for_status()

        # ====================================================
        # 4. PARSE RESPONSE
        # ====================================================

        try:
            data = response.json()

        except ValueError:
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": "Order Service trả về dữ liệu không hợp lệ.",
            }

        if not isinstance(data, dict):
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": "Order Service trả về dữ liệu không hợp lệ.",
            }

        products = data.get("products", [])
        not_found_skus = data.get("notFoundSkus", [])

        if not isinstance(products, list):
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": "Dữ liệu sản phẩm trả về không hợp lệ.",
            }

        # ====================================================
        # 5. RETURN RESULT
        # ====================================================

        if not_found_skus:
            message = (
                "Đã tính giá nhưng có SKU không tìm thấy. "
                "Cần kiểm tra lại danh sách sản phẩm."
            )
        else:
            message = "Tính giá sản phẩm thành công."

        return {
            "success": True,
            "found": len(products) > 0,
            "data": data,
            "message": message,
        }

    except httpx.TimeoutException:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Order Service phản hồi quá thời gian.",
        }

    except httpx.HTTPStatusError as e:

        try:
            detail = e.response.json()

        except ValueError:
            detail = e.response.text

        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Đã xảy ra lỗi khi tính giá sản phẩm.",
            "status_code": e.response.status_code,
            "detail": detail,
        }

    except httpx.RequestError:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Không thể kết nối đến Order Service.",
        }