from typing import Any, Literal
import math

from pydantic import BaseModel, ConfigDict, Field
from langchain.tools import tool, ToolRuntime

from services.order_service import (
    create_order as create_order_api,
    calculate_final_price as calculate_final_price_api,
)

# ============================================================
# ORDER ITEM SCHEMA
# ============================================================

class OrderItemInput(BaseModel):
    """Schema dữ liệu cho từng sản phẩm trong đơn hàng."""

    model_config = ConfigDict(extra="forbid")

    sku: str = Field(
        min_length=1,
        description="SKU chính xác của biến thể sản phẩm đã được Product Service xác nhận.",
    )

    productName: str = Field(
        min_length=1,
        description="Tên sản phẩm lấy từ Product Service.",
    )

    imageUrl: str = Field(
        min_length=1,
        description=(
            "Giữ nguyên tên file hoặc đường dẫn hình ảnh do Product Service trả về. "
            "Không tự thêm domain hoặc giao thức."
        ),
    )

    quantity: int = Field(
        gt=0,
        description="Số lượng sản phẩm, là số nguyên dương.",
    )

    price: float = Field(
        ge=0,
        description="Đơn giá sau khi áp dụng khuyến mãi trực tiếp nếu có.",
    )

    subtotal: float = Field(
        ge=0,
        description="Thành tiền sản phẩm sau khi áp dụng khuyến mãi trực tiếp.",
    )

    promotionId: str | int | None = Field(
        default=None,
        description="ID khuyến mãi trực tiếp; null nếu không có.",
    )

    promotionName: str | None = Field(
        default=None,
        description="Tên khuyến mãi trực tiếp; null nếu không có.",
    )

    directDiscountAmount: float = Field(
        default=0,
        ge=0,
        description="Số tiền giảm trực tiếp của sản phẩm; bằng 0 nếu không có.",
    )


# ============================================================
# CREATE ORDER TOOL
# ============================================================

@tool
async def create_order(
    fulfillmentType: Literal["HOME_DELIVERY", "STORE_PICKUP"],
    recipientName: str,
    recipientPhone: str,
    items: list[OrderItemInput],
    subtotal: float,
    shippingFee: float,
    couponDiscountAmount: float,
    discountAmount: float,
    totalAmount: float,
    paymentMethod: Literal["COD", "MOMO", "VNPAY"],

    addressLine: str,
    ward: str,
    province: str,

    runtime: ToolRuntime,

    couponId: str | int | None = None,
    couponName: str | None = None,
):
    """
    TOOL: create_order

    Tạo đơn hàng thông qua Order Service sau khi đã xác minh
    đầy đủ thông tin và được người dùng xác nhận.

    THÔNG TIN BẮT BUỘC:
    - Người nhận: recipientName, recipientPhone.
    - Sản phẩm: SKU, biến thể, số lượng và thông tin sản phẩm.
    - Hình thức nhận hàng và địa chỉ tương ứng.
    - Phương thức thanh toán.
    - Các giá trị tài chính theo dữ liệu đã xác minh.

    QUY TẮC SẢN PHẨM VÀ KHÁCH HÀNG:
    - SKU, tên, hình ảnh và giá phải lấy từ Product Service.
    - Sử dụng Customer Tools khi cần tra cứu khách hàng
    và địa chỉ giao hàng.
    - Không tự tạo hoặc suy đoán dữ liệu.

    QUY TẮC NHẬN HÀNG:

    HOME_DELIVERY:
    - fulfillmentType = HOME_DELIVERY.
    - branchId = 10 (kho tổng).
    - Lấy địa chỉ từ Customer Service.

    STORE_PICKUP:
    - fulfillmentType = STORE_PICKUP.
    - branchId = 1.
    - Bắt buộc gọi get_branch_address(branch_id=1)
    để lấy địa chỉ chi nhánh.

    Cả hai hình thức đều phải có đầy đủ:
    addressLine, ward, province.
    Không có địa chỉ hợp lệ thì không tạo đơn.

    QUY TẮC TÀI CHÍNH:
    - directDiscountAmount: Giảm giá trực tiếp từng sản phẩm.
    - couponDiscountAmount: Giảm giá coupon toàn đơn.
    - discountAmount: Tổng giảm giá trực tiếp và coupon.
    - subtotal: Tổng tiền hàng sau Direct Discount,
    trước coupon.
    - totalAmount: Tổng tiền thanh toán đã xác minh.
    - Không tự tính, tạo hoặc sửa đổi dữ liệu tài chính.
    - Không áp dụng trùng các khoản giảm giá.

    THANH TOÁN:
    Chỉ chấp nhận COD, MOMO hoặc VNPAY.
    Không tự lựa chọn thay người dùng.

    XÁC NHẬN VÀ XỬ LÝ KẾT QUẢ:
    - Chỉ gọi Tool sau khi người dùng xác nhận đơn hàng.
    - Không xem yêu cầu tư vấn hoặc hỏi giá là xác nhận đặt hàng.
    - success = true: Thông báo thành công theo dữ liệu trả về.
    - success = false: Thông báo lỗi theo kết quả API.
    - Timeout hoặc lỗi kết nối: Kiểm tra trạng thái đơn hàng
    trước khi thử lại, không tự động tạo đơn lần nữa.
    - Không tự tạo mã đơn hàng hoặc khẳng định thành công
    khi chưa có xác nhận từ Order Service.
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
            "data": None,
            "message": "Không xác định được tài khoản người dùng.",
        }

    if not isinstance(access_token, str) or not access_token.strip():
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Không tìm thấy Access Token hợp lệ.",
        }

    user_id = user_id.strip()
    access_token = access_token.strip()

    # ========================================================
    # 2. VALIDATE RECIPIENT INFORMATION
    # ========================================================

    if not isinstance(recipientName, str) or not recipientName.strip():
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Thiếu họ tên người nhận hàng.",
        }

    if not isinstance(recipientPhone, str) or not recipientPhone.strip():
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Thiếu số điện thoại người nhận hàng.",
        }

    # ========================================================
    # 3. VALIDATE ADDRESS FOR BOTH FULFILLMENT TYPES
    # ========================================================

    address_fields = {
        "addressLine": addressLine,
        "ward": ward,
        "province": province,
    }

    for field_name, value in address_fields.items():
        if not isinstance(value, str) or not value.strip():
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": f"Thiếu thông tin địa chỉ nhận hàng: {field_name}.",
            }

    # ========================================================
    # 4. DETERMINE BRANCH ID
    # ========================================================

    branch_id = 1 if fulfillmentType == "STORE_PICKUP" else 10

    # ========================================================
    # 5. VALIDATE ORDER ITEMS
    # ========================================================

    if not isinstance(items, list) or not items:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Đơn hàng phải có ít nhất một sản phẩm.",
        }

    normalized_items: list[dict[str, Any]] = []

    for index, item in enumerate(items):
        try:
            validated_item = (
                item
                if isinstance(item, OrderItemInput)
                else OrderItemInput.model_validate(item)
            )

            normalized_items.append(validated_item.model_dump())

        except Exception as exc:
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": (
                    f"Thông tin sản phẩm thứ {index + 1} "
                    f"không hợp lệ: {exc}"
                ),
            }

    # ========================================================
    # 6. VALIDATE FINANCIAL VALUES
    # ========================================================

    monetary_values = {
        "subtotal": subtotal,
        "shippingFee": shippingFee,
        "couponDiscountAmount": couponDiscountAmount,
        "discountAmount": discountAmount,
        "totalAmount": totalAmount,
    }

    for field_name, value in monetary_values.items():
        if not isinstance(value, (int, float)) or not math.isfinite(value):
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": f"Giá trị {field_name} không hợp lệ.",
            }

        if value < 0:
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": f"Giá trị {field_name} không được âm.",
            }

    # ========================================================
    # 7. BUILD ORDER PAYLOAD
    # ========================================================

    payload: dict[str, Any] = {
        "userId": user_id,
        "fulfillmentType": fulfillmentType,
        "branchId": branch_id,

        "recipientName": recipientName.strip(),
        "recipientPhone": recipientPhone.strip(),

        # Địa chỉ luôn được gửi cho cả HOME_DELIVERY
        # và STORE_PICKUP.
        "addressLine": addressLine.strip(),
        "ward": ward.strip(),
        "province": province.strip(),

        "items": normalized_items,

        "subtotal": subtotal,
        "shippingFee": shippingFee,

        "couponId": couponId,
        "couponName": couponName,
        "couponDiscountAmount": couponDiscountAmount,

        "discountAmount": discountAmount,
        "totalAmount": totalAmount,

        "paymentMethod": paymentMethod,
    }

    # ========================================================
    # 8. CALL ORDER SERVICE
    # ========================================================

    return await create_order_api(
        order_data=payload,
        access_token=access_token,
    )


# ============================================================
# CALCULATE FINAL PRICE INPUT
# ============================================================

class CalculateFinalPriceItemInput(BaseModel):
    """
    Schema đầu vào cho từng sản phẩm cần tính giá.
    """

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    sku: str = Field(
        min_length=1,
        description=(
            "SKU chính xác của biến thể sản phẩm "
            "đã được Product Service xác nhận."
        ),
    )

    quantity: int = Field(
        ge=1,
        description=(
            "Số lượng sản phẩm người dùng muốn mua. "
            "Phải là số nguyên dương."
        ),
    )


# ============================================================
# CALCULATE FINAL PRICE TOOL
# ============================================================

@tool
async def calculate_final_price(
    items: list[CalculateFinalPriceItemInput],
    runtime: ToolRuntime,
    coupon_id: int | None = None,
):
    """
    TOOL: calculate_final_price

    Tính giá cuối cùng của danh sách sản phẩm thông qua Order Service.

    1. THAM SỐ

    - items: Danh sách sản phẩm gồm sku và quantity.
    SKU phải được xác minh từ Product Service.
    - coupon_id: ID coupon người dùng đã chọn.
    Để None nếu không sử dụng coupon.

    2. KHI NÀO SỬ DỤNG

    - Người dùng muốn kiểm tra tổng giá sản phẩm.
    - Người dùng thay đổi SKU hoặc số lượng.
    - Người dùng chọn coupon và cần tính lại giá.
    - Trước khi tạo đơn hàng, cần xác minh giá mới nhất.

    3. QUY TẮC

    - Không tự tạo SKU hoặc suy đoán giá.
    - Không tự tính khuyến mãi, coupon hoặc tổng tiền.
    - Khi có coupon, truyền đúng coupon_id.
    - Không tự chọn coupon thay người dùng.
    - Khi SKU, quantity hoặc coupon thay đổi, phải tính lại giá.
    - Không gọi lại Tool nếu dữ liệu đầu vào không thay đổi.

    4. KẾT QUẢ

    - products: Chi tiết giá và khuyến mãi từng sản phẩm.
    - originalSubtotal: Tổng tiền trước giảm giá.
    - subtotal: Tổng tiền sau khuyến mãi trực tiếp.
    - totalDirectDiscountAmount: Tổng giảm giá trực tiếp.
    - coupon: Thông tin coupon và trạng thái áp dụng.
    - couponDiscountAmount: Số tiền giảm từ coupon.
    - discountAmount: Tổng tiền được giảm.
    - totalAmount: Tổng tiền sau tất cả giảm giá, chưa gồm phí vận chuyển.

    Chỉ sử dụng số liệu từ kết quả Order Service.
    Nếu couponApplied = false, không được thông báo coupon đã áp dụng.

    5. XỬ LÝ LỖI

    - success = false: Đọc message và detail để xử lý.
    - notFoundSkus không rỗng: Thông báo SKU không tìm thấy.
    - Coupon không hợp lệ: Thông báo theo lỗi trả về.
    - Timeout hoặc lỗi kết nối: Thông báo chưa thể xác minh giá.

    Không tạo đơn hàng khi chưa xác minh được giá thành công.
    """

    # ========================================================
    # 1. VALIDATE ITEMS
    # ========================================================

    if not items:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Danh sách sản phẩm không được để trống.",
        }

    if len(items) > 100:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Danh sách sản phẩm không được vượt quá 100 phần tử.",
        }

    # ========================================================
    # 2. VALIDATE COUPON ID
    # ========================================================

    if coupon_id is not None:

        if (
            isinstance(coupon_id, bool)
            or not isinstance(coupon_id, int)
            or coupon_id < 1
        ):
            return {
                "success": False,
                "found": False,
                "data": None,
                "message": "coupon_id phải là số nguyên dương.",
            }

    # ========================================================
    # 3. GET RUNTIME CONTEXT
    # ========================================================

    context = runtime.context or {}

    access_token = context.get("access_token")

    # ========================================================
    # 4. BUILD ITEMS PAYLOAD
    # ========================================================

    items_payload = [
        item.model_dump()
        for item in items
    ]

    # ========================================================
    # 5. CALL ORDER SERVICE
    # ========================================================

    return await calculate_final_price_api(
        items=items_payload,
        access_token=access_token,
        coupon_id=coupon_id,
    )
