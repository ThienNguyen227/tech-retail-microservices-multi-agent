'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Zap,
} from 'lucide-react';

// ==================== TYPES ====================

type TabletVariant = {
  sku: string;
  slug: string;
  storage: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

type StringList = string[] | string | undefined;

type Tablet = {
  _id: string;
  image: string;
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  screenTech?: string;
  screenSize?: string;
  variants: TabletVariant[];

  screen?: {
    screenTechnology?: string;
    screenSize?: string;
  };

  operatingSystemAndCpu?: {
    operatingSystem?: string;
    cpuSpeed?: string;
    gpu?: string;
  };

  memoryAndStorage?: {
    randomAccessMemory?: string;
    usableStorage?: string;
    externalMemoryCard?: string;
  };

  rearCamera?: {
    rearCameraResolution?: string;
    rearVideoRecording?: StringList;
    rearCameraFeatures?: StringList;
    rearFlash?: string;
  };

  frontCamera?: {
    frontCameraResolution?: string;
    frontCameraFeatures?: StringList;
  };

  connectivity?: {
    mobileNetwork?: string;
    simType?: string;
    voiceCallSupport?: string;
    wifi?: StringList;
    gps?: StringList;
    bluetooth?: string;
    connectorPort?: string;
    headphoneJack?: string;
    otherConnectivity?: string;
  };

  utilities?: {
    specialFeatures?: StringList;
    waterResistance?: string;
    audioRecording?: string;
    radio?: string;
  };

  batteryAndCharge?: {
    batteryCapacity?: string;
    batteryType?: string;
    batteryTechnology?: string;
    maxChargingPower?: string;
    chargerIncluded?: string;
  };

  designAndMaterials?: {
    materials?: string;
    dimensions?: string;
    weight?: string;
    releaseDate?: string;
  };
};

type TabletProductDetailProps = {
  product: Tablet;
  selectedSlug: string;
};

// ==================== HELPERS ====================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + '₫';
}

function normalizeList(value: StringList): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

// ==================== REUSABLE COMPONENTS ====================
function DetailSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center justify-between gap-3 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-800 transition hover:bg-gray-100"
      >
        <span>{title}</span>

        <ChevronDown
          size={20}
          className={`shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="space-y-3 p-4">
          {children}
        </div>
      )}
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let displayValue: string;

  if (typeof value === 'boolean') {
    displayValue = value ? 'Có' : 'Không';
  } else {
    displayValue = String(value);
  }

  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="break-words text-sm font-medium text-gray-800">
        {displayValue}
      </span>
    </div>
  );
}

function InfoList({
  label,
  value,
}: {
  label: string;
  value?: StringList;
}) {
  const items = normalizeList(value);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-2 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <span className="text-sm text-gray-500">{label}</span>

      <ul className="list-inside list-disc space-y-1 text-sm font-medium text-gray-800">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function TabletProductDetail({
  product,
  selectedSlug,
}: TabletProductDetailProps) {
  const router = useRouter();

  const initialVariant = useMemo(
    () =>
      product.variants.find(
        (variant) => variant.slug === selectedSlug,
      ) ?? product.variants[0],
    [product.variants, selectedSlug],
  );

  const [selectedStorage, setSelectedStorage] = useState(
    initialVariant?.storage ?? '',
  );

  const [selectedColor, setSelectedColor] = useState(
    initialVariant?.colorSlug ?? '',
  );

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  // Đồng bộ biến thể khi URL slug thay đổi.
  useEffect(() => {
    setSelectedStorage(initialVariant?.storage ?? '');
    setSelectedColor(initialVariant?.colorSlug ?? '');
    setSelectedImageIndex(0);
  }, [initialVariant]);

  const storageOptions = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.storage))],
    [product.variants],
  );

  const colorOptions = useMemo(() => {
    const uniqueColors = new Map<string, string>();

    product.variants.forEach((variant) => {
      uniqueColors.set(variant.colorSlug, variant.color);
    });

    return Array.from(uniqueColors.entries()).map(
      ([colorSlug, color]) => ({ colorSlug, color }),
    );
  }, [product.variants]);

  const selectedVariant = product.variants.find(
    (variant) =>
      variant.storage === selectedStorage &&
      variant.colorSlug === selectedColor,
  );

  const currentImages =
    selectedVariant?.images?.length
      ? selectedVariant.images
      : [product.image];

  const currentImage =
    currentImages[
      Math.min(selectedImageIndex, currentImages.length - 1)
    ];

  const screenTechnology =
    product.screen?.screenTechnology ?? product.screenTech;

  const screenSize =
    product.screen?.screenSize ?? product.screenSize;

  // Chỉ điều hướng khi tổ hợp RAM/bộ nhớ và màu tồn tại.
  const selectVariant = (
    storage: string,
    colorSlug: string,
  ) => {
    const nextVariant = product.variants.find(
      (variant) =>
        variant.storage === storage &&
        variant.colorSlug === colorSlug,
    );

    if (!nextVariant) {
      return;
    }

    setSelectedStorage(storage);
    setSelectedColor(colorSlug);
    setSelectedImageIndex(0);

    if (nextVariant.slug !== selectedSlug) {
      router.push(`/customer/product-detail/${nextVariant.slug}`);
    }
  };

  // ==================== ADD TO CART ====================

  const handleAddToCart = async () => {
    if (!selectedVariant || addingToCart) {
      return;
    }

    const userId =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('userId')
        : null;

    if (!userId) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      router.push('/customer/login');
      return;
    }

    setAddingToCart(true);

    try {
      const cartUrl = 'http://localhost:3004/api/v1/carts';

      // Kiểm tra giỏ hàng hiện tại.
      const cartResponse = await fetch(
        `${cartUrl}?userId=${encodeURIComponent(userId)}`,
      );

      if (!cartResponse.ok) {
        throw new Error('Không thể kiểm tra giỏ hàng.');
      }

      const cartData = await cartResponse.json();

      // Giữ bước kiểm tra giỏ hàng để tương thích với API hiện tại.
      // Backend xử lý cộng số lượng hoặc tạo item theo nghiệp vụ của service.
      void cartData;

      const response = await fetch(`${cartUrl}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          item: {
            productId: product._id,
            sku: selectedVariant.sku,
            variantSlug: selectedVariant.slug,
            productName: `${product.name} ${selectedVariant.storage} ${selectedVariant.color}`,
            imageUrl: currentImages[0] ?? product.image,
            quantity: 1,
            price: selectedVariant.price,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? 'Không thể thêm sản phẩm vào giỏ hàng.',
        );
      }

      alert('Đã thêm sản phẩm vào giỏ hàng.');

      window.dispatchEvent(new Event('cart-updated'));
    } catch (error) {
      console.error('Add to cart error:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi thêm vào giỏ hàng.',
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();

    // Chuyển đến giỏ hàng sau khi người dùng xác nhận thao tác
    // thêm sản phẩm thành công được xử lý ở handleAddToCart.
    // Không tự điều hướng tại đây vì handleAddToCart chưa trả về trạng thái.
  };

  if (!selectedVariant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-gray-600">
          Không tìm thấy phiên bản sản phẩm phù hợp.
        </p>
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <main className="min-h-screen bg-gray-50 pb-12">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="hover:text-teal-700"
          >
            Trang chủ
          </button>

          <span>/</span>

          <button
            type="button"
            onClick={() => router.push('/customer/products?category=tablet')}
            className="hover:text-teal-700"
          >
            Máy tính bảng
          </button>

          <span>/</span>

          <span className="font-medium text-gray-800">
            {product.name}
          </span>
        </nav>

        <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
            {product.name}
        </h1> 

        {/* Product overview */}
        <div className="grid grid-cols-1 gap-6 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-12 md:p-6">
          {/* Images */}
          <div className="md:col-span-5">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
              <img
                src={`/product/tablet/${currentImage}`}
                alt={product.name}
                className="h-full w-full object-contain"
                onError={(event) => {
                  const imageElement = event.currentTarget;

                  if (imageElement.dataset.fallbackApplied === 'true') {
                    return;
                  }

                  imageElement.dataset.fallbackApplied = 'true';
                  imageElement.src = `/product/tablet/${product.image}`;
                }}
              />
            </div>

            {currentImages.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  aria-label="Ảnh trước"
                  onClick={() =>
                    setSelectedImageIndex((index) =>
                      index === 0 ? currentImages.length - 1 : index - 1,
                    )
                  }
                  className="rounded-full border p-2 hover:bg-gray-100"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex max-w-full gap-2 overflow-x-auto">
                  {currentImages.map((image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 p-1 ${
                        index === selectedImageIndex
                          ? 'border-teal-600'
                          : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={`/product/tablet/${image}`}
                        alt={`${product.name} - ảnh ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  aria-label="Ảnh tiếp theo"
                  onClick={() =>
                    setSelectedImageIndex((index) =>
                      index === currentImages.length - 1 ? 0 : index + 1,
                    )
                  }
                  className="rounded-full border p-2 hover:bg-gray-100"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Product information */}
          <div className="md:col-span-7">
            <p className="mb-2 text-sm text-gray-500">
              Máy tính bảng
            </p>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              <span>
                Màn hình: {screenSize ?? 'Đang cập nhật'}
              </span>

              <span>
                Công nghệ: {screenTechnology ?? 'Đang cập nhật'}
              </span>
            </div>

            <div className="mt-5 rounded-xl bg-red-50 p-4">
              <p className="text-sm text-gray-500">Giá bán</p>

              <p className="mt-1 text-3xl font-bold text-red-600">
                {formatPrice(selectedVariant.price)}
              </p>
            </div>

            {/* Storage / RAM */}
            <div className="mt-6">
              <h2 className="mb-3 font-semibold text-gray-800">
                RAM và bộ nhớ
              </h2>

              <div className="flex flex-wrap gap-3">
                {storageOptions.map((storage) => {
                  const active = storage === selectedStorage;

                  return (
                    <button
                      key={storage}
                      type="button"
                      onClick={() =>
                        selectVariant(storage, selectedColor)
                      }
                      className={`rounded-lg border px-4 py-3 text-sm transition ${
                        active
                          ? 'border-teal-600 bg-teal-50 font-semibold text-teal-700'
                          : 'border-gray-200 text-gray-700 hover:border-teal-400'
                      }`}
                    >
                      {storage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div className="mt-6">
              <h2 className="mb-3 font-semibold text-gray-800">
                Màu sắc: {selectedVariant.color}
              </h2>

              <div className="flex flex-wrap gap-3">
                {colorOptions.map(({ colorSlug, color }) => {
                  const active = colorSlug === selectedColor;

                  const available = product.variants.some(
                    (variant) =>
                      variant.storage === selectedStorage &&
                      variant.colorSlug === colorSlug,
                  );

                  return (
                    <button
                      key={colorSlug}
                      type="button"
                      disabled={!available}
                      onClick={() =>
                        selectVariant(selectedStorage, colorSlug)
                      }
                      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? 'border-teal-600 bg-teal-50 font-semibold text-teal-700'
                          : 'border-gray-200 text-gray-700 hover:border-teal-400'
                      }`}
                    >
                      {active && <Check size={16} />}
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SKU */}
            <div className="mt-5 border-t border-gray-100 pt-4 text-sm text-gray-500">
              Mã sản phẩm:{' '}
              <span className="font-medium text-gray-800">
                {selectedVariant.sku}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={addingToCart}
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 rounded-xl border border-teal-600 px-4 py-3 font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingCart size={19} />
                {addingToCart ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
              </button>

              <button
                type="button"
                disabled={addingToCart}
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap size={19} />
                Mua ngay
              </button>
            </div>
          </div>
        </div>

        {/* Technical specifications */}
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">
            Thông số kỹ thuật
          </h2>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <DetailSection title="Màn hình" defaultOpen>
                <InfoRow
                  label="Công nghệ màn hình"
                  value={screenTechnology}
                />
                <InfoRow
                  label="Kích thước màn hình"
                  value={screenSize}
                />
              </DetailSection>

              <DetailSection title="Hệ điều hành và CPU">
                <InfoRow
                  label="Hệ điều hành"
                  value={product.operatingSystemAndCpu?.operatingSystem}
                />
                <InfoRow
                  label="Tốc độ CPU"
                  value={product.operatingSystemAndCpu?.cpuSpeed}
                />
                <InfoRow
                  label="GPU"
                  value={product.operatingSystemAndCpu?.gpu}
                />
              </DetailSection>

              <DetailSection title="Bộ nhớ và lưu trữ">
                <InfoRow
                  label="RAM"
                  value={
                    product.memoryAndStorage?.randomAccessMemory ??
                    selectedVariant.storage.split(' - ')[0]
                  }
                />
                <InfoRow
                  label="Bộ nhớ trong"
                  value={selectedVariant.storage.split(' - ')[1]}
                />
                <InfoRow
                  label="Dung lượng khả dụng"
                  value={product.memoryAndStorage?.usableStorage}
                />
                <InfoRow
                  label="Thẻ nhớ ngoài"
                  value={product.memoryAndStorage?.externalMemoryCard}
                />
              </DetailSection>

              <DetailSection title="Camera sau">
                <InfoRow
                  label="Độ phân giải"
                  value={product.rearCamera?.rearCameraResolution}
                />
                <InfoList
                  label="Quay video"
                  value={product.rearCamera?.rearVideoRecording}
                />
                <InfoList
                  label="Tính năng camera"
                  value={product.rearCamera?.rearCameraFeatures}
                />
                <InfoRow
                  label="Đèn flash"
                  value={product.rearCamera?.rearFlash}
                />
              </DetailSection>

              <DetailSection title="Camera trước">
                <InfoRow
                  label="Độ phân giải"
                  value={product.frontCamera?.frontCameraResolution}
                />
                <InfoList
                  label="Tính năng camera"
                  value={product.frontCamera?.frontCameraFeatures}
                />
              </DetailSection>

              <DetailSection title="Pin và sạc">
                <InfoRow
                  label="Dung lượng pin"
                  value={product.batteryAndCharge?.batteryCapacity}
                />
                <InfoRow
                  label="Loại pin"
                  value={product.batteryAndCharge?.batteryType}
                />
                <InfoRow
                  label="Công nghệ pin"
                  value={product.batteryAndCharge?.batteryTechnology}
                />
                <InfoRow
                  label="Công suất sạc tối đa"
                  value={product.batteryAndCharge?.maxChargingPower}
                />
                <InfoRow
                  label="Củ sạc đi kèm"
                  value={product.batteryAndCharge?.chargerIncluded}
                />
              </DetailSection>

              <DetailSection title="Kết nối">
                <InfoRow
                  label="Mạng di động"
                  value={product.connectivity?.mobileNetwork}
                />
                <InfoRow
                  label="Loại SIM"
                  value={product.connectivity?.simType}
                />
                <InfoRow
                  label="Hỗ trợ nghe gọi"
                  value={product.connectivity?.voiceCallSupport}
                />
                <InfoList
                  label="Wi-Fi"
                  value={product.connectivity?.wifi}
                />
                <InfoList
                  label="Định vị GPS"
                  value={product.connectivity?.gps}
                />
                <InfoRow
                  label="Bluetooth"
                  value={product.connectivity?.bluetooth}
                />
                <InfoRow
                  label="Cổng kết nối"
                  value={product.connectivity?.connectorPort}
                />
                <InfoRow
                  label="Jack tai nghe"
                  value={product.connectivity?.headphoneJack}
                />
                <InfoRow
                  label="Kết nối khác"
                  value={product.connectivity?.otherConnectivity}
                />
              </DetailSection>

              <DetailSection title="Tiện ích">
                <InfoList
                  label="Tính năng đặc biệt"
                  value={product.utilities?.specialFeatures}
                />
                <InfoRow
                  label="Kháng nước, bụi"
                  value={product.utilities?.waterResistance}
                />
                <InfoRow
                  label="Ghi âm"
                  value={product.utilities?.audioRecording}
                />
                <InfoRow
                  label="Radio"
                  value={product.utilities?.radio}
                />
              </DetailSection>

              <DetailSection title="Thiết kế và chất liệu">
                <InfoRow
                  label="Chất liệu"
                  value={product.designAndMaterials?.materials}
                />
                <InfoRow
                  label="Kích thước"
                  value={product.designAndMaterials?.dimensions}
                />
                <InfoRow
                  label="Khối lượng"
                  value={product.designAndMaterials?.weight}
                />
                <InfoRow
                  label="Thời điểm ra mắt"
                  value={product.designAndMaterials?.releaseDate}
                />
              </DetailSection>
            </div>

            {/* Quick summary */}
            <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4 lg:col-span-4">
              <h3 className="mb-3 font-bold text-gray-900">
                Thông tin nổi bật
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Sản phẩm</p>
                  <p className="font-medium text-gray-800">
                    {product.name}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Màn hình</p>
                  <p className="font-medium text-gray-800">
                    {screenSize ?? 'Đang cập nhật'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Hệ điều hành</p>
                  <p className="font-medium text-gray-800">
                    {product.operatingSystemAndCpu?.operatingSystem ??
                      'Đang cập nhật'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Dung lượng phiên bản</p>
                  <p className="font-medium text-gray-800">
                    {selectedVariant.storage}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Màu sắc</p>
                  <p className="font-medium text-gray-800">
                    {selectedVariant.color}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-gray-500">Giá bán</p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatPrice(selectedVariant.price)}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
