'use client';

import { promotionApi } from '@/lib/axios/promotion-api';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export type TabletVariant = {
  sku: string;
  slug: string;
  storage: string;
  color: string;
  colorSlug: string;
  price: number;
  images: string[];
};

export type Tablet = {
  _id: string;
  name: string;
  slug: string;
  image: string;
  brandId: string;
  categoryId: string;
  screenTech?: string;
  screenSize?: string;
  variants: TabletVariant[];
};

type PromotionDiscount = {
  promotionId: number;
  promotionName: string;
  sku: string;
  discountType: string;
  discountValue: string;
};

type TabletProductCardProps = {
  product: Tablet;
};

export default function TabletProductCard({product}: TabletProductCardProps) {
  // 1. Danh sách dung lượng
  const storages = useMemo(() => {
    return [
      ...new Set(
        (product.variants ?? []).map((variant) => variant.storage),
      ),
    ];
  }, [product.variants]);

  // 2. Danh sách màu
  const colors = useMemo(() => {
    const uniqueColors = new Map<string, TabletVariant>();

    (product.variants ?? []).forEach((variant) => {
      if (!uniqueColors.has(variant.colorSlug)) {
        uniqueColors.set(variant.colorSlug, variant);
      }
    });

    return Array.from(uniqueColors.values());
  }, [product.variants]);

  // 3. Phiên bản đang chọn
  const [selectedStorage, setSelectedStorage] = useState(
    storages[0] ?? '',
  );

  const [selectedColorSlug, setSelectedColorSlug] = useState(
    colors[0]?.colorSlug ?? '',
  );

  // Đồng bộ lựa chọn nếu dữ liệu sản phẩm thay đổi
  useEffect(() => {
    setSelectedStorage(storages[0] ?? '');
    setSelectedColorSlug(colors[0]?.colorSlug ?? '');
  }, [storages, colors]);

  // 4. Tìm variant tương ứng
  const selectedVariant = useMemo(() => {
    return (
      product.variants.find(
        (variant) =>
          variant.storage === selectedStorage &&
          variant.colorSlug === selectedColorSlug,
      ) ?? product.variants[0]
    );
  }, [product.variants, selectedStorage, selectedColorSlug]);

  // 5. Thông tin phiên bản
  const currentPrice = selectedVariant?.price ?? 0;
  const currentSlug = selectedVariant?.slug ?? product.slug;
  const currentImage = selectedVariant?.images?.[0] ?? product.image;
  const currentStorage = selectedVariant?.storage ?? '';
  const currentColor = selectedVariant?.color ?? '';

  // 6. Định dạng giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // 7. Lấy khuyến mãi theo SKU
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
        console.error('Fetch tablet promotion error:', error);

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

  // 8. Tính giá sau giảm
  const discountValue = Number(promotion?.discountValue ?? 0);

  const finalPrice =
    promotion?.discountType === 'PERCENTAGE'
      ? currentPrice * (1 - discountValue / 100)
      : promotion?.discountType === 'FIXED_AMOUNT'
        ? Math.max(0, currentPrice - discountValue)
        : currentPrice;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-lg">
      <div>
        {/* 1. Ảnh sản phẩm */}
        <Link
          href={`/customer/product-detail/${currentSlug}`}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-50"
        >
          <img
            src={`/product/tablet/${currentImage}`}
            alt={`${product.name} ${currentStorage} ${currentColor}`}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* 2. Tên sản phẩm */}
        <div className="mt-5">
          <h3 className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-red-600">
            {product.name} {currentStorage}
          </h3>
        </div>

        {/* 3. Màn hình */}
        {(product.screenTech || product.screenSize) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {product.screenTech && (
              <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                {product.screenTech}
              </span>
            )}

            {product.screenSize && (
              <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                {product.screenSize}
              </span>
            )}
          </div>
        )}

        {/* 4. Dung lượng */}
        {storages.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold text-gray-700">
              Dung lượng
            </p>

            <div className="flex flex-wrap gap-1.5">
              {storages.map((storage) => {
                const isSelected = storage === selectedStorage;

                return (
                  <button
                    key={storage}
                    type="button"
                    onClick={() => setSelectedStorage(storage)}
                    className={`rounded-md border px-2 py-1 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {storage}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Màu sắc */}
        {colors.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold text-gray-700">
              Màu: {currentColor}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {colors.map((colorVariant) => {
                const isSelected =
                  colorVariant.colorSlug === selectedColorSlug;

                return (
                  <button
                    key={colorVariant.colorSlug}
                    type="button"
                    onClick={() =>
                      setSelectedColorSlug(colorVariant.colorSlug)
                    }
                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {colorVariant.color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Giá */}
        <div className="mt-3">
          {promotion && discountValue > 0 ? (
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
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
