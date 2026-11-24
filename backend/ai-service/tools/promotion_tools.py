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

    MÔ TẢ:
    Lấy danh sách các mã giảm giá (coupon) đang hoạt động
    thông qua Promotion Service.

    KHI NÀO SỬ DỤNG:
    - Người dùng muốn xem các mã giảm giá hiện có.
    - Người dùng muốn biết có những coupon nào có thể áp dụng.
    - Khi cần kiểm tra các chương trình giảm giá bằng coupon.

    QUY TẮC:
    - Chỉ sử dụng dữ liệu trả về từ Promotion Service.
    - Không tự tạo hoặc suy đoán mã coupon.
    - Không tự khẳng định coupon áp dụng được cho đơn hàng
      nếu chưa kiểm tra điều kiện áp dụng.
    - Chú ý các thông tin minOrderValue và maxDiscountValue.
    - Nếu không tìm thấy coupon, thông báo rõ ràng cho người dùng.
    - Nếu xảy ra lỗi, thông báo theo kết quả trả về.

    KẾT QUẢ:
    Trả về danh sách coupon gồm:
    - couponId
    - couponName
    - discountValue
    - minOrderValue
    - maxDiscountValue
    - discountType
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

    MÔ TẢ:
    Lấy thông tin khuyến mãi trực tiếp của một sản phẩm
    thông qua SKU.

    KHI NÀO SỬ DỤNG:
    - Người dùng muốn biết sản phẩm có đang được giảm giá không.
    - Người dùng muốn xem mức giảm giá của một sản phẩm cụ thể.
    - Khi cần kiểm tra khuyến mãi của sản phẩm trước khi tư vấn
      hoặc tạo đơn hàng.

    QUY TẮC:
    - SKU phải là SKU thực tế của sản phẩm.
    - Không tự tạo hoặc suy đoán SKU.
    - Chỉ sử dụng thông tin khuyến mãi từ Promotion Service.
    - Không tự tính toán giá bán cuối cùng nếu chưa có giá gốc
      và chưa xác định đúng discountType.
    - Nếu sản phẩm không có khuyến mãi, thông báo rõ ràng.
    - Nếu xảy ra lỗi, thông báo theo kết quả trả về.

    KẾT QUẢ:
    Trả về thông tin:
    - promotionId
    - promotionName
    - sku
    - discountType
    - discountValue
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

    MÔ TẢ:
    Lấy danh sách khuyến mãi trực tiếp của nhiều sản phẩm
    thông qua danh sách SKU.

    KHI NÀO SỬ DỤNG:
    - Người dùng muốn xem khuyến mãi của nhiều sản phẩm.
    - Khi cần kiểm tra khuyến mãi của danh sách sản phẩm.
    - Khi cần thu thập thông tin khuyến mãi để so sánh sản phẩm.
    - Khi cần kiểm tra khuyến mãi các sản phẩm trong giỏ hàng
      trước khi tư vấn hoặc tạo đơn hàng.

    QUY TẮC:
    - Chỉ sử dụng các SKU thực tế đã được xác định.
    - Không tự tạo hoặc suy đoán SKU.
    - Truyền danh sách SKU vào một lần gọi Tool.
    - Không gọi riêng lẻ nhiều lần get_direct_discount
      khi có thể sử dụng Tool này.
    - Chỉ những SKU có khuyến mãi mới xuất hiện trong kết quả.
    - SKU không xuất hiện trong kết quả được hiểu là
      không tìm thấy khuyến mãi trực tiếp.
    - Không tự tính toán giá bán cuối cùng nếu chưa có giá gốc
      và chưa xác định đúng discountType.
    - Không tự tạo hoặc suy đoán thông tin khuyến mãi.

    KẾT QUẢ:
    Trả về danh sách thông tin:
    - promotionId
    - promotionName
    - sku
    - discountType
    - discountValue
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