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

    MỤC ĐÍCH:
    Tạo đơn hàng thông qua Order Service sau khi Agent đã
    thu thập, xác minh dữ liệu và nhận xác nhận cuối cùng
    từ người dùng.

    1. THU THẬP THÔNG TIN

    Agent phải xác định đầy đủ:

    - Số điện thoại và thông tin người nhận.
    - Sản phẩm, phiên bản, màu sắc và số lượng.
    - Hình thức nhận hàng.
    - Địa chỉ nhận hàng tương ứng.
    - Phương thức thanh toán.

    Nếu thiếu thông tin, phải hỏi người dùng.
    Không tự suy đoán hoặc tạo dữ liệu thay thế.

    2. XÁC MINH SẢN PHẨM

    - Sử dụng Product Tools để xác minh sản phẩm và SKU.
    - Sử dụng đúng biến thể người dùng lựa chọn.
    - Lấy tên sản phẩm, hình ảnh và giá từ Product Service.
    - Không tự tạo SKU, tên sản phẩm hoặc giá bán.
    - Không tự lựa chọn biến thể khác với yêu cầu.

    3. XÁC MINH KHÁCH HÀNG

    - Sử dụng Customer Tools để tra cứu thông tin khách hàng
      khi cần thiết.
    - recipientName và recipientPhone phải hợp lệ.
    - Không tự tạo thông tin người nhận.

    4. QUY TẮC HÌNH THỨC NHẬN HÀNG

    HOME_DELIVERY:
    - fulfillmentType = HOME_DELIVERY.
    - branchId luôn bằng 10 (kho tổng).
    - Lấy địa chỉ giao hàng từ Customer Service.
    - addressLine, ward, province phải là địa chỉ
      mà khách hàng đã lựa chọn.
    - Không sử dụng địa chỉ cửa hàng thay cho địa chỉ nhà.

    STORE_PICKUP:
    - fulfillmentType = STORE_PICKUP.
    - branchId luôn bằng 1.
    - BẮT BUỘC gọi Tool get_branch_address với branchId = 1
      trước khi gọi create_order.
    - Lấy addressLine, ward, province từ kết quả
      thực tế của Branch Service.
    - Không sử dụng địa chỉ nhà của khách hàng.
    - Không yêu cầu người dùng tự cung cấp địa chỉ cửa hàng.
    - Không tự tạo hoặc suy đoán địa chỉ chi nhánh.

    CẢ HAI HÌNH THỨC:
    - Đều phải truyền đầy đủ addressLine, ward, province.
    - Nếu không có địa chỉ hợp lệ thì không được tạo đơn.

    5. QUY TẮC KHUYẾN MÃI VÀ TÀI CHÍNH

    - Sử dụng Promotion Tools khi cần kiểm tra khuyến mãi.
    - directDiscountAmount là giảm giá trực tiếp từng sản phẩm.
    - couponDiscountAmount là giảm giá coupon toàn đơn.
    - discountAmount bao gồm tổng giảm giá trực tiếp
      và giảm giá coupon, không được tính trùng.
    - subtotal là tổng tiền hàng sau khuyến mãi trực tiếp
      nhưng trước coupon.
    - totalAmount phải là tổng tiền cuối cùng đã xác minh.
    - Không tự tạo hoặc sửa đổi dữ liệu tài chính.

    6. PHƯƠNG THỨC THANH TOÁN

    Chỉ chấp nhận:
    - COD
    - MOMO
    - VNPAY

    Không tự lựa chọn phương thức thanh toán thay người dùng.

    7. QUY TẮC XÁC NHẬN ĐƠN HÀNG

    - Tổng hợp thông tin đơn hàng để người dùng kiểm tra.
    - Chỉ gọi create_order sau khi người dùng xác nhận cuối cùng.
    - Không xem việc hỏi giá hoặc quan tâm sản phẩm
      là xác nhận đặt hàng.
    - Không hỏi lại thông tin đã được xác định hợp lệ.
    - Không gọi tạo đơn nhiều lần khi chưa xác định
      kết quả của lần gọi trước.

    8. XỬ LÝ KẾT QUẢ

    - success = true: thông báo tạo đơn thành công và sử dụng
      dữ liệu Order Service trả về.
    - success = false: thông báo nguyên nhân dựa trên
      message, status_code và detail.
    - Timeout hoặc lỗi kết nối: không kết luận đơn hàng thất bại;
      cần kiểm tra trạng thái đơn hàng trước khi thử lại.
    - Không tự tạo mã đơn hàng hoặc trạng thái đơn hàng.
    - Không thông báo thành công khi API chưa xác nhận.
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
):
    """
    TOOL: calculate_final_price

    MÔ TẢ:

    Tính giá bán cuối cùng của danh sách sản phẩm
    dựa trên SKU và số lượng.

    Tool gọi Order Service để thực hiện tính toán.
    Order Service sẽ kết nối Product Service và
    Promotion Service để lấy dữ liệu giá bán
    và khuyến mãi trực tiếp.

    1. KHI NÀO SỬ DỤNG

    Sử dụng Tool khi:

    - Người dùng hỏi tổng giá tiền của nhiều sản phẩm.
    - Người dùng muốn biết giá khi mua nhiều sản phẩm.
    - Người dùng thay đổi số lượng sản phẩm.
    - Agent đang chuẩn bị dữ liệu để tạo đơn hàng.
    - Agent cần xác minh giá bán và khuyến mãi trực tiếp.

    2. THAM SỐ ĐẦU VÀO

    items:
    Danh sách sản phẩm cần tính giá.

    Mỗi phần tử gồm:

    - sku:
      SKU chính xác được xác minh từ Product Service.

    - quantity:
      Số lượng sản phẩm người dùng yêu cầu.

    Ví dụ:

    [
        {
            "sku": "IP17PM-256GB-CAM-VU-TRU",
            "quantity": 2
        },
        {
            "sku": "IP17PM-512GB-CAM-VU-TRU",
            "quantity": 1
        }
    ]

    3. QUY TẮC SỬ DỤNG

    - SKU phải được xác minh từ Product Service.
    - Quantity phải phản ánh chính xác yêu cầu của người dùng.
    - Không tự tạo SKU.
    - Không tự suy đoán giá bán.
    - Không tự tính hoặc ước lượng khuyến mãi.
    - Không tự tính subtotal hoặc totalAmount.
    - Không sử dụng giá cũ trong lịch sử hội thoại
      thay cho kết quả mới nhất từ Tool.
    - Nếu người dùng thay đổi SKU hoặc quantity,
      phải gọi lại Tool để tính giá.

    - Khi chuẩn bị tạo đơn hàng, phải gọi Tool này
      để xác minh giá và khuyến mãi trực tiếp
      trước khi gọi create_order.

    4. QUY TẮC ĐỌC KẾT QUẢ

    Trong data.products, mỗi sản phẩm có:

    - price:
      Giá bán một sản phẩm trước khuyến mãi trực tiếp.

    - directDiscountAmount:
      Số tiền giảm trực tiếp trên một sản phẩm.

    - totalDirectDiscountAmount:
      Tổng tiền giảm trực tiếp theo quantity.

    - subtotal:
      Thành tiền của sản phẩm sau khuyến mãi trực tiếp,
      đã tính theo quantity.

    - promotionId:
      ID chương trình khuyến mãi trực tiếp,
      có thể null.

    - promotionName:
      Tên chương trình khuyến mãi trực tiếp,
      có thể null.

    Các trường tổng hợp:

    - subtotal:
      Tổng tiền hàng sau khuyến mãi trực tiếp.

    - totalDirectDiscountAmount:
      Tổng tiền giảm trực tiếp của toàn bộ sản phẩm.

    - totalQuantity:
      Tổng số lượng sản phẩm.

    - totalAmount:
      Tổng tiền hàng sau khuyến mãi trực tiếp.

    LƯU Ý:

    API này chưa tính coupon và phí vận chuyển.
    Không được xem totalAmount trả về là tổng tiền
    thanh toán cuối cùng của đơn hàng nếu vẫn còn
    coupon hoặc phí vận chuyển cần áp dụng.

    5. QUY TẮC XỬ LÝ LỖI

    - Nếu success = false:
      Đọc message, status_code và detail để xác định lỗi.

    - Nếu notFoundSkus không rỗng:
      Thông báo những SKU không tìm thấy.
      Không tự thay thế SKU khác.

    - Nếu không tìm thấy sản phẩm:
      Không tự tạo giá bán hoặc tiếp tục sử dụng
      giá cũ chưa được xác minh.

    - Nếu gặp lỗi kết nối hoặc timeout:
      Thông báo chưa thể xác minh giá.
      Không tự suy đoán kết quả.
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
    # 2. GET RUNTIME CONTEXT
    # ========================================================

    context = runtime.context or {}

    access_token = context.get("access_token")

    # ========================================================
    # 3. BUILD ITEMS PAYLOAD
    # ========================================================

    items_payload = [
        item.model_dump()
        for item in items
    ]

    # ========================================================
    # 4. CALL ORDER SERVICE
    # ========================================================

    return await calculate_final_price_api(
        items=items_payload,
        access_token=access_token,
    )