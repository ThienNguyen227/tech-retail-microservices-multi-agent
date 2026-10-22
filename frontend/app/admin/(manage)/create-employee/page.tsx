"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  Users,
  Eye,
  EyeOff,
  Mail,
  Phone,
  LockKeyhole,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Info,
  Save,
  LoaderCircle,
  ChevronDown,
} from "lucide-react";
import { adminUserService } from "@/lib/axios/services/admin-services/user_service";

type EmployeeForm = {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_password: string;
  confirm_password: string;
  role_name: string;
  user_status: "ACTIVE" | "INACTIVE";
  employee_full_name: string;
  employee_gender: string;
  employee_date_of_birth: string;
  employee_address: string;
  employee_status: "ACTIVE" | "INACTIVE";
};

const initialForm: EmployeeForm = {
  user_name: "",
  user_email: "",
  user_phone: "",
  user_password: "",
  confirm_password: "",
  role_name: "EMPLOYEE",
  user_status: "ACTIVE",
  employee_full_name: "",
  employee_gender: "",
  employee_date_of_birth: "",
  employee_address: "",
  employee_status: "ACTIVE",
};

export default function CreateEmployeePage() {
  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(field: keyof EmployeeForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.user_password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (form.user_password !== form.confirm_password) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!form.employee_date_of_birth) {
      setError("Vui lòng chọn ngày sinh nhân viên.");
      return;
    }

    if (new Date(form.employee_date_of_birth) >= new Date()) {
      setError("Ngày sinh phải nhỏ hơn ngày hiện tại.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        user_name: form.user_name.trim(),
        user_email: form.user_email.trim(),
        user_phone: form.user_phone.trim(),
        user_password: form.user_password,
        user_status: form.user_status,
        role_name: form.role_name,
        employee_full_name: form.employee_full_name.trim(),
        employee_gender: form.employee_gender,
        employee_date_of_birth: form.employee_date_of_birth,
        employee_address: form.employee_address.trim(),
        employee_status: form.employee_status,
      };

      const response = await adminUserService.createEmployee(payload);

      setSuccess(response.message || "Tạo nhân viên thành công.");

      setForm(initialForm);
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      };

      const message = error.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Không thể tạo nhân viên. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm(initialForm);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setSuccess("");
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  const labelClass = "text-sm font-medium text-slate-700";

  return (
    <div className="min-h-screen bg-slate-50/80 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/admin/dashboard"
            className="transition hover:text-blue-600"
          >
            Tổng quan
          </Link>
          <span>/</span>
          <Link
            href="/admin/manage-account"
            className="transition hover:text-blue-600"
          >
            Quản lý tài khoản
          </Link>
          <span>/</span>
          <span className="font-medium text-blue-600">
            Tạo tài khoản nhân viên
          </span>
        </div>

        {/* Page heading */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
              Tạo tài khoản nhân viên
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Nhập thông tin tài khoản và hồ sơ nhân viên mới.
            </p>
          </div>

          <Link
            href="/admin/manage-account"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <ArrowLeft size={17} />
            Quay lại
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Hai khung xếp theo chiều dọc */}
          <div className="flex flex-col gap-6">
            {/* ACCOUNT INFORMATION */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserRound size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Thông tin tài khoản
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Thông tin đăng nhập và phân quyền
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {/* Account name */}
                <div>
                  <label className={labelClass}>
                    Tên tài khoản <Required />
                  </label>
                  <div className="relative">
                    <UserRound
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      required
                      maxLength={50}
                      autoComplete="username"
                      className={`${inputClass} pl-10`}
                      placeholder="Nhập tên tài khoản"
                      value={form.user_name}
                      onChange={(e) =>
                        handleChange("user_name", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Email and phone */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Email <Required />
                    </label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        type="email"
                        maxLength={255}
                        autoComplete="email"
                        className={`${inputClass} pl-10`}
                        placeholder="example@email.com"
                        value={form.user_email}
                        onChange={(e) =>
                          handleChange("user_email", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Số điện thoại <Required />
                    </label>
                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        type="tel"
                        maxLength={20}
                        autoComplete="tel"
                        className={`${inputClass} pl-10`}
                        placeholder="Nhập số điện thoại"
                        value={form.user_phone}
                        onChange={(e) =>
                          handleChange("user_phone", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className={labelClass}>
                    Mật khẩu <Required />
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      autoComplete="new-password"
                      className={`${inputClass} pl-10 pr-11`}
                      placeholder="Tối thiểu 8 ký tự"
                      value={form.user_password}
                      onChange={(e) =>
                        handleChange("user_password", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Mật khẩu nên bao gồm chữ hoa, chữ thường, số và ký tự đặc
                    biệt.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label className={labelClass}>
                    Xác nhận mật khẩu <Required />
                  </label>
                  <div className="relative">
                    <LockKeyhole
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className={`${inputClass} pl-10 pr-11`}
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirm_password}
                      onChange={(e) =>
                        handleChange("confirm_password", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className={labelClass}>
                    Vai trò <Required />
                  </label>
                  <div className="relative">
                    <ShieldCheck
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      required
                      className={`${inputClass} appearance-none pl-10 pr-10`}
                      value={form.role_name}
                      onChange={(e) =>
                        handleChange("role_name", e.target.value)
                      }
                    >
                      <option value="EMPLOYEE">Nhân viên (EMPLOYEE)</option>
                      <option value="MANAGER">Quản lý (MANAGER)</option>
                    </select>
                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                  <InfoBox>
                    Vai trò quyết định quyền truy cập của tài khoản. Backend
                    cần kiểm tra quyền trước khi gán vai trò.
                  </InfoBox>
                </div>

                <StatusField
                  title="Trạng thái tài khoản"
                  value={form.user_status}
                  onChange={(value) => handleChange("user_status", value)}
                />
              </div>
            </section>

            {/* EMPLOYEE INFORMATION */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Thông tin nhân viên
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Thông tin cá nhân và hồ sơ công việc
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {/* Full name */}
                <div>
                  <label className={labelClass}>
                    Họ và tên <Required />
                  </label>
                  <input
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="Nhập họ và tên"
                    value={form.employee_full_name}
                    onChange={(e) =>
                      handleChange("employee_full_name", e.target.value)
                    }
                  />
                </div>

                {/* Gender and birthday */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Giới tính <Required />
                    </label>
                    <div className="relative">
                      <select
                        required
                        className={`${inputClass} appearance-none pr-10`}
                        value={form.employee_gender}
                        onChange={(e) =>
                          handleChange("employee_gender", e.target.value)
                        }
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <ChevronDown
                        size={17}
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Ngày sinh <Required />
                    </label>
                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        className={`${inputClass} pl-10`}
                        value={form.employee_date_of_birth}
                        onChange={(e) =>
                          handleChange(
                            "employee_date_of_birth",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className={labelClass}>
                    Địa chỉ <Required />
                  </label>
                  <div className="relative">
                    <MapPin
                      size={17}
                      className="absolute left-3.5 top-3.5 text-slate-400"
                    />
                    <textarea
                      required
                      maxLength={255}
                      rows={3}
                      className={`${inputClass} resize-y pl-10`}
                      placeholder="Nhập địa chỉ thường trú"
                      value={form.employee_address}
                      onChange={(e) =>
                        handleChange("employee_address", e.target.value)
                      }
                    />
                  </div>
                </div>

                <StatusField
                  title="Trạng thái nhân viên"
                  value={form.employee_status}
                  onChange={(value) => handleChange("employee_status", value)}
                />

                <InfoBox>
                  Mã nhân viên sẽ được Backend tự động tạo. Hồ sơ nhân viên
                  được liên kết với tài khoản thông qua{" "}
                  <code className="font-semibold">user_id</code>.
                </InfoBox>
              </div>
            </section>
          </div>

          {/* Feedback */}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Hủy nhập
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? "Đang xử lý..." : "Tạo tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Required() {
  return <span className="ml-1 text-red-500">*</span>;
}

function InfoBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex gap-2.5 rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-700">
      <Info size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function StatusField({
  title,
  value,
  onChange,
}: {
  title: string;
  value: "ACTIVE" | "INACTIVE";
  onChange: (value: "ACTIVE" | "INACTIVE") => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{title}</label>

      <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">
            {value === "ACTIVE" ? "Đang hoạt động" : "Đã vô hiệu hóa"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {value === "ACTIVE"
              ? "Tài khoản có thể sử dụng hệ thống"
              : "Tài khoản không thể đăng nhập"}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={value === "ACTIVE"}
          aria-label={title}
          onClick={() =>
            onChange(value === "ACTIVE" ? "INACTIVE" : "ACTIVE")
          }
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            value === "ACTIVE" ? "bg-blue-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
              value === "ACTIVE" ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}