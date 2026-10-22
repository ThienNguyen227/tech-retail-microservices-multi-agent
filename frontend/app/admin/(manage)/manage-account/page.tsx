"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  LoaderCircle,
  X,
  Mail,
  Phone,
  CalendarDays,
  Clock,
  UserRound,
} from "lucide-react";
import { adminUserService } from "@/lib/axios/services/admin-services/user_service";
import axios from "axios";

interface UserAccount {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_status: string;
  user_created_at: string;
  user_updated_at: string;
  roles: string[];
}

const PAGE_SIZE = 8;

function formatDate(date?: string) {
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
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-rose-50 text-rose-700";
}

function getRoleStyle(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-violet-50 text-violet-700";
    case "MANAGER":
      return "bg-blue-50 text-blue-700";
    case "EMPLOYEE":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function ManageAccountPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [statsUsers, setStatsUsers] = useState<UserAccount[]>([]);

  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Lấy dữ liệu tổng để thống kê
  useEffect(() => {
    let cancelled = false;

    adminUserService
      .getUserList()
      .then((data: UserAccount[]) => {
        if (!cancelled) {
          setStatsUsers(data);
        }
      })
      .catch((err: unknown) => {
        console.error("Get user statistics error:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Tìm kiếm và lọc bằng API backend
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params: {
          search?: string;
          role?: string;
          status?: string;
        } = {};

        if (keyword.trim()) params.search = keyword.trim();
        if (roleFilter !== "ALL") params.role = roleFilter;
        if (statusFilter !== "ALL") params.status = statusFilter;

        const data: UserAccount[] =
          await adminUserService.getUserList(params);

        if (!cancelled) {
          setUsers(data);
          setCurrentPage(1);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setUsers([]);

          if (axios.isAxiosError(err)) {
            const message = err.response?.data?.message;

            setError(
              Array.isArray(message)
                ? message.join(", ")
                : message || "Không thể tải danh sách tài khoản.",
            );
          } else {
            setError("Đã xảy ra lỗi không xác định.");
          }

          console.error("Get user list error:", err);
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
  }, [keyword, roleFilter, statusFilter, refreshKey]);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!selectedUser) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedUser(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedUser]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedUsers = users.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const activeCount = statsUsers.filter(
    (user) => user.user_status === "ACTIVE",
  ).length;

  const inactiveCount = statsUsers.length - activeCount;

  const resetFilters = useCallback(() => {
    setKeyword("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  }, []);

  function retryLoad() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <>
      <div className="min-h-full space-y-6">
        {/* Tiêu đề */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Quản trị hệ thống</span>
              <ChevronRight size={14} />
              <span className="font-medium text-blue-600">
                Quản lý tài khoản
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-800">
              Quản lý tài khoản
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi và quản lý tài khoản người dùng trong hệ thống.
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
            title="Tổng tài khoản"
            value={statsUsers.length}
            description="Tổng số tài khoản trong hệ thống"
            icon={<Users size={23} />}
            color="blue"
          />

          <StatCard
            title="Đang hoạt động"
            value={activeCount}
            description="Tài khoản có trạng thái ACTIVE"
            icon={<UserCheck size={23} />}
            color="emerald"
          />

          <StatCard
            title="Không hoạt động"
            value={inactiveCount}
            description="Tài khoản không có trạng thái ACTIVE"
            icon={<UserX size={23} />}
            color="rose"
          />
        </div>

        {/* Danh sách tài khoản */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Danh sách tài khoản
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tìm kiếm, lọc và theo dõi thông tin tài khoản.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-72">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tên, email hoặc số điện thoại..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  {/* <option value="LOCKED">LOCKED</option> */}
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bảng */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Tài khoản</th>
                  <th className="px-5 py-4">Số điện thoại</th>
                  <th className="px-5 py-4">Vai trò</th>
                  <th className="px-5 py-4">Ngày tạo</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <LoaderCircle
                        className="mx-auto animate-spin text-blue-600"
                        size={28}
                      />
                      <p className="mt-3 text-sm text-slate-500">
                        Đang tải danh sách tài khoản...
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <p className="font-semibold text-rose-600">
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
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Search
                        size={24}
                        className="mx-auto text-slate-400"
                      />
                      <p className="mt-3 font-semibold text-slate-700">
                        Không tìm thấy tài khoản
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Thử thay đổi từ khóa hoặc điều kiện lọc.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user.user_id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                            {user.user_name?.charAt(0).toUpperCase() ?? "?"}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800">
                              {user.user_name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {user.user_email}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              ID: {user.user_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.user_phone}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${getRoleStyle(role)}`}
                            >
                              {role === "ADMIN" && (
                                <ShieldCheck size={13} />
                              )}
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(user.user_created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(user.user_status)}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.user_status === "ACTIVE"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {user.user_status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          title="Xem chi tiết"
                          aria-label={`Xem chi tiết ${user.user_name}`}
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              Hiển thị{" "}
              <span className="font-semibold text-slate-700">
                {users.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
                {" - "}
                {Math.min(safePage * PAGE_SIZE, users.length)}
              </span>{" "}
              trên{" "}
              <span className="font-semibold text-slate-700">
                {users.length}
              </span>{" "}
              tài khoản
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

      {/* Modal chi tiết tài khoản */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header modal */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="user-detail-title"
                  className="text-lg font-bold text-slate-800"
                >
                  Chi tiết tài khoản
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thông tin tài khoản người dùng trong hệ thống.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Đóng cửa sổ"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Thông tin người dùng */}
            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-600">
                  {selectedUser.user_name?.charAt(0).toUpperCase() ?? "?"}
                </div>

                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-slate-800">
                    {selectedUser.user_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Mã tài khoản: {selectedUser.user_id}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(selectedUser.user_status)}`}
                  >
                    {selectedUser.user_status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <DetailRow
                  icon={<UserRound size={18} />}
                  label="ID tài khoản"
                  value={selectedUser.user_id}
                />

                <DetailRow
                  icon={<Mail size={18} />}
                  label="Email"
                  value={selectedUser.user_email}
                />

                <DetailRow
                  icon={<Phone size={18} />}
                  label="Số điện thoại"
                  value={selectedUser.user_phone}
                />

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-500">
                    Vai trò
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${getRoleStyle(role)}`}
                        >
                          {role === "ADMIN" && <ShieldCheck size={14} />}
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">
                        Chưa được gán vai trò
                      </span>
                    )}
                  </div>
                </div>

                <DetailRow
                  icon={<CalendarDays size={18} />}
                  label="Ngày tạo tài khoản"
                  value={formatDate(selectedUser.user_created_at)}
                />

                <DetailRow
                  icon={<Clock size={18} />}
                  label="Cập nhật lần cuối"
                  value={formatDate(selectedUser.user_updated_at)}
                />
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
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
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "rose";
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${styles[color].value}`}>
            {value}
          </p>
        </div>

        <div
          className={`grid h-12 w-12 place-items-center rounded-xl ${styles[color].icon}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
}
