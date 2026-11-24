from langchain.tools import tool, ToolRuntime

from services.promotion_service import (
    get_all_coupons as get_all_coupons_api,
    get_direct_discount as get_direct_discount_api,
    get_direct_discounts as get_direct_discounts_api,
)

# ==================== GET ALL COUPONS ====================

@tool
async def get_all_coupons(
    runtime: ToolRuntime,
):
    """
    TOOL: get_all_coupons

    Lấy danh sách coupon đang hoạt động từ Promotion Service.

    SỬ DỤNG KHI:
    - Người dùng muốn xem các mã giảm giá hiện có.
    - Cần tìm coupon để áp dụng cho đơn hàng.

    QUY TẮC:
    - Chỉ sử dụng dữ liệu từ Promotion Service.
    - Không tự tạo hoặc lựa chọn coupon thay người dùng.
    - Không khẳng định coupon áp dụng thành công
    khi chưa xác minh điều kiện.

    KẾT QUẢ:
    Trả về thông tin coupon gồm couponId, couponName,
    discountType, discountValue, minOrderValue
    và maxDiscountValue.
    """

    # 1. Lấy Access Token từ Runtime Context.
    context = runtime.context or {}
    access_token = context.get("access_token")

    # 2. Gọi Promotion Service.
    result = await get_all_coupons_api(
        access_token=access_token,
    )

    return result

# ==================== GET DIRECT DISCOUNT BY SKU ====================

@tool
async def get_direct_discount(
    sku: str,
    runtime: ToolRuntime,
):
    """
    TOOL: get_direct_discount

    Tra cứu thông tin khuyến mãi trực tiếp của một sản phẩm
    theo SKU để trả lời các câu hỏi của người dùng.

    Chỉ sử dụng khi người dùng muốn tìm hiểu về chương trình
    khuyến mãi của một sản phẩm cụ thể.

    Không sử dụng Tool này để tính giá cuối cùng,
    tính tiền đơn hàng hoặc xử lý checkout.
    """

    # 1. Lấy Access Token từ Runtime Context.
    context = runtime.context or {}
    access_token = context.get("access_token")

    # 2. Kiểm tra SKU.
    if not isinstance(sku, str) or not sku.strip():
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "SKU không hợp lệ.",
        }

    # 3. Gọi Promotion Service.
    result = await get_direct_discount_api(
        sku=sku.strip(),
        access_token=access_token,
    )

    return result

# ==================== GET DIRECT DISCOUNTS BY MULTIPLE SKUS ====================

@tool
async def get_direct_discounts(
    skus: list[str],
    runtime: ToolRuntime,
):
    """
    TOOL: get_direct_discounts

    Tra cứu thông tin khuyến mãi trực tiếp của nhiều sản phẩm
    theo danh sách SKU để trả lời các câu hỏi của người dùng.

    Chỉ sử dụng khi người dùng muốn tìm hiểu hoặc so sánh
    khuyến mãi giữa nhiều sản phẩm.

    SKU không xuất hiện trong kết quả được hiểu là
    không có khuyến mãi trực tiếp.

    Không sử dụng Tool này để tính giá cuối cùng,
    tính tiền đơn hàng hoặc xử lý checkout.
    """

    # 1. Lấy Access Token từ Runtime Context.
    context = runtime.context or {}
    access_token = context.get("access_token")

    # 2. Kiểm tra danh sách SKU.
    if not isinstance(skus, list) or not skus:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Danh sách SKU không được để trống.",
        }

    if any(
        not isinstance(sku, str) or not sku.strip()
        for sku in skus
    ):
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Danh sách SKU không hợp lệ.",
        }

    # 3. Loại bỏ SKU trùng lặp.
    unique_skus = list(dict.fromkeys(
        sku.strip() for sku in skus
    ))

    # 4. Gọi Promotion Service.
    result = await get_direct_discounts_api(
        skus=unique_skus,
        access_token=access_token,
    )

    return result