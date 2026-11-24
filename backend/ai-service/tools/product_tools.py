from langchain.tools import tool
from typing import Literal

from services.product_service import (
  search_products as search_products_api,
  get_phone_detail as get_phone_detail_api,
  get_laptop_detail as get_laptop_detail_api,
  get_tablet_detail as get_tablet_detail_api,
  compare_phones as compare_phones_api,
  compare_laptops as compare_laptops_api,
  compare_tablets as compare_tablets_api,
)

@tool
async def search_products(
    keyword: str | None = None,
    brand: str | None = None,
    category: str | None = None,
    storage: str | None = None,
    color: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    limit: int = 10,
):
    """Tìm danh sách sản phẩm trong hệ thống.

    Dùng khi người dùng hỏi cửa hàng có bán những sản phẩm nào,
    các dòng sản phẩm của một thương hiệu, hoặc muốn lọc sản phẩm
    theo từ khóa, thương hiệu, danh mục, dung lượng, màu sắc và giá.

    keyword: từ khóa tên sản phẩm, slug hoặc SKU.
    brand: tên thương hiệu đúng theo dữ liệu hệ thống.
    category: tên danh mục.
    storage: dung lượng như 256GB hoặc 1TB.
    color: màu sắc như Bạc hoặc Xanh đậm.
    min_price: giá tối thiểu tính bằng VND.
    max_price: giá tối đa tính bằng VND.
    limit: số sản phẩm tối đa, từ 1 đến 100.

    Ví dụ: người dùng hỏi "Bạn bán các loại iPhone nào?"
    thì tìm theo keyword="iPhone".
    """
    return await search_products_api(
        keyword=keyword,
        brand=brand,
        category=category,
        storage=storage,
        color=color,
        min_price=min_price,
        max_price=max_price,
        limit=limit,
    )

## GET PRODUCT DETAIL
# 1. GET PHONE DETIAL
PhoneDetailCriteria = Literal[
  "all",
  "screenTech",
  "screenSize",
  "variants",
  "specifications",
  "performanceAndStorage",
  "cameraAndScreen",
  "batteryAndCharge",
  "utilities",
  "connectivity",
  "designAndMaterials",
]


@tool
async def get_phone_detail(phone_name: str, criteria: list[PhoneDetailCriteria] | None = None):
  """
  TOOL: get_phone_detail

  Tra cứu thông tin chi tiết điện thoại từ Product Service
  theo tên sản phẩm và nhóm thông tin cần thiết.

  SỬ DỤNG KHI:
  - Người dùng hỏi thông tin một điện thoại cụ thể.
  - Muốn xem giá, phiên bản, màu sắc hoặc thông số kỹ thuật.
  - Muốn xem toàn bộ thông tin sản phẩm.

  INPUT:
  - phone_name: Tên điện thoại cần tra cứu.
  - criteria: Danh sách nhóm thông tin cần lấy.

  CÁC CRITERIA HỢP LỆ:
  - all: Toàn bộ thông tin sản phẩm.
  - screenTech: Công nghệ màn hình tổng quát.
  - screenSize: Kích thước màn hình tổng quát.
  - variants: SKU, phiên bản, dung lượng, màu sắc, giá và hình ảnh.
  - specifications: Chip, bộ nhớ, camera và pin tổng quát.
  - performanceAndStorage: Hệ điều hành, CPU, GPU, RAM và bộ nhớ.
  - cameraAndScreen: Camera và thông số màn hình chi tiết.
  - batteryAndCharge: Pin và công nghệ sạc.
  - utilities: Bảo mật, kháng nước và tiện ích.
  - connectivity: Mạng di động, SIM, Wi-Fi, GPS, Bluetooth và cổng kết nối.
  - designAndMaterials: Thiết kế, vật liệu, kích thước và trọng lượng.

  QUY TẮC CHỌN CRITERIA:
  - Hỏi giá, SKU, màu hoặc dung lượng: ["variants"].
  - Hỏi chip, RAM, CPU, GPU hoặc bộ nhớ: ["performanceAndStorage"].
  - Hỏi thông số tổng quát: ["specifications"].
  - Hỏi camera hoặc màn hình chi tiết: ["cameraAndScreen"].
  - Hỏi pin hoặc sạc: ["batteryAndCharge"].
  - Hỏi tiện ích hoặc bảo mật: ["utilities"].
  - Hỏi kết nối: ["connectivity"].
  - Hỏi thiết kế hoặc vật liệu: ["designAndMaterials"].
  - Hỏi nhiều nhóm: Chọn các criteria liên quan.
  - Hỏi toàn bộ sản phẩm: ["all"].

  QUY TẮC:
  - Chỉ lấy những nhóm dữ liệu cần thiết.
  - Khi tra cứu giá, phải đối chiếu đúng phiên bản,
    màu sắc và dung lượng trong variants.
  - Nếu chưa rõ phiên bản, trình bày lựa chọn hoặc hỏi lại.
  - Chỉ sử dụng dữ liệu từ Product Service.
  - Không tự suy đoán giá hoặc thông số sản phẩm.
  - Không sử dụng Tool này để tìm kiếm nhiều sản phẩm
    hoặc so sánh sản phẩm.
  """
  return await get_phone_detail_api(phone_name=phone_name, criteria=criteria)

# 2. GET LAPTOP DETIAL
LaptopDetailCriteria = Literal[
    "all",
    "ram",
    "ssd",
    "variants",
    "processor",
    "graphics",
    "memoryAndStorage",
    "display",
    "connectivityAndExpansion",
    "dimensionsAndBattery",
]


@tool
async def get_laptop_detail(
    laptop_name: str,
    criteria: list[LaptopDetailCriteria] | None = None,
):
    """
    TOOL: get_laptop_detail

    Tra cứu thông tin chi tiết laptop từ Product Service
    theo tên sản phẩm và nhóm thông tin cần thiết.

    SỬ DỤNG KHI:
    - Người dùng hỏi thông tin một laptop cụ thể.
    - Muốn xem giá, phiên bản, RAM, SSD hoặc màu sắc.
    - Muốn tra cứu thông số kỹ thuật hoặc toàn bộ sản phẩm.

    INPUT:
    - laptop_name: Tên laptop cần tra cứu.
    - criteria: Danh sách nhóm thông tin cần lấy.

    CÁC CRITERIA HỢP LỆ:
    - all: Toàn bộ thông tin laptop.
    - variants: SKU, RAM, SSD, màu sắc, giá và hình ảnh.
    - processor: Công nghệ, số nhân, số luồng và tốc độ CPU.
    - graphics: Thông tin card đồ họa.
    - memoryAndStorage: RAM, loại RAM, bus RAM và SSD.
    - display: Kích thước, độ phân giải, tấm nền và tần số quét.
    - connectivityAndExpansion: Cổng kết nối, Wi-Fi, Bluetooth,
      webcam, âm thanh, bảo mật và tản nhiệt.
    - dimensionsAndBattery: Pin, hệ điều hành, năm ra mắt,
      kích thước, trọng lượng và vật liệu.

    QUY TẮC CHỌN CRITERIA:
    - Hỏi giá, SKU, RAM, SSD hoặc màu sắc: ["variants"].
    - Hỏi CPU: ["processor"].
    - Hỏi GPU: ["graphics"].
    - Hỏi RAM, SSD hoặc khả năng nâng cấp: ["memoryAndStorage"].
    - Hỏi màn hình: ["display"].
    - Hỏi kết nối, webcam hoặc bảo mật: ["connectivityAndExpansion"].
    - Hỏi pin, hệ điều hành hoặc thiết kế: ["dimensionsAndBattery"].
    - Hỏi nhiều nhóm: Chọn các criteria liên quan.
    - Hỏi toàn bộ laptop: ["all"].

    QUY TẮC:
    - Chỉ lấy những nhóm dữ liệu cần thiết.
    - Khi tra cứu giá, đối chiếu đúng RAM, SSD và màu sắc
      trong variants.
    - Giá phải lấy từ variants[].price của phiên bản phù hợp.
    - Nếu chưa rõ phiên bản, trình bày lựa chọn hoặc hỏi lại.
    - Chỉ sử dụng dữ liệu từ Product Service.
    - Không tự suy đoán giá hoặc thông số.
    - Không sử dụng Tool này để tìm kiếm hoặc so sánh nhiều laptop.
    """
    return await get_laptop_detail_api(
        laptop_name=laptop_name,
        criteria=criteria,
    )

# 3. GET TABLET DETIAL
TabletDetailCriteria = Literal[
    "all",
    "screenTech",
    "screenSize",
    "variants",
    "screen",
    "operatingSystemAndCpu",
    "memoryAndStorage",
    "rearCamera",
    "frontCamera",
    "connectivity",
    "utilities",
    "batteryAndCharge",
    "designAndMaterials",
]

@tool
async def get_tablet_detail(
    tablet_name: str,
    criteria: list[TabletDetailCriteria] | None = None,
):
    """
    TOOL: get_tablet_detail

    Tra cứu thông tin chi tiết tablet từ Product Service
    theo tên sản phẩm và nhóm thông tin cần thiết.

    SỬ DỤNG KHI:
    - Người dùng hỏi thông tin một tablet cụ thể.
    - Muốn xem giá, phiên bản, RAM, bộ nhớ hoặc màu sắc.
    - Muốn tra cứu thông số kỹ thuật hoặc toàn bộ sản phẩm.

    INPUT:
    - tablet_name: Tên tablet cần tra cứu.
    - criteria: Danh sách nhóm thông tin cần lấy.

    CÁC CRITERIA HỢP LỆ:
    - all: Toàn bộ thông tin tablet.
    - screenTech: Công nghệ màn hình tổng quát.
    - screenSize: Kích thước màn hình tổng quát.
    - variants: SKU, dung lượng, màu sắc, giá và hình ảnh.
    - screen: Công nghệ, kích thước và tần số quét màn hình.
    - operatingSystemAndCpu: Hệ điều hành, CPU và GPU.
    - memoryAndStorage: RAM, bộ nhớ khả dụng và thẻ nhớ.
    - rearCamera: Camera sau và khả năng quay video.
    - frontCamera: Camera trước.
    - connectivity: Mạng di động, SIM, Wi-Fi, GPS, Bluetooth và cổng kết nối.
    - utilities: Tính năng đặc biệt, kháng nước và ghi âm.
    - batteryAndCharge: Pin, công nghệ sạc và bộ sạc.
    - designAndMaterials: Chất liệu, kích thước và ngày ra mắt.

    QUY TẮC CHỌN CRITERIA:
    - Hỏi giá, SKU, màu hoặc phiên bản: ["variants"].
    - Hỏi màn hình: ["screen", "screenTech", "screenSize"].
    - Hỏi hệ điều hành, CPU hoặc GPU: ["operatingSystemAndCpu"].
    - Hỏi RAM, bộ nhớ hoặc thẻ nhớ: ["memoryAndStorage"].
    - Hỏi camera sau: ["rearCamera"].
    - Hỏi camera trước: ["frontCamera"].
    - Hỏi kết nối: ["connectivity"].
    - Hỏi tiện ích hoặc kháng nước: ["utilities"].
    - Hỏi pin hoặc sạc: ["batteryAndCharge"].
    - Hỏi thiết kế hoặc vật liệu: ["designAndMaterials"].
    - Hỏi nhiều nhóm: Chọn các criteria liên quan.
    - Hỏi toàn bộ tablet: ["all"].

    QUY TẮC:
    - Chỉ lấy những nhóm dữ liệu cần thiết.
    - Khi tra cứu giá, đối chiếu đúng dung lượng và màu sắc
      trong variants.
    - Giá phải lấy từ variants[].price của phiên bản phù hợp.
    - Không tự suy đoán RAM hoặc bộ nhớ nếu dữ liệu không cung cấp.
    - Nếu chưa rõ phiên bản, trình bày lựa chọn hoặc hỏi lại.
    - Chỉ sử dụng dữ liệu từ Product Service.
    - Không sử dụng Tool này để tìm kiếm hoặc so sánh nhiều tablet.
    """
    return await get_tablet_detail_api(
        tablet_name=tablet_name,
        criteria=criteria,
    )

## COMPARE PRODUCT
# 1. COMPARE PHONE
PhoneCompareCriteria = Literal[
    "all",
    "screenTech",
    "screenSize",
    "variants",
    "specifications",
    "performanceAndStorage",
    "cameraAndScreen",
    "batteryAndCharge",
    "utilities",
    "connectivity",
    "designAndMaterials",
]

@tool
async def compare_phones(
    products: list[str],
    criteria: list[PhoneCompareCriteria] | None = None,
):
    """
    TOOL: compare_phones

    1. MÔ TẢ
    Lấy dữ liệu của nhiều điện thoại từ Product Service
    theo danh sách tên sản phẩm và các tiêu chí so sánh.

    2. KHI NÀO SỬ DỤNG
    - Người dùng yêu cầu so sánh từ 2 đến 5 điện thoại.
    - Người dùng muốn so sánh giá, màu sắc hoặc phiên bản.
    - Người dùng muốn so sánh thông số kỹ thuật giữa các điện thoại.
    - Người dùng muốn so sánh một tiêu chí cụ thể hoặc nhiều tiêu chí.

    Không sử dụng Tool này để lấy chi tiết một điện thoại duy nhất
    hoặc tìm kiếm danh sách sản phẩm theo điều kiện lọc.

    3. THAM SỐ ĐẦU VÀO

    - products:
      Danh sách tên từ 2 đến 5 điện thoại cần so sánh.
      Ví dụ:
      [
          "iPhone 17 Pro Max",
          "Samsung Galaxy S25 Ultra"
      ]

    - criteria:
      Danh sách nhóm dữ liệu cần lấy để so sánh.
      Chỉ chọn các nhóm phù hợp với yêu cầu của người dùng.

      Các giá trị hợp lệ:
      - all: Toàn bộ dữ liệu.
      - screenTech: Công nghệ màn hình.
      - screenSize: Kích thước màn hình.
      - variants: Phiên bản, dung lượng, màu sắc và giá bán.
      - specifications: Thông số kỹ thuật tổng quát.
      - performanceAndStorage: Hiệu năng và bộ nhớ.
      - cameraAndScreen: Camera và màn hình chi tiết.
      - batteryAndCharge: Pin và sạc.
      - utilities: Tiện ích và tính năng bổ sung.
      - connectivity: Kết nối.
      - designAndMaterials: Thiết kế và vật liệu.

    4. HƯỚNG DẪN CHỌN CRITERIA

    - Chỉ so sánh giá, màu sắc hoặc dung lượng:
      ["variants"]

    - So sánh công nghệ màn hình:
      ["screenTech"]

    - So sánh kích thước màn hình:
      ["screenSize"]

    - So sánh hiệu năng, chip, RAM hoặc bộ nhớ:
      ["performanceAndStorage"]

    - So sánh camera hoặc màn hình chi tiết:
      ["cameraAndScreen"]

    - So sánh pin và sạc:
      ["batteryAndCharge"]

    - So sánh nhiều nhóm thông số:
      Chọn tất cả criteria có liên quan.

    - Người dùng yêu cầu so sánh toàn diện:
      ["all"]

    - Người dùng chỉ nói "so sánh hai điện thoại" mà không nêu tiêu chí:
      Chọn các nhóm tiêu chí quan trọng, phù hợp với dữ liệu
      hiện có của các điện thoại.

    5. QUY TẮC XỬ LÝ KẾT QUẢ

    - Truyền đúng tên các điện thoại cần so sánh.
    - Chỉ sử dụng dữ liệu do Tool trả về.
    - Không tự tạo hoặc suy đoán giá bán, thông số hay tính năng.
    - Khi so sánh giá, phải đối chiếu đúng phiên bản trong variants.
    - Nếu một sản phẩm có nhiều phiên bản, cần phân biệt rõ
      dung lượng, màu sắc và giá tương ứng.
    - Nếu dữ liệu của một tiêu chí bị thiếu, nêu rõ chưa có dữ liệu.
    - Nếu Tool trả về found = false, thông báo lỗi phù hợp;
      không trình bày kết quả như thể đã so sánh thành công.
    - Sau khi nhận dữ liệu, trình bày điểm giống nhau,
      khác nhau và nhận xét dựa trên tiêu chí người dùng yêu cầu.
    """
    return await compare_phones_api(
        products=products,
        criteria=criteria,
    )

# 2. COMPARE LAPTOP

LaptopCompareCriteria = Literal[
    "all",
    "variants",
    "processor",
    "graphics",
    "memoryAndStorage",
    "display",
    "connectivityAndExpansion",
    "dimensionsAndBattery",
]

@tool
async def compare_laptops(
    products: list[str],
    criteria: list[LaptopCompareCriteria] | None = None,
):
    """
    TOOL: compare_laptops

    1. MÔ TẢ
    Lấy dữ liệu của nhiều laptop từ Product Service
    theo danh sách tên sản phẩm và các tiêu chí so sánh.

    2. KHI NÀO SỬ DỤNG
    - Người dùng yêu cầu so sánh từ 2 đến 5 laptop.
    - Người dùng muốn so sánh giá, màu sắc hoặc phiên bản laptop.
    - Người dùng muốn so sánh CPU, GPU, RAM, SSD hoặc màn hình.
    - Người dùng muốn so sánh pin, kích thước hoặc khả năng kết nối.
    - Người dùng muốn so sánh một hoặc nhiều nhóm thông số.

    Không sử dụng Tool này để lấy chi tiết một laptop duy nhất
    hoặc tìm kiếm danh sách laptop theo điều kiện lọc.

    3. THAM SỐ ĐẦU VÀO

    - products:
      Danh sách tên từ 2 đến 5 laptop cần so sánh.

      Ví dụ:
      [
          "HP 240R G10 - C3RU7AT",
          "Laptop Lenovo IdeaPad Slim 5"
      ]

    - criteria:
      Danh sách nhóm dữ liệu cần lấy để so sánh.

      Các giá trị hợp lệ:
      - all: Toàn bộ dữ liệu.
      - variants: Phiên bản, màu sắc và giá bán.
      - processor: Bộ xử lý (CPU).
      - graphics: Card đồ họa (GPU).
      - memoryAndStorage: RAM và bộ nhớ lưu trữ.
      - display: Màn hình.
      - connectivityAndExpansion: Kết nối và cổng mở rộng.
      - dimensionsAndBattery: Kích thước, trọng lượng và pin.

    4. HƯỚNG DẪN CHỌN CRITERIA

    - Chỉ so sánh giá, màu sắc hoặc phiên bản:
      ["variants"]

    - So sánh CPU:
      ["processor"]

    - So sánh GPU:
      ["graphics"]

    - So sánh RAM hoặc SSD:
      ["memoryAndStorage"]

    - So sánh màn hình:
      ["display"]

    - So sánh cổng kết nối:
      ["connectivityAndExpansion"]

    - So sánh pin, kích thước hoặc trọng lượng:
      ["dimensionsAndBattery"]

    - So sánh nhiều nhóm thông số:
      Chọn tất cả criteria có liên quan.

    - Người dùng yêu cầu so sánh toàn diện:
      ["all"]

    - Người dùng chỉ nói "so sánh hai laptop" mà không nêu tiêu chí:
      Chọn các nhóm tiêu chí quan trọng, phù hợp với dữ liệu
      hiện có của các laptop.

    5. QUY TẮC XỬ LÝ KẾT QUẢ

    - Truyền đúng tên các laptop cần so sánh.
    - Chỉ sử dụng dữ liệu do Tool trả về.
    - Không tự tạo hoặc suy đoán giá bán, thông số hay tính năng.
    - Khi so sánh giá, đối chiếu đúng phiên bản trong variants.
    - Phân biệt rõ CPU, GPU, RAM và SSD của từng laptop.
    - Nếu thiếu dữ liệu của một tiêu chí, nêu rõ chưa có dữ liệu.
    - Nếu Tool trả về found = false, thông báo lỗi phù hợp;
      không trình bày kết quả như thể đã so sánh thành công.
    - Sau khi nhận dữ liệu, trình bày điểm giống nhau,
      khác nhau và nhận xét dựa trên tiêu chí người dùng yêu cầu.
    """
    return await compare_laptops_api(
        products=products,
        criteria=criteria,
    )

# 3. COMPARE TABLET

TabletCompareCriteria = Literal[
    "all",
    "screenTech",
    "screenSize",
    "variants",
    "screen",
    "operatingSystemAndCpu",
    "memoryAndStorage",
    "rearCamera",
    "frontCamera",
    "connectivity",
    "utilities",
    "batteryAndCharge",
    "designAndMaterials",
]


@tool
async def compare_tablets(
    products: list[str],
    criteria: list[TabletCompareCriteria] | None = None,
):
    """
    TOOL: compare_tablets

    1. MÔ TẢ
    Lấy dữ liệu của nhiều máy tính bảng từ Product Service
    theo danh sách tên sản phẩm và các tiêu chí so sánh.

    2. KHI NÀO SỬ DỤNG
    - Người dùng yêu cầu so sánh từ 2 đến 5 máy tính bảng.
    - Người dùng muốn so sánh giá, màu sắc hoặc phiên bản tablet.
    - Người dùng muốn so sánh màn hình, hệ điều hành hoặc CPU.
    - Người dùng muốn so sánh RAM, bộ nhớ lưu trữ hoặc camera.
    - Người dùng muốn so sánh kết nối, tiện ích hoặc pin.
    - Người dùng muốn so sánh thiết kế và vật liệu.
    - Người dùng muốn so sánh một hoặc nhiều nhóm thông số.

    Không sử dụng Tool này để lấy chi tiết một tablet duy nhất
    hoặc tìm kiếm danh sách tablet theo điều kiện lọc.

    3. THAM SỐ ĐẦU VÀO

    - products:
      Danh sách tên từ 2 đến 5 máy tính bảng cần so sánh.

      Ví dụ:
      [
          "Apple iPad Air",
          "Samsung Galaxy Tab S10"
      ]

    - criteria:
      Danh sách nhóm dữ liệu cần lấy để so sánh.

      Các giá trị hợp lệ:
      - all: Toàn bộ dữ liệu.
      - screenTech: Công nghệ màn hình.
      - screenSize: Kích thước màn hình.
      - variants: Phiên bản, màu sắc và giá bán.
      - screen: Thông tin màn hình.
      - operatingSystemAndCpu: Hệ điều hành và CPU.
      - memoryAndStorage: RAM và bộ nhớ lưu trữ.
      - rearCamera: Camera sau.
      - frontCamera: Camera trước.
      - connectivity: Khả năng kết nối.
      - utilities: Các tiện ích.
      - batteryAndCharge: Pin và sạc.
      - designAndMaterials: Thiết kế và vật liệu.

    4. HƯỚNG DẪN CHỌN CRITERIA

    - Chỉ so sánh giá, màu sắc hoặc phiên bản:
      ["variants"]

    - So sánh công nghệ màn hình:
      ["screenTech"]

    - So sánh kích thước màn hình:
      ["screenSize"]

    - So sánh hệ điều hành và CPU:
      ["operatingSystemAndCpu"]

    - So sánh RAM hoặc bộ nhớ lưu trữ:
      ["memoryAndStorage"]

    - So sánh camera sau:
      ["rearCamera"]

    - So sánh camera trước:
      ["frontCamera"]

    - So sánh kết nối:
      ["connectivity"]

    - So sánh pin và sạc:
      ["batteryAndCharge"]

    - So sánh tiện ích:
      ["utilities"]

    - So sánh thiết kế và vật liệu:
      ["designAndMaterials"]

    - So sánh nhiều nhóm thông số:
      Chọn tất cả criteria có liên quan.

    - Người dùng yêu cầu so sánh toàn diện:
      ["all"]

    - Người dùng chỉ nói "so sánh hai tablet" mà không nêu tiêu chí:
      Chọn các nhóm tiêu chí quan trọng, phù hợp với dữ liệu
      hiện có của các tablet.

    5. QUY TẮC XỬ LÝ KẾT QUẢ

    - Truyền đúng tên các tablet cần so sánh.
    - Chỉ sử dụng dữ liệu do Tool trả về.
    - Không tự tạo hoặc suy đoán giá bán, thông số hay tính năng.
    - Khi so sánh giá, đối chiếu đúng phiên bản trong variants.
    - Phân biệt rõ thông số của từng tablet.
    - Nếu thiếu dữ liệu của một tiêu chí, nêu rõ chưa có dữ liệu.
    - Nếu Tool trả về found = false, thông báo lỗi phù hợp;
      không trình bày kết quả như thể đã so sánh thành công.
    - Sau khi nhận dữ liệu, trình bày điểm giống nhau,
      khác nhau và nhận xét dựa trên tiêu chí người dùng yêu cầu.
    """
    return await compare_tablets_api(
        products=products,
        criteria=criteria,
    )