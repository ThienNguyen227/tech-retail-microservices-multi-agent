'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Check,
  ShoppingCart,
  Zap,
} from 'lucide-react';

type LaptopVariant = {
  sku: string;
  slug: string;
  ram: string;
  ssd: string;
  color: string;
  colorSlug: string;
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

function DetailSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-semibold text-gray-800 hover:bg-gray-50"
      >
        <span>{title}</span>

        <ChevronDown
          size={20}
          className={`shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-4 py-3">
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

  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 last:border-b-0 sm:grid-cols-[40%_60%]">
      <div className="text-sm text-gray-500">{label}</div>

      <div className="break-words text-sm font-medium text-gray-800">
        {typeof value === 'boolean' ? (value ? 'Có' : 'Không') : value}
      </div>
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
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-100 py-3 last:border-b-0">
      <div className="mb-2 text-sm text-gray-500">{label}</div>

      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatPrice(price: number) {
  return `${new Intl.NumberFormat('vi-VN').format(price)}₫`;
}

function getColorClass(colorSlug: string) {
  switch (colorSlug.toLowerCase()) {
    case 'bac':
      return 'bg-gray-300';
    case 'den':
      return 'bg-gray-900';
    case 'xam':
      return 'bg-gray-500';
    case 'trang':
      return 'bg-white';
    case 'xanh':
    case 'xanh-dam':
      return 'bg-blue-700';
    case 'vang':
      return 'bg-yellow-400';
    default:
      return 'bg-orange-400';
  }
}

export default function LaptopProductDetail({
  product,
  selectedSlug,
}: LaptopProductDetailProps) {
  const router = useRouter();

  const initialVariant = useMemo(
    () =>
      product.variants.find((variant) => variant.slug === selectedSlug) ??
      product.variants[0],
    [product.variants, selectedSlug],
  );

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

  const colorOptions = useMemo(() => {
    const uniqueColors = new Map<
      string,
      { color: string; colorSlug: string }
    >();

    product.variants.forEach((variant) => {
      if (!uniqueColors.has(variant.colorSlug)) {
        uniqueColors.set(variant.colorSlug, {
          color: variant.color,
          colorSlug: variant.colorSlug,
        });
      }
    });

    return [...uniqueColors.values()];
  }, [product.variants]);

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          variant.ram === selectedRam &&
          variant.ssd === selectedSsd &&
          variant.colorSlug === selectedColorSlug,
      ),
    [product.variants, selectedRam, selectedSsd, selectedColorSlug],
  );

  const currentImages =
    selectedVariant?.images?.length
      ? selectedVariant.images
      : [product.image];

  const currentImage =
    currentImages[selectedImageIndex] ?? currentImages[0] ?? product.image;

  const changeVariant = (variant: LaptopVariant) => {
    setSelectedRam(variant.ram);
    setSelectedSsd(variant.ssd);
    setSelectedColorSlug(variant.colorSlug);
    setSelectedImageIndex(0);

    router.push(`/customer/product-detail/${variant.slug}`);
  };

  const handleRamChange = (ram: string) => {
    const variant = product.variants.find(
      (item) =>
        item.ram === ram &&
        item.ssd === selectedSsd &&
        item.colorSlug === selectedColorSlug,
    );

    if (variant) {
      changeVariant(variant);
    }
  };

  const handleSsdChange = (ssd: string) => {
    const variant = product.variants.find(
      (item) =>
        item.ram === selectedRam &&
        item.ssd === ssd &&
        item.colorSlug === selectedColorSlug,
    );

    if (variant) {
      changeVariant(variant);
    }
  };

  const handleColorChange = (colorSlug: string) => {
    const variant = product.variants.find(
      (item) =>
        item.ram === selectedRam &&
        item.ssd === selectedSsd &&
        item.colorSlug === colorSlug,
    );

    if (variant) {
      changeVariant(variant);
    }
  };

  const handleAddToCart = async () => {
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

      const response = await fetch(
        'http://localhost:3004/api/v1/carts/add',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

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
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) {
      alert('Vui lòng chọn phiên bản sản phẩm hợp lệ.');
      return;
    }

    await handleAddToCart();
  };

  if (!product.variants || product.variants.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-center text-gray-600">
          Sản phẩm hiện chưa có phiên bản để hiển thị.
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-5 text-sm text-gray-500">
        <span>Trang chủ</span>
        <span className="mx-2">/</span>
        <span>Laptop</span>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.name}</span>
      </nav>

      {/* Product title */}
      <h1 className="mb-6 text-xl font-bold text-gray-900 sm:text-2xl">
        {product.name}
      </h1>

      {/* Product overview */}
      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        {/* Images */}
        <div className="flex flex-col lg:col-span-5">
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-gray-100 bg-white p-4">
            <img
              src={`/product/laptop/${currentImage}`}
              alt={product.name}
              className="max-h-[400px] w-full object-contain"
            />
          </div>

          {/* Image thumbnails */}
          {currentImages.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {currentImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex h-20 items-center justify-center rounded-xl border p-2 transition sm:h-24 ${
                    selectedImageIndex === index
                      ? 'border-[#168b87] ring-1 ring-[#168b87]'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={`/product/laptop/${image}`}
                    alt={`${product.name} - ảnh ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product information */}
        <div className="flex flex-col lg:col-span-7">
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            {/* RAM */}
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-gray-800">
                RAM:
                <span className="ml-1 font-normal">{selectedRam}</span>
              </p>

              <div className="flex flex-wrap gap-2">
                {ramOptions.map((ram) => {
                  const available = product.variants.some(
                    (variant) =>
                      variant.ram === ram &&
                      variant.ssd === selectedSsd &&
                      variant.colorSlug === selectedColorSlug,
                  );

                  const selected = selectedRam === ram;

                  return (
                    <button
                      key={ram}
                      type="button"
                      disabled={!available}
                      onClick={() => handleRamChange(ram)}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        selected
                          ? 'border-[#168b87] bg-[#168b87]/5 font-semibold text-[#168b87]'
                          : 'border-gray-300 text-gray-700 hover:border-[#168b87]'
                      } ${
                        !available
                          ? 'cursor-not-allowed opacity-40'
                          : ''
                      }`}
                    >
                      {selected && (
                        <Check size={14} className="mr-1 inline" />
                      )}
                      {ram}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SSD */}
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-gray-800">
                SSD:
                <span className="ml-1 font-normal">{selectedSsd}</span>
              </p>

              <div className="flex flex-wrap gap-2">
                {ssdOptions.map((ssd) => {
                  const available = product.variants.some(
                    (variant) =>
                      variant.ram === selectedRam &&
                      variant.ssd === ssd &&
                      variant.colorSlug === selectedColorSlug,
                  );

                  const selected = selectedSsd === ssd;

                  return (
                    <button
                      key={ssd}
                      type="button"
                      disabled={!available}
                      onClick={() => handleSsdChange(ssd)}
                      className={`rounded-lg border px-4 py-2 text-sm transition ${
                        selected
                          ? 'border-[#168b87] bg-[#168b87]/5 font-semibold text-[#168b87]'
                          : 'border-gray-300 text-gray-700 hover:border-[#168b87]'
                      } ${
                        !available
                          ? 'cursor-not-allowed opacity-40'
                          : ''
                      }`}
                    >
                      {selected && (
                        <Check size={14} className="mr-1 inline" />
                      )}
                      {ssd}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color */}
            <div className="mb-5">
              <p className="mb-3 text-sm font-semibold text-gray-800">
                Màu sắc:
                <span className="ml-1 font-normal">
                  {colorOptions.find(
                    (color) => color.colorSlug === selectedColorSlug,
                  )?.color ?? 'Chưa chọn'}
                </span>
              </p>

              <div className="flex flex-wrap gap-3">
                {colorOptions.map(({ color, colorSlug }) => {
                  const available = product.variants.some(
                    (variant) =>
                      variant.ram === selectedRam &&
                      variant.ssd === selectedSsd &&
                      variant.colorSlug === colorSlug,
                  );

                  const selected = selectedColorSlug === colorSlug;

                  return (
                    <button
                      key={colorSlug}
                      type="button"
                      disabled={!available}
                      onClick={() => handleColorChange(colorSlug)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        selected
                          ? 'border-[#168b87] bg-[#168b87]/5 text-[#168b87]'
                          : 'border-gray-300 text-gray-700 hover:border-[#168b87]'
                      } ${
                        !available
                          ? 'cursor-not-allowed opacity-40'
                          : ''
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full border border-gray-300 ${getColorClass(
                          colorSlug,
                        )}`}
                      />
                      {color}
                      {selected && <Check size={15} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Giá bán</p>

              <div className="mt-1 text-xl font-bold text-[#d70018] sm:text-xl">
                {selectedVariant
                  ? formatPrice(selectedVariant.price)
                  : 'Phiên bản không khả dụng'}
              </div>
            </div>

            {/* SKU */}
            <div className="mb-5 border-t border-gray-100 pt-4 text-sm">
              <span className="text-gray-500">SKU: </span>
              <span className="font-medium text-gray-800">
                {selectedVariant?.sku ?? 'Không khả dụng'}
              </span>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={!selectedVariant || isAddingToCart}
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#168b87] px-5 py-3 font-semibold text-white transition hover:bg-[#11736f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShoppingCart size={19} />
                {isAddingToCart ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
              </button>

              <button
                type="button"
                disabled={!selectedVariant || isAddingToCart}
                onClick={handleBuyNow}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#d70018] px-5 py-3 font-semibold text-white transition hover:bg-[#b50015] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap size={19} />
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <section className="mt-10">
        <h2 className="mb-5 text-xl font-bold text-gray-900 sm:text-2xl">
          Thông số kỹ thuật chi tiết
        </h2>

        <div className="grid grid-cols-1 items-start gap-4 grid-cols-1">
          {/* Processor and graphics */}
          <div className="space-y-4">
            <DetailSection title="Bộ xử lý" defaultOpen>
              <InfoRow
                label="Công nghệ CPU"
                value={product.processor?.cpuTechnology}
              />
              <InfoRow
                label="Số nhân"
                value={product.processor?.cpuCores}
              />
              <InfoRow
                label="Số luồng"
                value={product.processor?.cpuThreads}
              />
              <InfoRow
                label="Tốc độ CPU"
                value={product.processor?.cpuSpeed}
              />
              <InfoRow
                label="Card đồ họa"
                value={product.graphics?.graphicsCard}
              />
            </DetailSection>

            <DetailSection title="Đồ họa GPU">
              <InfoRow
                label="Card màn hình"
                value={product.graphics?.graphicsCard}
              />
            </DetailSection>

            <DetailSection title="Bộ nhớ RAM - Ổ cứng">
              <InfoRow
                label="RAM"
                value={product.memoryAndStorage?.ram}
              />
              <InfoRow
                label="Loại RAM"
                value={product.memoryAndStorage?.ramType}
              />
              <InfoRow
                label="Tốc độ Bus RAM"
                value={product.memoryAndStorage?.ramBusSpeed}
              />
              <InfoRow
                label="Hỗ trợ RAM tối đa"
                value={product.memoryAndStorage?.maxRamCapacity}
              />
              <InfoRow
                label="Ổ cứng"
                value={product.memoryAndStorage?.storage}
              />
            </DetailSection>

            <DetailSection title="Màn hình">
              <InfoRow
                label="Kích thước màn hình"
                value={product.display?.screenSize}
              />
              <InfoRow
                label="Độ phân giải"
                value={product.display?.resolution}
              />
              <InfoRow
                label="Tấm nền"
                value={product.display?.panelType}
              />
              <InfoRow
                label="Tần số quét"
                value={product.display?.refreshRate}
              />
              <InfoRow
                label="Độ phủ màu"
                value={product.display?.colorCoverage}
              />
              <InfoList
                label="Công nghệ màn hình"
                items={product.display?.screenTechnology}
              />
            </DetailSection>
          </div>

          {/* Connectivity, design and battery */}
          <div className="space-y-4">
            <DetailSection title="Cổng kết nối - Tính năng mở rộng">
              <InfoList
                label="Cổng giao tiếp"
                items={product.connectivityAndExpansion?.ports}
              />
              <InfoList
                label="Kết nối không dây"
                items={product.connectivityAndExpansion?.wirelessConnectivity}
              />
              <InfoRow
                label="Khe đọc thẻ nhớ"
                value={product.connectivityAndExpansion?.memoryCardSlot}
              />
              <InfoRow
                label="Webcam"
                value={product.connectivityAndExpansion?.webcam}
              />
              <InfoRow
                label="Đèn bàn phím"
                value={product.connectivityAndExpansion?.keyboardBacklight}
              />
              <InfoRow
                label="Bảo mật"
                value={product.connectivityAndExpansion?.security}
              />
              <InfoList
                label="Công nghệ âm thanh"
                items={product.connectivityAndExpansion?.audioTechnology}
              />
              <InfoRow
                label="Hệ thống tản nhiệt"
                value={product.connectivityAndExpansion?.cooling}
              />
            </DetailSection>

            <DetailSection title="Kích thước - Khối lượng - Pin">
              <InfoRow
                label="Pin"
                value={product.dimensionsAndBattery?.battery}
              />
              <InfoRow
                label="Hệ điều hành"
                value={product.dimensionsAndBattery?.operatingSystem}
              />
              <InfoRow
                label="Năm ra mắt"
                value={product.dimensionsAndBattery?.releaseYear}
              />
              <InfoRow
                label="Kích thước"
                value={product.dimensionsAndBattery?.dimensions}
              />
              <InfoRow
                label="Trọng lượng"
                value={product.dimensionsAndBattery?.weight}
              />
              <InfoRow
                label="Chất liệu"
                value={product.dimensionsAndBattery?.material}
              />
            </DetailSection>
          </div>
        </div>
      </section>
    </main>
  );
}
