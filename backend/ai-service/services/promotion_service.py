import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

PROMOTION_SERVICE_URL = os.getenv("PROMOTION_SERVICE_URL")


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


async def _request_promotion(
    method: str,
    endpoint: str,
    access_token: str | None = None,
    params: dict | None = None,
    json: dict | None = None,
):
    """
    Hàm dùng chung để gọi Promotion Service.
    """

    if not PROMOTION_SERVICE_URL:
        return _error_response(
            "Promotion Service chưa được cấu hình địa chỉ kết nối."
        )

    url = (
        f"{PROMOTION_SERVICE_URL.rstrip('/')}"
        f"/api/v1/customer-session/promotion-service/{endpoint.lstrip('/')}"
    )

    headers = {
        "Content-Type": "application/json",
    }

    if access_token and access_token.strip():
        token = access_token.strip()

        if token.lower().startswith("bearer "):
            token = token[7:].strip()

        if not token:
            return _error_response("Access token không hợp lệ.")

        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json,
            )

        try:
            data = response.json()

        except ValueError:
            if response.is_error:
                return _error_response(
                    "Promotion Service trả về lỗi với dữ liệu không hợp lệ.",
                    response.status_code,
                    response.text,
                )

            return _error_response(
                "Promotion Service trả về dữ liệu không hợp lệ.",
                response.status_code,
            )

        if response.is_error:
            return _error_response(
                "Không thể lấy thông tin khuyến mãi.",
                response.status_code,
                data,
            )

        if isinstance(data, dict) and data.get("success") is False:
            return _error_response(
                data.get("message", "Không thể lấy thông tin khuyến mãi."),
                response.status_code,
                data,
            )

        return {
            "success": True,
            "found": bool(data),
            "data": data.get("data", data)
            if isinstance(data, dict) else data,
            "message": "Lấy thông tin khuyến mãi thành công.",
        }

    except httpx.TimeoutException:
        return _error_response(
            "Promotion Service phản hồi quá thời gian."
        )

    except httpx.RequestError:
        return _error_response(
            "Không thể kết nối đến Promotion Service."
        )


# ==================== GET COUPON LIST ====================

async def get_all_coupons(
    access_token: str | None = None,
):
    """
    Lấy danh sách coupon đang ACTIVE.

    API:
        GET /api/v1/customer-session/promotion-service/coupons
    """

    return await _request_promotion(
        method="GET",
        endpoint="coupons",
        access_token=access_token,
    )


# ==================== GET DIRECT DISCOUNT BY SKU ====================

async def get_direct_discount(
    sku: str,
    access_token: str | None = None,
):
    """
    Lấy thông tin direct discount theo SKU.

    API:
        GET /api/v1/customer-session/promotion-service/direct-discount?sku=...
    """

    if not isinstance(sku, str) or not sku.strip():
        return _error_response("SKU không hợp lệ.")

    return await _request_promotion(
        method="GET",
        endpoint="direct-discount",
        access_token=access_token,
        params={
            "sku": sku.strip(),
        },
    )


# ==================== GET DIRECT DISCOUNTS BY MULTIPLE SKUS ====================

async def get_direct_discounts(
    skus: list[str],
    access_token: str | None = None,
):
    """
    Lấy danh sách direct discount theo nhiều SKU.

    API:
        POST /api/v1/customer-session/promotion-service/direct-discounts

    Request Body:
        {
            "skus": ["SKU001", "SKU002"]
        }
    """

    if not isinstance(skus, list) or not skus:
        return _error_response("Danh sách SKU không được để trống.")

    if any(
        not isinstance(sku, str) or not sku.strip()
        for sku in skus
    ):
        return _error_response("Danh sách SKU không hợp lệ.")

    unique_skus = list(dict.fromkeys(
        sku.strip() for sku in skus
    ))

    return await _request_promotion(
        method="POST",
        endpoint="direct-discounts",
        access_token=access_token,
        json={
            "skus": unique_skus,
        },
    )
