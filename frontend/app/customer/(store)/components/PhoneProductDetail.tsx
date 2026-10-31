'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { promotionApi } from '@/lib/axios/promotion-api';
import {
  ChevronDown,
  Check,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Cpu,
  Camera,
  BatteryCharging,
  Shield,
  Wifi,
  Smartphone,
} from 'lucide-react';

export type ProductVariant = {
  sku: string;
  slug: string;
  storage: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

export type Phone = {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  image: string;
  brandId: string;
  categoryId: string;
  screenTech?: string;
  screenSize?: string;
  variants: ProductVariant[];

  specifications?: {
    chip?: string;
    ram?: string;
    storage?: string;
    rearCamera?: string;
    frontCamera?: string;
    battery?: string;
    [key: string]: any;
  };

  performanceAndStorage?: {
    os?: string;
    cpu?: string;
    cpuSpeed?: string;
    gpu?: string;
    ram?: string;
    internalStorage?: string;
    usableStorage?: string;
    contactsStorage?: string;
  };

  cameraAndScreen?: {
    rearCameraResolution?: string;
    rearVideoRecording?: string[];
    rearFlashlight?: boolean;
    rearCameraFeatures?: string[];
    frontCameraResolution?: string;
    frontCameraFeatures?: string[];
    screenTechnology?: string;
    screenResolution?: string;
    screenSize?: string;
    refreshRate?: string;
    maxBrightness?: string;
    touchScreenGlass?: string;
  };

  batteryAndCharge?: {
    batteryLife?: string;
    batteryType?: string;
    maxChargingPower?: string;
    batteryFeatures?: string[];
  };

  utilities?: {
    advancedSecurity?: string;
    specialFeatures?: string[];
    waterResistance?: string;
    audioRecording?: string[];
    supportedVideoFormats?: string[];
    supportedAudioFormats?: string[];
  };

  connectivity?: {
    mobileNetwork?: string;
    simType?: string;
    wifi?: string[];
    gps?: string[];
    bluetooth?: string;
    connectorPort?: string;
    headphoneJack?: string;
    otherConnectivity?: string;
  };

  designAndMaterials?: {
    designType?: string;
    materials?: string;
    dimensions?: string;
    weight?: string;
    releaseDate?: string;
  };
};

type PromotionDiscount = {
  promotionId: number;
  promotionName: string;
  sku: string;
  discountType: string;
  discountValue: string;
};

type PhoneProductDetailProps = {
  product: Phone;
  selectedSlug: string;
};

type DetailSectionProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
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
  value?: string | number | boolean;
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

export default function PhoneProductDetail({
  product,
  selectedSlug,
}: PhoneProductDetailProps) {
  const router = useRouter();

  const initialVariant =
    product.variants.find((variant) => variant.slug === selectedSlug) ??
    product.variants[0];

  const [selectedStorage, setSelectedStorage] = useState(
    initialVariant?.storage ?? '',
  );
  const [selectedColor, setSelectedColor] = useState(
    initialVariant?.colorSlug ?? '',
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [promotion, setPromotion] = useState<PromotionDiscount | null>(null);

  const storages = useMemo(
    () => [...new Set(product.variants.map((variant) => variant.storage))],
    [product.variants],
  );

  const colors = useMemo(() => {
    const uniqueColors = new Map<string, { name: string; slug: string }>();

    product.variants.forEach((variant) => {
      if (!uniqueColors.has(variant.colorSlug)) {
        uniqueColors.set(variant.colorSlug, {
          name: variant.color,
          slug: variant.colorSlug,
        });
      }
    });

    return Array.from(uniqueColors.values());
  }, [product.variants]);

  const selectedVariant =
    product.variants.find(
      (variant) =>
        variant.storage === selectedStorage &&
        variant.colorSlug === selectedColor,
    ) ?? initialVariant;

  const currentPrice = selectedVariant?.price ?? 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);

  useEffect(() => {
    let cancelled = false;

    if (!selectedVariant?.sku) {
      setPromotion(null);
      return;
    }

    const fetchPromotion = async () => {
      try {
        const response = await promotionApi.get(
          '/api/v1/promotion/direct-discount',
          {
            params: { sku: selectedVariant.sku },
          },
        );

        if (!cancelled) {
          setPromotion(response.data ?? null);
        }
      } catch (error) {
        console.error('Fetch promotion error:', error);

        if (!cancelled) {
          setPromotion(null);
        }
      }
    };

    setPromotion(null);
    fetchPromotion();

    return () => {
      cancelled = true;
    };
  }, [selectedVariant?.sku]);

  const discountValue = Number(promotion?.discountValue ?? 0);

  const finalPrice =
    promotion?.discountType === 'PERCENTAGE'
      ? currentPrice * (1 - discountValue / 100)
      : promotion?.discountType === 'FIXED_AMOUNT'
        ? Math.max(0, currentPrice - discountValue)
        : currentPrice;

  const hasPromotion =
    Boolean(promotion) &&
    discountValue > 0 &&
    finalPrice < currentPrice;

  const savedAmount = Math.max(0, currentPrice - finalPrice);

  const discountLabel =
    promotion?.discountType === 'PERCENTAGE'
      ? `-${discountValue}%`
      : `-${formatPrice(discountValue)}`;

  function handleStorageChange(storage: string) {
    const variant = product.variants.find(
      (item) =>
        item.storage === storage && item.colorSlug === selectedColor,
    );

    if (!variant) return;

    setSelectedStorage(storage);
    setSelectedImageIndex(0);
    router.push(`/customer/product-detail/${variant.slug}`);
  }

  function handleColorChange(colorSlug: string) {
    const variant = product.variants.find(
      (item) =>
        item.storage === selectedStorage && item.colorSlug === colorSlug,
    );

    if (!variant) return;

    setSelectedColor(colorSlug);
    setSelectedImageIndex(0);
    router.push(`/customer/product-detail/${variant.slug}`);
  }

  async function handleAddToCart() {
    try {
      if (!selectedVariant) {
        alert('Vui lòng chọn phiên bản sản phẩm!');
        return;
      }

      const userId = sessionStorage.getItem('userId');

      if (!userId) {
        alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
        router.push('/customer/login');
        return;
      }

      setIsAddingToCart(true);

      const cartRes = await fetch(
        `http://localhost:3004/api/v1/carts?userId=${userId}`,
      );
      const cartData = await cartRes.json();

      if (!cartRes.ok) {
        throw new Error(cartData?.message || 'Không thể lấy giỏ hàng');
      }

      const image = selectedVariant.images?.[0] || product.image;

      const payload = {
        userId,
        item: {
          productId: product._id,
          sku: selectedVariant.sku,
          variantSlug: selectedVariant.slug,
          productName: `${product.name} ${selectedVariant.storage} ${selectedVariant.color}`,
          imageUrl: image,
          quantity: 1,
          price: selectedVariant.price,
        },
      };

      const res = await fetch('http://localhost:3004/api/v1/carts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          data?.message ||
          `Lỗi HTTP ${res.status}: Thêm vào giỏ hàng thất bại!`;

        throw new Error(
          Array.isArray(message) ? message.join(', ') : message,
        );
      }

      alert('Thêm vào giỏ hàng thành công!');
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: any) {
      console.error(error);
      alert(error?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng!');
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="transition-colors hover:text-teal-700">
            Trang chủ
          </span>
          <span className="text-slate-300">/</span>
          <span className="transition-colors hover:text-teal-700">
            Điện thoại
          </span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-800">{product.name}</span>
        </nav>

        <h1 className="mb-6 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {product.name}
        </h1>

        <div className="mb-12 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          {/* Hình ảnh */}
          <div className="lg:col-span-5">
            <div className="group h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl sm:p-5">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-teal-50 via-white to-cyan-50">
                {hasPromotion && (
                  <span className="absolute left-4 top-4 z-10 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                    {discountLabel}
                  </span>
                )}

                <img
                  src={
                    selectedVariant?.images?.length
                      ? `/product/phone/${selectedVariant.images[selectedImageIndex]}`
                      : `/product/phone/${product.image}`
                  }
                  alt={`${product.name} ${selectedVariant?.color ?? ''}`}
                  className="h-full w-full object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              {selectedVariant?.images?.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {selectedVariant.images.map((image, index) => {
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
                          src={`/product/phone/${image}`}
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

          {/* Thông tin sản phẩm */}
          <div className="lg:col-span-7">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-teal-200 hover:shadow-xl sm:p-7">
              <div className="border-b border-slate-100 pb-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    Điện thoại
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
                    {selectedVariant.storage} · {selectedVariant.color}
                  </p>
                )}
              </div>

              {/* Giá và khuyến mãi */}
              <div className="my-5 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Giá bán
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="text-3xl font-bold tracking-tight text-teal-800">
                    {selectedVariant
                      ? formatPrice(hasPromotion ? finalPrice : currentPrice)
                      : 'Liên hệ'}
                  </p>

                  {hasPromotion && (
                    <>
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(currentPrice)}
                      </span>
                      <span className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                        {discountLabel}
                      </span>
                    </>
                  )}
                </div>

                {hasPromotion && savedAmount > 0 && (
                  <p className="mt-2 text-sm font-medium text-rose-600">
                    Tiết kiệm {formatPrice(savedAmount)}
                  </p>
                )}

                {hasPromotion && promotion?.promotionName && (
                  <p className="mt-2 text-xs font-medium text-rose-600">
                    Khuyến mãi: {promotion.promotionName}
                  </p>
                )}
              </div>

              {/* Dung lượng */}
              <div className="border-b border-slate-100 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Dung lượng
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {storages.map((storage) => {
                    const isSelected = storage === selectedStorage;
                    const available = product.variants.some(
                      (variant) =>
                        variant.storage === storage &&
                        variant.colorSlug === selectedColor,
                    );

                    return (
                      <button
                        key={storage}
                        type="button"
                        disabled={!available}
                        onClick={() => handleStorageChange(storage)}
                        aria-pressed={isSelected}
                        className={`relative rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${
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

              {/* Màu sắc: hiển thị tên màu, không hard-code mã màu */}
              <div className="border-b border-slate-100 py-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Màu sắc
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Đang chọn: {selectedVariant?.color}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((color) => {
                    const isSelected = color.slug === selectedColor;
                    const available = product.variants.some(
                      (variant) =>
                        variant.storage === selectedStorage &&
                        variant.colorSlug === color.slug,
                    );

                    return (
                      <button
                        key={color.slug}
                        type="button"
                        disabled={!available}
                        onClick={() => handleColorChange(color.slug)}
                        aria-pressed={isSelected}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-200 hover:-translate-y-0.5 ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50 text-teal-800 shadow-sm'
                            : available
                              ? 'border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/50'
                              : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        }`}
                      >
                        <span className="text-sm font-medium">{color.name}</span>
                        {isSelected && (
                          <Check size={15} className="text-teal-700" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SKU */}
              {selectedVariant && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-xs text-slate-400">Mã sản phẩm</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedVariant.sku}
                  </span>
                </div>
              )}

              {/* Nút thao tác */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-teal-700 text-sm font-semibold text-teal-800 transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-md active:scale-[0.98] ${
                    isAddingToCart ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  <ShoppingCart size={19} />
                  {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
                </button>
              </div>

              {/* Chính sách */}
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

        {/* Thông số kỹ thuật */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Thông số kỹ thuật
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Thông tin cấu hình và tính năng chi tiết của sản phẩm
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DetailSection
              title="Cấu hình & Bộ nhớ"
              subtitle="Hệ điều hành, chip và dung lượng"
              defaultOpen
              icon={<Cpu size={18} />}
            >
              <InfoRow label="Hệ điều hành" value={product.performanceAndStorage?.os} />
              <InfoRow label="CPU" value={product.performanceAndStorage?.cpu} />
              <InfoRow label="Tốc độ CPU" value={product.performanceAndStorage?.cpuSpeed} />
              <InfoRow label="GPU" value={product.performanceAndStorage?.gpu} />
              <InfoRow label="RAM" value={product.performanceAndStorage?.ram} />
              <InfoRow label="Bộ nhớ trong" value={selectedVariant?.storage} />
              <InfoRow label="Bộ nhớ khả dụng" value={product.performanceAndStorage?.usableStorage} />
              <InfoRow label="Lưu danh bạ" value={product.performanceAndStorage?.contactsStorage} />
            </DetailSection>

            <DetailSection
              title="Camera & Màn hình"
              subtitle="Hiển thị và khả năng chụp ảnh"
              icon={<Camera size={18} />}
            >
              <InfoRow label="Camera sau" value={product.cameraAndScreen?.rearCameraResolution} />
              <InfoRow label="Camera trước" value={product.cameraAndScreen?.frontCameraResolution} />
              <InfoRow label="Công nghệ màn hình" value={product.cameraAndScreen?.screenTechnology} />
              <InfoRow label="Độ phân giải" value={product.cameraAndScreen?.screenResolution} />
              <InfoRow label="Kích thước màn hình" value={product.cameraAndScreen?.screenSize} />
              <InfoRow label="Tần số quét" value={product.cameraAndScreen?.refreshRate} />
              <InfoRow label="Độ sáng tối đa" value={product.cameraAndScreen?.maxBrightness} />
              <InfoRow label="Mặt kính" value={product.cameraAndScreen?.touchScreenGlass} />
              <InfoList label="Tính năng camera sau" items={product.cameraAndScreen?.rearCameraFeatures} />
              <InfoList label="Quay phim camera sau" items={product.cameraAndScreen?.rearVideoRecording} />
              <InfoList label="Tính năng camera trước" items={product.cameraAndScreen?.frontCameraFeatures} />
            </DetailSection>

            <DetailSection
              title="Pin & Sạc"
              subtitle="Dung lượng pin và công nghệ sạc"
              icon={<BatteryCharging size={18} />}
            >
              <InfoRow label="Dung lượng pin" value={product.batteryAndCharge?.batteryLife} />
              <InfoRow label="Loại pin" value={product.batteryAndCharge?.batteryType} />
              <InfoRow label="Công suất sạc tối đa" value={product.batteryAndCharge?.maxChargingPower} />
              <InfoList label="Công nghệ pin" items={product.batteryAndCharge?.batteryFeatures} />
            </DetailSection>

            <DetailSection
              title="Tiện ích"
              subtitle="Bảo mật và tính năng bổ sung"
              icon={<Shield size={18} />}
            >
              <InfoRow label="Bảo mật nâng cao" value={product.utilities?.advancedSecurity} />
              <InfoRow label="Chống nước" value={product.utilities?.waterResistance} />
              <InfoList label="Tính năng đặc biệt" items={product.utilities?.specialFeatures} />
              <InfoList label="Ghi âm" items={product.utilities?.audioRecording} />
              <InfoList label="Định dạng video" items={product.utilities?.supportedVideoFormats} />
              <InfoList label="Định dạng âm thanh" items={product.utilities?.supportedAudioFormats} />
            </DetailSection>

            <DetailSection
              title="Kết nối"
              subtitle="Mạng di động và cổng kết nối"
              icon={<Wifi size={18} />}
            >
              <InfoRow label="Mạng di động" value={product.connectivity?.mobileNetwork} />
              <InfoRow label="SIM" value={product.connectivity?.simType} />
              <InfoRow label="Bluetooth" value={product.connectivity?.bluetooth} />
              <InfoRow label="Cổng kết nối" value={product.connectivity?.connectorPort} />
              <InfoRow label="Jack tai nghe" value={product.connectivity?.headphoneJack} />
              <InfoRow label="Kết nối khác" value={product.connectivity?.otherConnectivity} />
              <InfoList label="Wi-Fi" items={product.connectivity?.wifi} />
              <InfoList label="GPS" items={product.connectivity?.gps} />
            </DetailSection>

            <DetailSection
              title="Thiết kế & Chất liệu"
              subtitle="Ngoại hình và thông tin sản phẩm"
              icon={<Smartphone size={18} />}
            >
              <InfoRow label="Kiểu thiết kế" value={product.designAndMaterials?.designType} />
              <InfoRow label="Chất liệu" value={product.designAndMaterials?.materials} />
              <InfoRow label="Kích thước" value={product.designAndMaterials?.dimensions} />
              <InfoRow label="Trọng lượng" value={product.designAndMaterials?.weight} />
              <InfoRow label="Ngày ra mắt" value={product.designAndMaterials?.releaseDate} />
            </DetailSection>
          </div>
        </section>
      </div>
    </main>
  );
}