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
    phones: list[str] | None = None,
    emails: list[str] | None = None,
):
    """
    Tra cứu một hoặc nhiều tài khoản theo phone/email.

    THAM SỐ:
    - phones: Danh sách số điện thoại.
    - emails: Danh sách email.
    - Truyền tất cả giá trị trong một lần gọi, tối đa 100.
    - CUSTOMER tra cứu chính mình: Không truyền tham số.

    PHÂN QUYỀN:
    - Role 1: Chỉ tra cứu chính mình.
    - Role 2: Tra cứu mọi tài khoản theo phones/emails.
    - Có cả Role 1 và 2: Chỉ tra cứu chính mình.
    - Role khác: Không có quyền.
    - Backend xác thực JWT và phân quyền.

    KẾT QUẢ:
    - success=true, found=true: Trả về dữ liệu thực tế.
    - success=true, found=false: Không tìm thấy tài khoản.
    - HTTP 401: Yêu cầu đăng nhập lại.
    - HTTP 403: Trả lời nguyên văn message, kết thúc.
      Không yêu cầu đăng nhập lại.
    - Lỗi khác: Thông báo theo message.

    Không gọi riêng từng phone/email, không suy đoán dữ liệu.
    Không dùng để tra cứu hồ sơ hoặc địa chỉ khách hàng.
    """

    # ========================================================
    # 1. GET RUNTIME CONTEXT
    # ========================================================

    context = runtime.context or {}

    user_id = context.get("user_id")
    access_token = context.get("access_token")

    # ========================================================
    # 2. VALIDATE AUTHENTICATION
    # ========================================================

    if not isinstance(user_id, str) or not user_id.strip():
        return {
            "success": False,
            "found": False,
            "total": 0,
            "users": [],
            "status_code": 401,
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
            "status_code": 401,
            "message": "Không tìm thấy Access Token hợp lệ.",
        }

    # ========================================================
    # 3. CALL USER SERVICE
    # ========================================================

    return await search_user_api(
        phones=phones,
        emails=emails,
        access_token=access_token.strip(),
    )