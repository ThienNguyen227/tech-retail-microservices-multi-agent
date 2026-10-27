from langchain.tools import tool

from services.customer_service import (
    search_customer as search_customer_api,
    get_customer_addresses as get_customer_addresses_api,
)


# SEARCH CUSTOMER
@tool
async def search_customer(
    user_id: str | None = None,
    customer_code: str | None = None,
):
    """
    TOOL: search_customer

    1. MÔ TẢ
    Tra cứu thông tin khách hàng từ Customer Service
    theo user_id hoặc customer_code.

    2. KHI NÀO SỬ DỤNG
    - Người dùng muốn tra cứu thông tin cá nhân của khách hàng.
    - Người dùng muốn kiểm tra thông tin hồ sơ khách hàng.
    - Người dùng cung cấp user_id để tìm thông tin khách hàng tương ứng.
    - Người dùng cung cấp customer_code để tra cứu khách hàng.
    - Supervisor hoặc agent cần xác định thông tin khách hàng
      trước khi thực hiện các bước xử lý tiếp theo.

    Không sử dụng Tool này để lấy riêng danh sách địa chỉ
    khi người dùng chỉ hỏi về địa chỉ đã đăng ký.
    Trong trường hợp đó, sử dụng get_customer_addresses.

    3. THAM SỐ ĐẦU VÀO

    - user_id:
      ID của người dùng trong User Service.
      Dùng khi đã xác định được user_id từ User Agent
      hoặc từ ngữ cảnh hội thoại đáng tin cậy.

    - customer_code:
      Mã khách hàng trong Customer Service.
      Ví dụ: "CUS-18".

    Có thể cung cấp một trong hai tham số hoặc cả hai.
    Nếu cung cấp cả hai, Customer Service sẽ kiểm tra
    chúng có tương ứng với cùng một khách hàng hay không.

    4. QUY TẮC SỬ DỤNG

    - Nếu chỉ có user_id, tra cứu theo user_id.
    - Nếu chỉ có customer_code, tra cứu theo customer_code.
    - Nếu có cả hai, truyền cả hai để kiểm tra tính nhất quán.
    - Không tự tạo user_id hoặc customer_code.
    - Không sử dụng customer_id nội bộ của Customer Service
      thay cho user_id hoặc customer_code.
    - Nếu chưa có cả hai thông tin, không gọi Tool;
      cần yêu cầu thêm thông tin định danh phù hợp.

    5. QUY TẮC XỬ LÝ KẾT QUẢ

    - Nếu found = true, sử dụng data để trả lời người dùng.
    - Nếu found = false, kiểm tra message để xác định tình trạng.
    - Không tự suy đoán thông tin khách hàng khi dữ liệu bị thiếu.
    - Không khẳng định đã tìm thấy khách hàng nếu Tool trả về lỗi.
    - Chỉ cung cấp những thông tin phù hợp với yêu cầu của người dùng.
    """
    user_id = user_id.strip() if user_id else None
    customer_code = customer_code.strip() if customer_code else None

    if not user_id and not customer_code:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Cần cung cấp user_id hoặc customer_code.",
        }

    return await search_customer_api(
        user_id=user_id,
        customer_code=customer_code,
    )

# GET CUSTOMER ADDRESSES
@tool
async def get_customer_addresses(
    user_id: str | None = None,
    customer_code: str | None = None,
):
    """
    TOOL: get_customer_addresses

    1. MÔ TẢ
    Lấy danh sách địa chỉ đã đăng ký của khách hàng
    từ Customer Service theo user_id hoặc customer_code.

    2. KHI NÀO SỬ DỤNG
    - Người dùng hỏi khách hàng đã đăng ký những địa chỉ nào.
    - Người dùng muốn xem địa chỉ giao hàng đã lưu.
    - Người dùng muốn kiểm tra địa chỉ mặc định.
    - Người dùng hỏi thông tin địa chỉ gắn với hồ sơ khách hàng.
    - Agent cần lấy danh sách địa chỉ để phục vụ một bước xử lý tiếp theo.

    Không sử dụng Tool này để tra cứu toàn bộ hồ sơ khách hàng.
    Trong trường hợp đó, sử dụng search_customer.

    3. THAM SỐ ĐẦU VÀO

    - user_id:
      ID của người dùng trong User Service.
      Ví dụ: "18".

    - customer_code:
      Mã khách hàng trong Customer Service.
      Ví dụ: "CUS-18".

    Có thể cung cấp một trong hai tham số hoặc cả hai.
    Nếu cung cấp cả hai, Customer Service sẽ kiểm tra
    chúng có tương ứng với cùng một khách hàng hay không.

    4. QUY TẮC SỬ DỤNG

    - Nếu chỉ có user_id, lấy địa chỉ theo user_id.
    - Nếu chỉ có customer_code, lấy địa chỉ theo customer_code.
    - Nếu có cả hai, truyền cả hai để kiểm tra tính nhất quán.
    - Không tự tạo user_id hoặc customer_code.
    - Không sử dụng customer_id nội bộ của Customer Service
      thay cho user_id hoặc customer_code.
    - Nếu chưa có cả hai thông tin, không gọi Tool;
      cần yêu cầu thêm thông tin định danh phù hợp.

    5. QUY TẮC XỬ LÝ KẾT QUẢ

    - Nếu found = true, sử dụng data để trả lời người dùng.
    - Nếu data là danh sách rỗng, thông báo khách hàng
      hiện chưa có địa chỉ được đăng ký.
    - Nếu found = false, kiểm tra message để xác định tình trạng.
    - Không tự suy đoán địa chỉ khi dữ liệu bị thiếu.
    - Không khẳng định khách hàng không có địa chỉ nếu Tool
      trả về lỗi kết nối, timeout hoặc lỗi HTTP.
    - Khi trình bày nhiều địa chỉ, phân biệt rõ từng địa chỉ
      và trạng thái địa chỉ mặc định nếu dữ liệu có cung cấp.
    """
    user_id = user_id.strip() if user_id else None
    customer_code = customer_code.strip() if customer_code else None

    if not user_id and not customer_code:
        return {
            "success": False,
            "found": False,
            "data": None,
            "message": "Cần cung cấp user_id hoặc customer_code.",
        }

    return await get_customer_addresses_api(
        user_id=user_id,
        customer_code=customer_code,
    )