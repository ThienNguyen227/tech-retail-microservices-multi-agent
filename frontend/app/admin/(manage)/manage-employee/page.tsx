"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
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
  Pencil,
  X,
  Save,
  CheckCircle2,
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

type EmployeeForm = {
  employee_code: string;
  employee_full_name: string;
  employee_gender: string;
  employee_date_of_birth: string;
  employee_address: string;
  employee_status: string;
  roles: string[];
};

const PAGE_SIZE = 8;

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-gray-700";

const INITIAL_FORM: EmployeeForm = {
  employee_code: "",
  employee_full_name: "",
  employee_gender: "MALE",
  employee_date_of_birth: "",
  employee_address: "",
  employee_status: "ACTIVE",
  roles: [],
};

function formatDate(value: string) {
  if (!value) return "—";

  // Tránh lệch ngày khi dữ liệu ngày sinh có dạng YYYY-MM-DD.
  const dateOnly = value.slice(0, 10);
  const date = new Date(`${dateOnly}T00:00:00`);

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

function getRoleLabel(role: string) {
  switch (role) {
    case "EMPLOYEE":
      return "Nhân viên";
    case "MANAGER":
      return "Quản lý";
    case "ADMIN":
      return "Quản trị viên";
    case "CUSTOMER":
      return "Khách hàng";
    default:
      return role;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
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
  const [roleFilter, setRoleFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [editForm, setEditForm] = useState<EmployeeForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Tải danh sách nhân viên theo bộ lọc.
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
      setError(
        getErrorMessage(err, "Không thể tải danh sách nhân viên."),
      );
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, genderFilter, statusFilter]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  // Debounce tìm kiếm 300ms.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Đưa về trang đầu khi thay đổi bộ lọc.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, genderFilter, statusFilter]);

  // Lọc bổ sung trên dữ liệu đã tải.
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

      const matchesRole =
        !roleFilter || employee.user?.roles?.includes(roleFilter);

      const matchesGender =
        !genderFilter ||
        employee.employee_gender?.toUpperCase() === genderFilter;

      const matchesStatus =
        !statusFilter ||
        employee.employee_status?.toUpperCase() === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesGender &&
        matchesStatus
      );
    });
  }, [employees, search, roleFilter, genderFilter, statusFilter]);

  const totalEmployees = employees.length;

  const activeEmployees = employees.filter(
    (employee) => employee.employee_status?.toUpperCase() === "ACTIVE",
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.employee_status?.toUpperCase() === "INACTIVE",
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

  const handleOpenEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditError("");
    setSuccess("");

    setEditForm({
      employee_code: employee.employee_code ?? "",
      employee_full_name: employee.employee_full_name ?? "",
      employee_gender: employee.employee_gender ?? "MALE",
      employee_date_of_birth: employee.employee_date_of_birth
        ? employee.employee_date_of_birth.slice(0, 10)
        : "",
      employee_address: employee.employee_address ?? "",
      employee_status: employee.employee_status ?? "ACTIVE",
      roles: employee.user?.roles ?? [],
    });
  };

  const handleCloseEditModal = () => {
    if (saving) return;

    setSelectedEmployee(null);
    setEditError("");
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    setEditForm((previous) => ({
      ...previous,
      roles: checked
        ? [...new Set([...previous.roles, role])]
        : previous.roles.filter((item) => item !== role),
    }));
  };

  const handleSaveEmployee = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedEmployee) return;

    setEditError("");
    setSuccess("");

    if (!editForm.employee_code.trim()) {
      setEditError("Vui lòng nhập mã nhân viên.");
      return;
    }

    if (!editForm.employee_full_name.trim()) {
      setEditError("Vui lòng nhập họ và tên.");
      return;
    }

    if (!editForm.employee_date_of_birth) {
      setEditError("Vui lòng chọn ngày sinh.");
      return;
    }

    if (!editForm.employee_address.trim()) {
      setEditError("Vui lòng nhập địa chỉ.");
      return;
    }

    if (editForm.roles.length === 0) {
      setEditError("Vui lòng chọn ít nhất một vai trò.");
      return;
    }

    try {
      setSaving(true);

      await adminUserService.updateEmployee(
        selectedEmployee.employee_id,
        {
          ...editForm,
          employee_code: editForm.employee_code.trim(),
          employee_full_name: editForm.employee_full_name.trim(),
          employee_address: editForm.employee_address.trim(),
        },
      );

      setSelectedEmployee(null);
      setSuccess("Cập nhật thông tin nhân viên thành công!");

      await loadEmployees();
    } catch (err: unknown) {
      setEditError(
        getErrorMessage(
          err,
          "Đã xảy ra lỗi khi cập nhật thông tin nhân viên.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

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

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Tổng nhân viên"
            value={totalEmployees}
            icon={<Users size={22} />}
            description="Nhân viên trong danh sách đã tải"
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
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Tất cả vai trò</option>
              <option value="EMPLOYEE">Nhân viên</option>
              <option value="MANAGER">Quản lý</option>
            </select>

            {/* Gender filter */}
            <select
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Tất cả giới tính</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
              <option value="BLOCKED">Đã khóa</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
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

        {/* Loading / Error */}
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

        {/* Employee table */}
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
                      {[
                        "Nhân viên",
                        "Thông tin tài khoản",
                        "Vai trò",
                        "Giới tính",
                        "Ngày sinh",
                        "Trạng thái",
                        "Ngày tạo",
                        "Hành động",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {paginatedEmployees.map((employee) => (
                      <tr
                        key={employee.employee_id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* Employee */}
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

                        {/* Account */}
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

                        {/* Roles */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {employee.user?.roles?.length ? (
                              employee.user.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                >
                                  {getRoleLabel(role)}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">
                                Chưa có vai trò
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {getGenderLabel(employee.employee_gender)}
                        </td>

                        {/* Date of birth */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {formatDate(employee.employee_date_of_birth)}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusStyle(employee.employee_status)}`}
                          >
                            {getStatusLabel(employee.employee_status)}
                          </span>
                        </td>

                        {/* Created date */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {formatDate(employee.employee_created_at)}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(employee)}
                            title="Chỉnh sửa nhân viên"
                            aria-label={`Chỉnh sửa ${employee.employee_full_name}`}
                            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            <Pencil size={16} />
                          </button>
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
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Trước
                  </button>

                  <span className="whitespace-nowrap px-2 text-sm text-gray-600">
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
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* (MODAL) PATCH EMPLOYEE-LIST  */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/60 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseEditModal();
            }
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Chỉnh sửa thông tin nhân viên
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Cập nhật thông tin và vai trò nhân viên.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={saving}
                aria-label="Đóng modal"
                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSaveEmployee}>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto bg-white px-6 py-5">
                {/* Employee identity */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Đang chỉnh sửa
                  </p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedEmployee.employee_full_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Mã nhân viên hiện tại: {selectedEmployee.employee_code}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Employee code */}
                  <div>
                    <label className={LABEL_CLASS}>Mã nhân viên</label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={editForm.employee_code}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          employee_code: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                      placeholder="Nhập mã nhân viên"
                    />
                  </div>

                  {/* Full name */}
                  <div>
                    <label className={LABEL_CLASS}>Họ và tên</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={editForm.employee_full_name}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          employee_full_name: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                      placeholder="Nhập họ và tên"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className={LABEL_CLASS}>Giới tính</label>
                    <select
                      value={editForm.employee_gender}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          employee_gender: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  {/* Date of birth */}
                  <div>
                    <label className={LABEL_CLASS}>Ngày sinh</label>
                    <input
                      type="date"
                      required
                      value={editForm.employee_date_of_birth}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          employee_date_of_birth: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className={LABEL_CLASS}>Trạng thái</label>
                    <select
                      value={editForm.employee_status}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          employee_status: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="INACTIVE">Không hoạt động</option>
                      <option value="BLOCKED">Đã khóa</option>
                    </select>
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>Địa chỉ</label>
                    <input
                      type="text"
                      required
                      maxLength={255}
                      value={editForm.employee_address}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          employee_address: event.target.value,
                        }))
                      }
                      className={INPUT_CLASS}
                      placeholder="Nhập địa chỉ"
                    />
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <label className={LABEL_CLASS}>Vai trò</label>

                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                    {["EMPLOYEE", "MANAGER"].map((role) => {
                      const checked = editForm.roles.includes(role);

                      return (
                        <label
                          key={role}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition ${
                            checked
                              ? "border-blue-300 bg-blue-50 text-blue-800"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              handleRoleChange(role, event.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300 accent-blue-600 focus:ring-blue-500"
                          />

                          <span className="font-medium">
                            {getRoleLabel(role)}
                          </span>

                          {checked && (
                            <CheckCircle2
                              size={16}
                              className="ml-auto text-blue-600"
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Có thể chọn nhiều vai trò. Danh sách vai trò sau khi lưu
                    sẽ thay thế các vai trò hiện tại của tài khoản.
                  </p>
                </div>

                {editError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

              </div>

              {/* Modal footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>
        </div>
      )}
    </div>
  );
}