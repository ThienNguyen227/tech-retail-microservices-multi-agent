from langchain.tools import tool

from services.customer_service import (
    search_customer as search_customer_api,
    get_customer_addresses as get_customer_addresses_api,
)


# SEARCH CUSTOMER
@tool
async def search_customer(
    user_id: str | None = None,
    customer_code: str | None = None,
):
    """
    TOOL: search_customer

    Tra cứu hồ sơ khách hàng theo user_id hoặc customer_code.

    SỬ DỤNG KHI:
    - Người dùng muốn xem thông tin hồ sơ khách hàng.
    - Cần xác minh thông tin khách hàng cho nghiệp vụ khác.

    QUY TẮC:
    - Có thể cung cấp user_id, customer_code hoặc cả hai.
    - Nếu có cả hai, sử dụng để kiểm tra tính nhất quán.
    - Không tự tạo hoặc suy đoán thông tin định danh.
    - Nếu chỉ hỏi danh sách địa chỉ, sử dụng get_customer_addresses.

    KẾT QUẢ:
    Chỉ trả lời dựa trên dữ liệu thực tế từ Customer Service.
    Không suy đoán khi dữ liệu không đầy đủ hoặc API gặp lỗi.
    """
    user_id = user_id.strip() if user_id else None
    customer_code = customer_code.strip() if customer_code else None

    if not user_id and not customer_code:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Cần cung cấp user_id hoặc customer_code.",
        }

    return await search_customer_api(
        user_id=user_id,
        customer_code=customer_code,
    )


# GET CUSTOMER ADDRESSES
@tool
async def get_customer_addresses(
    user_id: str | None = None,
    customer_code: str | None = None,
):
    """
    TOOL: get_customer_addresses

    Lấy danh sách địa chỉ đã đăng ký của khách hàng
    theo user_id hoặc customer_code.

    SỬ DỤNG KHI:
    - Người dùng muốn xem địa chỉ giao hàng đã lưu.
    - Cần lấy địa chỉ khách hàng để chuẩn bị đơn hàng.

    QUY TẮC:
    - Có thể cung cấp user_id, customer_code hoặc cả hai.
    - Nếu có cả hai, sử dụng để kiểm tra tính nhất quán.
    - Không tự tạo hoặc suy đoán thông tin định danh.
    - Nếu cần tra cứu hồ sơ khách hàng, sử dụng search_customer.

    KẾT QUẢ:
    - Trình bày các địa chỉ được trả về.
    - Phân biệt địa chỉ mặc định nếu có.
    - Nếu danh sách rỗng, thông báo khách hàng chưa đăng ký địa chỉ.
    - Không kết luận không có địa chỉ khi API gặp lỗi.
    """
    user_id = user_id.strip() if user_id else None
    customer_code = customer_code.strip() if customer_code else None

    if not user_id and not customer_code:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Cần cung cấp user_id hoặc customer_code.",
        }

    return await get_customer_addresses_api(
        user_id=user_id,
        customer_code=customer_code,
    )