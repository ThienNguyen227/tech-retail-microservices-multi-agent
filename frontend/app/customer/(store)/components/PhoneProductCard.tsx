'use client';

import { promotionApi } from '@/lib/axios/promotion-api';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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

type PromotionDiscount = {
  promotionId: number;
  promotionName: string;
  sku: string;
  discountType: string;
  discountValue: string;
};

type PhoneProductCardProps = {
  product: Phone;
};

export default function PhoneProductCard({
  product,
}: PhoneProductCardProps) {
  const storages = useMemo(
    () => [...new Set((product.variants ?? []).map((variant) => variant.storage))],
    [product.variants],
  );

  const colors = useMemo(() => {
    const uniqueColors = new Map<string, ProductVariant>();

    (product.variants ?? []).forEach((variant) => {
      if (!uniqueColors.has(variant.colorSlug)) {
        uniqueColors.set(variant.colorSlug, variant);
      }
    });

    return Array.from(uniqueColors.values());
  }, [product.variants]);

  const [selectedStorage, setSelectedStorage] = useState(storages[0] ?? '');
  const [selectedColorSlug, setSelectedColorSlug] = useState(
    colors[0]?.colorSlug ?? '',
  );
  const [promotion, setPromotion] = useState<PromotionDiscount | null>(null);

  const selectedVariant = useMemo(
    () =>
      product.variants.find(
        (variant) =>
          variant.storage === selectedStorage &&
          variant.colorSlug === selectedColorSlug,
      ) ?? product.variants[0],
    [product.variants, selectedStorage, selectedColorSlug],
  );

  const currentPrice = selectedVariant?.price ?? 0;
  const currentSlug = selectedVariant?.slug ?? product.slug;
  const currentImage = selectedVariant?.images?.[0] ?? product.image;
  const currentStorage = selectedVariant?.storage ?? '';
  const currentColor = selectedVariant?.color ?? '';

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

  const hasPromotion = Boolean(promotion);
  const savedAmount = Math.max(0, currentPrice - finalPrice);

  const discountLabel =
    promotion?.discountType === 'PERCENTAGE'
      ? `-${discountValue}%`
      : `-${formatPrice(discountValue)}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/8">
      {/* Product image */}
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

      {/* Product information */}
      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
        <Link href={`/customer/product-detail/${currentSlug}`}>
          <h3 className="line-clamp-2 min-h-11 text-[15px] font-semibold leading-5 text-slate-900 transition-colors group-hover:text-teal-700">
            {product.name} {currentStorage}
          </h3>
        </Link>

        {/* Screen information */}
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

        {/* Storage selector */}
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

        {/* Color selector */}
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
                      onClick={() => setSelectedColorSlug(colorVariant.colorSlug)}
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

        {/* Price */}
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
              <p className="text-lg font-medium text-slate-600">Liên hệ</p>
            </div>
          )}
        </div>

        {/* Action */}
        <Link
          href={`/customer/product-detail/${currentSlug}`}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Xem chi tiết
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}