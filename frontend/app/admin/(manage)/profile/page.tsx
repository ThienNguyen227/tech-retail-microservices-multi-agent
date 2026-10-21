"use client";
import { adminUserService } from "@/lib/axios/services/admin-services/user_service";
import { useEffect, useState } from "react";

import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Clock,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  Fingerprint,
  Pencil,
  X,
} from "lucide-react";

interface AdminProfile {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_type: string;
  user_status: string;
  user_created_at: string;
  user_updated_at: string;
}

function formatDate(value?: string) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Không hợp lệ";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function InfoRow({icon: Icon, label, children}: {
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
        {children}
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [editError, setEditError] = useState("");

  // 1. GET PROFILE
  async function fetchProfile() {
    setLoading(true);
    setError("");

    try {
      const data = await adminUserService.getProfile();

      setProfile(data.user ?? data);
    } catch (err) {
      console.error("Lỗi lấy thông tin Admin:", err);

      setError("Không thể tải thông tin cá nhân. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }

  // 2. UPDATE PROFILE
  async function handleUpdateProfile() {
    setSaving(true);
    setEditError("");
    setSuccess("");

    try {
      const user_name = editName.trim();
      const user_phone = editPhone.trim();

      if (!user_name || user_name.length > 50) {
        setEditError("Tên phải có từ 1 đến 50 ký tự.");
        return;
      }

      if (!/^[0-9]{10,11}$/.test(user_phone)) {
        setEditError("Số điện thoại phải có từ 10 đến 11 chữ số.");
        return;
      }

      await adminUserService.updateProfile({
        user_name,
        user_phone,
      });

      await fetchProfile();

      setIsEditModalOpen(false);
      setSuccess("Cập nhật thông tin thành công!");
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);

      setEditError(
        "Không thể cập nhật thông tin. Vui lòng kiểm tra dữ liệu và thử lại.",
      );
    } finally {
      setSaving(false);
    }
  }


  
  // RETRY
  useEffect(() => {
    void fetchProfile();
  }, []);

  const isActive = profile?.user_status === "ACTIVE";

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-slate-500">
          Trang chủ <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-blue-700">Hồ sơ cá nhân</span>
        </div>

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* Heading */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Hồ sơ cá nhân
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Quản lý thông tin tài khoản và thông tin cá nhân của bạn.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setEditName(profile?.user_name ?? "");
                setEditPhone(profile?.user_phone ?? "");
                setEditError("");
                setSuccess("");
                setIsEditModalOpen(true);
              }}
              disabled={!profile || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Pencil size={17} />
              Chỉnh sửa thông tin
            </button>

            <button
              type="button"
              onClick={() => void fetchProfile()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <RefreshCw size={17} />
              )}
              Làm mới
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && !profile && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <LoaderCircle
              size={34}
              className="animate-spin text-blue-600"
            />
            <p className="mt-4 text-sm text-slate-500">
              Đang tải thông tin cá nhân...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && !profile && (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={28} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              Không thể tải hồ sơ
            </h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => void fetchProfile()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Profile */}
        {profile && (
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
                      {profile.user_name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-400/20 text-emerald-50"
                          : "bg-red-400/20 text-red-50"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isActive ? "bg-emerald-300" : "bg-red-300"
                        }`}
                      />
                      {isActive ? "Đang hoạt động" : "Không hoạt động"}
                    </span>
                  </div>

                  <p className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                    <ShieldCheck size={17} />
                    {profile.user_type}
                  </p>

                  <div className="mt-4 flex flex-col gap-3 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:gap-6">
                    <span className="flex min-w-0 items-center gap-2">
                      <Mail size={16} className="shrink-0" />
                      <span className="break-all">{profile.user_email}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <Phone size={16} />
                      {profile.user_phone}
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
                  <div>
                    <p className="text-xs text-slate-500">Mã tài khoản</p>
                    <p className="mt-1 font-bold text-slate-800">
                      #{profile.user_id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Loại tài khoản</p>
                    <p className="mt-1 font-bold text-slate-800">
                      {profile.user_type}
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
                    <p className="text-xs text-slate-500">Trạng thái</p>
                    <p
                      className={`mt-1 font-bold ${
                        isActive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isActive ? "Hoạt động" : profile.user_status}
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
                    <p className="text-xs text-slate-500">Ngày tạo tài khoản</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {formatDate(profile.user_created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Detail panels */}
            <section className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <UserRound size={21} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Thông tin cá nhân
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Thông tin được lưu trong hệ thống
                    </p>
                  </div>
                </div>

                <div>
                  <InfoRow icon={UserRound} label="Họ và tên">
                    {profile.user_name}
                  </InfoRow>
                  <InfoRow icon={Mail} label="Địa chỉ email">
                    {profile.user_email}
                  </InfoRow>
                  <InfoRow icon={Phone} label="Số điện thoại">
                    {profile.user_phone}
                  </InfoRow>
                  <InfoRow icon={ShieldCheck} label="Loại tài khoản">
                    {profile.user_type}
                  </InfoRow>
                  <InfoRow icon={CheckCircle2} label="Trạng thái tài khoản">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {profile.user_status}
                    </span>
                  </InfoRow>
                  <InfoRow icon={CalendarDays} label="Ngày tạo tài khoản">
                    {formatDate(profile.user_created_at)}
                  </InfoRow>
                  <InfoRow icon={Clock} label="Cập nhật lần cuối">
                    {formatDate(profile.user_updated_at)}
                  </InfoRow>
                </div>
              </div>

              <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-sky-100 text-blue-600 ring-8 ring-blue-50/70">
                    <UserRound size={58} strokeWidth={1.4} />
                  </div>

                  <h3 className="mt-6 break-words text-xl font-bold text-slate-900">
                    {profile.user_name}
                  </h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <ShieldCheck size={16} className="text-blue-600" />
                    {profile.user_type}
                  </p>

                  <div className="mt-7 w-full rounded-xl bg-blue-50/80 p-5 text-left">
                    <p className="text-sm font-semibold text-blue-900">
                      <span className="mr-2 text-lg">“</span>
                      Tài khoản SmartHub
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Quản lý thông tin tài khoản và theo dõi trạng thái hoạt
                      động của bạn trong hệ thống.
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
                      {formatDate(profile.user_updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>


      {isEditModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
      className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="edit-profile-title"
            className="text-xl font-bold text-slate-900"
          >
            Chỉnh sửa thông tin
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Chỉ có thể thay đổi họ tên và số điện thoại.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditModalOpen(false)}
          disabled={saving}
          aria-label="Đóng"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="edit-user-name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Họ và tên
          </label>

          <input
            id="edit-user-name"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={50}
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            placeholder="Nhập họ và tên"
          />
        </div>

        <div>
          <label
            htmlFor="edit-user-phone"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Số điện thoại
          </label>

          <input
            id="edit-user-phone"
            type="tel"
            inputMode="numeric"
            value={editPhone}
            onChange={(e) =>
              setEditPhone(e.target.value.replace(/[^0-9]/g, ""))
            }
            maxLength={11}
            disabled={saving}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            placeholder="Nhập số điện thoại"
          />
        </div>

        {editError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{editError}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(false)}
            disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={() => void handleUpdateProfile()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && (
              <LoaderCircle size={17} className="animate-spin" />
            )}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </main>
  );
}
