from langchain.tools import tool, ToolRuntime

from services.branch_service import (
    get_branch_address as get_branch_address_api,
)


# ==================== GET BRANCH ADDRESS ====================

@tool
async def get_branch_address(
    branch_id: int,
    runtime: ToolRuntime,
):
    """
    TOOL: get_branch_address

    MÔ TẢ:
    Lấy địa chỉ của một chi nhánh thông qua Branch Service.

    KHI NÀO SỬ DỤNG:
    - Người dùng muốn tra cứu địa chỉ chi nhánh.
    - Người dùng chọn STORE_PICKUP và cần xác định địa chỉ cửa hàng.

    QUY TẮC:
    - branch_id phải là ID chi nhánh hợp lệ.
    - Khi đặt hàng STORE_PICKUP, sử dụng branch_id = 1.
    - Không sử dụng Tool này để lấy địa chỉ giao hàng của khách hàng.
    - Không tự tạo hoặc suy đoán thông tin địa chỉ.
    - Chỉ sử dụng địa chỉ khi Branch Service trả về thành công.
    - Nếu không tìm thấy chi nhánh hoặc xảy ra lỗi, thông báo chính xác
      kết quả cho người dùng.

    KẾT QUẢ:
    Trả về thông tin:
    - branchId
    - addressLine
    - ward
    - province
    """

    # 1. Lấy Access Token từ Runtime Context.
    context = runtime.context or {}
    access_token = context.get("access_token")

    # 2. Kiểm tra branch_id.
    if not isinstance(branch_id, int) or branch_id <= 0:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Branch ID không hợp lệ.",
        }

    # 3. Gọi Branch Service.
    result = await get_branch_address_api(
        branch_id=branch_id,
        access_token=access_token,
    )

    return result