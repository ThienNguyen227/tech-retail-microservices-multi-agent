"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const user_email = String(form.get("email") ?? "");
    const user_password = String(form.get("password") ?? "");
    const remember = form.get("remember") === "on";

    try {
      const response = await fetch(
        "http://localhost:3001/auth/customer/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email,
            user_password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message)
          ? data.message[0]
          : data.message;

        setError(message || "Đăng nhập thất bại.");
        return;
      }

      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("accessToken", data.access_token);
      storage.setItem("refreshToken", data.refresh_token);
      storage.setItem("userType", "CUSTOMER");
      storage.setItem("userName", data.user_name);
      storage.setItem("userId", data.user_id);

      router.push("/customer/home");
    } catch {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef6f7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-[#0c56631a] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-[#073b4c] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-[#2ec4b6]/20" />
          <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full border-[38px] border-[#ffd166]/15" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2ec4b6] text-xl font-black text-[#073b4c]">
                S
              </div>
              <span className="text-xl font-bold">SmartHub</span>
            </div>

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-[#2ec4b6]">
              Smart retail platform
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Điều hành hệ thống dễ dàng.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-[#c6e4e5]">
              Đăng nhập để theo dõi cửa hàng, sản phẩm và hoạt động kinh doanh
              của bạn.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f8f5] text-2xl">
                ⚡
              </div>
              <div>
                <p className="font-semibold">SmartHub trong tầm tay</p>
                <p className="mt-1 text-sm text-[#a9d4d6]">
                  Quản lý mọi lúc, mọi nơi
                </p>
              </div>
            </div>

            <div className="h-1 w-20 rounded-full bg-[#ffd166]" />
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#073b4c] font-black text-white">
                  S
                </div>
                <span className="text-lg font-bold text-[#073b4c]">
                  SmartHub
                </span>
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#168b87]">
                Chào mừng trở lại
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#12313a]">
                Đăng nhập
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#70858b]">
                Đăng nhập để tiếp tục quản lý hệ thống cửa hàng của bạn.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-[#29444b]"
                  htmlFor="email"
                >
                  Email
                </label>

                <input
                  className="h-12 w-full rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] px-4 text-sm text-[#12313a] outline-none transition placeholder:text-[#a4b4b7] focus:border-[#168b87] focus:ring-4 focus:ring-[#168b8718]"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    className="block text-sm font-semibold text-[#29444b]"
                    htmlFor="password"
                  >
                    Mật khẩu
                  </label>

                  <a
                    className="text-xs font-semibold text-[#168b87] hover:text-[#073b4c]"
                    href="/customer/forgot-password"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <div className="relative">
                  <input
                    className="h-12 w-full rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] px-4 pr-12 text-sm text-[#12313a] outline-none transition placeholder:text-[#a4b4b7] focus:border-[#168b87] focus:ring-4 focus:ring-[#168b8718]"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    required
                  />

                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6e858a] hover:text-[#168b87]"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-[#70858b]">
                <input
                  className="h-4 w-4 accent-[#168b87]"
                  name="remember"
                  type="checkbox"
                />
                Ghi nhớ đăng nhập
              </label>

              {error && (
                <p className="rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                  {error}
                </p>
              )}

              <button
                className="h-12 w-full rounded-xl bg-[#168b87] font-semibold text-white shadow-lg shadow-[#168b8730] transition hover:bg-[#10736f] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#168b8730] disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#70858b]">
              Chưa có tài khoản?{" "}
              <Link
                className="font-bold text-[#168b87] hover:text-[#073b4c]"
                href="/customer/register"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}