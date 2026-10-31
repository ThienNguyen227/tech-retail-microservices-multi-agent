'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  BatteryCharging,
  Camera,
  Check,
  ChevronDown,
  Cpu,
  Laptop,
  MemoryStick,
  Monitor,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  RotateCcw,
  Cable,
} from 'lucide-react';

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
    cpu?: string;
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

type DetailSectionProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
};

type ColorOption = {
  color: string;
  colorSlug: string;
};

function normalizeList(value: StringList): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

function DetailSection({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
}: DetailSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
        open
          ? 'border-teal-200 shadow-md shadow-teal-900/5'
          : 'border-slate-200 shadow-sm hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-teal-50/70 sm:px-5"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800 transition-colors group-hover:bg-teal-200">
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-800">
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {subtitle}
          </span>
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180 text-teal-700' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 sm:px-5">
            {children}
          </div>
        </div>
      </div>
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

  const displayValue =
    typeof value === 'boolean' ? (value ? 'Có' : 'Không') : value;

  return (
    <div className="grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.2fr)] gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm leading-6 text-slate-500">{label}</span>
      <span className="break-words text-right text-sm font-medium leading-6 text-slate-800">
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

  if (!items.length) {
    return null;
  }

  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="mb-2 text-sm text-slate-500">{label}</p>

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs leading-5 text-teal-800 transition-colors hover:border-teal-200 hover:bg-teal-100"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TabletProductDetail({
  product,
  selectedSlug,
}: TabletProductDetailProps) {
  const router = useRouter();

  const initialVariant =
    product.variants.find((variant) => variant.slug === selectedSlug) ??
    product.variants[0];

  const [selectedStorage, setSelectedStorage] = useState(
    initialVariant?.storage ?? '',
  );
  const [selectedColorSlug, setSelectedColorSlug] = useState(
    initialVariant?.colorSlug ?? '',
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    setSelectedStorage(initialVariant?.storage ?? '');
    setSelectedColorSlug(initialVariant?.colorSlug ?? '');
    setSelectedImageIndex(0);
  }, [initialVariant]);

  const storageOptions = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.storage))],
    [product.variants],
  );

  const colorOptions = useMemo<ColorOption[]>(() => {
    const colors = new Map<string, ColorOption>();

    product.variants.forEach((variant) => {
      if (!colors.has(variant.colorSlug)) {
        colors.set(variant.colorSlug, {
          color: variant.color,
          colorSlug: variant.colorSlug,
        });
      }
    });

    return [...colors.values()];
  }, [product.variants]);

  const selectedVariant =
    product.variants.find(
      (variant) =>
        variant.storage === selectedStorage &&
        variant.colorSlug === selectedColorSlug,
    ) ?? initialVariant;

  const currentImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : [product.image];

  const currentImage =
    currentImages[selectedImageIndex] ?? currentImages[0] ?? product.image;

  const screenTechnology =
    product.screen?.screenTechnology ?? product.screenTech;

  const screenSize = product.screen?.screenSize ?? product.screenSize;

  function changeVariant(variant: TabletVariant) {
    setSelectedStorage(variant.storage);
    setSelectedColorSlug(variant.colorSlug);
    setSelectedImageIndex(0);

    if (variant.slug !== selectedSlug) {
      router.push(`/customer/product-detail/${variant.slug}`);
    }
  }

  function handleStorageChange(storage: string) {
    const variant = product.variants.find(
      (item) =>
        item.storage === storage && item.colorSlug === selectedColorSlug,
    );

    if (variant) {
      changeVariant(variant);
    }
  }

  function handleColorChange(colorSlug: string) {
    const variant = product.variants.find(
      (item) =>
        item.storage === selectedStorage && item.colorSlug === colorSlug,
    );

    if (variant) {
      changeVariant(variant);
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant || isAddingToCart) {
      return;
    }

    const userId = sessionStorage.getItem('userId');

    if (!userId) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      router.push('/customer/login');
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartUrl = 'http://localhost:3004/api/v1/carts';
      const cartResponse = await fetch(
        `${cartUrl}?userId=${encodeURIComponent(userId)}`,
      );

      if (!cartResponse.ok) {
        throw new Error('Không thể kiểm tra giỏ hàng.');
      }

      const cartData = await cartResponse.json();
      const cart = cartData.cart ?? cartData;
      const existingItems = Array.isArray(cart.items) ? cart.items : [];
      const existingItem = existingItems.find(
        (item: { sku?: string }) => item.sku === selectedVariant.sku,
      );

      const response = await fetch(`${cartUrl}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          item: {
            productId: product._id,
            sku: selectedVariant.sku,
            variantSlug: selectedVariant.slug,
            productName: `${product.name} ${selectedVariant.storage} ${selectedVariant.color}`,
            imageUrl: selectedVariant.images?.[0] ?? product.image,
            quantity: 1,
            price: selectedVariant.price,
          },
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || 'Không thể thêm sản phẩm vào giỏ hàng.',
        );
      }

      alert(
        existingItem
          ? 'Đã cập nhật sản phẩm trong giỏ hàng!'
          : 'Đã thêm sản phẩm vào giỏ hàng!',
      );

      window.dispatchEvent(new Event('cart-updated'));
    } catch (error) {
      console.error('Add to cart error:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng.',
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  if (!product.variants?.length || !selectedVariant) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-center text-slate-500">
          Sản phẩm hiện chưa có phiên bản để hiển thị.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="transition-colors hover:text-teal-700"
          >
            Trang chủ
          </button>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() =>
              router.push('/customer/products?category=tablet')
            }
            className="transition-colors hover:text-teal-700"
          >
            Máy tính bảng
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">{product.name}</span>
        </nav>

        <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {product.name}
        </h1>

        <div className="mb-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="group h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl sm:p-5">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-white to-cyan-50">
                <img
                  src={`/product/tablet/${currentImage}`}
                  alt={`${product.name} ${selectedVariant.color}`}
                  onError={(event) => {
                    const image = event.currentTarget;

                    if (image.dataset.fallbackApplied === 'true') return;

                    image.dataset.fallbackApplied = 'true';
                    image.src = `/product/tablet/${product.image}`;
                  }}
                  className="h-full w-full object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-105 sm:p-8"
                />
              </div>

              {currentImages.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {currentImages.map((image, index) => {
                    const isSelected = index === selectedImageIndex;

                    return (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`Xem ảnh ${index + 1}`}
                        aria-pressed={isSelected}
                        className={`aspect-square overflow-hidden rounded-xl border-2 bg-slate-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 ring-2 ring-teal-600/15'
                            : 'border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <img
                          src={`/product/tablet/${image}`}
                          alt={`${product.name} ${index + 1}`}
                          className="h-full w-full object-contain p-2"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-teal-200 hover:shadow-xl sm:p-7">
              <div className="border-b border-slate-100 pb-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    Máy tính bảng
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Sparkles size={13} />
                    Sản phẩm nổi bật
                  </span>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {product.name}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedVariant.storage} · {selectedVariant.color}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Màn hình: {screenSize ?? 'Đang cập nhật'}</span>
                  <span>
                    Công nghệ: {screenTechnology ?? 'Đang cập nhật'}
                  </span>
                </div>
              </div>

              <div className="my-5 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Giá bán
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-teal-800">
                  {formatPrice(selectedVariant.price)}
                </p>
              </div>

              <div className="border-b border-slate-100 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Bộ nhớ
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Đang chọn: {selectedStorage}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {storageOptions.map((storage) => {
                    const isSelected = storage === selectedStorage;
                    const available = product.variants.some(
                      (variant) =>
                        variant.storage === storage &&
                        variant.colorSlug === selectedColorSlug,
                    );

                    return (
                      <button
                        key={storage}
                        type="button"
                        disabled={!available}
                        onClick={() => handleStorageChange(storage)}
                        aria-pressed={isSelected}
                        className={`relative rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                            : available
                              ? 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        }`}
                      >
                        {storage}
                        {isSelected && (
                          <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-teal-600 text-white shadow-sm">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-b border-slate-100 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Màu sắc
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Đang chọn: {selectedVariant.color}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {colorOptions.map(({ colorSlug, color }) => {
                    const isSelected = colorSlug === selectedColorSlug;
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
                        onClick={() => handleColorChange(colorSlug)}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-200 hover:-translate-y-0.5 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                            : available
                              ? 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        }`}
                      >
                        <span className="text-sm font-medium">{color}</span>
                        {isSelected && (
                          <Check size={15} className="text-teal-700" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs text-slate-400">Mã sản phẩm</span>
                <span className="text-xs font-semibold text-slate-700">
                  {selectedVariant.sku}
                </span>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-teal-700 text-sm font-semibold text-teal-800 transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingCart size={19} />
                  {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck size={17} className="shrink-0 text-teal-700" />
                  Bảo hành chính hãng
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Truck size={17} className="shrink-0 text-teal-700" />
                  Giao hàng toàn quốc
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <RotateCcw size={17} className="shrink-0 text-teal-700" />
                  Hỗ trợ đổi trả
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Thông số kỹ thuật
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Thông tin cấu hình và tính năng chi tiết của máy tính bảng
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailSection
              title="Màn hình"
              subtitle="Kích thước và công nghệ hiển thị"
              defaultOpen
              icon={<Monitor size={18} />}
            >
              <InfoRow label="Công nghệ màn hình" value={screenTechnology} />
              <InfoRow label="Kích thước màn hình" value={screenSize} />
            </DetailSection>

            <DetailSection
              title="Hệ điều hành và CPU"
              subtitle="Nền tảng xử lý và đồ họa"
              icon={<Cpu size={18} />}
            >
              <InfoRow
                label="Hệ điều hành"
                value={product.operatingSystemAndCpu?.operatingSystem}
              />
              <InfoRow label="CPU" value={product.operatingSystemAndCpu?.cpu} />
              <InfoRow
                label="Tốc độ CPU"
                value={product.operatingSystemAndCpu?.cpuSpeed}
              />
              <InfoRow label="GPU" value={product.operatingSystemAndCpu?.gpu} />
            </DetailSection>

            <DetailSection
              title="Bộ nhớ và lưu trữ"
              subtitle="Dung lượng và khả năng mở rộng"
              icon={<MemoryStick size={18} />}
            >
              <InfoRow
                label="RAM"
                value={product.memoryAndStorage?.randomAccessMemory}
              />
              <InfoRow label="Bộ nhớ trong" value={selectedVariant.storage} />
              <InfoRow
                label="Dung lượng khả dụng"
                value={product.memoryAndStorage?.usableStorage}
              />
              <InfoRow
                label="Thẻ nhớ ngoài"
                value={product.memoryAndStorage?.externalMemoryCard}
              />
            </DetailSection>

            <DetailSection
              title="Camera sau"
              subtitle="Chụp ảnh và quay video"
              icon={<Camera size={18} />}
            >
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
              <InfoRow label="Đèn flash" value={product.rearCamera?.rearFlash} />
            </DetailSection>

            <DetailSection
              title="Camera trước"
              subtitle="Camera selfie và gọi video"
              icon={<Camera size={18} />}
            >
              <InfoRow
                label="Độ phân giải"
                value={product.frontCamera?.frontCameraResolution}
              />
              <InfoList
                label="Tính năng camera"
                value={product.frontCamera?.frontCameraFeatures}
              />
            </DetailSection>

            <DetailSection
              title="Pin và sạc"
              subtitle="Dung lượng pin và công nghệ sạc"
              icon={<BatteryCharging size={18} />}
            >
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

            <DetailSection
              title="Kết nối"
              subtitle="Mạng di động và cổng giao tiếp"
              icon={<Cable size={18} />}
            >
              <InfoRow
                label="Mạng di động"
                value={product.connectivity?.mobileNetwork}
              />
              <InfoRow label="Loại SIM" value={product.connectivity?.simType} />
              <InfoRow
                label="Hỗ trợ nghe gọi"
                value={product.connectivity?.voiceCallSupport}
              />
              <InfoList label="Wi-Fi" value={product.connectivity?.wifi} />
              <InfoList label="Định vị GPS" value={product.connectivity?.gps} />
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

            <DetailSection
              title="Tiện ích"
              subtitle="Tính năng bổ sung"
              icon={<Laptop size={18} />}
            >
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
              <InfoRow label="Radio" value={product.utilities?.radio} />
            </DetailSection>

            <DetailSection
              title="Thiết kế và chất liệu"
              subtitle="Kích thước, khối lượng và thời điểm ra mắt"
              icon={<Laptop size={18} />}
            >
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
        </section>
      </div>
    </main>
  );
}