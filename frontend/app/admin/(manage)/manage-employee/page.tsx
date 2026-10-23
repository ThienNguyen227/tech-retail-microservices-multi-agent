"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  AlertCircle,
  FilterX,
} from "lucide-react";

import { adminUserService } from "@/lib/axios/services/admin-services/user_service";

type Employee = {
  employee_id: string;
  employee_code: string;
  employee_full_name: string;
  employee_gender: string;
  employee_date_of_birth: string;
  employee_address: string;
  employee_status: string;
  employee_created_at: string;
  employee_updated_at: string;
  user: {
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone: string;
    user_status: string;
    roles: string[];
  };
};

const PAGE_SIZE = 8;

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("vi-VN");
}

function getGenderLabel(gender: string) {
  switch (gender?.toUpperCase()) {
    case "MALE":
      return "Nam";
    case "FEMALE":
      return "Nữ";
    case "OTHER":
      return "Khác";
    default:
      return gender || "—";
  }
}

function getStatusStyle(status: string) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "INACTIVE":
      return "bg-gray-100 text-gray-600 ring-gray-500/20";
    case "BLOCKED":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-gray-100 text-gray-600 ring-gray-500/20";
  }
}

function getStatusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "Hoạt động";
    case "INACTIVE":
      return "Không hoạt động";
    case "BLOCKED":
      return "Đã khóa";
    default:
      return status || "Không xác định";
  }
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ManageEmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await adminUserService.getEmployeeList({
        search: search || undefined,
        role: roleFilter || undefined,
        gender: genderFilter || undefined,
        status: statusFilter || undefined,
      });

      if (!Array.isArray(result)) {
        throw new Error("Dữ liệu danh sách nhân viên không hợp lệ.");
      }

      setEmployees(result as Employee[]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Không thể tải danh sách nhân viên.",
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi khi tải danh sách nhân viên.");
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, genderFilter, statusFilter]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  // Debounce tìm kiếm 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Lọc danh sách theo từ khóa, giới tính và trạng thái
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const keyword = [
        employee.employee_code,
        employee.employee_full_name,
        employee.user?.user_name,
        employee.user?.user_email,
        employee.user?.user_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || keyword.includes(search);

      const matchesGender =
        !genderFilter ||
        employee.employee_gender?.toUpperCase() === genderFilter;

      const matchesStatus =
        !statusFilter ||
        employee.employee_status?.toUpperCase() === statusFilter;

      return matchesSearch && matchesGender && matchesStatus;
    });
  }, [employees, search, genderFilter, statusFilter]);

  // Thống kê trên toàn bộ danh sách, không phụ thuộc bộ lọc
  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) =>
      employee.employee_status?.toUpperCase() === "ACTIVE",
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) =>
      employee.employee_status?.toUpperCase() === "INACTIVE",
  ).length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / PAGE_SIZE),
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedEmployees = filteredEmployees.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setRoleFilter("");
    setGenderFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, genderFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý nhân viên
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Theo dõi và tra cứu thông tin nhân viên trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadEmployees()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Làm mới
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Tổng nhân viên"
            value={totalEmployees}
            icon={<Users size={22} />}
            description="Tất cả nhân viên"
          />

          <StatCard
            title="Đang hoạt động"
            value={activeEmployees}
            icon={<UserCheck size={22} />}
            description="Trạng thái ACTIVE"
          />

          <StatCard
            title="Không hoạt động"
            value={inactiveEmployees}
            icon={<UserX size={22} />}
            description="Trạng thái INACTIVE"
          />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Danh sách nhân viên
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Tìm kiếm và lọc thông tin nhân viên.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(250px,1fr)_180px_180px_180px_auto]">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Mã NV, họ tên, email, số điện thoại..."
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Role */}
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả vai trò</option>
              <option value="EMPLOYEE">Nhân viên</option>
              <option value="MANAGER">Quản lý</option>
            </select>

            {/* Gender */}
            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả giới tính</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="BLOCKED">Đã khóa</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <FilterX size={16} />
              Xóa lọc
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Tìm thấy{" "}
            <span className="font-semibold text-gray-900">
              {filteredEmployees.length}
            </span>{" "}
            nhân viên
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={() => void loadEmployees()}
              className="self-start text-sm font-semibold text-red-700 hover:underline sm:self-auto"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <LoaderCircle
                size={32}
                className="animate-spin text-blue-600"
              />
              <p className="text-sm text-gray-500">
                Đang tải danh sách nhân viên...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-48 items-center justify-center px-4 text-sm text-gray-500">
              Không thể hiển thị danh sách nhân viên.
            </div>
          ) : paginatedEmployees.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <Users size={28} className="text-gray-400" />
              </div>

              <p className="mt-4 font-medium text-gray-800">
                Không tìm thấy nhân viên
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Thử thay đổi từ khóa tìm kiếm hoặc điều kiện lọc.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-left">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Nhân viên
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Thông tin tài khoản
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Vai trò
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Giới tính
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Ngày sinh
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {paginatedEmployees.map((employee) => (
                      <tr
                        key={employee.employee_id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* Employee information */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {employee.employee_full_name
                                ?.trim()
                                .charAt(0)
                                .toUpperCase() || "N"}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {employee.employee_full_name || "—"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Mã NV: {employee.employee_code || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Account information */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-800">
                            {employee.user?.user_name || "—"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {employee.user?.user_email || "—"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {employee.user?.user_phone || "—"}
                          </p>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {employee.user?.roles?.length ? (
                              employee.user.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">Chưa có vai trò</span>
                            )}
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {getGenderLabel(employee.employee_gender)}
                        </td>

                        {/* Date of birth */}
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(employee.employee_date_of_birth)}
                        </td>

                        {/* Employee status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyle(employee.employee_status)}`}
                          >
                            {getStatusLabel(employee.employee_status)}
                          </span>
                        </td>

                        {/* Created date */}
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(employee.employee_created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Hiển thị{" "}
                  <span className="font-medium text-gray-900">
                    {(safeCurrentPage - 1) * PAGE_SIZE + 1}
                  </span>
                  {" - "}
                  <span className="font-medium text-gray-900">
                    {Math.min(
                      safeCurrentPage * PAGE_SIZE,
                      filteredEmployees.length,
                    )}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-medium text-gray-900">
                    {filteredEmployees.length}
                  </span>{" "}
                  nhân viên
                </p>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Trước
                  </button>

                  <span className="px-2 text-sm text-gray-600">
                    Trang {safeCurrentPage}/{totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(totalPages, page + 1),
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
