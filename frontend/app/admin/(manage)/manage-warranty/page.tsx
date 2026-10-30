
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  LoaderCircle,
  X,
  CalendarDays,
  Clock,
  Package,
  Hash,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Barcode,
  ShoppingBag,
  Wrench,
  FileText,
  UserRound,
  ImageIcon,
} from "lucide-react";
import axios from "axios";
import { adminWarrantyService } from "@/lib/axios/services/admin-services/warranty_service";

// ======================================================
// INTERFACES
// ======================================================

interface WarrantyStatus {
  warranty_status_id: number;
  warranty_status_code: string;
  warranty_status_name: string;
}

interface WarrantyRequestType {
  warranty_request_type_id: number;
  warranty_request_type_code: string;
  warranty_request_type_name: string;
}

interface WarrantyRequestStatus {
  warranty_request_status_id: number;
  warranty_request_status_code: string;
  warranty_request_status_name: string;
}

interface WarrantyRequest {
  warranty_request_id: number;
  warranty_request_code: string;
  warranty_request_description: string;
  warranty_request_received_at: string | null;
  warranty_request_completed_at: string | null;
  warranty_request_created_at: string;
  warranty_request_updated_at: string;
  warranty_id: number;
  warranty_request_type_id: number;
  warranty_request_status_id: number;
  type: WarrantyRequestType;
  status: WarrantyRequestStatus;
}

interface Warranty {
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
  requests: WarrantyRequest[];
}

interface WarrantyListResponse {
  success?: boolean;
  message?: string;
  total?: number;
  data?: Warranty[];
}

const PAGE_SIZE = 8;

// ======================================================
// HELPERS
// ======================================================

function normalizeWarrantyData(response: unknown): Warranty[] {
  if (Array.isArray(response)) {
    return response as Warranty[];
  }

  if (
    response &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as WarrantyListResponse).data)
  ) {
    return (response as WarrantyListResponse).data ?? [];
  }

  return [];
}

function formatDate(date?: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWarrantyStatusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "EXPIRED":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getWarrantyStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Đang bảo hành";

    case "EXPIRED":
      return "Đã hết hạn";

    default:
      return status || "Không xác định";
  }
}

function getRequestTypeStyle(type: string) {
  switch (type) {
    case "WARRANTY":
      return "bg-blue-50 text-blue-700";

    case "REPAIR":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getRequestTypeLabel(type: string) {
  switch (type) {
    case "WARRANTY":
      return "Bảo hành";

    case "REPAIR":
      return "Sửa chữa";

    default:
      return type || "Không xác định";
  }
}

function getRequestStatusStyle(status: string) {
  switch (status) {
    case "RECEIVED":
      return "bg-blue-50 text-blue-700";

    case "INSPECTING":
      return "bg-amber-50 text-amber-700";

    case "IN_REPAIR":
      return "bg-violet-50 text-violet-700";

    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-rose-50 text-rose-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getRequestStatusLabel(status: string) {
  switch (status) {
    case "RECEIVED":
      return "Đã tiếp nhận";

    case "INSPECTING":
      return "Đang kiểm tra";

    case "IN_REPAIR":
      return "Đang sửa chữa";

    case "COMPLETED":
      return "Đã hoàn thành";

    case "REJECTED":
      return "Đã từ chối";

    default:
      return status || "Không xác định";
  }
}

function extractErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function getRemainingDays(endDate: string) {
  const end = new Date(endDate);
  const today = new Date();

  if (Number.isNaN(end.getTime())) return null;

  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function ManageWarrantyPage() {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [statsWarranties, setStatsWarranties] = useState<Warranty[]>([]);

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedWarranty, setSelectedWarranty] =
    useState<Warranty | null>(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // ======================================================
  // LOAD STATISTICS
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    async function loadStatistics() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const response =
          await adminWarrantyService.getWarrantyList();

        const data = normalizeWarrantyData(response);

        if (!cancelled) {
          setStatsWarranties(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setStatsError(
            extractErrorMessage(
              err,
              "Không thể tải dữ liệu thống kê bảo hành.",
            ),
          );

          console.error("Get warranty statistics error:", err);
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // ======================================================
  // SEARCH AND FILTER
  // ======================================================

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await adminWarrantyService.getWarrantyList(
            keyword.trim() || undefined,
            statusFilter !== "ALL" ? statusFilter : undefined,
          );

        const data = normalizeWarrantyData(response);

        if (!cancelled) {
          setWarranties(data);
          setCurrentPage(1);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setWarranties([]);

          setError(
            extractErrorMessage(
              err,
              "Không thể tải danh sách bảo hành.",
            ),
          );

          console.error("Get warranty list error:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [keyword, statusFilter, refreshKey]);

  // ======================================================
  // CLOSE MODAL WITH ESCAPE
  // ======================================================

  useEffect(() => {
    if (!selectedWarranty) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedWarranty(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedWarranty]);

  // ======================================================
  // PAGINATION
  // ======================================================

  const totalPages = Math.max(
    1,
    Math.ceil(warranties.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedWarranties = warranties.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // ======================================================
  // STATISTICS
  // ======================================================

  const activeCount = statsWarranties.filter(
    (warranty) => warranty.status?.warranty_status_code === "ACTIVE",
  ).length;

  const expiredCount = statsWarranties.filter(
    (warranty) => warranty.status?.warranty_status_code === "EXPIRED",
  ).length;

  // ======================================================
  // ACTIONS
  // ======================================================

  const resetFilters = useCallback(() => {
    setKeyword("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  }, []);

  function retryLoad() {
    setRefreshKey((key) => key + 1);
  }

  function handleOpenDetail(warranty: Warranty) {
    setSelectedWarranty(warranty);
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>
      <div className="min-h-full space-y-6">

        {/* PAGE HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Quản trị hệ thống</span>
              <ChevronRight size={14} />
              <span className="font-medium text-blue-600">
                Quản lý bảo hành
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
              Quản lý bảo hành
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi thông tin bảo hành sản phẩm và lịch sử yêu cầu bảo hành, sửa chữa.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetFilters();
              retryLoad();
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Đặt lại bộ lọc
          </button>
        </div>

        {/* STATISTICS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          <StatCard
            title="Tổng bảo hành"
            value={statsWarranties.length}
            description="Tổng số bảo hành trong hệ thống"
            icon={<ShieldCheck size={23} />}
            color="blue"
            loading={statsLoading}
          />

          <StatCard
            title="Đang bảo hành"
            value={activeCount}
            description="Sản phẩm có trạng thái ACTIVE"
            icon={<ShieldCheck size={23} />}
            color="emerald"
            loading={statsLoading}
          />

          <StatCard
            title="Đã hết hạn"
            value={expiredCount}
            description="Sản phẩm có trạng thái EXPIRED"
            icon={<ShieldX size={23} />}
            color="rose"
            loading={statsLoading}
          />

        </div>

        {/* STATISTICS ERROR */}

        {statsError && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-amber-600"
            />

            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Không thể cập nhật thống kê
              </p>

              <p className="mt-1 text-sm text-amber-700">
                {statsError}
              </p>
            </div>

            <button
              type="button"
              onClick={retryLoad}
              className="text-sm font-semibold text-amber-800 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* WARRANTY LIST */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* SEARCH AND FILTER */}

          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Danh sách bảo hành
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Tìm kiếm, lọc và xem thông tin chi tiết bảo hành sản phẩm.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <div className="relative sm:w-80">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900"
                  />

                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Mã BH, đơn hàng, SKU, serial..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang bảo hành</option>
                  <option value="EXPIRED">Đã hết hạn</option>
                </select>

              </div>
            </div>
          </div>

          {/* WARRANTY TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">

              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th className="px-5 py-4">Mã bảo hành</th>
                  <th className="px-5 py-4">Đơn hàng</th>
                  <th className="px-5 py-4">Serial Number</th>
                  <th className="px-5 py-4">Thời hạn</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <LoaderCircle
                        className="mx-auto animate-spin text-blue-600"
                        size={28}
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        Đang tải danh sách bảo hành...
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <AlertCircle
                        size={26}
                        className="mx-auto text-rose-500"
                      />

                      <p className="mt-3 font-semibold text-rose-600">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={retryLoad}
                        className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Thử tải lại
                      </button>
                    </td>
                  </tr>
                ) : paginatedWarranties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Search
                        size={26}
                        className="mx-auto text-slate-400"
                      />

                      <p className="mt-3 font-semibold text-slate-700">
                        Không tìm thấy thông tin bảo hành
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Thử thay đổi từ khóa hoặc điều kiện lọc.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedWarranties.map((warranty) => {
                    const status =
                      warranty.status?.warranty_status_code ?? "";

                    return (
                      <tr
                        key={warranty.warranty_id}
                        className="transition hover:bg-slate-50/80"
                      >

                        {/* PRODUCT */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                              {warranty.warranty_product_image ? (
                                <img
                                  src={`/product/phone/${warranty.warranty_product_image}`}
                                  alt={warranty.warranty_product_name || "Sản phẩm"}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Package
                                  size={21}
                                  className="text-slate-400"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[230px] truncate font-semibold text-slate-800">
                                {warranty.warranty_product_name || "Chưa cập nhật tên sản phẩm"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                SKU: {warranty.warranty_sku}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                ID: {warranty.warranty_id}
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* WARRANTY CODE */}

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {warranty.warranty_code}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {warranty.warranty_duration_months} tháng
                          </p>
                        </td>

                        {/* ORDER */}

                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {warranty.order_code}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Order ID: {warranty.order_id}
                          </p>
                        </td>

                        {/* SERIAL */}

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">
                            {warranty.warranty_serial_number || "—"}
                          </p>
                        </td>

                        {/* WARRANTY PERIOD */}

                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">
                            {formatDate(warranty.warranty_start_date)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            đến {formatDate(warranty.warranty_end_date)}
                          </p>
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getWarrantyStatusStyle(status)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                status === "ACTIVE"
                                  ? "bg-emerald-500"
                                  : status === "EXPIRED"
                                    ? "bg-rose-500"
                                    : "bg-slate-400"
                              }`}
                            />

                            {getWarrantyStatusLabel(status)}
                          </span>

                          <p className="mt-1 text-xs text-slate-400">
                            {warranty.requests?.length ?? 0} yêu cầu
                          </p>
                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            title="Xem chi tiết bảo hành"
                            aria-label={`Xem chi tiết ${warranty.warranty_code}`}
                            onClick={() => handleOpenDetail(warranty)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={18} />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">

            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              <span className="font-semibold text-slate-700">
                {warranties.length === 0
                  ? 0
                  : (safePage - 1) * PAGE_SIZE + 1}
                {" - "}
                {Math.min(safePage * PAGE_SIZE, warranties.length)}
              </span>{" "}
              trên{" "}
              <span className="font-semibold text-slate-700">
                {warranties.length}
              </span>{" "}
              bảo hành
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={safePage <= 1 || loading}
                onClick={() => setCurrentPage((page) => page - 1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-20 text-center text-sm font-medium text-slate-600">
                Trang {safePage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safePage >= totalPages || loading}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>

            </div>
          </div>

        </section>
      </div>

      {/* ================================================== */}
      {/* WARRANTY DETAIL MODAL */}
      {/* ================================================== */}

      {selectedWarranty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedWarranty(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="warranty-detail-title"
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="warranty-detail-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Chi tiết bảo hành
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Thông tin bảo hành sản phẩm và lịch sử yêu cầu liên quan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                aria-label="Đóng cửa sổ"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL CONTENT */}

            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">

              {/* PRODUCT OVERVIEW */}

              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center">

                <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {selectedWarranty.warranty_product_image ? (
                    <img
                      src={
                        selectedWarranty.warranty_product_image
                            ? `/product/phone/${selectedWarranty.warranty_product_image}`
                            : "/images/no-image.png"
                        }
                      alt={selectedWarranty.warranty_product_name || "Sản phẩm"}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon
                      size={30}
                      className="text-slate-300"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-base font-bold text-slate-800">
                    {selectedWarranty.warranty_product_name || "Chưa cập nhật tên sản phẩm"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    SKU: {selectedWarranty.warranty_sku}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Mã bảo hành: {selectedWarranty.warranty_code}
                  </p>

                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getWarrantyStatusStyle(selectedWarranty.status?.warranty_status_code ?? "")}`}
                  >
                    {getWarrantyStatusLabel(
                      selectedWarranty.status?.warranty_status_code ?? "",
                    )}
                  </span>
                </div>

              </div>

              {/* WARRANTY INFORMATION */}

              <section>
                <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                  Thông tin bảo hành
                </h3>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

                  <DetailRow
                    icon={<ShieldCheck size={18} />}
                    label="Mã bảo hành"
                    value={selectedWarranty.warranty_code}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="ID bảo hành"
                    value={String(selectedWarranty.warranty_id)}
                  />

                  <DetailRow
                    icon={<Package size={18} />}
                    label="Tên sản phẩm"
                    value={selectedWarranty.warranty_product_name || "Chưa cập nhật"}
                  />

                  <DetailRow
                    icon={<Barcode size={18} />}
                    label="SKU"
                    value={selectedWarranty.warranty_sku}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="Serial Number"
                    value={selectedWarranty.warranty_serial_number || "Chưa cập nhật"}
                  />

                  <DetailRow
                    icon={<Clock size={18} />}
                    label="Thời hạn bảo hành"
                    value={`${selectedWarranty.warranty_duration_months} tháng`}
                  />

                  <DetailRow
                    icon={<CalendarDays size={18} />}
                    label="Ngày bắt đầu"
                    value={formatDate(selectedWarranty.warranty_start_date)}
                  />

                  <DetailRow
                    icon={<CalendarDays size={18} />}
                    label="Ngày kết thúc"
                    value={formatDate(selectedWarranty.warranty_end_date)}
                  />

                  <DetailRow
                    icon={<ShoppingBag size={18} />}
                    label="Mã đơn hàng"
                    value={selectedWarranty.order_code}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="ID đơn hàng"
                    value={String(selectedWarranty.order_id)}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="ID chi tiết đơn hàng"
                    value={String(selectedWarranty.order_item_id)}
                  />

                  <DetailRow
                    icon={<UserRound size={18} />}
                    label="ID khách hàng"
                    value={String(selectedWarranty.user_id)}
                  />

                  <DetailRow
                    icon={<CalendarDays size={18} />}
                    label="Ngày tạo bảo hành"
                    value={formatDateTime(selectedWarranty.warranty_created_at)}
                  />

                  <DetailRow
                    icon={<Clock size={18} />}
                    label="Cập nhật lần cuối"
                    value={formatDateTime(selectedWarranty.warranty_updated_at)}
                  />

                </div>
              </section>

              {/* WARRANTY PERIOD INFORMATION */}

              <section>
                <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                  Tình trạng thời hạn bảo hành
                </h3>

                {(() => {
                  const remainingDays = getRemainingDays(
                    selectedWarranty.warranty_end_date,
                  );

                  const isActive =
                    selectedWarranty.status?.warranty_status_code === "ACTIVE";

                  return (
                    <div
                      className={`rounded-xl border p-4 ${
                        isActive
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-rose-200 bg-rose-50/60"
                      }`}
                    >
                      <div className="flex items-start gap-3">

                        {isActive ? (
                          <ShieldCheck
                            size={22}
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />
                        ) : (
                          <ShieldAlert
                            size={22}
                            className="mt-0.5 shrink-0 text-rose-600"
                          />
                        )}

                        <div>
                          <p
                            className={`text-sm font-bold ${
                              isActive
                                ? "text-emerald-800"
                                : "text-rose-800"
                            }`}
                          >
                            {isActive
                              ? "Bảo hành đang có hiệu lực"
                              : "Bảo hành đã hết hạn"}
                          </p>

                          <p
                            className={`mt-1 text-sm ${
                              isActive
                                ? "text-emerald-700"
                                : "text-rose-700"
                            }`}
                          >
                            {remainingDays === null
                              ? "Không xác định được thời hạn bảo hành."
                              : remainingDays > 0
                                ? `Còn ${remainingDays} ngày bảo hành theo ngày kết thúc.`
                                : remainingDays === 0
                                  ? "Ngày hôm nay là ngày kết thúc bảo hành."
                                  : `Đã qua ngày kết thúc bảo hành ${Math.abs(remainingDays)} ngày.`}
                          </p>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* WARRANTY REQUEST HISTORY */}

              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">

                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <ClipboardList
                      size={18}
                      className="text-blue-600"
                    />
                    Lịch sử yêu cầu bảo hành / sửa chữa
                  </h3>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {selectedWarranty.requests?.length ?? 0} yêu cầu
                  </span>

                </div>

                {!selectedWarranty.requests ||
                selectedWarranty.requests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">

                    <FileText
                      size={28}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Chưa có yêu cầu bảo hành hoặc sửa chữa
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Các yêu cầu liên quan đến sản phẩm sẽ được hiển thị tại đây.
                    </p>

                  </div>
                ) : (
                  <div className="space-y-3">

                    {selectedWarranty.requests.map((request, index) => (
                      <div
                        key={request.warranty_request_id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >

                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

                          <div className="flex items-start gap-3">

                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                              {request.type?.warranty_request_type_code === "REPAIR" ? (
                                <Wrench size={19} />
                              ) : (
                                <ShieldCheck size={19} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="break-all text-sm font-bold text-slate-800">
                                {request.warranty_request_code}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Yêu cầu #{index + 1}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">

                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRequestTypeStyle(request.type?.warranty_request_type_code ?? "")}`}
                                >
                                  {getRequestTypeLabel(
                                    request.type?.warranty_request_type_code ?? "",
                                  )}
                                </span>

                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRequestStatusStyle(request.status?.warranty_request_status_code ?? "")}`}
                                >
                                  {getRequestStatusLabel(
                                    request.status?.warranty_request_status_code ?? "",
                                  )}
                                </span>

                              </div>
                            </div>

                          </div>

                          <p className="shrink-0 text-xs text-slate-400">
                            {formatDateTime(request.warranty_request_created_at)}
                          </p>

                        </div>

                        {/* REQUEST DESCRIPTION */}

                        <div className="mt-4 rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Mô tả yêu cầu
                          </p>

                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {request.warranty_request_description || "Không có mô tả"}
                          </p>
                        </div>

                        {/* REQUEST TIMELINE */}

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">

                          <div>
                            <p className="text-xs text-slate-400">
                              Ngày tiếp nhận
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {formatDateTime(request.warranty_request_received_at)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Ngày hoàn thành
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {formatDateTime(request.warranty_request_completed_at)}
                            </p>
                          </div>

                        </div>

                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-400">
                            Cập nhật lần cuối: {formatDateTime(request.warranty_request_updated_at)}
                          </p>
                        </div>

                      </div>
                    ))}

                  </div>
                )}
              </section>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>

          </section>
        </div>
      )}
    </>
  );
}

// ======================================================
// DETAIL ROW COMPONENT
// ======================================================

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5 shrink-0 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>
      </div>

    </div>
  );
}

// ======================================================
// STAT CARD COMPONENT
// ======================================================

function StatCard({
  title,
  value,
  description,
  icon,
  color,
  loading,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "rose";
  loading: boolean;
}) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      value: "text-slate-800",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      value: "text-emerald-600",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600",
      value: "text-rose-600",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-3">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          {loading ? (
            <LoaderCircle
              size={24}
              className="mt-3 animate-spin text-slate-400"
            />
          ) : (
            <p className={`mt-2 text-3xl font-bold ${styles[color].value}`}>
              {value}
            </p>
          )}
        </div>

        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${styles[color].icon}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}
