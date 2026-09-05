"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AccountProfile = {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_type: string;
  user_status: string;
  user_created_at: string;
  user_updated_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  if (status === "ACTIVE") return "Đang hoạt động";
  if (status === "INACTIVE") return "Không hoạt động";
  if (status === "LOCKED") return "Đã khóa";

  return status;
}



export default function CustomerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const accessToken =
        localStorage.getItem("accessToken") ??
        sessionStorage.getItem("accessToken");

      if (!accessToken) {
        router.replace("/customer/login");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3001/auth/customer/me",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");

          router.replace("/customer/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Không thể tải thông tin tài khoản.");
          return;
        }

        setProfile(data);
      } catch {
        setError("Không thể kết nối đến server. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function startEditing() {
    if (!profile) return;

    setFormName(profile.user_name);
    setFormPhone(profile.user_phone);
    setEditError("");
    setEditing(true);
  }

  async function saveProfile() {
    const accessToken =
      localStorage.getItem("accessToken") ??
      sessionStorage.getItem("accessToken");

    if (!accessToken) {
      router.replace("/customer/login");
      return;
    }

    setSaving(true);
    setEditError("");

    try {
      const response = await fetch(
        "http://localhost:3001/auth/customer/me",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            user_name: formName,
            user_phone: formPhone,
          }),
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/customer/login");
        return;
      }

      if (!response.ok) {
        setEditError(data.message || "Không thể cập nhật thông tin.");
        return;
      }

      setProfile(data);

      localStorage.setItem("userName", data.user_name);
      sessionStorage.setItem("userName", data.user_name);

      window.dispatchEvent(new Event("customer-profile-updated"));

      setEditing(false);
    } catch {
      setEditError("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#168b87]">
          Tài khoản
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#12313a]">
          Hồ sơ của tôi
        </h1>

        <p className="mt-2 text-sm text-[#70858b]">
          Quản lý thông tin tài khoản và thông tin khách hàng của bạn.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#dce8e9] bg-white p-3 shadow-sm">
          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.15em] text-[#8a9da1]">
            Danh mục hồ sơ
          </p>

          <nav className="space-y-1">
            <Link
              href="/customer/profile"
              className="flex items-center gap-3 rounded-xl bg-[#e8f8f5] px-4 py-3 text-sm font-bold text-[#10736f]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#168b87] text-base text-white">
                👤
              </span>

              <span>Thông tin tài khoản</span>
            </Link>

            <Link
              href="/customer/profile/customer-information"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#526b71] transition hover:bg-[#f2f7f7] hover:text-[#168b87]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef6f7] text-base">
                🪪
              </span>

              <span>Thông tin khách hàng</span>
            </Link>
          </nav>

          <div className="mx-3 my-4 border-t border-[#e4eeee]" />

          <p className="px-3 pb-1 text-xs leading-5 text-[#8a9da1]">
            Thông tin khách hàng sẽ bao gồm mã khách hàng, ngày sinh, giới tính
            và địa chỉ.
          </p>
        </aside>

        <div className="overflow-hidden rounded-2xl border border-[#dce8e9] bg-white shadow-sm">
          <div className="border-b border-[#e4eeee] px-5 py-5 sm:px-7">
            <h2 className="text-xl font-bold text-[#12313a]">
              Thông tin tài khoản
            </h2>

            <p className="mt-1 text-sm text-[#70858b]">
              Đây là thông tin được dùng để đăng nhập và liên hệ với bạn.
            </p>
          </div>

          {loading && (
            <div className="grid min-h-72 place-items-center px-5 py-12">
              <div className="text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#dce8e9] border-t-[#168b87]" />
                <p className="mt-4 text-sm text-[#70858b]">
                  Đang tải thông tin tài khoản...
                </p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="m-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b] sm:m-7">
              {error}
            </div>
          )}

          {!loading && profile && (
            <div className="p-5 sm:p-7">
              <div className="mb-7 flex flex-col gap-4 border-b border-[#e4eeee] pb-7 sm:flex-row sm:items-center">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#e8f8f5] text-2xl font-bold text-[#168b87]">
                  {profile.user_name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#12313a]">
                    {profile.user_name}
                  </h3>

                  <p className="mt-1 text-sm text-[#70858b]">
                    Tài khoản {profile.user_type.toLowerCase()}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-[#e8f8f5] px-3 py-1.5 text-xs font-bold text-[#168b87] sm:ml-auto">
                  {getStatusLabel(profile.user_status)}
                </span>
              </div>

              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Họ và tên
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {profile.user_name}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Email
                  </dt>

                  <dd className="mt-2 break-all text-sm font-semibold text-[#29444b]">
                    {profile.user_email}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Số điện thoại
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {profile.user_phone}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Mã tài khoản
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    #{profile.user_id}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Loại tài khoản
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {profile.user_type}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Ngày tạo tài khoản
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {formatDate(profile.user_created_at)}
                  </dd>
                </div>
              </dl>

              <div className="mt-7">
                {!editing ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="rounded-xl bg-[#168b87] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10736f]"
                  >
                    Chỉnh sửa thông tin
                  </button>
                ) : (
                  <div className="rounded-2xl border border-[#dce8e9] bg-[#f9fcfc] p-5">
                    <h3 className="text-lg font-bold text-[#12313a]">
                      Chỉnh sửa thông tin tài khoản
                    </h3>

                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#29444b]">
                          Họ và tên
                        </label>

                        <input
                          value={formName}
                          onChange={(event) => setFormName(event.target.value)}
                          maxLength={50}
                          className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm outline-none focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#29444b]">
                          Số điện thoại
                        </label>

                        <input
                          value={formPhone}
                          onChange={(event) => setFormPhone(event.target.value)}
                          maxLength={20}
                          className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm outline-none focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-[#29444b]">
                          Email
                        </label>

                        <input
                          value={profile.user_email}
                          disabled
                          className="h-11 w-full cursor-not-allowed rounded-xl border border-[#d9e4e5] bg-slate-100 px-4 text-sm text-[#70858b]"
                        />

                        <p className="mt-2 text-xs text-[#8a9da1]">
                          Email dùng để đăng nhập nên hiện chưa thể thay đổi.
                        </p>
                      </div>
                    </div>

                    {editError && (
                      <p className="mt-4 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                        {editError}
                      </p>
                    )}

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={saving}
                        className="rounded-xl bg-[#168b87] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10736f] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="rounded-xl border border-[#cbdadb] px-5 py-3 text-sm font-bold text-[#526b71] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}