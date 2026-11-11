
'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Trash2,
  X,
  Plus,
  ArrowRight,
  GitCompareArrows,
} from 'lucide-react';

import { useProductCompare } from './ProductCompareProvider';

const MAX_COMPARE_PRODUCTS = 3;

const TABLET_CATEGORY_PATH = '/customer/product-category/may-tinh-bang';
const TABLET_COMPARE_PATH = '/customer/product-tablet-compare';

export default function ProductCompareTabletBar() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    tablets,
    removeTablet,
    clearTablets,
    isHydrated,
  } = useProductCompare();

  const tabletCount = tablets.length;
  const isTabletCategoryPage = pathname === TABLET_CATEGORY_PATH;
  const canCompare = tabletCount >= 2;

  if (!isHydrated || tabletCount === 0 || !isTabletCategoryPage) {
    return null;
  }

  const handleCompare = () => {
    if (!canCompare) return;
    router.push(TABLET_COMPARE_PATH);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              So sánh máy tính bảng
            </h3>

            <p className="text-[11px] text-slate-500">
              Đã chọn {tabletCount}/{MAX_COMPARE_PRODUCTS} sản phẩm
            </p>
          </div>

          {/* CLEAR ALL */}
          <button
            type="button"
            onClick={clearTablets}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={16} />
            Xóa tất cả
          </button>
        </div>

        {/* PRODUCT LIST */}
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible">
          {tablets.map((tablet) => (
            <div
              key={tablet.productId}
              className="group flex min-w-[260px] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-teal-300 hover:bg-teal-50/30 sm:min-w-0"
            >
              {/* PRODUCT IMAGE */}
              <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                <img
                  src={`/product/tablet/${tablet.variant.image || tablet.image}`}
                  alt={tablet.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              {/* PRODUCT INFORMATION */}
              <div className="min-w-0 flex-1">
                <p
                  className="line-clamp-1 text-xs font-bold text-slate-800"
                  title={tablet.name}
                >
                  {tablet.name}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {tablet.variant.storage} · {tablet.variant.color}
                </p>

                <p className="mt-1 text-xs font-semibold text-teal-700">
                  {formatPrice(tablet.variant.price)}
                </p>
              </div>

              {/* REMOVE BUTTON */}
              <button
                type="button"
                onClick={() => removeTablet(tablet.productId)}
                aria-label={`Xóa ${tablet.name} khỏi danh sách so sánh`}
                title="Xóa sản phẩm"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X size={17} />
              </button>
            </div>
          ))}

          {/* EMPTY SLOTS */}
          {Array.from({
            length: Math.max(0, MAX_COMPARE_PRODUCTS - tabletCount),
          }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex min-w-[260px] flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-3 py-3 sm:min-w-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400">
                <Plus size={20} />
              </div>

              <span className="text-xs text-slate-400">
                Thêm sản phẩm ({tabletCount + index + 1}/{MAX_COMPARE_PRODUCTS})
              </span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            {canCompare
              ? `Bạn có thể so sánh ${tabletCount} máy tính bảng đã chọn.`
              : 'Vui lòng chọn ít nhất 2 máy tính bảng để so sánh.'}
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
