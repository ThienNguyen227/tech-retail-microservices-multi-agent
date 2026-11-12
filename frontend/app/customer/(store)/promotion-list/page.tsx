
"use client";

import { customerPromotionService } from "@/lib/axios/services/customer-services/promotion_service";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  House,
  ChevronRight,
  Gift,
  BadgePercent,
  CalendarDays,
  Clock3,
  Sparkles,
  Search,
  ArrowUpRight,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  CalendarCheck2,
  Tag,
  TicketPercent,
  X,
} from "lucide-react";

// ========================================
// TYPES
// ========================================

type Promotion = {
  promotionId: number;
  promotionName: string;
  promotionDescription: string;
  promotionStartAt: string;
  promotionEndAt: string;
  promotionCreatedAt: string;
  promotionStatusId: number;
};

type PromotionStatus = {
  label: string;
  className: string;
  dot: string;
};

// ========================================
// HELPERS
// ========================================

function formatDate(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getPromotionStatus(promotion: Promotion): PromotionStatus {
  const now = new Date();
  const startDate = new Date(promotion.promotionStartAt);
  const endDate = new Date(promotion.promotionEndAt);

  if (promotion.promotionStatusId !== 3) {
    return {
      label: "Không hoạt động",
      className: "bg-slate-100 text-slate-600 ring-slate-500/20",
      dot: "bg-slate-400",
    };
  }

  if (now < startDate) {
    return {
      label: "Sắp diễn ra",
      className: "bg-amber-50 text-amber-700 ring-amber-600/20",
      dot: "bg-amber-500",
    };
  }

  if (now > endDate) {
    return {
      label: "Đã kết thúc",
      className: "bg-slate-100 text-slate-600 ring-slate-500/20",
      dot: "bg-slate-400",
    };
  }

  return {
    label: "Đang diễn ra",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  };
}

function getRemainingDays(endAt: string) {
  const endDate = new Date(endAt).getTime();

  if (Number.isNaN(endDate)) return null;

  const difference = endDate - Date.now();

  if (difference <= 0) return 0;

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

// ========================================
// MAIN PAGE
// ========================================

export default function CustomerPromotionPage() {
  const router = useRouter();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // ========================================
  // LOAD PROMOTIONS
  // ========================================

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await customerPromotionService.getAllPromotions();

      const result = response?.data ?? response;

      const promotionList: Promotion[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setPromotions(promotionList);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        router.replace("/customer/login");
        return;
      }

      const message = err.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join("\n")
          : message ||
              "Không thể tải danh sách khuyến mãi. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  // ========================================
  // SEARCH
  // ========================================

  const filteredPromotions = useMemo(() => {
    const keyword = normalizeText(searchKeyword.trim());

    if (!keyword) return promotions;

    return promotions.filter((promotion) => {
      const name = normalizeText(promotion.promotionName ?? "");
      const description = normalizeText(
        promotion.promotionDescription ?? "",
      );

      return (
        name.includes(keyword) ||
        description.includes(keyword) ||
        String(promotion.promotionId).includes(keyword)
      );
    });
  }, [promotions, searchKeyword]);

  const activeCount = promotions.filter(
    (promotion) =>
      getPromotionStatus(promotion).label === "Đang diễn ra",
  ).length;

  // ========================================
  // RENDER
  // ========================================

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-14">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ========================================
            BREADCRUMB
        ======================================== */}

        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm"
        >
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 transition hover:text-teal-700"
          >
            <House size={16} />
            <span>Trang chủ</span>
          </Link>

          <ChevronRight size={15} className="text-slate-400" />

          <span className="font-semibold text-slate-800">
            Khuyến mãi
          </span>
        </nav>

        {/* ========================================
            HERO BANNER
        ======================================== */}

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-600 p-6 text-white shadow-xl shadow-teal-900/10 sm:p-9">

          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[45px] border-white/[0.07]" />

          <div className="pointer-events-none absolute -bottom-32 right-52 h-72 w-72 rounded-full bg-white/[0.06]" />

          <div className="pointer-events-none absolute right-12 top-12 hidden rotate-12 text-white/[0.07] sm:block">
            <Gift size={160} strokeWidth={1} />
          </div>

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

            {/* Hero content */}
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-teal-50 backdrop-blur">
                <Sparkles size={15} />
                ƯU ĐÃI ĐẶC BIỆT DÀNH CHO BẠN
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[42px]">
                Khám phá ưu đãi hấp dẫn
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-teal-50 sm:text-base">
                Đừng bỏ lỡ những chương trình khuyến mãi hấp dẫn
                đang diễn ra tại cửa hàng. Mua sắm công nghệ với
                nhiều ưu đãi và tiết kiệm hơn.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-teal-800 shadow-lg shadow-teal-950/10">
                  <Gift size={17} />
                  Xem ưu đãi ngay
                </div>

                <span className="text-xs font-medium text-teal-100">
                  Cập nhật các chương trình mới nhất
                </span>
              </div>
            </div>

            {/* Hero statistic */}
            <div className="relative w-full max-w-sm">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-100">
                      Ưu đãi đang áp dụng
                    </p>

                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-5xl font-extrabold tracking-tight">
                        {loading ? "..." : activeCount}
                      </span>

                      <span className="mb-1.5 text-sm font-medium text-teal-100">
                        chương trình
                      </span>
                    </div>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                    <TicketPercent size={30} />
                  </div>
                </div>

                <div className="mt-5 border-t border-white/15 pt-4">
                  <div className="flex items-center gap-2 text-xs text-teal-50">
                    <CalendarCheck2 size={16} />
                    Các chương trình được cập nhật tự động
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            SECTION HEADING
        ======================================== */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <BadgePercent size={20} />
              </div>

              <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
                Promotion Center
              </span>
            </div> */}

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Chương trình khuyến mãi
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Tổng hợp những ưu đãi đang được áp dụng tại hệ thống cửa hàng.
            </p>
          </div>

          {!loading && !error && (
            <div className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">
              Hiển thị{" "}
              <span className="font-bold text-teal-700">
                {filteredPromotions.length}
              </span>{" "}
              / {promotions.length} chương trình
            </div>
          )}
        </div>

        {/* ========================================
            SEARCH BAR
        ======================================== */}

        <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="group relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-teal-600"
              />

              <input
                type="text"
                value={searchKeyword}
                onChange={(event) =>
                  setSearchKeyword(event.target.value)
                }
                placeholder="Tìm kiếm chương trình khuyến mãi..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />

              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword("")}
                  aria-label="Xóa nội dung tìm kiếm"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => void loadPromotions()}
              disabled={loading}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Làm mới
            </button>
          </div>
        </div>

        {/* ========================================
            LOADING
        ======================================== */}

        {loading && (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <LoaderCircle
                size={34}
                className="animate-spin text-teal-600"
              />
            </div>

            <p className="mt-5 font-semibold text-slate-800">
              Đang tải chương trình khuyến mãi...
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Vui lòng chờ trong giây lát.
            </p>
          </div>
        )}

        {/* ========================================
            ERROR
        ======================================== */}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <AlertCircle size={25} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900">
                  Không thể tải chương trình khuyến mãi
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => void loadPromotions()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  <RefreshCw size={16} />
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            PROMOTION LIST
        ======================================== */}

        {!loading && !error && (
          <>
            {filteredPromotions.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">

                {filteredPromotions.map((promotion) => {
                  const status = getPromotionStatus(promotion);
                  const remainingDays = getRemainingDays(
                    promotion.promotionEndAt,
                  );

                  return (
                    <article
                      key={promotion.promotionId}
                      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/[0.07]"
                    >
                      {/* Card top decoration */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-6 py-5 text-white">
                        <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full border-[20px] border-white/[0.08]" />

                        <div className="relative flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-inner">
                              <Gift size={25} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-100">
                                SPECIAL OFFER
                              </p>

                              <p className="mt-1 text-sm font-bold">
                                Chương trình khuyến mãi
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-lg border border-white/20 bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur">
                            #{promotion.promotionId}
                          </span>
                        </div>
                      </div>

                      {/* Card content */}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">

                        {/* Promotion name */}
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <h3 className="min-w-0 text-lg font-bold leading-7 text-slate-900 transition group-hover:text-teal-800 sm:text-xl">
                            {promotion.promotionName}
                          </h3>

                          <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-100 sm:flex">
                            <ArrowUpRight size={19} />
                          </div>
                        </div>

                        {/* Status */}
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.className}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                            />
                            {status.label}
                          </span>

                          {status.label === "Đang diễn ra" &&
                            remainingDays !== null && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                <Clock3 size={13} />
                                Còn {remainingDays} ngày
                              </span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mb-6 flex-1 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <Tag
                              size={16}
                              className="text-teal-600"
                            />

                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              Nội dung ưu đãi
                            </span>
                          </div>

                          <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                            {promotion.promotionDescription ||
                              "Chưa có mô tả cho chương trình khuyến mãi này."}
                          </p>
                        </div>

                        {/* Promotion date */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <CalendarDays size={19} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-400">
                                Ngày bắt đầu
                              </p>

                              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                {formatDate(promotion.promotionStartAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                              <CalendarDays size={19} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-400">
                                Ngày kết thúc
                              </p>

                              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                                {formatDate(promotion.promotionEndAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Card footer */}
                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <Sparkles size={14} className="text-teal-500" />
                            Ưu đãi tại hệ thống cửa hàng
                          </div>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 transition group-hover:gap-2">
                            Chi tiết
                            <ArrowUpRight size={15} />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* ========================================
                 EMPTY STATE
              ======================================== */

              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-600">
                  {searchKeyword ? (
                    <Search size={36} />
                  ) : (
                    <Gift size={38} />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-800">
                  {searchKeyword
                    ? "Không tìm thấy chương trình phù hợp"
                    : "Hiện chưa có chương trình khuyến mãi"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {searchKeyword
                    ? "Không tìm thấy chương trình nào phù hợp với từ khóa tìm kiếm. Hãy thử một từ khóa khác."
                    : "Các chương trình ưu đãi sẽ được cập nhật tại đây. Hãy quay lại sau để không bỏ lỡ những khuyến mãi hấp dẫn."}
                </p>

                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    <X size={16} />
                    Xóa tìm kiếm
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* ========================================
            BOTTOM INFORMATION
        ======================================== */}

        {!loading && !error && promotions.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
                <Sparkles size={24} />
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-slate-800">
                  Đừng bỏ lỡ những ưu đãi hấp dẫn!
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Các chương trình khuyến mãi có thời hạn áp dụng
                  cụ thể. Hãy kiểm tra thông tin và thời gian trước
                  khi mua sắm tại cửa hàng.
                </p>
              </div>

              {/* <div className="sm:ml-auto">
                <span className="inline-flex items-center gap-2 rounded-xl bg-teal-100 px-4 py-2.5 text-xs font-bold text-teal-800">
                  <BadgePercent size={16} />
                  Promotion Center
                </span>
              </div> */}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
