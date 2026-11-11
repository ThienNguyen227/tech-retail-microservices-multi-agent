
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useProductCompare } from './ProductCompareProvider';

const MAX_COMPARE_PRODUCTS = 3;

export default function ProductCompareBar() {
  const router = useRouter();
  const pathname = usePathname();

  const {
    phones,
    count,
    removePhone,
    clearPhones,
    isHydrated,
  } = useProductCompare();

  // Chỉ hiển thị thanh so sánh tại trang danh mục điện thoại
  const isPhoneCategoryPage =
    pathname === '/customer/product-category/dien-thoai-di-dong';

  // Chờ load localStorage, ẩn khi không có sản phẩm
  // hoặc khi người dùng đang ở trang khác
  if (
    !isHydrated ||
    count === 0 ||
    !isPhoneCategoryPage
  ) {
    return null;
  }

  const canCompare = count >= 2;

  const handleCompare = () => {
    if (!canCompare) return;

    router.push('/customer/product-phone-compare');
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
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="8" height="16" rx="1.5" />
                <rect x="13" y="4" width="8" height="16" rx="1.5" />
              </svg>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                So sánh sản phẩm
              </h3>

              <p className="text-[11px] text-slate-500">
                Đã chọn {count}/{MAX_COMPARE_PRODUCTS} sản phẩm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearPhones}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"
              />
            </svg>

            Xóa tất cả
          </button>
        </div>

        {/* PRODUCT LIST */}
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible">
          {phones.map((phone) => (
            <div
              key={phone.productId}
              className="group flex min-w-[260px] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-teal-300 hover:bg-teal-50/30 sm:min-w-0"
            >
              {/* PRODUCT IMAGE */}
              <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                <img
                  src={`/product/phone/${phone.variant.image || phone.image}`}
                  alt={phone.name}
                  className="h-full w-full object-contain p-1"
                />
              </div>

              {/* PRODUCT INFORMATION */}
              <div className="min-w-0 flex-1">
                <p
                  className="line-clamp-1 text-xs font-bold text-slate-800"
                  title={phone.name}
                >
                  {phone.name}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {phone.variant.storage} · {phone.variant.color}
                </p>

                <p className="mt-1 text-xs font-semibold text-teal-700">
                  {formatPrice(phone.variant.price)}
                </p>
              </div>

              {/* REMOVE BUTTON */}
              <button
                type="button"
                onClick={() => removePhone(phone.productId)}
                aria-label={`Xóa ${phone.name} khỏi danh sách so sánh`}
                title="Xóa sản phẩm"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m18 6-12 12M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}

          {/* EMPTY SLOTS */}
          {Array.from({
            length: MAX_COMPARE_PRODUCTS - count,
          }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="flex min-w-[260px] flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-3 py-3 sm:min-w-0"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 5v14m-7-7h14"
                  />
                </svg>
              </div>

              <span className="text-xs text-slate-400">
                Thêm sản phẩm ({count + index + 1}/{MAX_COMPARE_PRODUCTS})
              </span>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            {canCompare
              ? `Bạn có thể so sánh ${count} sản phẩm đã chọn.`
              : 'Vui lòng chọn ít nhất 2 điện thoại để so sánh.'}
          </p>

          <button
            type="button"
            onClick={handleCompare}
            disabled={!canCompare}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 hover:shadow-md disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="8" height="16" rx="1.5" />
              <rect x="13" y="4" width="8" height="16" rx="1.5" />
            </svg>

            So sánh ngay

            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
