'use client';

import { promotionApi } from '@/lib/axios/promotion-api';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

export type ProductSpecifications = {
  chip?: string;
  ram?: string;
  storage?: string;
  rearCamera?: string;
  frontCamera?: string;
  battery?: string;
  [key: string]: any;
};

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
  specifications?: ProductSpecifications;
};

type PhoneProductCardProps = {
  product: Phone;
};

export default function PhoneProductCard({
  product,
}: PhoneProductCardProps) {
  /*
   * ============================
   * 1. Lấy danh sách dung lượng
   * ============================
  */
  const storages = useMemo(() => {
    return [
      ...new Set(
        (product.variants ?? []).map((variant) => variant.storage),
      ),
    ];
  }, [product.variants]);

  /*
   * ============================
   * 2. Lấy danh sách màu
   * ============================
  */
  const colors = useMemo(() => {
    const uniqueColors = new Map<string, ProductVariant>();

    (product.variants ?? []).forEach((variant) => {
      if (!uniqueColors.has(variant.colorSlug)) {
        uniqueColors.set(variant.colorSlug, variant);
      }
    });

    return Array.from(uniqueColors.values());
  }, [product.variants]);

  /*
   * ============================
   * 3. State đang chọn
   * ============================
  */
  const [selectedStorage, setSelectedStorage] = useState(storages[0] ?? '');

  const [selectedColorSlug, setSelectedColorSlug] = useState(colors[0]?.colorSlug ?? '');

  /*
   * ============================
   * 4. Tìm variant tương ứng
   * ============================
  */

  const selectedVariant = useMemo(() => {
    return (
      product.variants.find(
        (variant) =>
          variant.storage === selectedStorage &&
          variant.colorSlug === selectedColorSlug,
      ) ?? product.variants[0]
    );
  }, [
    product.variants,
    selectedStorage,
    selectedColorSlug,
  ]);

  /*
   * ============================
   * 5. Thông tin hiện tại
   * ============================
  */
  const currentPrice = selectedVariant?.price ?? 0;

  const currentSlug =
    selectedVariant?.slug ?? product.slug;

  const currentImage =
    selectedVariant?.images?.[0] ?? product.image;

  const currentStorage =
    selectedVariant?.storage ?? '';

  const currentColor =
    selectedVariant?.color ?? '';

  /*
   * ============================
   * 6. Format giá
   * ============================
  */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  //  {#b32,49}
  /*
   * ============================
   * 7. Giảm giá trực tiếp
   * ============================
  */
  const [promotion, setPromotion] = useState<PromotionDiscount | null>(null);

  type PromotionDiscount = {
    promotionId: number;
    promotionName: string;
    sku: string;
    discountType: string;
    discountValue: string;
  };

  useEffect(() => {
    if (!selectedVariant?.sku) {
      setPromotion(null);
      return;
    }

    const fetchPromotion = async () => {
      try {
        const response = await promotionApi.get('/api/v1/promotion/direct-discount',
          {
            params: {
              sku: selectedVariant.sku,
            },
          },
        );

        console.log('Promotion API response:', response.data);

        setPromotion(response.data);
      } catch (error) {
        console.error('Fetch promotion error:', error);
        setPromotion(null);
      }
    };

    fetchPromotion();
  }, [selectedVariant?.sku]);

  const discountValue = Number(promotion?.discountValue ?? 0);

  const finalPrice = promotion?.discountType === 'PERCENTAGE' ? currentPrice * (1 - discountValue / 100)
      : promotion?.discountType === 'FIXED_AMOUNT'
        ? Math.max(0, currentPrice - discountValue)
        : currentPrice;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-red-300 hover:shadow-lg">

      <div>

        {/* ============================
            1. Ảnh sản phẩm
        ============================ */}

        <Link
          href={`/customer/product-detail/${currentSlug}`}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-50"
        >
          <img
            src={`/product/phone/${currentImage}`}
            alt={`${product.name} ${currentStorage} ${currentColor}`}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* ============================
            2. Tên sản phẩm
        ============================ */}

        <div className="mt-5">
          <h3 className="line-clamp-2 text-sm font-bold text-gray-900 transition-colors group-hover:text-red-600">
            {product.name} {currentStorage}
          </h3>
        </div>

        {/* ============================
            3. Màn hình
        ============================ */}

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

        {/* ============================
            4. Dung lượng
        ============================ */}

        {storages.length > 0 && (
          <div className="mt-3">

            <p className="mb-1.5 text-xs font-semibold text-gray-700">
              Dung lượng
            </p>

            <div className="flex flex-wrap gap-1.5">

              {storages.map((storage) => {

                const isSelected =
                  storage === selectedStorage;

                return (
                  <button
                    key={storage}
                    type="button"
                    onClick={() =>
                      setSelectedStorage(storage)
                    }
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

        {/* ============================
            5. Màu sắc
        ============================ */}

        {colors.length > 0 && (
          <div className="mt-3">

            <p className="mb-1.5 text-xs font-semibold text-gray-700">
              Màu: {currentColor}
            </p>

            <div className="flex flex-wrap gap-1.5">

              {colors.map((colorVariant) => {

                const isSelected =
                  colorVariant.colorSlug ===
                  selectedColorSlug;

                return (
                  <button
                    key={colorVariant.colorSlug}
                    type="button"
                    onClick={() =>
                      setSelectedColorSlug(
                        colorVariant.colorSlug,
                      )
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

        {/* ============================
            6. Giá
        ============================ */}
        <div className="mt-3">
          {promotion ? (
            <div className="flex flex-col">
              {/* Giá gốc + mức giảm */}
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

              {/* Giá sau giảm */}
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
        

        {/* ============================
            7. Thông số nhanh
        ============================ */}

        <ul className="mt-3 space-y-1.5 border-t border-dashed border-gray-200 pt-3 text-[11px] leading-relaxed text-gray-600">

          {product.specifications?.chip && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>

              <span className="line-clamp-1">
                <strong className="font-semibold text-gray-800">
                  Chip:
                </strong>{' '}
                {product.specifications.chip}
              </span>
            </li>
          )}

          {product.specifications?.ram && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>

              <span className="line-clamp-1">
                <strong className="font-semibold text-gray-800">
                  Ram:
                </strong>{' '}
                {product.specifications.ram}
              </span>
            </li>
          )}

          {currentStorage && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>

              <span>
                <strong className="font-semibold text-gray-800">
                  Dung lượng:
                </strong>{' '}
                {currentStorage}
              </span>
            </li>
          )}

          {currentColor && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>

              <span>
                <strong className="font-semibold text-gray-800">
                  Màu:
                </strong>{' '}
                {currentColor}
              </span>
            </li>
          )}

          {product.specifications?.rearCamera && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>

              <span className="line-clamp-2">
                <strong className="font-semibold text-gray-800">
                  Camera sau:
                </strong>{' '}
                {product.specifications.rearCamera}
              </span>
            </li>
          )}

          {product.specifications?.frontCamera && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>

              <span>
                <strong className="font-semibold text-gray-800">
                  Camera trước:
                </strong>{' '}
                {product.specifications.frontCamera}
              </span>
            </li>
          )}

          {product.specifications?.battery && (
            <li className="flex items-start gap-1.5">
              <span className="text-gray-400">•</span>

              <span className="line-clamp-1">
                <strong className="font-semibold text-gray-800">
                  Pin:
                </strong>{' '}
                {product.specifications.battery}
              </span>
            </li>
          )}

        </ul>

      </div>
    </div>
  );
}

