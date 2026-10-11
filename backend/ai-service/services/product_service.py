
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL")

async def get_product_details(product_name: str):
    url = f"{PRODUCT_SERVICE_URL}/api/v1/ai/product-service/details"

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(
                url,
                params={"keyword": product_name},
            )

            if response.status_code == 404:
                return {
                    "found": False,
                    "message": f"Không tìm thấy sản phẩm: {product_name}",
                }

            response.raise_for_status()

            data = response.json()

            return {
                "found": True,
                "data": data,
            }

        except httpx.TimeoutException:
            return {
                "found": False,
                "message": "Product Service phản hồi quá thời gian.",
            }

        except httpx.HTTPStatusError:
            return {
                "found": False,
                "message": "Đã xảy ra lỗi khi truy xuất thông tin sản phẩm.",
            }

        except httpx.RequestError:
            return {
                "found": False,
                "message": "Không thể kết nối đến Product Service.",
            }


async def search_products(
    keyword: str | None = None,
    brand: str | None = None,
    category: str | None = None,
    storage: str | None = None,
    color: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    limit: int = 10,
):
    """Gọi Product Service để tìm danh sách sản phẩm."""
    url = f"{PRODUCT_SERVICE_URL}/api/v1/ai/product-service/search"

    params = {
        "keyword": keyword,
        "brand": brand,
        "category": category,
        "storage": storage,
        "color": color,
        "min_price": min_price,
        "max_price": max_price,
        "limit": limit,
    }

    # Không gửi các tham số chưa được cung cấp
    params = {
        key: value
        for key, value in params.items()
        if value is not None and value != ""
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()

            data = response.json()

            return {
                "found": data.get("total", 0) > 0,
                "data": data,
            }

        except httpx.TimeoutException:
            return {
                "found": False,
                "message": "Product Service phản hồi quá thời gian.",
            }
        except httpx.HTTPStatusError:
            return {
                "found": False,
                "message": "Đã xảy ra lỗi khi tìm kiếm sản phẩm.",
            }
        except httpx.RequestError:
            return {
                "found": False,
                "message": "Không thể kết nối đến Product Service.",
            }
