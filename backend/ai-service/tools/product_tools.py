from langchain.tools import tool
from typing import Literal

from services.product_service import (
    get_product_details,
    search_products as search_products_api,
    compare_phones as compare_phones_api,
)

@tool
async def get_product_detail(product_name: str):
    """
    Lấy thông tin chi tiết và cấu hình của một sản phẩm.
    Dùng khi người dùng hỏi cấu hình, thông số kỹ thuật,
    camera, màn hình, chip, pin, kết nối hoặc thiết kế.
    Ví dụ: iPhone 17 Pro Max có cấu hình như thế nào?
    Tham số product_name là tên sản phẩm, ví dụ iPhone 17 Pro Max.
    """
    return await get_product_details(product_name)


@tool
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
    """Tìm danh sách sản phẩm trong hệ thống.

    Dùng khi người dùng hỏi cửa hàng có bán những sản phẩm nào,
    các dòng sản phẩm của một thương hiệu, hoặc muốn lọc sản phẩm
    theo từ khóa, thương hiệu, danh mục, dung lượng, màu sắc và giá.

    keyword: từ khóa tên sản phẩm, slug hoặc SKU.
    brand: tên thương hiệu đúng theo dữ liệu hệ thống.
    category: tên danh mục.
    storage: dung lượng như 256GB hoặc 1TB.
    color: màu sắc như Bạc hoặc Xanh đậm.
    min_price: giá tối thiểu tính bằng VND.
    max_price: giá tối đa tính bằng VND.
    limit: số sản phẩm tối đa, từ 1 đến 100.

    Ví dụ: người dùng hỏi "Bạn bán các loại iPhone nào?"
    thì tìm theo keyword="iPhone".
    """
    return await search_products_api(
        keyword=keyword,
        brand=brand,
        category=category,
        storage=storage,
        color=color,
        min_price=min_price,
        max_price=max_price,
        limit=limit,
    )


CompareCriteria = Literal[
    "basic",
    "variant",
    "price",
    "performance",
    "camera",
    "screen",
    "battery",
    "connectivity",
    "design",
    "utilities",
    "all",
]


@tool
async def compare_phones(
    products: list[str],
    criteria: list[CompareCriteria] | None = None,
):
    """Lấy dữ liệu để so sánh từ 2 đến 5 điện thoại.

    products: Danh sách tên sản phẩm chính xác.
    criteria: Danh sách tiêu chí cần so sánh.

    Tiêu chí hỗ trợ:
    - basic: thông tin cơ bản
    - variant: dung lượng, màu sắc, giá và mã phiên bản
    - price: giá theo từng dung lượng
    - performance: chip, CPU, GPU, RAM và bộ nhớ
    - camera: camera và tính năng quay video
    - screen: thông số màn hình
    - battery: pin và sạc
    - connectivity: kết nối
    - design: thiết kế, chất liệu, kích thước và trọng lượng
    - utilities: tiện ích
    - all: toàn bộ dữ liệu

    Nếu criteria không được cung cấp, Product-Service trả về toàn bộ dữ liệu.
    Chỉ chọn các tiêu chí liên quan đến yêu cầu của người dùng.
    """
    return await compare_phones_api(
        products=products,
        criteria=criteria,
    )