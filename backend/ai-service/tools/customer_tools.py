from langchain.tools import tool, ToolRuntime

from services.customer_service import (
    search_customer as search_customer_api,
)


# ============================================================
# SEARCH CUSTOMER AND ADDRESSES
# ============================================================

@tool
async def search_customer(
    runtime: ToolRuntime,
    user_ids: list[str] | None = None,
    customer_codes: list[str] | None = None,
):
    """
    Tra cứu hồ sơ và địa chỉ của một hoặc nhiều khách hàng.

    THAM SỐ:
    - user_ids: Danh sách User ID.
    - customer_codes: Danh sách mã khách hàng.
    - Gộp toàn bộ định danh trong một lần gọi, tối đa 100.

    PHÂN QUYỀN:
    - Role 1: Chỉ tra cứu chính mình.
    - Role 2,3,4: Tra cứu mọi khách hàng theo định danh.
    - Có Role 1 cùng Role khác: Chỉ tra cứu chính mình.
    - Role khác: Không có quyền.
    - Backend xác thực JWT và phân quyền.

    QUY TẮC:
    - CUSTOMER hỏi hồ sơ hoặc địa chỉ cá nhân:
      Gọi Tool không tham số.
    - Dùng Tool này khi cần lấy địa chỉ để đặt hàng.
    - Không tự tạo user_id hoặc customer_code.
    - Không gọi riêng từng khách hàng.

    KẾT QUẢ:
    - data: Danh sách hồ sơ khách hàng.
    - data[i].addresses: Địa chỉ của khách hàng tương ứng.
    - Phân biệt địa chỉ mặc định.
    - addresses=[]: Chưa đăng ký địa chỉ.
    - found=false: Không tìm thấy trong phạm vi được phép.
    - Chỉ trình bày dữ liệu liên quan đến yêu cầu.
    - HTTP 401/403: Tuân thủ quy tắc xử lý lỗi chung.
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
            "totalAddresses": 0,
            "data": None,
            "status_code": 401,
            "message": "Không xác định được tài khoản đăng nhập.",
        }

    if (
        not isinstance(access_token, str)
        or not access_token.strip()
    ):
        return {
            "success": False,
            "found": False,
            "total": 0,
            "totalAddresses": 0,
            "data": None,
            "status_code": 401,
            "message": "Không tìm thấy Access Token hợp lệ.",
        }

    # ========================================================
    # 3. CALL CUSTOMER SERVICE
    # ========================================================

    return await search_customer_api(
        user_ids=user_ids,
        customer_codes=customer_codes,
        access_token=access_token.strip(),
    )