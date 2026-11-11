'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  GitCompareArrows,
  Trash2,
  X,
  Plus,
  ArrowRight,
} from 'lucide-react';

import { useProductCompare } from './ProductCompareProvider';

// ============================================================
// CONSTANTS
// ============================================================

const MAX_COMPARE_PRODUCTS = 3;

const LAPTOP_CATEGORY_PATH =
  '/customer/product-category/may-tinh-xach-tay';

const LAPTOP_COMPARE_PATH =
  '/customer/product-laptop-compare';

// ============================================================
// COMPONENT
// ============================================================

export default function ProductCompareLaptopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    laptops,
    removeLaptop,
    clearLaptops,
    isHydrated,
  } = useProductCompare();

  const laptopCount = laptops.length;

  const isLaptopCategoryPage =
    pathname === LAPTOP_CATEGORY_PATH;

  const canCompare = laptopCount >= 2;

  if (
    !isHydrated ||
    laptopCount === 0 ||
    !isLaptopCategoryPage
  ) {
    return null;
  }

  // ==========================================================
  // HANDLERS
  // ==========================================================

  const handleCompare = () => {
    if (!canCompare) return;

    router.push(LAPTOP_COMPARE_PATH);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <GitCompareArrows size={20} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                So sánh laptop
              </h3>

              <p className="text-[11px] text-slate-500">
                Đã chọn {laptopCount}/{MAX_COMPARE_PRODUCTS} sản phẩm
              </p>
            </div>
          </div>

          {/* CLEAR ALL */}
          <button
            type="button"
            onClick={clearLaptops}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={16} />
            Xóa tất cả
          </button>
        </div>

        {/* PRODUCT LIST */}
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible">
          {laptops.map((laptop) => (
            <div
              key={laptop.productId}
              className="group flex min-w-[260px] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-teal-300 hover:bg-teal-50/30 sm:min-w-0"
            >
              {/* PRODUCT IMAGE */}
              <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                <img
                  src={`/product/laptop/${laptop.variant.image || laptop.image}`}
                  alt={laptop.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              {/* PRODUCT INFORMATION */}
              <div className="min-w-0 flex-1">
                <p
                  className="line-clamp-1 text-xs font-bold text-slate-800"
                  title={laptop.name}
                >
                  {laptop.name}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {laptop.variant.ram} · {laptop.variant.ssd}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {laptop.variant.color}
                </p>

                <p className="mt-1 text-xs font-semibold text-teal-700">
                  {formatPrice(laptop.variant.price)}
                </p>
              </div>

              {/* REMOVE BUTTON */}
              <button
                type="button"
                onClick={() => removeLaptop(laptop.productId)}
                aria-label={`Xóa ${laptop.name} khỏi danh sách so sánh`}
                title="Xóa sản phẩm"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X size={17} />
              </button>
            </div>
          ))}

          {/* EMPTY SLOTS */}
          {Array.from({
            length: Math.max(
              0,
              MAX_COMPARE_PRODUCTS - laptopCount,
            ),
          }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex min-w-[260px] flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-3 py-3 sm:min-w-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400">
                <Plus size={20} />
              </div>

              <span className="text-xs text-slate-400">
                Thêm sản phẩm ({laptopCount + index + 1}/{MAX_COMPARE_PRODUCTS})
              </span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            {canCompare
              ? `Bạn có thể so sánh ${laptopCount} laptop đã chọn.`
              : 'Vui lòng chọn ít nhất 2 laptop để so sánh.'}
          </p>

          {/* COMPARE BUTTON */}
          <button
            type="button"
            onClick={handleCompare}
            disabled={!canCompare}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none sm:w-auto"
          >
            <GitCompareArrows size={16} />

            So sánh ngay

            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
