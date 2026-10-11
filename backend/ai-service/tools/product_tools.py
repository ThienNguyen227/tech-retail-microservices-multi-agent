from langchain.tools import tool

from services.product_service import (
    get_product_details,
    search_products as search_products_api,
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