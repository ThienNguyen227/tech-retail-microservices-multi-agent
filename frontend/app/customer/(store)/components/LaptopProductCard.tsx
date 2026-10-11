'use client';

import { promotionApi } from '@/lib/axios/promotion-api';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

// ============================
// 1. Schema Laptop Variant
// ============================
export type LaptopVariant = {
  sku: string;
  slug: string;
  ram: string;
  ssd: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

// ============================
// 2. Schema Laptop
// Không sử dụng ProductSpecifications
// ============================
export type Laptop = {
  _id: string;
  image: string;
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  ram: string;
  ssd: string;
  variants: LaptopVariant[];
};

type LaptopProductCardProps = {
  product: Laptop;
};

type PromotionDiscount = {
  promotionId: number;
  promotionName: string;
  sku: string;
  discountType: string;
  discountValue: string;
};

export default function LaptopProductCard({
  product,
}: LaptopProductCardProps) {
  // ============================
  // 3. Lấy danh sách RAM
  // ============================
  const rams = useMemo(() => {
    return [
      ...new Set(
        (product.variants ?? []).map((variant) => variant.ram),
      ),
    ];
  }, [product.variants]);

  // ============================
  // 4. Lấy danh sách SSD
  // ============================
  const ssds = useMemo(() => {
    return [
      ...new Set(
        (product.variants ?? []).map((variant) => variant.ssd),
      ),
    ];
  }, [product.variants]);

  // ============================
  // 5. Lấy danh sách màu
  // ============================
  const colors = useMemo(() => {
    const uniqueColors = new Map<string, LaptopVariant>();

    (product.variants ?? []).forEach((variant) => {
      if (!uniqueColors.has(variant.colorSlug)) {
        uniqueColors.set(variant.colorSlug, variant);
      }
    });

    return Array.from(uniqueColors.values());
  }, [product.variants]);

  // ============================
  // 6. State cấu hình đang chọn
  // ============================
  const [selectedRam, setSelectedRam] = useState(
    product.variants?.[0]?.ram ?? product.ram ?? '',
  );

  const [selectedSsd, setSelectedSsd] = useState(
    product.variants?.[0]?.ssd ?? product.ssd ?? '',
  );

  const [selectedColorSlug, setSelectedColorSlug] = useState(
    product.variants?.[0]?.colorSlug ?? '',
  );

  // ============================
  // 7. Tìm variant tương ứng
  // ============================
  const selectedVariant = useMemo(() => {
    return (
      product.variants?.find(
        (variant) =>
          variant.ram === selectedRam &&
          variant.ssd === selectedSsd &&
          variant.colorSlug === selectedColorSlug,
      ) ??
      product.variants?.find(
        (variant) =>
          variant.ram === selectedRam &&
          variant.ssd === selectedSsd,
      ) ??
      product.variants?.find(
        (variant) => variant.ram === selectedRam,
      ) ??
      product.variants?.[0]
    );
  }, [
    product.variants,
    selectedRam,
    selectedSsd,
    selectedColorSlug,
  ]);

  // ============================
  // 8. Thông tin variant hiện tại
  // ============================
  const currentPrice = selectedVariant?.price ?? 0;

  const currentSlug = selectedVariant?.slug ?? product.slug;

  const currentImage =
    selectedVariant?.images?.[0] ?? product.image;

  const currentRam = selectedVariant?.ram ?? product.ram;

  const currentSsd = selectedVariant?.ssd ?? product.ssd;

  const currentColor = selectedVariant?.color ?? '';

  // ============================
  // 9. Format giá
  // ============================
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // ============================
  // 10. Lấy khuyến mãi trực tiếp
  // ============================
  const [promotion, setPromotion] =
    useState<PromotionDiscount | null>(null);

  useEffect(() => {
    if (!selectedVariant?.sku) {
      setPromotion(null);
      return;
    }

    let cancelled = false;

    const fetchPromotion = async () => {
      try {
        const response = await promotionApi.get(
          '/api/v1/promotion/direct-discount',
          {
            params: {
              sku: selectedVariant.sku,
            },
          },
        );

        if (!cancelled) {
          setPromotion(response.data ?? null);
        }
      } catch (error) {
        console.error('Fetch laptop promotion error:', error);

        if (!cancelled) {
          setPromotion(null);
        }
      }
    };

    fetchPromotion();

    return () => {
      cancelled = true;
    };
  }, [selectedVariant?.sku]);

  const discountValue = Number(
    promotion?.discountValue ?? 0,
  );

  const finalPrice =
    promotion?.discountType === 'PERCENTAGE'
      ? currentPrice * (1 - discountValue / 100)
      : promotion?.discountType === 'FIXED_AMOUNT'
        ? Math.max(0, currentPrice - discountValue)
        : currentPrice;

  // ============================
  // 11. Giao diện sản phẩm
  // ============================
  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-lg">
      <div>
        {/* Ảnh sản phẩm */}
        <Link
          href={`/customer/product-detail/${currentSlug}`}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-50"
        >
          <img
            src={`/product/laptop/${currentImage}`}
            alt={`${product.name} ${currentRam} ${currentSsd} ${currentColor}`}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Tên sản phẩm */}
        <div className="mt-5">
          <h3 className="line-clamp-2 text-xs font-bold text-gray-900 transition-colors group-hover:text-red-600">
            {product.name}
          </h3>
        </div>

        {/* Chọn RAM */}
{rams.length > 0 && (
  <div className="mt-3 flex items-center gap-2">
    <span className="w-9 shrink-0 text-xs font-semibold text-gray-700">
      RAM :
    </span>

    <div className="flex flex-wrap gap-1.5">
      {rams.map((ram) => (
        <button
          key={ram}
          type="button"
          onClick={() => setSelectedRam(ram)}
          className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
            ram === selectedRam
              ? 'border-red-600 bg-red-50 text-red-600'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          {ram}
        </button>
      ))}
    </div>
  </div>
)}


        {/* Chọn SSD */}
{ssds.length > 0 && (
  <div className="mt-2 flex items-center gap-2">
    <span className="w-9 shrink-0 text-xs font-semibold text-gray-700">
      SSD :
    </span>

    <div className="flex flex-wrap gap-1.5">
      {ssds.map((ssd) => (
        <button
          key={ssd}
          type="button"
          onClick={() => setSelectedSsd(ssd)}
          className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
            ssd === selectedSsd
              ? 'border-red-600 bg-red-50 text-red-600'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          {ssd}
        </button>
      ))}
    </div>
  </div>
)}

        {/* Chọn màu */}
{colors.length > 0 && (
  <div className="mt-2 flex items-center gap-2">
    <span className="w-9 shrink-0 text-xs font-semibold text-gray-700">
      Màu :
    </span>

    <div className="flex flex-wrap gap-1.5">
      {colors.map((colorVariant) => (
        <button
          key={colorVariant.colorSlug}
          type="button"
          onClick={() =>
            setSelectedColorSlug(colorVariant.colorSlug)
          }
          className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
            colorVariant.colorSlug === selectedColorSlug
              ? 'border-red-600 bg-red-50 text-red-600'
              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}
        >
          {colorVariant.color}
        </button>
      ))}
    </div>
  </div>
)}

        {/* Giá và khuyến mãi */}
        <div className="mt-3">
          {promotion ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(currentPrice)}
                </span>

                <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600">
                  {promotion.discountType === 'PERCENTAGE'
                    ? `-${discountValue}%`
                    : `-${formatPrice(discountValue)}`}
                </span>
              </div>

              <span className="mt-0.5 text-xl font-extrabold text-red-600">
                {formatPrice(finalPrice)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-extrabold text-red-600">
              {currentPrice > 0
                ? formatPrice(currentPrice)
                : 'Liên hệ'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
