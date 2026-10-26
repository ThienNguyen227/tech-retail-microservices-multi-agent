from langchain.tools import tool

from services.user_service import (
    search_user as search_user_api
)

@tool
async def search_user(
    phone: str | None = None,
    email: str | None = None,
):
    """
    Tìm kiếm tài khoản người dùng theo số điện thoại hoặc email.

    Sử dụng tool này khi cần tìm tài khoản người dùng trong hệ thống.

    Args:
        phone: Số điện thoại của người dùng cần tìm.
        email: Email của người dùng cần tìm.

    Cần cung cấp ít nhất một trong hai tham số phone hoặc email.
    Nếu cung cấp cả hai, việc tìm kiếm sẽ tuân theo logic của User Service API.

    Chỉ sử dụng dữ liệu được trả về từ User Service API.
    Không tự suy đoán hoặc tạo thông tin người dùng không tồn tại.
    Không tiết lộ mật khẩu, password hash, token hoặc thông tin xác thực.
    """
    # Kiểm tra đầu vào
    phone = phone.strip() if phone else None
    email = email.strip().lower() if email else None

    if not phone and not email:
        return {
            "success": False,
            "message": "Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm.",
            "users": [],
        }

    try:
        result = await search_user_api(
            phone=phone,
            email=email,
        )
        return result

    except Exception:
        # Không đưa chi tiết lỗi nội bộ ra cho LLM hoặc người dùng.
        return {
            "success": False,
            "message": "Không thể tìm kiếm tài khoản người dùng lúc này. Vui lòng thử lại sau.",
            "users": [],
        }
