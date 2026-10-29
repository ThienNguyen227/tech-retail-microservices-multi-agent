"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  CalendarDays,
  Package,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Hash,
  ShoppingBag,
  FilterX,
  ChevronRight,
} from "lucide-react";

import { customerCustomerService } from "@/lib/axios/services/customer-services/warranty_service";

type WarrantyStatus = {
  warranty_status_id: number;
  warranty_status_code: string;
  warranty_status_name: string;
};

type Warranty = {
  warranty_id: number;
  warranty_code: string;
  user_id: number;
  order_id: number;
  order_code: string;
  order_item_id: number;
  warranty_product_name: string | null;
  warranty_product_image: string | null;
  warranty_sku: string;
  warranty_serial_number: string | null;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_duration_months: number;
  warranty_created_at: string;
  warranty_updated_at: string;
  warranty_status_id: number;
  status: WarrantyStatus;
};

type WarrantyResponse = {
  success: boolean;
  message: string;
  total: number;
  data: Warranty[];
};

type FilterStatus = "ALL" | "ACTIVE" | "EXPIRED";
type EffectiveStatus = "ACTIVE" | "EXPIRED" | "OTHER";

const formatDate = (value: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getStatusCode = (warranty: Warranty) =>
  (warranty.status?.warranty_status_code ?? "").toUpperCase();

const getStatusLabel = (warranty: Warranty) =>
  warranty.status?.warranty_status_name || "Chưa xác định";

function getEffectiveStatus(warranty: Warranty): EffectiveStatus {
  const code = getStatusCode(warranty);

  if (code.includes("EXPIRED") || code.includes("HET_HAN")) {
    return "EXPIRED";
  }

  const endDate = new Date(warranty.warranty_end_date);

  if (!Number.isNaN(endDate.getTime())) {
    endDate.setHours(23, 59, 59, 999);

    if (code === "ACTIVE" && endDate < new Date()) {
      return "EXPIRED";
    }
  }

  if (code === "ACTIVE" || code.includes("VALID")) {
    return "ACTIVE";
  }

  return "OTHER";
}

function getProductImage(image: string | null) {
  if (!image) return "";

  if (/^https?:\/\//i.test(image) || image.startsWith("/")) {
    return image;
  }

  return `/product/${image}`;
}

function StatusBadge({ warranty }: { warranty: Warranty }) {
  const status = getEffectiveStatus(warranty);

  const styles: Record<EffectiveStatus, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    EXPIRED: "bg-rose-50 text-rose-700 ring-rose-200",
    OTHER: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  const icons: Record<EffectiveStatus, typeof CheckCircle2> = {
    ACTIVE: CheckCircle2,
    EXPIRED: XCircle,
    OTHER: AlertCircle,
  };

  const Icon = icons[status];

  const label =
    status === "EXPIRED"
      ? "Hết hạn"
      : status === "ACTIVE"
        ? "Còn hiệu lực"
        : getStatusLabel(warranty);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof ShieldCheck;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="mt-0.5 shrink-0 text-teal-600">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function WarrantyPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");

  const [selectedWarranty, setSelectedWarranty] =
    useState<Warranty | null>(null);

  // Debounce từ khóa tìm kiếm.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [keyword]);

  const fetchWarranties = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response: WarrantyResponse =
          await customerCustomerService.getWarranty(
            debouncedKeyword || undefined,
            filterStatus === "ALL" ? undefined : filterStatus,
          );

        if (!response || !Array.isArray(response.data)) {
          throw new Error("Dữ liệu bảo hành trả về không hợp lệ.");
        }

        setWarranties(response.data);
        setTotal(
          typeof response.total === "number"
            ? response.total
            : response.data.length,
        );
      } catch (err: unknown) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };

        setError(
          axiosError.response?.data?.message ||
            axiosError.message ||
            "Không thể tải danh sách bảo hành. Vui lòng thử lại.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedKeyword, filterStatus],
  );

  useEffect(() => {
    void fetchWarranties();
  }, [fetchWarranties]);

  const stats = useMemo(() => {
    return {
      active: warranties.filter(
        (item) => getEffectiveStatus(item) === "ACTIVE",
      ).length,
      expired: warranties.filter(
        (item) => getEffectiveStatus(item) === "EXPIRED",
      ).length,
    };
  }, [warranties]);

  const clearFilters = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setFilterStatus("ALL");
  };

  const hasFilters = Boolean(keyword.trim()) || filterStatus !== "ALL";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
              <ShieldCheck size={17} />
              Dịch vụ khách hàng
              <ChevronRight size={14} />
              <span className="text-slate-500">Bảo hành</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Bảo hành của tôi
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Theo dõi thời hạn bảo hành và thông tin sản phẩm đã mua của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchWarranties(true)}
            disabled={loading || refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-center"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Làm mới
          </button>
        </div>

        {/* Statistics: no pending card */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Tổng bảo hành"
            value={total}
            description="Theo điều kiện tìm kiếm hiện tại"
            icon={Package}
            iconClass="bg-teal-50 text-teal-700"
          />

          <StatCard
            title="Còn hiệu lực"
            value={stats.active}
            description="Trong danh sách đang hiển thị"
            icon={ShieldCheck}
            iconClass="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Đã hết hạn"
            value={stats.expired}
            description="Trong danh sách đang hiển thị"
            icon={Clock}
            iconClass="bg-rose-50 text-rose-700"
          />
        </section>

        {/* Warranty list */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Danh sách bảo hành
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Đang tải dữ liệu..."
                    : `Hiển thị ${warranties.length} / ${total} sản phẩm`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-80">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm mã bảo hành, đơn hàng, SKU..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(event.target.value as FilterStatus)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                  aria-label="Lọc trạng thái bảo hành"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Còn hiệu lực</option>
                  <option value="EXPIRED">Đã hết hạn</option>
                </select>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    <FilterX size={16} />
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="m-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-rose-600"
                />

                <div>
                  <p className="text-sm font-semibold text-rose-800">
                    Không thể tải dữ liệu bảo hành
                  </p>
                  <p className="mt-1 text-sm text-rose-700">{error}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void fetchWarranties()}
                className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
              <p className="text-sm text-slate-500">
                Đang tải danh sách bảo hành...
              </p>
            </div>
          ) : !error && warranties.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                {hasFilters ? <Search size={28} /> : <ShieldCheck size={30} />}
              </div>

              <h3 className="text-base font-bold text-slate-800">
                {hasFilters
                  ? "Không tìm thấy kết quả"
                  : "Bạn chưa có sản phẩm bảo hành"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {hasFilters
                  ? "Hãy thử từ khóa khác hoặc thay đổi bộ lọc trạng thái."
                  : "Thông tin bảo hành sẽ xuất hiện tại đây khi đơn hàng của bạn đủ điều kiện đăng ký bảo hành."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  <FilterX size={16} />
                  Xóa bộ lọc
                </button>
              )}
            </div>
          ) : !error ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">Sản phẩm</th>
                      <th className="px-5 py-4">Mã bảo hành</th>
                      <th className="px-5 py-4">Thời hạn</th>
                      <th className="px-5 py-4">Trạng thái</th>
                      <th className="px-5 py-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {warranties.map((warranty) => (
                      <tr
                        key={warranty.warranty_id}
                        className="transition hover:bg-teal-50/40"
                      >
                        <td className="px-6 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              {warranty.warranty_product_image ? (
                                <img
                                  src={getProductImage(warranty.warranty_product_image)}
                                  alt={warranty.warranty_product_name || "Sản phẩm"}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Package size={23} className="text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-2 max-w-xs text-sm font-semibold text-slate-800">
                                {warranty.warranty_product_name ||
                                  "Sản phẩm công nghệ"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                SKU: {warranty.warranty_sku}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Đơn hàng: {warranty.order_code}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-teal-700">
                            {warranty.warranty_code}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID: {warranty.warranty_id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {formatDate(warranty.warranty_start_date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            đến {formatDate(warranty.warranty_end_date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {warranty.warranty_duration_months} tháng
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge warranty={warranty} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedWarranty(warranty)}
                            aria-label={`Xem chi tiết ${warranty.warranty_code}`}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-600 hover:text-white"
                          >
                            <Eye size={15} />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-4 md:hidden">
                {warranties.map((warranty) => (
                  <article
                    key={warranty.warranty_id}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-teal-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {warranty.warranty_product_image ? (
                          <img
                            src={getProductImage(warranty.warranty_product_image)}
                            alt={warranty.warranty_product_name || "Sản phẩm"}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package size={25} className="text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-slate-800">
                          {warranty.warranty_product_name ||
                            "Sản phẩm công nghệ"}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {warranty.warranty_code}
                        </p>

                        <div className="mt-2">
                          <StatusBadge warranty={warranty} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-xs text-slate-500">Bắt đầu</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(warranty.warranty_start_date)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Kết thúc</p>
                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {formatDate(warranty.warranty_end_date)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedWarranty(warranty)}
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white text-sm font-semibold text-teal-700 transition hover:bg-teal-600 hover:text-white"
                    >
                      <Eye size={16} />
                      Xem chi tiết bảo hành
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {!loading && !error && warranties.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Tổng cộng{" "}
                <strong className="text-slate-700">{total}</strong> bảo hành
              </span>

              <span>Dữ liệu được tải từ hệ thống bảo hành</span>
            </div>
          )}
        </section>
      </div>

      {/* Warranty detail modal */}
      {selectedWarranty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedWarranty(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="warranty-modal-title"
            className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="warranty-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Chi tiết bảo hành
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Mã: {selectedWarranty.warranty_code}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                aria-label="Đóng chi tiết"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {selectedWarranty.warranty_product_image ? (
                    <img
                      src={getProductImage(selectedWarranty.warranty_product_image)}
                      alt={selectedWarranty.warranty_product_name || "Sản phẩm"}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Package size={34} className="text-slate-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-slate-900">
                    {selectedWarranty.warranty_product_name ||
                      "Sản phẩm công nghệ"}
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-500">
                    SKU: {selectedWarranty.warranty_sku}
                  </p>

                  <div className="mt-3">
                    <StatusBadge warranty={selectedWarranty} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-slate-800">
                  Thông tin bảo hành
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={<ShieldCheck size={17} />}
                    label="Mã bảo hành"
                    value={selectedWarranty.warranty_code}
                  />

                  <DetailItem
                    icon={<Hash size={17} />}
                    label="ID bảo hành"
                    value={String(selectedWarranty.warranty_id)}
                  />

                  <DetailItem
                    icon={<CalendarDays size={17} />}
                    label="Ngày bắt đầu"
                    value={formatDate(selectedWarranty.warranty_start_date)}
                  />

                  <DetailItem
                    icon={<CalendarDays size={17} />}
                    label="Ngày kết thúc"
                    value={formatDate(selectedWarranty.warranty_end_date)}
                  />

                  <DetailItem
                    icon={<Clock size={17} />}
                    label="Thời hạn"
                    value={`${selectedWarranty.warranty_duration_months} tháng`}
                  />

                  <DetailItem
                    icon={<ShoppingBag size={17} />}
                    label="Mã đơn hàng"
                    value={selectedWarranty.order_code}
                  />

                  <DetailItem
                    icon={<Package size={17} />}
                    label="Mã SKU"
                    value={selectedWarranty.warranty_sku}
                  />

                  <DetailItem
                    icon={<Hash size={17} />}
                    label="Số serial"
                    value={
                      selectedWarranty.warranty_serial_number ||
                      "Chưa cập nhật"
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-800">
                  Thông tin hệ thống
                </h3>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Trạng thái gốc</span>
                    <span className="text-right font-medium text-slate-700">
                      {getStatusLabel(selectedWarranty)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">Ngày tạo</span>
                    <span className="text-right font-medium text-slate-700">
                      {formatDate(selectedWarranty.warranty_created_at)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-500">
                      Cập nhật lần cuối
                    </span>
                    <span className="text-right font-medium text-slate-700">
                      {formatDate(selectedWarranty.warranty_updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                className="h-10 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
