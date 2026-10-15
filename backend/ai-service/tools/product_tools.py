from langchain.tools import tool
from typing import Literal

from services.product_service import (
  search_products as search_products_api,
  get_phone_detail as get_phone_detail_api,
  get_laptop_detail as get_laptop_detail_api,
  get_tablet_detail as get_tablet_detail_api,
  compare_phones as compare_phones_api,
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

  1. MÔ TẢ
  Truy xuất thông tin chi tiết của một điện thoại từ Product Service
  theo tên sản phẩm và các nhóm thông tin được yêu cầu.

  2. KHI NÀO SỬ DỤNG
  - Người dùng hỏi thông tin về một điện thoại cụ thể.
  - Người dùng hỏi giá, màu sắc, dung lượng hoặc phiên bản.
  - Người dùng hỏi thông số kỹ thuật hoặc tính năng của điện thoại.
  - Người dùng yêu cầu xem toàn bộ thông tin sản phẩm.

  Không sử dụng Tool này để tìm kiếm danh sách nhiều sản phẩm
  theo điều kiện lọc hoặc so sánh nhiều điện thoại.

  3. THAM SỐ ĐẦU VÀO

  - phone_name:
    Tên điện thoại cần truy xuất.
    Ví dụ: "iPhone 17 Pro Max", "Samsung Galaxy Z Fold7".

  - criteria:
    Danh sách nhóm dữ liệu cần truy xuất.
    Chỉ chọn các nhóm phù hợp với câu hỏi của người dùng.

    Các giá trị hợp lệ:

    - all:
      Toàn bộ dữ liệu của sản phẩm.

    - screenTech:
      Công nghệ màn hình tổng quát.
      Trường dữ liệu:
      - screenTech: Công nghệ màn hình, ví dụ "Super Retina XDR".

    - screenSize:
      Kích thước màn hình tổng quát.
      Trường dữ liệu:
      - screenSize: Kích thước màn hình, ví dụ 6.9".

    - variants:
      Danh sách các phiên bản và thông tin bán hàng.
      Trường dữ liệu:
      - sku: Mã định danh phiên bản.
      - slug: Đường dẫn định danh phiên bản.
      - storage: Dung lượng của phiên bản, ví dụ "256GB", "512GB".
      - color: Tên màu sắc, ví dụ "Cam Vũ Trụ", "Bạc".
      - colorSlug: Slug của màu sắc.
      - price: Giá bán của phiên bản, đơn vị VNĐ.
      - images: Danh sách hình ảnh của phiên bản.

    - specifications:
      Các thông số kỹ thuật tổng quát.
      Trường dữ liệu:
      - chip: Thông tin chip xử lý.
      - storage: Dung lượng lưu trữ được ghi trong thông số chung.
      - rearCamera: Thông số camera sau.
      - frontCamera: Thông số camera trước.
      - battery: Thông tin pin và sạc được mô tả tổng quát.

    - performanceAndStorage:
      Thông tin hệ điều hành, hiệu năng và bộ nhớ.
      Trường dữ liệu:
      - os: Hệ điều hành.
      - cpu/chip: Bộ xử lý CPU/Thông tin chip xử lý.
      - cpuSpeed: Tốc độ CPU.
      - gpu: Bộ xử lý đồ họa GPU.
      - ram: Dung lượng RAM.
      - internalStorage: Dung lượng bộ nhớ trong.
      - usableStorage: Dung lượng bộ nhớ khả dụng.
      - contactsStorage: Khả năng lưu danh bạ.

    - cameraAndScreen:
      Thông tin chi tiết camera và màn hình.
      Trường dữ liệu:
      - rearCameraResolution: Độ phân giải camera sau.
      - rearVideoRecording: Các chuẩn và độ phân giải quay video bằng camera sau.
      - rearFlashlight: Có hoặc không có đèn flash camera sau.
      - rearCameraFeatures: Các tính năng camera sau.
      - frontCameraResolution: Độ phân giải camera trước.
      - frontCameraFeatures: Các tính năng camera trước.
      - screenTechnology: Công nghệ màn hình chi tiết.
      - screenResolution: Độ phân giải màn hình.
      - screenSize: Kích thước màn hình trong nhóm thông số chi tiết.
      - refreshRate: Tần số quét màn hình.
      - maxBrightness: Độ sáng tối đa.
      - touchScreenGlass: Loại kính màn hình.

    - batteryAndCharge:
      Thông tin pin, thời lượng sử dụng và sạc.
      Trường dữ liệu:
      - batteryLife: Thời lượng sử dụng pin.
      - batteryType: Loại pin.
      - maxChargingPower: Công suất sạc tối đa.
      - batteryFeatures: Các tính năng pin và sạc.

    - utilities:
      Các tiện ích và tính năng bổ sung.
      Trường dữ liệu:
      - advancedSecurity: Tính năng bảo mật.
      - waterResistance: Khả năng kháng nước.
      - audioRecording: Các tính năng ghi âm.
      - supportedVideoFormats: Các định dạng video hỗ trợ.
      - supportedAudioFormats: Các định dạng âm thanh hỗ trợ.

    - connectivity:
      Thông tin mạng và kết nối.
      Trường dữ liệu:
      - mobileNetwork: Mạng di động hỗ trợ.
      - simType: Loại SIM.
      - wifi: Các chuẩn hoặc tính năng Wi-Fi.
      - gps: Các hệ thống định vị hỗ trợ.
      - bluetooth: Phiên bản Bluetooth.
      - connectorPort: Cổng kết nối.
      - headphoneJack: Kết nối tai nghe.
      - otherConnectivity: Các kết nối khác.

    - designAndMaterials:
      Thông tin thiết kế, vật liệu và kích thước vật lý.
      Trường dữ liệu:
      - designType: Kiểu thiết kế.
      - materials: Vật liệu cấu thành.
      - dimensions: Kích thước vật lý.
      - weight: Trọng lượng.
      - releaseDate: Ngày ra mắt.

  4. HƯỚNG DẪN CHỌN CRITERIA

  - Hỏi công nghệ màn hình tổng quát:
    ["screenTech"]

  - Hỏi kích thước màn hình tổng quát:
    ["screenSize"]

  - Hỏi giá, SKU, màu sắc, dung lượng hoặc phiên bản:
    ["variants"]

  - Hỏi chip, RAM, CPU, GPU, hệ điều hành hoặc bộ nhớ khả dụng:
    ["performanceAndStorage"]

  - Hỏi thông số kỹ thuật tổng quát như chip, camera hoặc pin:
    ["specifications"]

  - Hỏi độ phân giải camera, quay video hoặc tính năng camera:
    ["cameraAndScreen"]

  - Hỏi độ phân giải màn hình, tần số quét, độ sáng hoặc kính màn hình:
    ["cameraAndScreen"]

  - Hỏi thời lượng pin, loại pin, công suất sạc hoặc tính năng sạc:
    ["batteryAndCharge"]

  - Hỏi bảo mật, kháng nước, ghi âm hoặc định dạng đa phương tiện:
    ["utilities"]

  - Hỏi 5G, SIM, Wi-Fi, GPS, Bluetooth, NFC hoặc cổng kết nối:
    ["connectivity"]

  - Hỏi kiểu thiết kế, vật liệu, kích thước vật lý, trọng lượng hoặc ngày ra mắt:
    ["designAndMaterials"]

  - Hỏi nhiều nhóm thông tin:
    Chọn tất cả criteria có liên quan.

  - Hỏi toàn bộ thông tin sản phẩm:
    ["all"]

  5. QUY TẮC XỬ LÝ KẾT QUẢ

  - Chỉ yêu cầu các nhóm dữ liệu cần thiết để trả lời câu hỏi.
  - Khi hỏi giá theo dung lượng hoặc màu sắc, đối chiếu đúng
    variants[].storage và variants[].color trước khi lấy giá.
  - Giá bán phải lấy từ variants[].price của phiên bản phù hợp.
  - Nếu người dùng chưa xác định phiên bản, trình bày các lựa chọn
    phù hợp hoặc hỏi lại nếu cần thiết.
  - Chỉ sử dụng dữ liệu Tool trả về; không tự suy đoán giá,
    thông số hoặc đặc điểm sản phẩm.
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

    1. MÔ TẢ
    Truy xuất thông tin chi tiết của một laptop từ Product Service
    theo tên sản phẩm và các nhóm thông tin được yêu cầu.

    2. KHI NÀO SỬ DỤNG
    - Người dùng hỏi thông tin về một laptop cụ thể.
    - Người dùng hỏi giá, màu sắc, RAM, SSD hoặc phiên bản.
    - Người dùng hỏi CPU, GPU, màn hình hoặc kết nối.
    - Người dùng hỏi pin, hệ điều hành, kích thước hoặc trọng lượng.
    - Người dùng yêu cầu xem toàn bộ thông tin laptop.

    Không sử dụng Tool này để tìm kiếm danh sách nhiều laptop
    theo điều kiện lọc hoặc so sánh nhiều laptop.

    3. THAM SỐ ĐẦU VÀO

    - laptop_name:
      Tên laptop cần truy xuất.
      Ví dụ: "Laptop HP 240R G10 - C3RU7AT".

    - criteria:
      Danh sách nhóm dữ liệu cần truy xuất.
      Chỉ chọn các nhóm phù hợp với câu hỏi của người dùng.

    4. CÁC CRITERIA HỢP LỆ

    - all:
      Toàn bộ dữ liệu của laptop.

    - variants:
      Danh sách phiên bản và thông tin bán hàng.
      Trường dữ liệu:
      - sku: Mã định danh phiên bản.
      - slug: Đường dẫn định danh phiên bản.
      - ram: Dung lượng RAM của phiên bản.
      - ssd: Dung lượng SSD của phiên bản.
      - color: Màu sắc.
      - colorSlug: Slug màu sắc.
      - price: Giá bán, đơn vị VNĐ.
      - images: Danh sách hình ảnh của phiên bản.

    - processor:
      Thông tin bộ xử lý.
      Trường dữ liệu:
      - cpuTechnology: Công nghệ CPU.
      - cpuCores: Số nhân CPU.
      - cpuThreads: Số luồng CPU.
      - cpuSpeed: Tốc độ CPU.

    - graphics:
      Thông tin card đồ họa.
      Trường dữ liệu:
      - graphicsCard: Card đồ họa tích hợp hoặc rời.

    - memoryAndStorage:
      Thông tin bộ nhớ và lưu trữ.
      Trường dữ liệu:
      - ram: Dung lượng RAM.
      - ramType: Loại RAM và cấu hình khe RAM.
      - ramBusSpeed: Tốc độ bus RAM.
      - maxRamCapacity: Dung lượng RAM tối đa.
      - storage: Thông tin SSD, chuẩn kết nối và khả năng nâng cấp.

    - display:
      Thông tin màn hình.
      Trường dữ liệu:
      - screenSize: Kích thước màn hình.
      - resolution: Độ phân giải.
      - panelType: Loại tấm nền.
      - refreshRate: Tần số quét.
      - colorCoverage: Độ phủ màu.
      - screenTechnology: Công nghệ và đặc điểm màn hình.

    - connectivityAndExpansion:
      Thông tin kết nối và mở rộng.
      Trường dữ liệu:
      - ports: Các cổng kết nối.
      - wirelessConnectivity: Wi-Fi và Bluetooth.
      - memoryCardSlot: Khe đọc thẻ nhớ.
      - webcam: Webcam.
      - keyboardBacklight: Đèn bàn phím.
      - security: Tính năng bảo mật.
      - audioTechnology: Công nghệ âm thanh.
      - cooling: Hệ thống tản nhiệt.

    - dimensionsAndBattery:
      Thông tin pin, hệ điều hành, thiết kế và kích thước.
      Trường dữ liệu:
      - battery: Dung lượng và thông tin pin.
      - operatingSystem: Hệ điều hành.
      - releaseYear: Năm ra mắt.
      - dimensions: Kích thước vật lý.
      - weight: Trọng lượng.
      - material: Vật liệu cấu thành.

    5. HƯỚNG DẪN CHỌN CRITERIA

    - Hỏi giá, SKU, màu sắc hoặc phiên bản:
      ["variants"]

    - Hỏi CPU, số nhân, số luồng hoặc tốc độ CPU:
      ["processor"]

    - Hỏi card đồ họa:
      ["graphics"]

    - Hỏi loại RAM, bus RAM, RAM tối đa hoặc khả năng nâng cấp SSD:
      ["memoryAndStorage"]

    - Hỏi kích thước, độ phân giải, tấm nền hoặc tần số quét:
      ["display"]

    - Hỏi cổng kết nối, Wi-Fi, Bluetooth, webcam, âm thanh
      hoặc tính năng bảo mật:
      ["connectivityAndExpansion"]

    - Hỏi pin, hệ điều hành, năm ra mắt, kích thước,
      trọng lượng hoặc vật liệu:
      ["dimensionsAndBattery"]

    - Hỏi nhiều nhóm thông tin:
      Chọn tất cả criteria có liên quan.

    - Hỏi toàn bộ thông tin laptop:
      ["all"]

    6. QUY TẮC XỬ LÝ KẾT QUẢ

    - Chỉ yêu cầu những nhóm dữ liệu cần thiết để trả lời.
    - Khi hỏi giá theo RAM, SSD hoặc màu sắc, đối chiếu
      variants[].ram, variants[].ssd và variants[].color.
    - Giá bán phải lấy từ variants[].price của phiên bản phù hợp.
    - Nếu người dùng chưa xác định phiên bản, trình bày các
      lựa chọn phù hợp hoặc hỏi lại khi cần thiết.
    - Chỉ sử dụng dữ liệu Tool trả về; không tự suy đoán giá,
      thông số hoặc đặc điểm laptop.
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

    1. MÔ TẢ
    Truy xuất thông tin chi tiết của một tablet từ Product Service
    theo tên sản phẩm và các nhóm thông tin được yêu cầu.

    2. KHI NÀO SỬ DỤNG
    - Người dùng hỏi thông tin về một tablet cụ thể.
    - Người dùng hỏi giá, màu sắc, dung lượng RAM, bộ nhớ hoặc phiên bản.
    - Người dùng hỏi màn hình, CPU, GPU hoặc hệ điều hành.
    - Người dùng hỏi camera, kết nối hoặc tính năng tiện ích.
    - Người dùng hỏi pin, công suất sạc, kích thước hoặc vật liệu.
    - Người dùng yêu cầu xem toàn bộ thông tin tablet.

    Không sử dụng Tool này để tìm kiếm danh sách nhiều tablet
    theo điều kiện lọc hoặc so sánh nhiều tablet.

    3. THAM SỐ ĐẦU VÀO

    - tablet_name:
      Tên tablet cần truy xuất.
      Ví dụ: "Samsung Galaxy Tab A11+ 5G".

    - criteria:
      Danh sách nhóm dữ liệu cần truy xuất.
      Chỉ chọn các nhóm phù hợp với câu hỏi của người dùng.

    4. CÁC CRITERIA HỢP LỆ

    - all:
      Toàn bộ dữ liệu của tablet.

    - screenTech:
      Công nghệ màn hình ở cấp cao nhất.

    - screenSize:
      Kích thước màn hình ở cấp cao nhất.

    - variants:
      Danh sách phiên bản và thông tin bán hàng.
      Trường dữ liệu:
      - sku: Mã định danh phiên bản.
      - slug: Đường dẫn định danh phiên bản.
      - storage: Thông tin RAM và bộ nhớ của phiên bản.
      - color: Màu sắc.
      - colorSlug: Slug màu sắc.
      - price: Giá bán, đơn vị VNĐ.
      - images: Danh sách hình ảnh của phiên bản.

    - screen:
      Thông tin màn hình.
      Trường dữ liệu:
      - screenTechnology: Công nghệ màn hình.
      - screenSize: Kích thước và tần số quét màn hình.

    - operatingSystemAndCpu:
      Thông tin hệ điều hành và bộ xử lý.
      Trường dữ liệu:
      - operatingSystem: Hệ điều hành.
      - cpu: Tên bộ xử lý.
      - cpuSpeed: Tốc độ và cấu hình nhân CPU.
      - gpu: Bộ xử lý đồ họa.

    - memoryAndStorage:
      Thông tin bộ nhớ và lưu trữ.
      Trường dữ liệu:
      - randomAccessMemory: Dung lượng RAM.
      - usableStorage: Bộ nhớ khả dụng.
      - externalMemoryCard: Thẻ nhớ ngoài và dung lượng hỗ trợ tối đa.

    - rearCamera:
      Thông tin camera sau.
      Trường dữ liệu:
      - rearVideoRecording: Khả năng quay video.
      - rearCameraFeatures: Các tính năng camera sau.

    - frontCamera:
      Thông tin camera trước.
      Trường dữ liệu:
      - frontCameraFeatures: Các tính năng camera trước.

    - connectivity:
      Thông tin kết nối.
      Trường dữ liệu:
      - mobileNetwork: Mạng di động.
      - simType: Loại SIM.
      - voiceCallSupport: Khả năng nghe gọi.
      - wifi: Chuẩn Wi-Fi.
      - gps: Các hệ thống định vị.
      - bluetooth: Phiên bản Bluetooth.
      - connectorPort: Cổng kết nối.
      - headphoneJack: Jack tai nghe.
      - otherConnectivity: Các kết nối khác.

    - utilities:
      Thông tin tiện ích và tính năng đặc biệt.
      Trường dữ liệu:
      - specialFeatures: Các tính năng đặc biệt.
      - waterResistance: Chuẩn kháng nước.
      - audioRecording: Khả năng ghi âm.
      - radio: Khả năng sử dụng radio.

    - batteryAndCharge:
      Thông tin pin và sạc.
      Trường dữ liệu:
      - batteryCapacity: Dung lượng pin.
      - batteryType: Loại pin.
      - batteryTechnology: Công nghệ sạc.
      - maxChargingPower: Công suất sạc tối đa.
      - chargerIncluded: Thông tin bộ sạc đi kèm.

    - designAndMaterials:
      Thông tin thiết kế và vật liệu.
      Trường dữ liệu:
      - materials: Chất liệu.
      - dimensions: Kích thước thiết bị.
      - releaseDate: Thời điểm ra mắt.

    5. HƯỚNG DẪN CHỌN CRITERIA

    - Hỏi giá, SKU, màu sắc hoặc phiên bản:
      ["variants"]

    - Hỏi công nghệ, kích thước hoặc tần số quét màn hình:
      ["screen", "screenTech", "screenSize"]

    - Hỏi hệ điều hành, CPU hoặc GPU:
      ["operatingSystemAndCpu"]

    - Hỏi RAM, bộ nhớ khả dụng hoặc thẻ nhớ:
      ["memoryAndStorage"]

    - Hỏi camera sau hoặc khả năng quay video:
      ["rearCamera"]

    - Hỏi camera trước:
      ["frontCamera"]

    - Hỏi mạng di động, SIM, Wi-Fi, GPS, Bluetooth hoặc cổng kết nối:
      ["connectivity"]

    - Hỏi tính năng đặc biệt, kháng nước hoặc ghi âm:
      ["utilities"]

    - Hỏi dung lượng pin, công nghệ sạc hoặc bộ sạc:
      ["batteryAndCharge"]

    - Hỏi chất liệu, kích thước hoặc ngày ra mắt:
      ["designAndMaterials"]

    - Hỏi nhiều nhóm thông tin:
      Chọn tất cả criteria có liên quan.

    - Hỏi toàn bộ thông tin tablet:
      ["all"]

    6. QUY TẮC XỬ LÝ KẾT QUẢ

    - Chỉ yêu cầu những nhóm dữ liệu cần thiết để trả lời.
    - Khi hỏi giá theo dung lượng bộ nhớ hoặc màu sắc, đối chiếu
      variants[].storage và variants[].color.
    - Giá bán phải lấy từ variants[].price của phiên bản phù hợp.
    - Không tự suy ra RAM hoặc bộ nhớ của từng phiên bản nếu dữ liệu
      phiên bản không cung cấp thông tin tương ứng.
    - Nếu người dùng chưa xác định phiên bản, trình bày các lựa chọn
      phù hợp hoặc hỏi lại khi cần thiết.
    - Chỉ sử dụng dữ liệu Tool trả về; không tự suy đoán thông số.
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
