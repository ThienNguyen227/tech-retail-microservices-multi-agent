from langchain.tools import tool
from typing import Literal

from services.product_service import (
  search_products as search_products_api,
  get_phone_detail as get_phone_detail_api,
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


CompareCriteria = Literal[
    "basic",
    "variant",
    "price",
    "performance",
    "camera",
    "screen",
    "battery",
    "connectivity",
    "design",
    "utilities",
    "all",
]


@tool
async def compare_phones(
    products: list[str],
    criteria: list[CompareCriteria] | None = None,
):
    """Lấy dữ liệu để so sánh từ 2 đến 5 điện thoại.

    products: Danh sách tên sản phẩm chính xác.
    criteria: Danh sách tiêu chí cần so sánh.

    Tiêu chí hỗ trợ:
    - basic: thông tin cơ bản
    - variant: dung lượng, màu sắc, giá và mã phiên bản
    - price: giá theo từng dung lượng
    - performance: chip, CPU, GPU, RAM và bộ nhớ
    - camera: camera và tính năng quay video
    - screen: thông số màn hình
    - battery: pin và sạc
    - connectivity: kết nối
    - design: thiết kế, chất liệu, kích thước và trọng lượng
    - utilities: tiện ích
    - all: toàn bộ dữ liệu

    Nếu criteria không được cung cấp, Product-Service trả về toàn bộ dữ liệu.
    Chỉ chọn các tiêu chí liên quan đến yêu cầu của người dùng.
    """
    return await compare_phones_api(
        products=products,
        criteria=criteria,
    )


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