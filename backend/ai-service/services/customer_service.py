import os

import httpx
from dotenv import load_dotenv

load_dotenv()

CUSTOMER_SERVICE_URL = os.getenv("CUSTOMER_SERVICE_URL")

MAX_SEARCH_VALUES = 100
MAX_BIGINT = 9223372036854775807


# ============================================================
# ERROR RESPONSE
# ============================================================

def _error_response(
    message: str,
    status_code: int | None = None,
):
    result = {
        "success": False,
        "found": False,
        "total": 0,
        "totalAddresses": 0,
        "data": None,
        "message": message,
    }

    if status_code is not None:
        result["status_code"] = status_code

    return result


# ============================================================
# NORMALIZE SEARCH VALUES
# ============================================================

def _normalize_values(
    values: list[str] | None,
) -> list[str]:

    if values is None:
        return []

    if not isinstance(values, list):
        raise ValueError(
            "Tham số tìm kiếm phải là danh sách."
        )

    if any(
        not isinstance(value, str)
        or not value.strip()
        for value in values
    ):
        raise ValueError(
            "Giá trị tìm kiếm phải là chuỗi không rỗng."
        )

    # Loại bỏ giá trị trùng lặp
    return list(
        dict.fromkeys(
            value.strip()
            for value in values
        )
    )


# ============================================================
# SEARCH CUSTOMER AND ADDRESSES
# ============================================================

async def search_customer(
    user_ids: list[str] | None = None,
    customer_codes: list[str] | None = None,
    access_token: str | None = None,
):
    """
    Tra cứu hồ sơ và địa chỉ của một hoặc nhiều khách hàng.
    """

    # ========================================================
    # 1. VALIDATE SERVICE CONFIGURATION
    # ========================================================

    if not CUSTOMER_SERVICE_URL:
        return _error_response(
            "Customer Service chưa được cấu hình địa chỉ kết nối."
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

    if not token or any(
        char.isspace() for char in token
    ):
        return _error_response(
            "Access Token không hợp lệ.",
            401,
        )

    # ========================================================
    # 3. NORMALIZE SEARCH PARAMETERS
    # ========================================================

    try:
        normalized_user_ids = _normalize_values(
            user_ids
        )

        normalized_customer_codes = _normalize_values(
            customer_codes
        )

        # Giới hạn số lượng giá trị tìm kiếm
        if (
            len(normalized_user_ids)
            + len(normalized_customer_codes)
            > MAX_SEARCH_VALUES
        ):
            raise ValueError(
                "Tối đa 100 giá trị tìm kiếm mỗi lần."
            )

        # Kiểm tra danh sách User ID
        if any(
            not value.isascii()
            or not value.isdigit()
            or value.startswith("0")
            or len(value) > 19
            or int(value) > MAX_BIGINT

            for value in normalized_user_ids
        ):
            raise ValueError(
                "user_ids phải chứa số nguyên dương dạng chuỗi hợp lệ."
            )

        # Kiểm tra danh sách mã khách hàng
        if any(
            len(code) > 256
            for code in normalized_customer_codes
        ):
            raise ValueError(
                "Mã khách hàng quá dài."
            )

    except ValueError as error:
        return _error_response(
            str(error),
            400,
        )

    # CUSTOMER có thể không truyền tham số
    # khi muốn tra cứu chính mình.
    #
    # Backend chịu trách nhiệm kiểm tra Role.

    # ========================================================
    # 4. BUILD REQUEST PARAMETERS
    # ========================================================

    params: list[tuple[str, str]] = []

    for user_id in normalized_user_ids:
        params.append(
            ("userIds", user_id)
        )

    for customer_code in normalized_customer_codes:
        params.append(
            ("customerCodes", customer_code)
        )

    url = (
        f"{CUSTOMER_SERVICE_URL.rstrip('/')}"
        "/api/v1/ai/customer-service/search"
    )

    headers = {
        "Authorization": f"Bearer {token}",
    }

    # ========================================================
    # 5. CALL CUSTOMER SERVICE
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
        # 6. HANDLE AUTHENTICATION ERRORS
        # ====================================================

        if response.status_code == 401:
            return _error_response(
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
                401,
            )

        if response.status_code == 403:
            return _error_response(
                "Bạn không có quyền thực hiện truy vấn này.",
                403,
            )

        # ====================================================
        # 7. PARSE RESPONSE
        # ====================================================

        try:
            payload = response.json()

        except ValueError:
            payload = None

        # ====================================================
        # 8. HANDLE HTTP ERRORS
        # ====================================================

        if not response.is_success:

            message = (
                "Đã xảy ra lỗi khi tra cứu dữ liệu khách hàng."
            )

            if response.status_code == 503:
                message = (
                    "Không thể xác minh quyền hoặc "
                    "Customer Service chưa sẵn sàng."
                )

            elif (
                400 <= response.status_code < 500
                and isinstance(payload, dict)
            ):
                api_message = payload.get("message")

                if isinstance(api_message, str):
                    message = api_message

            return _error_response(
                message,
                response.status_code,
            )

        # ====================================================
        # 9. VALIDATE RESPONSE
        # ====================================================

        if not isinstance(payload, dict):
            return _error_response(
                "Customer Service trả về dữ liệu không hợp lệ."
            )

        data = payload.get("data")
        total = payload.get("total")
        total_addresses = payload.get("totalAddresses")

        if (
            not isinstance(data, list)

            or any(
                not isinstance(item, dict)
                for item in data
            )

            or type(total) is not int

            or total != len(data)
        ):
            return _error_response(
                "Danh sách khách hàng trả về không hợp lệ."
            )

        # ====================================================
        # 10. VALIDATE CUSTOMER ADDRESSES
        # ====================================================

        for customer in data:

            addresses = customer.get("addresses")
            customer_id = customer.get("customer_id")

            if (
                not isinstance(customer_id, str)
                or not customer_id
                or not isinstance(addresses, list)
            ):
                return _error_response(
                    "Dữ liệu khách hàng hoặc địa chỉ không hợp lệ."
                )

            # Đảm bảo địa chỉ thuộc đúng khách hàng
            if any(
                not isinstance(address, dict)
                or address.get(
                    "customer_address_customer_id"
                ) != customer_id

                for address in addresses
            ):
                return _error_response(
                    "Địa chỉ không khớp với khách hàng."
                )

        if (
            type(total_addresses) is not int

            or total_addresses != sum(
                len(customer["addresses"])
                for customer in data
            )
        ):
            return _error_response(
                "Tổng số địa chỉ khách hàng không hợp lệ."
            )

        # ====================================================
        # 11. RETURN RESULT
        # ====================================================

        return {
            "success": True,

            "found": total > 0,

            "total": total,

            "totalAddresses": total_addresses,

            "data": data,

            "message": (
                "Tra cứu hồ sơ và địa chỉ khách hàng thành công."

                if total

                else (
                    "Không tìm thấy khách hàng phù hợp "
                    "trong phạm vi được phép."
                )
            ),
        }

    except httpx.TimeoutException:
        return _error_response(
            "Customer Service phản hồi quá thời gian."
        )

    except httpx.RequestError:
        return _error_response(
            "Không thể kết nối đến Customer Service."
        )