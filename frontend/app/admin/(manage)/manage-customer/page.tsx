
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  LoaderCircle,
  X,
  CalendarDays,
  Clock,
  UserRound,
  MapPin,
  MapPinned,
  CheckCircle2,
  Hash,
  VenusAndMars,
  AlertCircle,
  Pencil,
  Save,
} from "lucide-react";
import axios from "axios";
import { adminCustomerService } from "@/lib/axios/services/admin-services/customer_service";

interface CustomerAddress {
  customer_address_id: string;
  customer_address_customer_id: string;
  customer_address_line: string;
  customer_address_ward: string | null;
  customer_address_province: string | null;
  customer_address_default: boolean;
  customer_address_created_at: string;
  customer_address_updated_at: string;
}

interface Customer {
  customer_id: string;
  customer_user_id: string;
  customer_code: string;
  customer_full_name: string | null;
  customer_date_of_birth: string | null;
  customer_gender: string | null;
  customer_status: string;
  customer_created_at: string;
  customer_updated_at: string;
  addresses: CustomerAddress[];
}

interface UpdateCustomerListDto {
  customer_code?: string;
  customer_full_name?: string;
  customer_date_of_birth?: string;
  customer_gender?: string;
  customer_status?: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

const PAGE_SIZE = 8;

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

function getStatusStyle(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "bg-amber-50 text-amber-700";
    case "BLOCKED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Đang hoạt động";
    case "INACTIVE":
      return "Không hoạt động";
    case "BLOCKED":
      return "Đã khóa";
    default:
      return status || "Không xác định";
  }
}

function getGenderLabel(gender: string | null) {
  switch (gender) {
    case "MALE":
      return "Nam";
    case "FEMALE":
      return "Nữ";
    case "OTHER":
      return "Khác";
    default:
      return "—";
  }
}

function getAddressText(address: CustomerAddress) {
  return [
    address.customer_address_line,
    address.customer_address_ward,
    address.customer_address_province,
  ]
    .filter((part) => Boolean(part?.trim()))
    .join(", ");
}

function getInitial(name: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "K";
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

export default function ManageCustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statsCustomers, setStatsCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statsError, setStatsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // 2. (PATCH) CUSTOMER-LIST
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<UpdateCustomerListDto>({
    customer_code: "",
    customer_full_name: "",
    customer_date_of_birth: "",
    customer_gender: "MALE",
    customer_status: "ACTIVE",
  });

  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  function handleOpenEditModal(customer: Customer) {
    setEditingCustomer(customer);

    setEditForm({
      customer_code: customer.customer_code,
      customer_full_name: customer.customer_full_name ?? "",
      customer_date_of_birth: customer.customer_date_of_birth?.slice(0, 10) ?? "",
      customer_gender: customer.customer_gender ?? "MALE",
      customer_status: customer.customer_status as | "ACTIVE" | "INACTIVE" | "BLOCKED",
    });

    setEditError("");
  }

  async function handleUpdateCustomer(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingCustomer || saving) return;

    const customerCode = editForm.customer_code?.trim() ?? "";
    const customerName = editForm.customer_full_name?.trim() ?? "";

    if (!customerCode || !customerName) {
      setEditError("Mã khách hàng và họ tên không được để trống.");
      return;
    }

    if (!editForm.customer_date_of_birth) {
      setEditError("Vui lòng chọn ngày sinh.");
      return;
    }

    if (!editForm.customer_gender) {
      setEditError("Vui lòng chọn giới tính.");
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      await adminCustomerService.updateCustomer(
        editingCustomer.customer_id,
        {
          ...editForm,
          customer_code: customerCode,
          customer_full_name: customerName,
        },
      );
      setSuccess("Cập nhật thông tin khách hàng thành công!")
      setEditingCustomer(null);
      setRefreshKey((key) => key + 1);
    } catch (err: unknown) {
      setEditError(
        extractErrorMessage(
          err,
          "Không thể cập nhật thông tin khách hàng.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  // Lấy dữ liệu tổng để thống kê
  useEffect(() => {
    let cancelled = false;

    async function loadStatistics() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const data: Customer[] =
          await adminCustomerService.getCustomerList();

        if (!cancelled) {
          setStatsCustomers(Array.isArray(data) ? data : []);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setStatsError(
            extractErrorMessage(
              err,
              "Không thể tải dữ liệu thống kê khách hàng.",
            ),
          );
          console.error("Get customer statistics error:", err);
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

  // Tìm kiếm và lọc khách hàng bằng API backend
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params: {
          search?: string;
          status?: string;
        } = {};

        if (keyword.trim()) {
          params.search = keyword.trim();
        }

        if (statusFilter !== "ALL") {
          params.status = statusFilter;
        }

        const data: Customer[] =
          await adminCustomerService.getCustomerList(params);

        if (!cancelled) {
          setCustomers(Array.isArray(data) ? data : []);
          setCurrentPage(1);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setCustomers([]);
          setError(
            extractErrorMessage(
              err,
              "Không thể tải danh sách khách hàng.",
            ),
          );

          console.error("Get customer list error:", err);
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

  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!selectedCustomer) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCustomer(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCustomer]);

  const totalPages = Math.max(
    1,
    Math.ceil(customers.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedCustomers = customers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const activeCount = statsCustomers.filter(
    (customer) => customer.customer_status === "ACTIVE",
  ).length;

  const inactiveCount = statsCustomers.filter(
    (customer) => customer.customer_status !== "ACTIVE",
  ).length;

  const resetFilters = useCallback(() => {
    setKeyword("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  }, []);

  function retryLoad() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <>
      <div className="min-h-full space-y-6">
        {/* Tiêu đề trang */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Quản trị hệ thống</span>
              <ChevronRight size={14} />
              <span className="font-medium text-blue-600">
                Quản lý khách hàng
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
              Quản lý khách hàng
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi thông tin khách hàng và địa chỉ giao hàng trong hệ thống.
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

        {/* Thống kê */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Tổng khách hàng"
            value={statsCustomers.length}
            description="Tổng số khách hàng trong hệ thống"
            icon={<Users size={23} />}
            color="blue"
            loading={statsLoading}
          />

          <StatCard
            title="Đang hoạt động"
            value={activeCount}
            description="Khách hàng có trạng thái ACTIVE"
            icon={<UserCheck size={23} />}
            color="emerald"
            loading={statsLoading}
          />

          <StatCard
            title="Không hoạt động"
            value={inactiveCount}
            description="Khách hàng không có trạng thái ACTIVE"
            icon={<UserX size={23} />}
            color="rose"
            loading={statsLoading}
          />
        </div>

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

        {/* Success message */}
        {success && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="ml-auto rounded p-1 hover:bg-emerald-100"
              aria-label="Đóng thông báo"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Danh sách khách hàng */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Danh sách khách hàng
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tìm kiếm, lọc và xem thông tin chi tiết khách hàng.
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
                    placeholder="Mã khách hàng hoặc họ tên..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                  <option value="BLOCKED">Đã khóa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bảng khách hàng */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Giới tính</th>
                  <th className="px-5 py-4">Ngày sinh</th>
                  <th className="px-5 py-4">Địa chỉ</th>
                  <th className="px-5 py-4">Ngày tạo</th>
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
                        Đang tải danh sách khách hàng...
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
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <Search
                        size={26}
                        className="mx-auto text-slate-400"
                      />
                      <p className="mt-3 font-semibold text-slate-700">
                        Không tìm thấy khách hàng
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Thử thay đổi từ khóa hoặc điều kiện lọc.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => {
                    const defaultAddress =
                      customer.addresses?.find(
                        (address) => address.customer_address_default,
                      ) ?? customer.addresses?.[0];

                    return (
                      <tr
                        key={customer.customer_id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                              {getInitial(customer.customer_full_name)}
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800">
                                {customer.customer_full_name || "Chưa cập nhật"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {customer.customer_code}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                ID: {customer.customer_id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {getGenderLabel(customer.customer_gender)}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(customer.customer_date_of_birth)}
                        </td>

                        <td className="max-w-[240px] px-5 py-4">
                          {defaultAddress ? (
                            <div className="flex items-start gap-2">
                              <MapPin
                                size={16}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm text-slate-600">
                                  {getAddressText(defaultAddress) || "Chưa cập nhật"}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {customer.addresses.length} địa chỉ
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              Chưa có địa chỉ
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(customer.customer_created_at)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(customer.customer_status)}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                customer.customer_status === "ACTIVE"
                                  ? "bg-emerald-500"
                                  : customer.customer_status === "INACTIVE"
                                    ? "bg-amber-500"
                                    : customer.customer_status === "BLOCKED"
                                      ? "bg-rose-500"
                                      : "bg-slate-400"
                              }`}
                            />
                            {getStatusLabel(customer.customer_status)}
                          </span>
                        </td>

                        {/* <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            title="Xem chi tiết khách hàng"
                            aria-label={`Xem chi tiết ${customer.customer_full_name || customer.customer_code}`}
                            onClick={() => setSelectedCustomer(customer)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={18} />
                          </button>
                        </td> */}
                        <td className="px-5 py-4">
  <div className="flex items-center justify-center gap-1">
    <button
      type="button"
      title="Chỉnh sửa khách hàng"
      aria-label={`Chỉnh sửa ${customer.customer_full_name || customer.customer_code}`}
      onClick={() => handleOpenEditModal(customer)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
    >
      <Pencil size={18} />
    </button>

    <button
      type="button"
      title="Xem chi tiết khách hàng"
      aria-label={`Xem chi tiết ${customer.customer_full_name || customer.customer_code}`}
      onClick={() => setSelectedCustomer(customer)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
    >
      <Eye size={18} />
    </button>
  </div>
</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              <span className="font-semibold text-slate-700">
                {customers.length === 0
                  ? 0
                  : (safePage - 1) * PAGE_SIZE + 1}
                {" - "}
                {Math.min(safePage * PAGE_SIZE, customers.length)}
              </span>{" "}
              trên{" "}
              <span className="font-semibold text-slate-700">
                {customers.length}
              </span>{" "}
              khách hàng
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

      {/* Modal chi tiết khách hàng */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCustomer(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-detail-title"
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="customer-detail-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Chi tiết khách hàng
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thông tin cá nhân và địa chỉ khách hàng.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Đóng cửa sổ"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nội dung */}
            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
              {/* Thông tin tổng quan */}
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-600">
                  {getInitial(selectedCustomer.customer_full_name)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-lg font-bold text-slate-800">
                    {selectedCustomer.customer_full_name || "Chưa cập nhật họ tên"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Mã khách hàng: {selectedCustomer.customer_code}
                  </p>

                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(selectedCustomer.customer_status)}`}
                  >
                    {getStatusLabel(selectedCustomer.customer_status)}
                  </span>
                </div>
              </div>

              {/* Thông tin cá nhân */}
              <section>
                <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold text-slate-700">
                  Thông tin cá nhân
                </h3>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <DetailRow
                    icon={<UserRound size={18} />}
                    label="Họ và tên"
                    value={selectedCustomer.customer_full_name || "Chưa cập nhật"}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="Mã khách hàng"
                    value={selectedCustomer.customer_code}
                  />

                  <DetailRow
                    icon={<UserRound size={18} />}
                    label="ID khách hàng"
                    value={selectedCustomer.customer_id}
                  />

                  <DetailRow
                    icon={<Hash size={18} />}
                    label="ID tài khoản người dùng"
                    value={selectedCustomer.customer_user_id}
                  />

                  <DetailRow
                    icon={<VenusAndMars size={18} />}
                    label="Giới tính"
                    value={getGenderLabel(selectedCustomer.customer_gender)}
                  />

                  <DetailRow
                    icon={<CalendarDays size={18} />}
                    label="Ngày sinh"
                    value={formatDate(selectedCustomer.customer_date_of_birth)}
                  />

                  <DetailRow
                    icon={<CalendarDays size={18} />}
                    label="Ngày tạo hồ sơ"
                    value={formatDateTime(selectedCustomer.customer_created_at)}
                  />

                  <DetailRow
                    icon={<Clock size={18} />}
                    label="Cập nhật lần cuối"
                    value={formatDateTime(selectedCustomer.customer_updated_at)}
                  />
                </div>
              </section>

              {/* Danh sách địa chỉ */}
              <section>
                <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <MapPinned size={18} className="text-blue-600" />
                    Địa chỉ khách hàng
                  </h3>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {selectedCustomer.addresses?.length ?? 0} địa chỉ
                  </span>
                </div>

                {!selectedCustomer.addresses ||
                selectedCustomer.addresses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                    <MapPin
                      size={26}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Khách hàng chưa có địa chỉ
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Chưa có thông tin địa chỉ được lưu trong hệ thống.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.addresses.map((address, index) => (
                      <div
                        key={address.customer_address_id}
                        className={`rounded-xl border p-4 ${
                          address.customer_address_default
                            ? "border-blue-200 bg-blue-50/50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                              address.customer_address_default
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <MapPin size={19} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-800">
                                Địa chỉ {index + 1}
                              </p>

                              {address.customer_address_default && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                  <CheckCircle2 size={12} />
                                  Mặc định
                                </span>
                              )}
                            </div>

                            <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                              {getAddressText(address) || "Chưa cập nhật địa chỉ"}
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              Mã địa chỉ: {address.customer_address_id}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Ngày tạo: {formatDateTime(address.customer_address_created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Modal chỉnh sửa khách hàng */}
{editingCustomer && (
  <div
    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) {
        setEditingCustomer(null);
      }
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-edit-title"
      className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2
            id="customer-edit-title"
            className="text-lg font-bold text-slate-800"
          >
            Chỉnh sửa khách hàng
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Cập nhật thông tin khách hàng trong hệ thống.
          </p>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => setEditingCustomer(null)}
          aria-label="Đóng modal chỉnh sửa"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleUpdateCustomer}>
        <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
          {/* Mã khách hàng */}
          <div>
            <label
              htmlFor="customer_code"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Mã khách hàng <span className="text-rose-500">*</span>
            </label>

            <input
              id="customer_code"
              type="text"
              required
              maxLength={50}
              value={editForm.customer_code ?? ""}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  customer_code: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Nhập mã khách hàng"
            />
          </div>

          {/* Họ tên */}
          <div>
            <label
              htmlFor="customer_full_name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Họ và tên <span className="text-rose-500">*</span>
            </label>

            <input
              id="customer_full_name"
              type="text"
              required
              maxLength={100}
              value={editForm.customer_full_name ?? ""}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  customer_full_name: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Ngày sinh */}
          <div>
            <label
              htmlFor="customer_date_of_birth"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Ngày sinh <span className="text-rose-500">*</span>
            </label>

            <input
              id="customer_date_of_birth"
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              value={editForm.customer_date_of_birth ?? ""}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  customer_date_of_birth: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Giới tính */}
          <div>
            <label
              htmlFor="customer_gender"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Giới tính <span className="text-rose-500">*</span>
            </label>

            <select
              id="customer_gender"
              required
              value={editForm.customer_gender ?? ""}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  customer_gender: event.target.value,
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div>
            <label
              htmlFor="customer_status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Trạng thái <span className="text-rose-500">*</span>
            </label>

            <select
              id="customer_status"
              required
              value={editForm.customer_status ?? ""}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  customer_status: event.target.value as
                    | "ACTIVE"
                    | "INACTIVE"
                    | "BLOCKED",
                }))
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="BLOCKED">Đã khóa</option>
            </select>
          </div>

          {editError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-rose-600"
              />
              <p className="text-sm text-rose-700">{editError}</p>
            </div>
          )}
        </div>

        

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => setEditingCustomer(null)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <LoaderCircle size={16} className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={16} />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  </div>
)}
    </>
  );
}

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
      <div className="mt-0.5 shrink-0 text-slate-400">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

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
          <p className="text-sm font-medium text-slate-500">{title}</p>

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

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
}
