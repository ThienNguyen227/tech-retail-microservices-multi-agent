from langchain.tools import tool

from services.user_service import (
  search_user as search_user_api,
)


# SEARCH USER
@tool
async def search_user(
    phone: str | None = None,
    email: str | None = None,
):
    """
    TOOL: search_user

    Tra cứu tài khoản người dùng theo số điện thoại hoặc email.

    SỬ DỤNG KHI:
    - Người dùng muốn tìm tài khoản.
    - Cần xác định user_id để thực hiện nghiệp vụ tiếp theo.

    QUY TẮC:
    - Cung cấp ít nhất phone hoặc email.
    - Có thể sử dụng đồng thời cả hai tham số.
    - Không tự tạo hoặc suy đoán thông tin tài khoản.
    - Không sử dụng Tool này để tra cứu hồ sơ khách hàng
      hoặc địa chỉ đã đăng ký.

    KẾT QUẢ:
    - Chỉ sử dụng dữ liệu thực tế từ User Service.
    - Phân biệt rõ trường hợp không tìm thấy tài khoản
      và trường hợp API gặp lỗi.
    """
    
    # Chuẩn hóa đầu vào
    phone = phone.strip() if phone else None
    email = email.strip().lower() if email else None

    # Kiểm tra đầu vào
    if not phone and not email:
        return {
            "success": False,
            "found": False,
            "total": 0,
            "users": [],
            "message": (
                "Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm."
            ),
        }

    return await search_user_api(
        phone=phone,
        email=email,
    )