"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/admin-session/user-service/forgot-password/otp-sending",
        {
          user_email: email,
        },
        {
          timeout: 10_000,
        },
      );

      const data = response.data;

      sessionStorage.setItem("forgotPasswordEmail", email);
      sessionStorage.setItem(
        "forgotPasswordOtpExpiresAt",
        data.otp_expires_at,
      );

      router.push(`/admin/forgot-password-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          if (error.code === "ECONNABORTED") {
            setError("Server phản hồi quá lâu. Vui lòng thử lại sau!");
          } else {
            setError("Không thể kết nối đến server. Vui lòng thử lại.");
          }

          return;
        }

        const message = error.response.data?.message;

        setError(
          Array.isArray(message)
            ? message[0]
            : message || "Không thể kiểm tra email.",
        );
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-2">
        {/* LEFT - BRAND */}
        <section className="relative hidden overflow-hidden bg-[#1e3a5f] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[30px] border-white/5" />
          <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full border-[40px] border-blue-400/10" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-extrabold text-[#1e3a5f]">
                S
              </div>

              <span className="text-xl font-bold tracking-wide">
                SmartHub
              </span>
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
              Account recovery
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Khôi phục mật khẩu của bạn.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-blue-100/80">
              Đừng lo lắng nếu bạn quên mật khẩu. Hãy xác minh email để
              thiết lập mật khẩu mới và tiếp tục sử dụng SmartHub.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/10 text-2xl">
                🔐
              </div>

              <div>
                <p className="font-semibold">Bảo mật tài khoản</p>
                <p className="mt-1 text-sm text-blue-100/70">
                  Xác minh danh tính bằng mã OTP
                </p>
              </div>
            </div>

            <div className="h-1 w-16 rounded-full bg-blue-300" />
          </div>
        </section>

        {/* RIGHT - FORM */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e3a5f] font-extrabold text-white">
                S
              </div>

              <span className="text-lg font-bold text-[#1e3a5f]">
                SmartHub
              </span>
            </div>

            {/* STEP INDICATOR */}
            <div className="mb-9">
              <div className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    1
                  </div>
                  <span className="mt-2 text-center text-xs font-semibold text-[#1e3a5f]">
                    Email
                  </span>
                </div>

                <div className="mx-3 mb-5 h-px flex-1 bg-slate-200" />

                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-400">
                    2
                  </div>
                  <span className="mt-2 text-center text-xs text-slate-400">
                    Xác thực OTP
                  </span>
                </div>

                <div className="mx-3 mb-5 h-px flex-1 bg-slate-200" />

                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-400">
                    3
                  </div>
                  <span className="mt-2 text-center text-xs text-slate-400">
                    Mật khẩu mới
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#3b82f6]">
                Khôi phục tài khoản
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-800">
                Quên mật khẩu?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP để xác minh
                và giúp bạn đặt lại mật khẩu.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Địa chỉ email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-lg bg-[#1e3a5f] font-semibold text-white shadow-md shadow-blue-900/10 transition hover:bg-[#294d7a] focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Đang gửi mã OTP..." : "Gửi mã OTP"}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              Nhớ mật khẩu rồi?{" "}
              <button
                type="button"
                onClick={() => router.push("/admin/login")}
                className="font-semibold text-[#1e3a5f] transition hover:text-blue-600"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
