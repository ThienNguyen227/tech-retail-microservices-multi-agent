from langchain.tools import tool

from services.user_service import (
    search_user as search_user_api,
)


@tool
async def search_user(
    phone: str | None = None,
    email: str | None = None,
):
    """
    TOOL: search_user

    1. MÔ TẢ
    Tra cứu tài khoản người dùng từ User Service
    theo số điện thoại hoặc email.

    2. KHI NÀO SỬ DỤNG
    - Người dùng muốn tìm kiếm tài khoản theo số điện thoại.
    - Người dùng muốn tìm kiếm tài khoản theo email.
    - Người dùng cung cấp số điện thoại hoặc email
      để xác định user_id.
    - Supervisor cần xác định user_id để chuyển tiếp
      yêu cầu tra cứu sang Customer Agent.
    - Agent cần xác minh thông tin tài khoản trước khi
      thực hiện các bước xử lý tiếp theo.

    Không sử dụng Tool này để tra cứu hồ sơ khách hàng,
    mã khách hàng hoặc danh sách địa chỉ đã đăng ký.
    Các yêu cầu đó thuộc phạm vi của Customer Service.

    3. THAM SỐ ĐẦU VÀO

    - phone:
      Số điện thoại của tài khoản cần tìm kiếm.

    - email:
      Email của tài khoản cần tìm kiếm.

    Cần cung cấp ít nhất một trong hai tham số.
    Nếu cung cấp cả hai, User Service sẽ áp dụng
    điều kiện tìm kiếm theo logic của API.

    4. QUY TẮC SỬ DỤNG

    - Nếu chỉ có phone, tra cứu theo phone.
    - Nếu chỉ có email, tra cứu theo email.
    - Nếu có cả phone và email, truyền cả hai
      để User Service xử lý.
    - Chuẩn hóa phone bằng cách loại bỏ khoảng trắng
      ở đầu và cuối chuỗi.
    - Chuẩn hóa email bằng cách loại bỏ khoảng trắng
      ở đầu và cuối chuỗi, đồng thời chuyển thành chữ thường.
    - Không tự tạo phone, email hoặc user_id.
    - Không sử dụng customer_id nội bộ của Customer Service
      thay cho user_id của User Service.
    - Nếu chưa có phone hoặc email, không gọi API;
      yêu cầu người dùng cung cấp thông tin phù hợp.

    5. QUY TẮC XỬ LÝ KẾT QUẢ

    - Nếu success = true và found = true,
      sử dụng thông tin tài khoản do API trả về.
    - Nếu success = true và found = false,
      thông báo không tìm thấy tài khoản.
    - Nếu success = false,
      thông báo không thể tra cứu tài khoản;
      không khẳng định tài khoản không tồn tại.
    - Không tự suy đoán thông tin khi dữ liệu bị thiếu.
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