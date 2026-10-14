
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL")

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


# 3. SO SÁNH ĐIỆN THOẠI
async def compare_phones(products: list[str], criteria: list[str] | None = None):
    """Lấy dữ liệu điện thoại theo các tiêu chí cần so sánh."""
    url = f"{PRODUCT_SERVICE_URL}/api/v1/ai/product-service/compare/phones"

    if not 2 <= len(products) <= 5:
        return {
            "found": False,
            "message": "Chỉ được so sánh từ 2 đến 5 sản phẩm.",
        }

    params = [("products", name) for name in products]

    if criteria:
        params.extend(("criteria", item) for item in criteria)

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()

            return {
                "found": True,
                "data": response.json(),
            }

        except httpx.TimeoutException:
            return {
                "found": False,
                "message": "Product Service phản hồi quá thời gian.",
            }

        except httpx.HTTPStatusError as e:
            
            print("Compare phones HTTP error:", e.response.status_code)
            print("Response body:", e.response.text)

            if e.response.status_code == 400:
                return {
                    "found": False,
                    "message": "Tên sản phẩm hoặc tiêu chí so sánh không hợp lệ.",
                }

            if e.response.status_code == 404:
                return {
                    "found": False,
                    "message": "Không tìm thấy sản phẩm cần so sánh.",
                }

            return {
                "found": False,
                "message": "Đã xảy ra lỗi khi so sánh sản phẩm.",
            }

        except httpx.RequestError:
            return {
                "found": False,
                "message": "Không thể kết nối đến Product Service.",
            }

# 4. LẤY CHI TIẾT ĐIỆN THOẠI THEO TIÊU CHÍ
async def get_phone_detail(
    phone_name: str,
    criteria: list[str] | None = None,
):
    url = (
        f"{PRODUCT_SERVICE_URL}"
        "/api/v1/ai/product-service/detail/phone"
    )

    params = [("phoneName", phone_name)]

    if criteria:
        params.extend(
            ("criteria", item) for item in criteria
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params)

            if response.status_code == 404:
                return {
                    "found": False,
                    "message": f"Không tìm thấy điện thoại: {phone_name}",
                }

            response.raise_for_status()

            return {
                "found": True,
                "data": response.json(),
            }

        except httpx.TimeoutException:
            return {
                "found": False,
                "message": "Product Service phản hồi quá thời gian.",
            }

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                return {
                    "found": False,
                    "message": "Tên sản phẩm hoặc tiêu chí truy xuất không hợp lệ.",
                    "detail": e.response.json(),
                }

            return {
                "found": False,
                "message": "Đã xảy ra lỗi khi lấy chi tiết điện thoại.",
            }

        except httpx.RequestError:
            return {
                "found": False,
                "message": "Không thể kết nối đến Product Service.",
            }

# 5. LẤY CHI TIẾT LAPTOP THEO TIÊU CHÍ
async def get_laptop_detail(
    laptop_name: str,
    criteria: list[str] | None = None,
):
    url = (
        f"{PRODUCT_SERVICE_URL}"
        "/api/v1/ai/product-service/detail/laptop"
    )

    params = [("laptopName", laptop_name)]

    if criteria:
        params.extend(
            ("criteria", item) for item in criteria
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params)

            if response.status_code == 404:
                return {
                    "found": False,
                    "message": f"Không tìm thấy laptop: {laptop_name}",
                }

            response.raise_for_status()

            return {
                "found": True,
                "data": response.json(),
            }

        except httpx.TimeoutException:
            return {
                "found": False,
                "message": "Product Service phản hồi quá thời gian.",
            }

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                return {
                    "found": False,
                    "message": "Tên sản phẩm hoặc tiêu chí truy xuất không hợp lệ.",
                    "detail": e.response.json(),
                }

            return {
                "found": False,
                "message": "Đã xảy ra lỗi khi lấy chi tiết laptop.",
            }

        except httpx.RequestError:
            return {
                "found": False,
                "message": "Không thể kết nối đến Product Service.",
            }

# 6. LẤY CHI TIẾT TABLET THEO TIÊU CHÍ
async def get_tablet_detail(
    tablet_name: str,
    criteria: list[str] | None = None,
):
    url = (
        f"{PRODUCT_SERVICE_URL}"
        "/api/v1/ai/product-service/detail/tablet"
    )

    params = [("tabletName", tablet_name)]

    if criteria:
        params.extend(
            ("criteria", item) for item in criteria
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url, params=params)

            if response.status_code == 404:
                return {
                    "found": False,
                    "message": f"Không tìm thấy tablet: {tablet_name}",
                }

            response.raise_for_status()

            return {
                "found": True,
                "data": response.json(),
            }

        except httpx.TimeoutException:
            return {
                "found": False,
                "message": "Product Service phản hồi quá thời gian.",
            }

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                return {
                    "found": False,
                    "message": "Tên sản phẩm hoặc tiêu chí truy xuất không hợp lệ.",
                    "detail": e.response.json(),
                }

            return {
                "found": False,
                "message": "Đã xảy ra lỗi khi lấy chi tiết tablet.",
            }

        except httpx.RequestError:
            return {
                "found": False,
                "message": "Không thể kết nối đến Product Service.",
            }