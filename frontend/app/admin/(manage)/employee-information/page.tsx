
"use client";

import { adminUserService } from "@/lib/axios/services/admin-services/user_service";
import { useCallback, useEffect, useState } from "react";

import {
  UserRound,
  IdCard,
  MapPin,
  ShieldCheck,
  CalendarDays,
  Clock,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  Fingerprint,
  BriefcaseBusiness,
} from "lucide-react";

interface EmployeeInformation {
  employee_code: string;
  employee_full_name: string;
  employee_gender: string;
  employee_date_of_birth: string;
  employee_address: string;
  employee_status: string;
  employee_created_at: string;
  employee_updated_at: string;
  roles: string[];
}

function formatDate(value?: string, includeTime = false) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Không hợp lệ";

  return new Intl.DateTimeFormat(
    "vi-VN",
    includeTime
      ? {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
  ).format(date);
}

function getGenderLabel(gender?: string) {
  switch (gender?.toUpperCase()) {
    case "MALE":
      return "Nam";
    case "FEMALE":
      return "Nữ";
    case "OTHER":
      return "Khác";
    default:
      return gender || "Chưa cập nhật";
  }
}

function getStatusInfo(status?: string) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return {
        label: "Đang hoạt động",
        className: "bg-emerald-400/20 text-emerald-50",
        dotClassName: "bg-emerald-300",
        textClassName: "bg-emerald-50 text-emerald-700",
      };
    case "INACTIVE":
      return {
        label: "Ngừng hoạt động",
        className: "bg-amber-400/20 text-amber-50",
        dotClassName: "bg-amber-300",
        textClassName: "bg-amber-50 text-amber-700",
      };
    case "BLOCKED":
      return {
        label: "Đã khóa",
        className: "bg-red-400/20 text-red-50",
        dotClassName: "bg-red-300",
        textClassName: "bg-red-50 text-red-700",
      };
    default:
      return {
        label: status || "Không xác định",
        className: "bg-white/20 text-white",
        dotClassName: "bg-white",
        textClassName: "bg-slate-100 text-slate-700",
      };
  }
}

function getRoleLabel(role: string) {
  switch (role.toUpperCase()) {
    case "ADMIN":
      return "Quản trị viên";
    case "MANAGER":
      return "Quản lý";
    case "EMPLOYEE":
      return "Nhân viên";
    case "CUSTOMER":
      return "Khách hàng";
    default:
      return role;
  }
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-slate-100 py-4 last:border-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Icon size={17} className="shrink-0 text-blue-600" />
        <span>{label}</span>
      </div>

      <div className="break-words text-sm font-semibold text-slate-800">
        {children || "Chưa cập nhật"}
      </div>
    </div>
  );
}

export default function EmployeeInformationPage() {
  const [employee, setEmployee] =
    useState<EmployeeInformation | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1. GET EMPLOYEE INFORMATION
  const fetchEmployeeInformation = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await adminUserService.getEmployeeInformation();

      const data = response?.data ?? response?.employee ?? response;

      if (
        !data ||
        typeof data !== "object" ||
        !("employee_code" in data)
      ) {
        throw new Error("Dữ liệu thông tin nhân viên không hợp lệ.");
      }

      setEmployee(data as EmployeeInformation);
    } catch (err) {
      console.error("Lỗi lấy thông tin nhân viên:", err);

      const errorResponse = err as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      };

      const message = errorResponse.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message ||
              "Không thể tải thông tin nhân viên. Vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployeeInformation();
  }, [fetchEmployeeInformation]);

  const statusInfo = getStatusInfo(employee?.employee_status);

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-slate-500">
          Trang chủ
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-blue-700">
            Thông tin nhân viên
          </span>
        </div>

        {/* Heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Thông tin nhân viên
            </h1>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Xem hồ sơ cá nhân và thông tin công tác của bạn.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchEmployeeInformation()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : (
              <RefreshCw size={17} />
            )}
            Làm mới
          </button>
        </div>

        {/* Loading */}
        {loading && !employee && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <LoaderCircle
              size={34}
              className="animate-spin text-blue-600"
            />

            <p className="mt-4 text-sm text-slate-500">
              Đang tải thông tin nhân viên...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && !employee && (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={28} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-800">
              Không thể tải thông tin
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void fetchEmployeeInformation()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Employee profile */}
        {employee && (
          <>
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-900/10 sm:p-8">
              <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />

              <div className="pointer-events-none absolute -bottom-32 right-1/4 h-64 w-64 rounded-full bg-white/5" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/15 shadow-inner sm:h-28 sm:w-28">
                  <UserRound size={54} strokeWidth={1.5} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="break-words text-2xl font-bold sm:text-3xl">
                      {employee.employee_full_name}
                    </h2>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${statusInfo.dotClassName}`}
                      />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
  <BriefcaseBusiness size={17} className="text-blue-100" />

  {employee.roles?.length ? (
    employee.roles.map((role) => (
      <span
        key={role}
        className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white"
      >
        {getRoleLabel(role)}
      </span>
    ))
  ) : (
    <span className="text-sm text-blue-100">
      Chưa có vai trò
    </span>
  )}
</div>

                  <div className="mt-4 flex flex-col gap-3 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:gap-6">
                    <span className="flex items-center gap-2">
                      <Fingerprint size={16} />
                      Mã nhân viên: {employee.employee_code}
                    </span>

                    <span className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span className="break-words">
                        {employee.employee_address || "Chưa cập nhật địa chỉ"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Summary cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Fingerprint size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      Mã nhân viên
                    </p>
                    <p className="mt-1 break-words font-bold text-slate-800">
                      {employee.employee_code}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <UserRound size={22} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Giới tính
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {getGenderLabel(employee.employee_gender)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={22} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Trạng thái
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {statusInfo.label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <CalendarDays size={22} />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Ngày sinh
                    </p>
                    <p className="mt-1 font-bold text-slate-800">
                      {formatDate(employee.employee_date_of_birth)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Detail panels */}
            <section className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[1.6fr_1fr]">
              {/* Personal information */}
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <IdCard size={21} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">
                      Hồ sơ cá nhân
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Thông tin cá nhân được lưu trong hệ thống
                    </p>
                  </div>
                </div>

                <div>
                  <InfoRow
                    icon={Fingerprint}
                    label="Mã nhân viên"
                  >
                    {employee.employee_code}
                  </InfoRow>

                  <InfoRow
                    icon={UserRound}
                    label="Họ và tên"
                  >
                    {employee.employee_full_name}
                  </InfoRow>

                  <InfoRow icon={ShieldCheck} label="Vai trò">
  <div className="flex flex-wrap gap-2">
    {employee.roles?.length ? (
      employee.roles.map((role) => (
        <span
          key={role}
          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
        >
          {getRoleLabel(role)}
        </span>
      ))
    ) : (
      "Chưa có vai trò"
    )}
  </div>
</InfoRow>

                  <InfoRow
                    icon={UserRound}
                    label="Giới tính"
                  >
                    {getGenderLabel(employee.employee_gender)}
                  </InfoRow>

                  <InfoRow
                    icon={CalendarDays}
                    label="Ngày sinh"
                  >
                    {formatDate(employee.employee_date_of_birth)}
                  </InfoRow>

                  <InfoRow
                    icon={MapPin}
                    label="Địa chỉ"
                  >
                    {employee.employee_address}
                  </InfoRow>

                  <InfoRow
                    icon={ShieldCheck}
                    label="Trạng thái nhân viên"
                  >
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.textClassName}`}
                    >
                      {statusInfo.label}
                    </span>
                  </InfoRow>
                </div>
              </div>

              {/* Profile summary */}
              <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-sky-100 text-blue-600 ring-8 ring-blue-50/70">
                    <UserRound size={58} strokeWidth={1.4} />
                  </div>

                  <h3 className="mt-6 break-words text-xl font-bold text-slate-900">
                    {employee.employee_full_name}
                  </h3>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
  {employee.roles?.length ? (
    employee.roles.map((role) => (
      <span
        key={role}
        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
      >
        {getRoleLabel(role)}
      </span>
    ))
  ) : (
    <span className="text-sm text-slate-500">
      Chưa có vai trò
    </span>
  )}
</div>

                  <div className="mt-7 w-full rounded-xl bg-blue-50/80 p-5 text-left">
                    <p className="text-sm font-semibold text-blue-900">
                      Hồ sơ nhân viên
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Thông tin hồ sơ cá nhân của bạn được quản lý
                      và lưu trữ trong hệ thống cửa hàng.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-100 p-4">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                    <Clock size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Cập nhật gần nhất
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {formatDate(employee.employee_updated_at, true)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* History */}
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={21} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Lịch sử hồ sơ
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Thời điểm tạo và cập nhật hồ sơ nhân viên
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
                <InfoRow
                  icon={CalendarDays}
                  label="Ngày tạo hồ sơ"
                >
                  {formatDate(employee.employee_created_at, true)}
                </InfoRow>

                <InfoRow
                  icon={RefreshCw}
                  label="Cập nhật lần cuối"
                >
                  {formatDate(employee.employee_updated_at, true)}
                </InfoRow>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
