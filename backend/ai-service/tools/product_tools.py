from langchain.tools import tool

from services.product_service import (get_product_details)

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