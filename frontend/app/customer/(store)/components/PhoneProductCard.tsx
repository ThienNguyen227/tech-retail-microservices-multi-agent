'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { useProductCompare } from './ProductCompareProvider';
import { CirclePlus, ArrowRight } from 'lucide-react';

// ============================================================
// TYPES
// ============================================================

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
};

export type PromotionDiscount = {
  promotionId: number;
  promotionName: string;
  sku: string;
  discountType: string;
  discountValue: string;
};

type PhoneProductCardProps = {
  product: Phone;
  promotions: PromotionDiscount[];
};

// ============================================================
// COMPONENT
// ============================================================

export default function PhoneProductCard({
  product,
  promotions,
}: PhoneProductCardProps) {
  // ==========================================================
  // COMPARE CONTEXT
  // ==========================================================

  const { addPhone } = useProductCompare();

  // ==========================================================
  // STORAGE OPTIONS
  // ==========================================================

  const storages = useMemo(
    () => [
      ...new Set(
        (product.variants ?? []).map((variant) => variant.storage),
      ),
    ],
    [product.variants],
  );

  // ==========================================================
  // COLOR OPTIONS
  // ==========================================================

  const colors = useMemo(() => {
    const uniqueColors = new Map<string, ProductVariant>();

    (product.variants ?? []).forEach((variant) => {
      if (!uniqueColors.has(variant.colorSlug)) {
        uniqueColors.set(variant.colorSlug, variant);
      }
    });

    return Array.from(uniqueColors.values());
  }, [product.variants]);

  // ==========================================================
  // SELECTED VARIANT
  // ==========================================================

  const [selectedStorage, setSelectedStorage] = useState(
    storages[0] ?? '',
  );

  const [selectedColorSlug, setSelectedColorSlug] = useState(
    colors[0]?.colorSlug ?? '',
  );

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          variant.storage === selectedStorage &&
          variant.colorSlug === selectedColorSlug,
      ) ?? product.variants[0],
    [product.variants, selectedStorage, selectedColorSlug],
  );

  // ==========================================================
  // PROMOTION
  // ==========================================================

  const promotion = useMemo(
    () =>
      promotions.find(
        (item) => item.sku === selectedVariant?.sku,
      ) ?? null,
    [promotions, selectedVariant?.sku],
  );

  // ==========================================================
  // CURRENT PRODUCT INFORMATION
  // ==========================================================

  const currentPrice = selectedVariant?.price ?? 0;
  const currentSlug = selectedVariant?.slug ?? product.slug;
  const currentImage = selectedVariant?.images?.[0] ?? product.image;
  const currentStorage = selectedVariant?.storage ?? '';
  const currentColor = selectedVariant?.color ?? '';

  // ==========================================================
  // PRICE FORMAT
  // ==========================================================

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);

  // ==========================================================
  // CALCULATE PROMOTION PRICE
  // ==========================================================

  const discountValue = Number(promotion?.discountValue ?? 0);

  const finalPrice =
    promotion?.discountType === 'PERCENTAGE'
      ? Math.max(0, currentPrice * (1 - discountValue / 100))
      : promotion?.discountType === 'FIXED_AMOUNT'
        ? Math.max(0, currentPrice - discountValue)
        : currentPrice;

  const savedAmount = Math.max(0, currentPrice - finalPrice);

  const hasPromotion = Boolean(
    promotion && discountValue > 0,
  );

  const discountLabel =
    promotion?.discountType === 'PERCENTAGE'
      ? `-${discountValue}%`
      : `-${formatPrice(discountValue)}`;

  // ==========================================================
  // ADD TO COMPARE
  // ==========================================================

  const handleAddToCompare = () => {
    if (!selectedVariant) {
      return;
    }

    const result = addPhone(product, selectedVariant);

    switch (result) {
      case 'added':
        // Thanh so sánh sẽ tự động cập nhật thông qua Context
        break;

      case 'duplicate':
        alert('Sản phẩm này đã có trong danh sách so sánh!');
        break;

      case 'limit':
        alert('Bạn chỉ có thể so sánh tối đa 3 sản phẩm!');
        break;
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/8">

      {/* ================================================== */}
      {/* PRODUCT IMAGE */}
      {/* ================================================== */}

      <Link
        href={`/customer/product-detail/${currentSlug}`}
        aria-label={`Xem chi tiết ${product.name}`}
        className="relative m-3 block aspect-[4/3] shrink-0 overflow-hidden rounded-2xl bg-slate-50 sm:m-4"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/50" />

        <img
          src={`/product/phone/${currentImage}`}
          alt={`${product.name} ${currentStorage} ${currentColor}`}
          loading="lazy"
          className="relative h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />

        {hasPromotion && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {discountLabel}
          </span>
        )}

        <span className="absolute bottom-3 right-3 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur">
          {currentColor || 'Điện thoại'}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">

        {/* ================================================== */}
        {/* PRODUCT NAME */}
        {/* ================================================== */}

        <Link href={`/customer/product-detail/${currentSlug}`}>
          <h3 className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-5 text-slate-900 transition-colors group-hover:text-teal-700">
            {product.name} {currentStorage}
          </h3>
        </Link>

        {/* ================================================== */}
        {/* SCREEN INFORMATION */}
        {/* ================================================== */}

        <div className="mt-2 flex min-h-7 flex-wrap content-start gap-1.5">
          {product.screenTech && (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
              {product.screenTech}
            </span>
          )}

          {product.screenSize && (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
              {product.screenSize}
            </span>
          )}
        </div>

        {/* ================================================== */}
        {/* SELECT STORAGE */}
        {/* ================================================== */}

        <div className="mt-3 min-h-[58px]">
          {storages.length > 0 && (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Dung lượng
              </p>

              <div className="flex flex-wrap gap-2">
                {storages.map((storage) => {
                  const isSelected = storage === selectedStorage;

                  return (
                    <button
                      key={storage}
                      type="button"
                      onClick={() => setSelectedStorage(storage)}
                      aria-pressed={isSelected}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
                      }`}
                    >
                      {storage}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ================================================== */}
        {/* SELECT COLOR */}
        {/* ================================================== */}

        <div className="mt-3 min-h-[58px]">
          {colors.length > 0 && (
            <>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Màu sắc

                <span className="ml-1.5 normal-case tracking-normal text-slate-600">
                  {currentColor}
                </span>
              </p>

              <div className="flex flex-wrap gap-2">
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
                      aria-pressed={isSelected}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
                      }`}
                    >
                      {colorVariant.color}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ================================================== */}
        {/* PRODUCT PRICE */}
        {/* ================================================== */}

        <div className="mt-4 border-t border-slate-100 pt-3">
          {currentPrice > 0 ? (
            <div className="flex min-h-[62px] flex-col justify-center">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-lg font-semibold leading-tight tracking-tight text-teal-700">
                  {formatPrice(hasPromotion ? finalPrice : currentPrice)}
                </p>

                {hasPromotion && (
                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">
                    {discountLabel}
                  </span>
                )}
              </div>

              {hasPromotion && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2">
                  <span className="text-xs text-slate-400 line-through">
                    {formatPrice(currentPrice)}
                  </span>

                  {savedAmount > 0 && (
                    <span className="text-[10px] text-emerald-600">
                      Tiết kiệm {formatPrice(savedAmount)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[62px] flex-col justify-center">
              <p className="text-xs text-slate-400">Giá bán</p>
              <p className="text-lg font-medium text-slate-600">
                Liên hệ
              </p>
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* ACTION BUTTONS */}
        {/* ================================================== */}

        <div className="mt-auto grid grid-cols-[auto_minmax(0,1fr)] gap-2">
          {/* COMPARE BUTTON */}
          <button
            type="button"
            onClick={handleAddToCompare}
            aria-label={`So sánh ${product.name}`}
            className="inline-flex min-w-0 items-center justify-center gap-1 rounded-lg border border-teal-600 bg-white px-2 py-2 text-[11px] font-semibold text-teal-700 transition-all duration-200 hover:bg-teal-50 active:scale-[0.98] sm:text-xs"
          >
            <CirclePlus size={15} className="shrink-0" />
            <span>So sánh</span>
          </button>

          {/* DETAIL BUTTON */}
          <Link
            href={`/customer/product-detail/${currentSlug}`}
            className="group inline-flex min-w-0 items-center justify-center gap-1 rounded-lg bg-teal-700 px-2 py-2 text-[11px] font-semibold text-white transition hover:bg-teal-800 active:scale-[0.98] sm:gap-1.5 sm:text-xs"
          >
            <span className="truncate">Chi tiết</span>

            <ArrowRight
              size={14}
              className="shrink-0 transition-transform group-hover:translate-x-1"
            />
          </Link>

        </div>
      </div>
    </article>
  );
}

