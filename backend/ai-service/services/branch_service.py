import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

BRANCH_SERVICE_URL = os.getenv("BRANCH_SERVICE_URL")


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


# ==================== GET BRANCH ADDRESS ====================

async def get_branch_address(
    branch_id: int | str,
    access_token: str | None = None,
):
    """
    Gọi Branch Service để lấy thông tin địa chỉ chi nhánh.

    Args:
        branch_id: ID chi nhánh cần lấy địa chỉ.
        access_token: JWT access token nếu API yêu cầu xác thực.
    """

    # 1. Kiểm tra cấu hình Branch Service
    if not BRANCH_SERVICE_URL:
        return _error_response(
            "Branch Service chưa được cấu hình địa chỉ kết nối."
        )

    # 2. Kiểm tra branch_id
    if not str(branch_id).isdigit() or int(branch_id) <= 0:
        return _error_response(
            "Branch ID không hợp lệ."
        )

    # 3. API endpoint
    url = (
        f"{BRANCH_SERVICE_URL.rstrip('/')}"
        f"/api/v1/ai-session/branch-service/branch-address/{branch_id}"
    )

    headers = {
        "Content-Type": "application/json",
    }

    # 4. Thêm JWT nếu được truyền vào
    if access_token and access_token.strip():
        token = access_token.strip()

        if token.lower().startswith("bearer "):
            token = token[7:].strip()

        if not token:
            return _error_response("Access token không hợp lệ.")

        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            response = await client.get(
                url,
                headers=headers,
            )

        # 5. Xử lý dữ liệu phản hồi
        try:
            data = response.json()
        except ValueError:
            if response.is_error:
                return _error_response(
                    "Branch Service trả về lỗi với dữ liệu không hợp lệ.",
                    response.status_code,
                    response.text,
                )

            return _error_response(
                "Branch Service trả về dữ liệu không hợp lệ.",
                response.status_code,
            )

        # 6. Xử lý HTTP Error
        if response.is_error:
            return _error_response(
                "Không thể lấy thông tin địa chỉ chi nhánh.",
                response.status_code,
                data,
            )

        # 7. Kiểm tra kết quả
        if isinstance(data, dict) and data.get("success") is False:
            return _error_response(
                data.get("message", "Không tìm thấy thông tin chi nhánh."),
                response.status_code,
                data,
            )

        # 8. Lấy địa chỉ chi nhánh thành công
        return {
            "success": True,
            "found": True,
            "data": data.get("data", data) if isinstance(data, dict) else data,
            "message": "Lấy thông tin địa chỉ chi nhánh thành công.",
        }

    except httpx.TimeoutException:
        return _error_response(
            "Branch Service phản hồi quá thời gian."
        )

    except httpx.RequestError:
        return _error_response(
            "Không thể kết nối đến Branch Service."
        )
