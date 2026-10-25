"use client";

import { customerUserService } from "@/lib/axios/services/customer-services/user_service";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Mail,
  Phone,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  House,
  Pencil,
  Check,
  X,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  Hash,
  Clock3,
} from "lucide-react";

type AccountInformation = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_status: string;
  user_created_at: string;
  user_updated_at: string;
};

function formatDate(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return {
        label: "Đang hoạt động",
        className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        dot: "bg-emerald-500",
      };

    case "INACTIVE":
      return {
        label: "Không hoạt động",
        className: "bg-slate-100 text-slate-600 ring-slate-500/20",
        dot: "bg-slate-400",
      };

    case "LOCKED":
    case "BLOCKED":
      return {
        label: "Đã khóa",
        className: "bg-red-50 text-red-700 ring-red-600/20",
        dot: "bg-red-500",
      };

    default:
      return {
        label: status || "Chưa xác định",
        className: "bg-slate-100 text-slate-600 ring-slate-500/20",
        dot: "bg-slate-400",
      };
  }
}

export default function CustomerProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<AccountInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const data = await customerUserService.getAccountInformation();

      setProfile(data.data ?? data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");

        router.replace("/customer/login");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Không thể tải thông tin tài khoản. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function startEditing() {
    if (!profile) return;

    setFormName(profile.user_name ?? "");
    setFormPhone(profile.user_phone ?? "");
    setEditError("");
    setSuccessMessage("");
    setEditing(true);
  }

  async function saveProfile() {
    const name = formName.trim();
    const phone = formPhone.trim();

    if (!name) {
      setEditError("Vui lòng nhập họ và tên.");
      return;
    }

    if (name.length > 50) {
      setEditError("Họ và tên không được vượt quá 50 ký tự.");
      return;
    }

    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
      setEditError("Số điện thoại phải gồm 10–11 chữ số.");
      return;
    }

    const accessToken =
      localStorage.getItem("accessToken") ??
      sessionStorage.getItem("accessToken");

    if (!accessToken) {
      router.replace("/customer/login");
      return;
    }

    setSaving(true);
    setEditError("");
    setSuccessMessage("");

    try {
      // Giữ nguyên API cập nhật đang sử dụng trong dự án.
      const response = await fetch(
        "http://localhost:3001/auth/customer/me",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            user_name: name,
            user_phone: phone,
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");

        router.replace("/customer/login");
        return;
      }

      if (!response.ok) {
        setEditError(
          data.message || "Không thể cập nhật thông tin tài khoản.",
        );
        return;
      }

      setProfile((previous) => ({
        ...(previous as AccountInformation),
        ...data,
      }));

      localStorage.setItem("userName", data.user_name);
      sessionStorage.setItem("userName", data.user_name);

      window.dispatchEvent(new Event("customer-profile-updated"));

      setEditing(false);
      setSuccessMessage("Cập nhật thông tin tài khoản thành công.");
    } catch {
      setEditError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const status = profile ? getStatus(profile.user_status) : null;

  return (
    <main className="min-h-screen bg-[#f6f8fb] pb-12">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
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
            Thông tin tài khoản
          </span>
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
              <UserRound size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Thông tin tài khoản
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Tài khoản của tôi
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                Trung tâm tài khoản
              </p>
            </div>

            <nav className="space-y-1 p-3">
              <Link
                href="/customer/profile/account-information"
                className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3.5 text-sm font-semibold text-teal-800 ring-1 ring-inset ring-teal-100"
              >
                <UserRound size={19} />
                <span>Thông tin tài khoản</span>
                <ChevronRight size={16} className="ml-auto" />
              </Link>

              <Link
                href="/customer/profile/customer-information"
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-teal-700"
              >
                <ShieldCheck size={19} />
                <span>Thông tin khách hàng</span>
                <ChevronRight size={16} className="ml-auto text-slate-400" />
              </Link>
            </nav>

            <div className="mx-4 border-t border-slate-100" />

            <div className="p-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <ShieldCheck size={17} className="text-teal-600" />
                  <span className="text-sm font-semibold">
                    Bảo mật tài khoản
                  </span>
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  Hãy đảm bảo email và số điện thoại của bạn luôn chính xác để
                  thuận tiện cho việc liên hệ.
                </p>
              </div>
            </div>
          </aside>

          {/* Content */}
          <section className="min-w-0 space-y-6">
            {/* Loading */}
            {loading && (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <LoaderCircle
                  size={36}
                  className="animate-spin text-teal-600"
                />
                <p className="mt-4 text-sm font-medium text-slate-500">
                  Đang tải thông tin tài khoản...
                </p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    size={22}
                    className="mt-0.5 shrink-0 text-red-500"
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-900">
                      Không thể tải thông tin
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">{error}</p>

                    <button
                      type="button"
                      onClick={loadProfile}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                    >
                      <RefreshCw size={16} />
                      Thử lại
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && profile && (
              <>
                {/* Profile banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 p-6 text-white shadow-lg shadow-teal-900/10 sm:p-8">
                  <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[32px] border-white/10" />
                  <div className="pointer-events-none absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-white/5" />

                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-3xl font-bold uppercase shadow-inner backdrop-blur">
                      {profile.user_name?.trim().charAt(0) || "U"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-teal-50">
                        Xin chào,
                      </p>

                      <h2 className="mt-1 break-words text-2xl font-bold sm:text-3xl">
                        {profile.user_name}
                      </h2>

                      <p className="mt-2 break-all text-sm text-teal-50">
                        {profile.user_email}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status?.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status?.dot}`}
                          />
                          {status?.label}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90">
                          <Hash size={14} />
                          Mã tài khoản: {profile.user_id}
                        </span>
                      </div>
                    </div>

                    {!editing && (
                      <button
                        type="button"
                        onClick={startEditing}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50"
                      >
                        <Pencil size={16} />
                        Chỉnh sửa
                      </button>
                    )}
                  </div>
                </div>

                {/* Success message */}
                {successMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <Check size={18} />
                    {successMessage}
                  </div>
                )}

                {/* Account details */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Chi tiết tài khoản
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Thông tin đăng ký tài khoản và liên hệ của bạn.
                      </p>
                    </div>

                    <span className="w-fit rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                      Thông tin cá nhân
                    </span>
                  </div>

                  <div className="grid gap-0 sm:grid-cols-2">
                    <InfoItem
                      icon={<UserRound size={19} />}
                      label="Tên tài khoản"
                      value={profile.user_name}
                    />

                    <InfoItem
                      icon={<Mail size={19} />}
                      label="Địa chỉ email"
                      value={profile.user_email}
                    />

                    <InfoItem
                      icon={<Phone size={19} />}
                      label="Số điện thoại"
                      value={profile.user_phone || "Chưa cập nhật"}
                    />

                    <InfoItem
                      icon={<Hash size={19} />}
                      label="Mã tài khoản"
                      value={profile.user_id}
                    />

                    <InfoItem
                      icon={<CalendarDays size={19} />}
                      label="Ngày tạo tài khoản"
                      value={formatDate(profile.user_created_at)}
                    />

                    <InfoItem
                      icon={<Clock3 size={19} />}
                      label="Cập nhật lần cuối"
                      value={formatDate(profile.user_updated_at)}
                    />
                  </div>
                </div>

                {/* Edit form */}
                {editing && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                          <Pencil size={19} />
                        </div>

                        <div>
                          <h2 className="font-bold text-slate-900">
                            Chỉnh sửa thông tin
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Cập nhật họ tên và số điện thoại của bạn.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-5 sm:p-7">
                      <div>
                        <label
                          htmlFor="userName"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Họ và tên
                        </label>

                        <div className="relative">
                          <UserRound
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            id="userName"
                            value={formName}
                            onChange={(event) =>
                              setFormName(event.target.value)
                            }
                            maxLength={50}
                            disabled={saving}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
                            placeholder="Nhập họ và tên"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="userPhone"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                          Số điện thoại
                        </label>

                        <div className="relative">
                          <Phone
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            id="userPhone"
                            type="tel"
                            inputMode="numeric"
                            value={formPhone}
                            onChange={(event) =>
                              setFormPhone(event.target.value)
                            }
                            maxLength={11}
                            disabled={saving}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-50"
                            placeholder="Nhập số điện thoại"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Địa chỉ email
                        </label>

                        <div className="relative">
                          <Mail
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            value={profile.user_email}
                            disabled
                            className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-500"
                          />
                        </div>

                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Email đăng nhập hiện không thể thay đổi tại đây.
                        </p>
                      </div>

                      {editError && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                          />
                          <p>{editError}</p>
                        </div>
                      )}

                      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setEditError("");
                          }}
                          disabled={saving}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          <X size={17} />
                          Hủy bỏ
                        </button>

                        <button
                          type="button"
                          onClick={saveProfile}
                          disabled={saving}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {saving ? (
                            <LoaderCircle
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Check size={17} />
                          )}

                          {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-4 border-b border-slate-100 p-5 last:border-b-0 sm:p-6 [&:nth-child(odd)]:sm:border-r [&:nth-last-child(-n+2)]:sm:border-b-0">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1 self-center">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
          {value || "Chưa cập nhật"}
        </p>
      </div>
    </div>
  );
}