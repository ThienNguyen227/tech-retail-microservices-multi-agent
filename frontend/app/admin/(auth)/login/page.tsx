"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setAccessToken } from "@/lib/access_token/access_token";
import axios from "axios";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const user_email = String(form.get("email") ?? "");
    const user_password = String(form.get("password") ?? "");

    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/admin-session/user-service/login",
        {
          user_email,
          user_password,
        },
        {
          withCredentials: true,
        },
      );

      const data = response.data;

      setAccessToken(data.access_token);

      const remember = form.get("remember") === "on";
      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("userId", String(data.user_id));
      storage.setItem("userName", data.user_name);
      sessionStorage.setItem("adminSessionId", data.session_id);
  
      router.push("/admin/dashboard");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = Array.isArray(error.response?.data?.message)
          ? error.response.data.message[0]
          : error.response?.data?.message;

        setError(message || "Đăng nhập quản trị thất bại.");
      } else {
        setError("Không thể kết nối đến server. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-[#0f172a12] lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left banner */}
        <section className="relative hidden overflow-hidden bg-[#0f172a] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[32px] border-blue-400/10" />
          <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full border-[40px] border-cyan-400/10" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500 text-2xl font-black text-white shadow-lg shadow-blue-500/20">
                S
              </div>

              <div>
                <p className="text-xl font-bold">SmartHub</p>
                <p className="text-xs tracking-widest text-slate-400">
                  ADMIN CONSOLE
                </p>
              </div>
            </div>

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
              Smart retail management
            </p>

            <h1 className="max-w-lg text-4xl font-bold leading-tight xl:text-5xl">
              Quản trị hệ thống bán lẻ thông minh.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
              Quản lý sản phẩm, nhân viên, chi nhánh, kho hàng và hoạt động
              kinh doanh trên một nền tảng tập trung.
            </p>

            <div className="mt-10 grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                </div>
                <p className="font-semibold">Quản lý tập trung</p>
                <p className="mt-1 text-xs text-slate-400">
                  Theo dõi toàn hệ thống
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 text-cyan-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                  >
                    <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <p className="font-semibold">Bảo mật hệ thống</p>
                <p className="mt-1 text-xs text-slate-400">
                  Kiểm soát quyền truy cập
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <div className="mb-4 h-1 w-20 rounded-full bg-blue-500" />
            <p className="text-sm text-slate-400">
              SmartHub · Hệ thống quản lý bán lẻ
            </p>
          </div>
        </section>

        {/* Login form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0f172a] text-xl font-black text-white">
                  S
                </div>
                <div>
                  <p className="font-bold text-[#0f172a]">SmartHub</p>
                  <p className="text-xs tracking-widest text-slate-500">
                    ADMIN CONSOLE
                  </p>
                </div>
              </div>

              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-7 w-7"
                >
                  <rect x="5" y="10" width="14" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <circle cx="12" cy="15" r="1" />
                  <path d="M12 16v2" />
                </svg>
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Khu vực quản trị
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#0f172a]">
                Đăng nhập Admin
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Đăng nhập bằng tài khoản quản trị được cấp để tiếp tục.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-slate-700"
                  htmlFor="email"
                >
                  Email quản trị
                </label>

                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>

                  <input
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    className="block text-sm font-semibold text-slate-700"
                    htmlFor="password"
                  >
                    Mật khẩu
                  </label>

                  <Link
                    className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                    href="/admin/forgot-password"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>

                <div className="relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  >
                    <rect x="5" y="10" width="14" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>

                  <input
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-500">
                <input
                  className="h-4 w-4 rounded accent-blue-600"
                  name="remember"
                  type="checkbox"
                />
                Ghi nhớ đăng nhập
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              <button
                className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
              </button>

              <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
                >
                  <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                <p className="text-xs leading-5 text-slate-500">
                  Khu vực dành riêng cho nhân sự được cấp quyền quản trị.
                  Không chia sẻ thông tin đăng nhập với người khác.
                </p>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Bạn là khách hàng?{" "}
              <Link
                className="font-semibold text-blue-600 transition hover:text-blue-800"
                href="/customer/login"
              >
                Đăng nhập tại đây
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}