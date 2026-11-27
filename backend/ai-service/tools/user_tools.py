from langchain.tools import tool, ToolRuntime

from services.user_service import (
    search_user as search_user_api,
)


# ============================================================
# SEARCH USER TOOL
# ============================================================

@tool
async def search_user(
    runtime: ToolRuntime,
    phone: str | None = None,
    email: str | None = None,
):
    """
    Tra cứu tài khoản theo số điện thoại hoặc email, xác định user_id.

    THAM SỐ:
    - phone: Số điện thoại.
    - email: Email.
    - Có thể truyền cả hai hoặc bỏ trống khi Role 4 tra cứu chính mình.

    PHÂN QUYỀN:
    - Role 2: Tra cứu mọi tài khoản, cần phone hoặc email.
    - Role 4: Chỉ tra cứu chính mình.
    - Có cả Role 2 và 4: Chỉ tra cứu chính mình.
    - Role khác: Không có quyền.
    - User Service xác thực JWT và kiểm tra quyền.
    - Access Token lấy từ Runtime Context, không hỏi người dùng.
    - Không suy đoán Role, dữ liệu hoặc tìm cách vượt quyền.

    KẾT QUẢ:
    - success=true, found=true: Trả về thông tin tài khoản.
    - success=true, found=false: Không tìm thấy tài khoản.
    - HTTP 401: Yêu cầu đăng nhập lại.
    - HTTP 403: Trả lời nguyên văn message và kết thúc.
    Không yêu cầu đăng nhập lại hoặc cung cấp thông tin đăng nhập.
    - success=false: Thông báo theo message, không suy diễn.

    Không dùng Tool này để tra cứu hồ sơ hoặc địa chỉ khách hàng.
    """
    # ========================================================
    # 1. GET RUNTIME CONTEXT
    # ========================================================

    context = runtime.context or {}

    user_id = context.get("user_id")
    access_token = context.get("access_token")

    if not isinstance(user_id, str) or not user_id.strip():
        return {
            "success": False,
            "found": False,
            "total": 0,
            "users": [],
            "message": "Không xác định được tài khoản người dùng.",
        }

    if (
        not isinstance(access_token, str)
        or not access_token.strip()
    ):
        return {
            "success": False,
            "found": False,
            "total": 0,
            "users": [],
            "message": "Không tìm thấy Access Token hợp lệ.",
        }

    # ========================================================
    # 2. NORMALIZE INPUT
    # ========================================================

    phone = (phone.strip() or None) if phone else None
    email = (email.strip().lower() or None) if email else None

    access_token = access_token.strip()

    # ========================================================
    # 3. CALL USER SERVICE
    # ========================================================

    return await search_user_api(
        phone=phone,
        email=email,
        access_token=access_token,
    )