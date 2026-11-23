from typing import Any
from langchain.tools import tool, ToolRuntime

from services.order_service import (create_order as create_order_api)

# ==================== CREATE ORDER ====================
@tool
async def create_order(order_data: dict[str, Any], runtime: ToolRuntime):
  """
  TOOL: create_order

  1. MÔ TẢ
  Tạo đơn hàng mới thông qua Order Service.

  Tool tiếp nhận dữ liệu đơn hàng đã được Agent tổng hợp
  và chuyển tiếp đến Order Service để thực hiện nghiệp vụ tạo đơn.

  2. KHI NÀO SỬ DỤNG
  - Người dùng muốn đặt mua sản phẩm.
  - Người dùng muốn tiến hành thanh toán và tạo đơn hàng.
  - Agent đã hoàn tất việc thu thập thông tin cần thiết
    để tạo đơn hàng.
  - Người dùng đã xác nhận thông tin đơn hàng cuối cùng.

  Không sử dụng Tool này để:
  - Tìm kiếm sản phẩm.
  - Lấy thông tin chi tiết sản phẩm.
  - Tra cứu thông tin khách hàng.
  - Lấy danh sách địa chỉ đã đăng ký.
  - Tra cứu hoặc kiểm tra mã khuyến mãi.

  Các nghiệp vụ trên cần sử dụng Tool tương ứng
  trước khi gọi create_order.

  3. THAM SỐ ĐẦU VÀO

  - order_data:
    Dữ liệu đơn hàng theo cấu trúc CreateOrderDto.

    Bao gồm:

    + fulfillmentType:
      Hình thức nhận hàng: HOME_DELIVERY hoặc STORE_PICKUP.

    + branchId:
      ID chi nhánh nhận hàng.
      Cần cung cấp khi người dùng chọn STORE_PICKUP.

    + recipientName:
      Tên người nhận hàng.

    + recipientPhone:
      Số điện thoại người nhận.

    + addressLine:
      Địa chỉ chi tiết.

    + ward:
      Phường/Xã.

    + province:
      Tỉnh/Thành phố.

    + items:
      Danh sách sản phẩm trong đơn hàng.

    + subtotal:
      Tổng tiền hàng trước giảm giá.

    + shippingFee:
      Phí vận chuyển.

    + couponId:
      ID mã giảm giá.

    + couponName:
      Tên mã giảm giá.

    + couponDiscountAmount:
      Số tiền được giảm từ coupon.

    + discountAmount:
      Tổng số tiền giảm giá, bao gồm giảm giá trực tiếp
      trên sản phẩm và giảm giá coupon.

    + totalAmount:
      Tổng tiền thanh toán.

    + paymentMethodId:
      ID phương thức thanh toán.

    + paymentMethod:
      Tên phương thức thanh toán.

    + deliveryMethodId:
      ID phương thức giao hàng.

  4. QUY TẮC SỬ DỤNG

  - Chỉ gọi Tool sau khi đã thu thập đầy đủ thông tin
    cần thiết để tạo đơn hàng.
  - Phải xác định sản phẩm thông qua Product Service.
  - Phải kiểm tra thông tin khách hàng và địa chỉ
    thông qua Customer Service khi cần thiết.
  - Phải kiểm tra khuyến mãi thông qua Promotion Service
    nếu đơn hàng có sử dụng khuyến mãi.
  - Không tự tạo SKU, productName, promotionId hoặc couponId.
  - Không tự suy đoán số lượng, đơn giá, phí vận chuyển
    hoặc số tiền được giảm.
  - Không tự tính hoặc sửa giá trị tài chính khi chưa có
    dữ liệu đáng tin cậy từ các nghiệp vụ tương ứng.
  - Với STORE_PICKUP, phải xác định branchId hợp lệ.
  - Với HOME_DELIVERY, phải có đầy đủ thông tin địa chỉ giao hàng.
  - Không tự tạo userId, user_id hoặc access_token.
  - Không tạo đơn hàng khi người dùng chưa xác nhận
    thông tin đơn hàng cuối cùng.
  - Không gọi lại Tool chỉ vì chưa nhận được phản hồi
    nếu chưa xác định trạng thái của lần gọi trước.

  5. QUY TẮC XỬ LÝ KẾT QUẢ

  - Nếu success = true:
    Thông báo tạo đơn hàng thành công và sử dụng
    thông tin đơn hàng trong data để phản hồi người dùng.

  - Nếu success = false:
    Kiểm tra message, status_code và detail
    để xác định nguyên nhân thất bại.

  - Nếu gặp lỗi xác thực:
    Thông báo phiên đăng nhập không hợp lệ
    hoặc đã hết hạn.

  - Nếu gặp lỗi kết nối hoặc timeout:
    Không khẳng định đơn hàng đã tạo thất bại,
    vì có khả năng Order Service đã xử lý request
    nhưng phản hồi chưa được nhận.

  - Không tự tạo mã đơn hàng hoặc trạng thái đơn hàng.
  - Không thông báo tạo đơn thành công khi API trả về lỗi.
  - Không tự động gọi lại Tool khi chưa xác định
    kết quả của lần tạo đơn trước.
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
  # 3. VALIDATE ORDER DATA
  # ========================================================

  if not isinstance(order_data, dict) or not order_data:
      return {
          "success": False,
          "found": False,
          "data": None,
          "message": "Dữ liệu tạo đơn hàng không hợp lệ.",
      }

  # ========================================================
  # 4. VALIDATE REQUIRED FIELDS
  # ========================================================

  required_fields = [
      "recipientName",
      "recipientPhone",
      "addressLine",
      "ward",
      "province",
      "items",
  ]

  for field in required_fields:
      value = order_data.get(field)

      if value is None or (
          isinstance(value, str) and not value.strip()
      ):
          return {
              "success": False,
              "found": False,
              "data": None,
              "message": f"Thiếu thông tin bắt buộc: {field}.",
          }

  # ========================================================
  # 5. VALIDATE ORDER ITEMS
  # ========================================================

  items = order_data.get("items")

  if not isinstance(items, list) or not items:
      return {
          "success": False,
          "found": False,
          "data": None,
          "message": "Đơn hàng phải có ít nhất một sản phẩm.",
      }

  item_required_fields = [
      "sku",
      "productName",
      "quantity",
      "price",
  ]

  for index, item in enumerate(items):

      if not isinstance(item, dict):
          return {
              "success": False,
              "found": False,
              "data": None,
              "message": (
                  f"Sản phẩm tại vị trí {index + 1} không hợp lệ."
              ),
          }

      for field in item_required_fields:
          value = item.get(field)

          if value is None or (
              isinstance(value, str) and not value.strip()
          ):
              return {
                  "success": False,
                  "found": False,
                  "data": None,
                  "message": (
                      f"Sản phẩm tại vị trí {index + 1} "
                      f"thiếu thông tin: {field}."
                  ),
              }

  # ========================================================
  # 6. VALIDATE FULFILLMENT TYPE
  # ========================================================

  fulfillment_type = order_data.get("fulfillmentType")

  if fulfillment_type == "STORE_PICKUP":
      branch_id = order_data.get("branchId")

      if branch_id is None:
          return {
              "success": False,
              "found": False,
              "data": None,
              "message": (
                  "Cần cung cấp branchId khi chọn nhận hàng tại cửa hàng."
              ),
          }

  # ========================================================
  # 7. BUILD TRUSTED ORDER PAYLOAD
  # ========================================================

  # userId luôn lấy từ JWT đã được FastAPI xác thực.
  # Không sử dụng userId do LLM cung cấp.

  payload = {
      **order_data,
      "userId": user_id,
  }

  # ========================================================
  # 8. CALL ORDER SERVICE
  # ========================================================

  return await create_order_api(
      order_data=payload,
      access_token=access_token,
  )
