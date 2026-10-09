from langchain.tools import tool

from services.product_service import search_products


@tool
async def search_product(keyword: str):
    """
    Tìm kiếm sản phẩm công nghệ theo từ khóa.
    Sử dụng tool này khi người dùng muốn tìm sản phẩm.
    Ví dụ: iPhone 17, Samsung, laptop gaming...
    """
    return await search_products(keyword)