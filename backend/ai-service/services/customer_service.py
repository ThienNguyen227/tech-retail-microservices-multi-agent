import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CUSTOMER_SERVICE_URL = os.getenv("CUSTOMER_SERVICE_URL")


def _error_response(message: str, status_code: int | None = None):
    response = {
        "success": False,
        "found": False,
        "data": None,
        "message": message,
    }

    if status_code is not None:
        response["status_code"] = status_code

    return response


# ==================== SEARCH CUSTOMER ====================

async def search_customer(
    user_id: str | None = None,
    customer_code: str | None = None,
):
    """Gọi Customer Service để tra cứu thông tin khách hàng."""

    user_id = user_id.strip() if user_id else None
    customer_code = customer_code.strip() if customer_code else None

    if not user_id and not customer_code:
        return _error_response("Cần cung cấp user_id hoặc customer_code.")

    if not CUSTOMER_SERVICE_URL:
        return _error_response(
            "Customer Service chưa được cấu hình địa chỉ kết nối."
        )

    url = f"{CUSTOMER_SERVICE_URL}/api/v1/ai/customer-service/search"

    params = {
        "userId": user_id,
        "customerCode": customer_code,
    }
    params = {
        key: value
        for key, value in params.items()
        if value is not None and value != ""
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)

        if response.status_code == 404:
            return {
                "success": True,
                "found": False,
                "data": None,
                "message": "Không tìm thấy khách hàng phù hợp.",
            }

        response.raise_for_status()

        try:
            data = response.json()
        except ValueError:
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": "Customer Service trả về dữ liệu không hợp lệ.",
            }

        if not isinstance(data, (dict, list)):
            return _error_response(
                "Customer Service trả về dữ liệu không hợp lệ."
            )

        if isinstance(data, list) and not data:
            return {
                "success": True,
                "found": False,
                "data": [],
                "message": "Không tìm thấy khách hàng phù hợp.",
            }

        return {
            "success": True,
            "found": True,
            "data": data,
            "message": "Tra cứu khách hàng thành công.",
        }

    except httpx.TimeoutException:
        return _error_response("Customer Service phản hồi quá thời gian.")

    except httpx.HTTPStatusError as e:
        return _error_response(
            "Đã xảy ra lỗi khi tra cứu khách hàng.",
            e.response.status_code,
        )

    except httpx.RequestError:
        return _error_response("Không thể kết nối đến Customer Service.")


# ==================== GET CUSTOMER ADDRESSES ====================

async def get_customer_addresses(
    user_id: str | None = None,
    customer_code: str | None = None,
):
    """Gọi Customer Service để lấy danh sách địa chỉ đã đăng ký."""

    user_id = user_id.strip() if user_id else None
    customer_code = customer_code.strip() if customer_code else None

    if not user_id and not customer_code:
        return _error_response(
            "Cần cung cấp user_id hoặc customer_code."
        )

    if not CUSTOMER_SERVICE_URL:
        return _error_response(
            "Customer Service chưa được cấu hình địa chỉ kết nối."
        )

    url = f"{CUSTOMER_SERVICE_URL}/api/v1/ai/customer-service/addresses"

    params = {
        "userId": user_id,
        "customerCode": customer_code,
    }
    params = {
        key: value
        for key, value in params.items()
        if value is not None and value != ""
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)

        if response.status_code == 404:
            return {
                "success": True,
                "found": False,
                "data": None,
                "message": "Customer Service trả về HTTP 404.",
                "status_code": 404,
            }

        response.raise_for_status()

        try:
            data = response.json()
        except ValueError:
            return _error_response(
                "Customer Service trả về dữ liệu không hợp lệ.",
                response.status_code,
            )

        if not isinstance(data, list):
            return _error_response(
                "Customer Service trả về danh sách địa chỉ không hợp lệ.",
                response.status_code,
            )

        return {
            "success": True,
            "found": True,
            "data": data,
            "message": (
                "Lấy danh sách địa chỉ thành công."
                if data
                else "API trả về danh sách địa chỉ rỗng."
            ),
        }

    except httpx.TimeoutException:
        return _error_response(
            "Customer Service phản hồi quá thời gian."
        )

    except httpx.HTTPStatusError as e:
        return _error_response(
            "Đã xảy ra lỗi khi tra cứu địa chỉ.",
            e.response.status_code,
        )

    except httpx.RequestError as e:
        return _error_response(
            "Không thể kết nối đến Customer Service."
        )
