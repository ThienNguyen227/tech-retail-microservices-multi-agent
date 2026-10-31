'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Check,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Cpu,
  Monitor,
  MemoryStick,
  Cable,
  BatteryCharging,
  Laptop,
} from 'lucide-react';

type LaptopVariant = {
  sku: string;
  slug: string;
  ram: string;
  ssd: string;
  color: string;
  colorSlug: string;
  colorHex?: string;
  price: number;
  images: string[];
};

type Laptop = {
  _id: string;
  id?: string;
  image: string;
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  ram: string;
  ssd: string;
  variants: LaptopVariant[];
  processor?: {
    cpuTechnology?: string;
    cpuCores?: number;
    cpuThreads?: number;
    cpuSpeed?: string;
  };
  graphics?: {
    graphicsCard?: string;
  };
  memoryAndStorage?: {
    ram?: string;
    ramType?: string;
    ramBusSpeed?: string;
    maxRamCapacity?: string;
    storage?: string;
  };
  display?: {
    screenSize?: string;
    resolution?: string;
    panelType?: string;
    refreshRate?: string;
    colorCoverage?: string;
    screenTechnology?: string[];
  };
  connectivityAndExpansion?: {
    ports?: string[];
    wirelessConnectivity?: string[];
    memoryCardSlot?: string;
    webcam?: string;
    keyboardBacklight?: string;
    security?: string;
    audioTechnology?: string[];
    cooling?: string;
  };
  dimensionsAndBattery?: {
    battery?: string;
    operatingSystem?: string;
    releaseYear?: number;
    dimensions?: string;
    weight?: string;
    material?: string;
  };
};

type LaptopProductDetailProps = {
  product: Laptop;
  selectedSlug?: string;
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
  colorHex?: string;
};

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
  if (value === undefined || value === null || value === '') return null;

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
  items,
}: {
  label: string;
  items?: string[];
}) {
  if (!items?.length) return null;

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

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export default function LaptopProductDetail({
  product,
  selectedSlug,
}: LaptopProductDetailProps) {
  const router = useRouter();

  const initialVariant =
    product.variants.find((variant) => variant.slug === selectedSlug) ??
    product.variants[0];

  const [selectedRam, setSelectedRam] = useState(
    initialVariant?.ram ?? product.ram,
  );
  const [selectedSsd, setSelectedSsd] = useState(
    initialVariant?.ssd ?? product.ssd,
  );
  const [selectedColorSlug, setSelectedColorSlug] = useState(
    initialVariant?.colorSlug ?? '',
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const ramOptions = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.ram))],
    [product.variants],
  );

  const ssdOptions = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.ssd))],
    [product.variants],
  );

  const colorOptions = useMemo<ColorOption[]>(() => {
    const colors = new Map<string, ColorOption>();

    product.variants.forEach((variant) => {
      if (!colors.has(variant.colorSlug)) {
        colors.set(variant.colorSlug, {
          color: variant.color,
          colorSlug: variant.colorSlug,
          colorHex: variant.colorHex,
        });
      }
    });

    return [...colors.values()];
  }, [product.variants]);

  const selectedVariant =
    product.variants.find(
      (variant) =>
        variant.ram === selectedRam &&
        variant.ssd === selectedSsd &&
        variant.colorSlug === selectedColorSlug,
    ) ?? initialVariant;

  const currentImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : [product.image];

  const currentImage =
    currentImages[selectedImageIndex] ?? currentImages[0] ?? product.image;

  function changeVariant(variant: LaptopVariant) {
    setSelectedRam(variant.ram);
    setSelectedSsd(variant.ssd);
    setSelectedColorSlug(variant.colorSlug);
    setSelectedImageIndex(0);
    router.push(`/customer/product-detail/${variant.slug}`);
  }

  function handleRamChange(ram: string) {
    const variant = product.variants.find(
      (item) =>
        item.ram === ram &&
        item.ssd === selectedSsd &&
        item.colorSlug === selectedColorSlug,
    );

    if (variant) changeVariant(variant);
  }

  function handleSsdChange(ssd: string) {
    const variant = product.variants.find(
      (item) =>
        item.ram === selectedRam &&
        item.ssd === ssd &&
        item.colorSlug === selectedColorSlug,
    );

    if (variant) changeVariant(variant);
  }

  function handleColorChange(colorSlug: string) {
    const variant = product.variants.find(
      (item) =>
        item.ram === selectedRam &&
        item.ssd === selectedSsd &&
        item.colorSlug === colorSlug,
    );

    if (variant) changeVariant(variant);
  }

  async function handleAddToCart() {
    if (!selectedVariant) {
      alert('Phiên bản sản phẩm này hiện không khả dụng.');
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
      const cartResponse = await fetch(
        `http://localhost:3004/api/v1/carts?userId=${encodeURIComponent(userId)}`,
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

      const payload = {
        userId,
        item: {
          productId: product._id,
          sku: selectedVariant.sku,
          variantSlug: selectedVariant.slug,
          productName: `${product.name} ${selectedVariant.ram} ${selectedVariant.ssd} ${selectedVariant.color}`,
          imageUrl: selectedVariant.images?.[0] ?? product.image,
          quantity: 1,
          price: selectedVariant.price,
        },
      };

      const response = await fetch('http://localhost:3004/api/v1/carts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  if (!product.variants?.length) {
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
          <span className="transition-colors hover:text-teal-700">
            Trang chủ
          </span>
          <span className="text-slate-300">/</span>
          <span className="transition-colors hover:text-teal-700">Laptop</span>
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
                  src={`/product/laptop/${currentImage}`}
                  alt={`${product.name} ${selectedVariant?.color ?? ''}`}
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
                          src={`/product/laptop/${image}`}
                          alt={`${product.name} ${index + 1}`}
                          className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-110"
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
                    Laptop
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Sparkles size={13} />
                    Sản phẩm nổi bật
                  </span>
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {product.name}
                </h2>

                {selectedVariant && (
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedVariant.ram} · {selectedVariant.ssd} ·{' '}
                    {selectedVariant.color}
                  </p>
                )}
              </div>

              <div className="my-5 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Giá bán
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-teal-800">
                  {selectedVariant
                    ? formatPrice(selectedVariant.price)
                    : 'Liên hệ'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 border-b border-slate-100 py-5 sm:grid-cols-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800">RAM</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Đang chọn: {selectedRam}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ramOptions.map((ram) => {
                      const isSelected = ram === selectedRam;
                      const available = product.variants.some(
                        (variant) =>
                          variant.ram === ram &&
                          variant.ssd === selectedSsd &&
                          variant.colorSlug === selectedColorSlug,
                      );

                      return (
                        <button
                          key={ram}
                          type="button"
                          disabled={!available}
                          onClick={() => handleRamChange(ram)}
                          aria-pressed={isSelected}
                          className={`relative rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                              : available
                                ? 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50'
                                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                          }`}
                        >
                          {ram}
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

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Ổ cứng SSD
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Đang chọn: {selectedSsd}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ssdOptions.map((ssd) => {
                      const isSelected = ssd === selectedSsd;
                      const available = product.variants.some(
                        (variant) =>
                          variant.ram === selectedRam &&
                          variant.ssd === ssd &&
                          variant.colorSlug === selectedColorSlug,
                      );

                      return (
                        <button
                          key={ssd}
                          type="button"
                          disabled={!available}
                          onClick={() => handleSsdChange(ssd)}
                          aria-pressed={isSelected}
                          className={`relative rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
                            isSelected
                              ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                              : available
                                ? 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50'
                                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                          }`}
                        >
                          {ssd}
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
              </div>

              {/* Màu sắc: bỏ vòng tròn màu, chỉ hiển thị tên màu */}
              <div className="border-b border-slate-100 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Màu sắc
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Đang chọn:{' '}
                  {colorOptions.find(
                    (color) => color.colorSlug === selectedColorSlug,
                  )?.color ?? 'Chưa chọn'}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {colorOptions.map(({ color, colorSlug }) => {
                    const isSelected = colorSlug === selectedColorSlug;
                    const available = product.variants.some(
                      (variant) =>
                        variant.ram === selectedRam &&
                        variant.ssd === selectedSsd &&
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

              {selectedVariant && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs text-slate-400">Mã sản phẩm</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedVariant.sku}
                  </span>
                </div>
              )}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || isAddingToCart}
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
              Thông tin cấu hình và tính năng chi tiết của laptop
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailSection
              title="Bộ xử lý"
              subtitle="Thông tin CPU và hiệu năng"
              defaultOpen
              icon={<Cpu size={18} />}
            >
              <InfoRow label="Công nghệ CPU" value={product.processor?.cpuTechnology} />
              <InfoRow label="Số nhân" value={product.processor?.cpuCores} />
              <InfoRow label="Số luồng" value={product.processor?.cpuThreads} />
              <InfoRow label="Tốc độ CPU" value={product.processor?.cpuSpeed} />
            </DetailSection>

            <DetailSection
              title="Đồ họa GPU"
              subtitle="Card đồ họa tích hợp hoặc rời"
              icon={<Monitor size={18} />}
            >
              <InfoRow label="Card màn hình" value={product.graphics?.graphicsCard} />
            </DetailSection>

            <DetailSection
              title="Bộ nhớ RAM - Ổ cứng"
              subtitle="Dung lượng và khả năng nâng cấp"
              icon={<MemoryStick size={18} />}
            >
              <InfoRow label="RAM" value={product.memoryAndStorage?.ram} />
              <InfoRow label="Loại RAM" value={product.memoryAndStorage?.ramType} />
              <InfoRow label="Tốc độ Bus RAM" value={product.memoryAndStorage?.ramBusSpeed} />
              <InfoRow label="Hỗ trợ RAM tối đa" value={product.memoryAndStorage?.maxRamCapacity} />
              <InfoRow label="Ổ cứng" value={product.memoryAndStorage?.storage} />
            </DetailSection>

            <DetailSection
              title="Màn hình"
              subtitle="Kích thước, độ phân giải và hiển thị"
              icon={<Laptop size={18} />}
            >
              <InfoRow label="Kích thước màn hình" value={product.display?.screenSize} />
              <InfoRow label="Độ phân giải" value={product.display?.resolution} />
              <InfoRow label="Tấm nền" value={product.display?.panelType} />
              <InfoRow label="Tần số quét" value={product.display?.refreshRate} />
              <InfoRow label="Độ phủ màu" value={product.display?.colorCoverage} />
              <InfoList label="Công nghệ màn hình" items={product.display?.screenTechnology} />
            </DetailSection>

            <DetailSection
              title="Cổng kết nối - Tính năng mở rộng"
              subtitle="Cổng giao tiếp và tiện ích"
              icon={<Cable size={18} />}
            >
              <InfoList label="Cổng giao tiếp" items={product.connectivityAndExpansion?.ports} />
              <InfoList
                label="Kết nối không dây"
                items={product.connectivityAndExpansion?.wirelessConnectivity}
              />
              <InfoRow
                label="Khe đọc thẻ nhớ"
                value={product.connectivityAndExpansion?.memoryCardSlot}
              />
              <InfoRow label="Webcam" value={product.connectivityAndExpansion?.webcam} />
              <InfoRow
                label="Đèn bàn phím"
                value={product.connectivityAndExpansion?.keyboardBacklight}
              />
              <InfoRow label="Bảo mật" value={product.connectivityAndExpansion?.security} />
              <InfoList
                label="Công nghệ âm thanh"
                items={product.connectivityAndExpansion?.audioTechnology}
              />
              <InfoRow
                label="Hệ thống tản nhiệt"
                value={product.connectivityAndExpansion?.cooling}
              />
            </DetailSection>

            <DetailSection
              title="Kích thước - Khối lượng - Pin"
              subtitle="Thiết kế, pin và hệ điều hành"
              icon={<BatteryCharging size={18} />}
            >
              <InfoRow label="Pin" value={product.dimensionsAndBattery?.battery} />
              <InfoRow
                label="Hệ điều hành"
                value={product.dimensionsAndBattery?.operatingSystem}
              />
              <InfoRow
                label="Năm ra mắt"
                value={product.dimensionsAndBattery?.releaseYear}
              />
              <InfoRow label="Kích thước" value={product.dimensionsAndBattery?.dimensions} />
              <InfoRow label="Trọng lượng" value={product.dimensionsAndBattery?.weight} />
              <InfoRow label="Chất liệu" value={product.dimensionsAndBattery?.material} />
            </DetailSection>
          </div>
        </section>
      </div>
    </main>
  );
}