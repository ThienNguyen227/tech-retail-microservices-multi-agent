"use client";

import { customerUserService } from "@/lib/axios/services/customer-services/user_service";
import { useCallback, useEffect, useState, type ReactNode } from "react";
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
  Sparkles,
  LockKeyhole,
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

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await customerUserService.getAccountInformation();
      const result = response?.data ?? response;

      setProfile(result);
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
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function startEditing() {
    if (!profile) return;

    setFormName(profile.user_name ?? "");
    setFormPhone(profile.user_phone ?? "");
    setEditError("");
    setSuccessMessage("");
    setEditing(true);
  }

  function closeModal() {
    if (saving) return;

    setEditing(false);
    setEditError("");
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

    // Khớp với kiểm tra số điện thoại 10–11 chữ số trên giao diện.
    if (phone && !/^[0-9]{10,11}$/.test(phone)) {
      setEditError("Số điện thoại phải gồm 10-11 chữ số!");
      return;
    }

    setSaving(true);
    setEditError("");
    setSuccessMessage("");

    try {
      // Gọi API thông qua customerAxios trong customerUserService.
      const response = await customerUserService.updateAccountInformation({
        user_name: name,
        user_phone: phone,
      });

      const result = response?.data ?? response;
      const updatedProfile =
        result?.data && typeof result.data === "object"
          ? result.data
          : result;

      setProfile((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          ...(updatedProfile &&
          typeof updatedProfile === "object"
            ? updatedProfile
            : {}),
          user_name: updatedProfile?.user_name ?? name,
          user_phone: updatedProfile?.user_phone ?? phone,
        };
      });

      // localStorage.setItem("userName", name);
      sessionStorage.setItem("userName", name);

      window.dispatchEvent(new Event("customer-profile-updated"));

      setEditing(false);
      setSuccessMessage("Cập nhật thông tin tài khoản thành công!");
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        router.replace("/customer/login");
        return;
      }

      const message = err.response?.data?.message;

      setEditError(
        Array.isArray(message)
          ? message.join("\n")
          : message || "Không thể cập nhật thông tin tài khoản. Vui lòng thử lại.",
      );
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
              <div className="rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
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
                      onClick={() => void loadProfile()}
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

                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-md"
                    >
                      <Pencil size={16} />
                      Chỉnh sửa
                    </button>
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
              </>
            )}
          </section>
        </div>
      </div>

      {/* Edit modal */}
      {editing && profile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />

          {/* Modal panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-account-title"
            className="relative z-10 my-auto w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20">
              {/* Modal header */}
              <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 px-6 py-6 text-white sm:px-8">
                <div className="pointer-events-none absolute -right-8 -top-16 h-44 w-44 rounded-full border-[24px] border-white/10" />
                <div className="pointer-events-none absolute -bottom-14 right-28 h-28 w-28 rounded-full bg-white/5" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner">
                      <Pencil size={22} />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-teal-100">
                        <Sparkles size={13} />
                        Hồ sơ cá nhân
                      </div>

                      <h2
                        id="edit-account-title"
                        className="text-xl font-bold sm:text-2xl"
                      >
                        Chỉnh sửa tài khoản
                      </h2>

                      <p className="mt-1 text-sm text-teal-50">
                        Cập nhật thông tin liên hệ của bạn.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    aria-label="Đóng cửa sổ"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="space-y-5 px-6 py-6 sm:px-8">
                <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                      <UserRound size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {profile.user_name}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {profile.user_email}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Email đăng nhập được giữ nguyên trong lần cập nhật này.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name field */}
                <div>
                  <label
                    htmlFor="editUserName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>

                  <div className="group relative">
                    <UserRound
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-teal-600"
                    />

                    <input
                      id="editUserName"
                      autoFocus
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      maxLength={50}
                      disabled={saving}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div className="mt-1.5 flex justify-between gap-3">
                    <p className="text-xs text-slate-400">
                      Tên hiển thị trên tài khoản của bạn.
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formName.length}/50
                    </span>
                  </div>
                </div>

                {/* Phone field */}
                <div>
                  <label
                    htmlFor="editUserPhone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Số điện thoại
                  </label>

                  <div className="group relative">
                    <Phone
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-teal-600"
                    />

                    <input
                      id="editUserPhone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={formPhone}
                      onChange={(event) => setFormPhone(event.target.value)}
                      maxLength={11}
                      disabled={saving}
                      placeholder="Nhập số điện thoại"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                    Nhập từ 10 đến 11 chữ số, không bao gồm khoảng trắng.
                  </p>
                </div>

                {/* Email read-only */}
                <div>
                  <label
                    htmlFor="editUserEmail"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Địa chỉ email
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="editUserEmail"
                      value={profile.user_email}
                      disabled
                      className="h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 pl-11 pr-11 text-sm text-slate-500"
                    />

                    <LockKeyhole
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Email không thể chỉnh sửa tại đây.
                  </p>
                </div>

                {/* Error */}
                {editError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="whitespace-pre-line">{editError}</p>
                  </div>
                )}

                {/* Modal footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={17} />
                    Hủy bỏ
                  </button>

                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Đang lưu thay đổi...
                      </>
                    ) : (
                      <>
                        <Check size={17} />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-white/80">
              <ShieldCheck size={13} className="mr-1 inline-block" />
              Thông tin của bạn được sử dụng để quản lý tài khoản.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
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
