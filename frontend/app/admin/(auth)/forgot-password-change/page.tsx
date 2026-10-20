"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const getRemainingSeconds = (expiresAt: string | null): number => {
  if (!expiresAt) return 0;

  const remainingMs = new Date(expiresAt).getTime() - Date.now();

  return Math.max(0, Math.ceil(remainingMs / 1000));
};

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetExpiresAt, setResetExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Kiểm tra session
  useEffect(() => {
    const forgotPasswordEmail = sessionStorage.getItem("forgotPasswordEmail");
    const expiresAt = sessionStorage.getItem(
      "forgotPasswordResetExpiresAt",
    );

    if (!forgotPasswordEmail || !expiresAt) {
      router.replace("/admin/forgot-password");
      return;
    }

    setEmail(forgotPasswordEmail);
    setResetExpiresAt(expiresAt);
  }, [router]);

  // Countdown
  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(getRemainingSeconds(resetExpiresAt));
    };

    updateCountdown();

    if (!resetExpiresAt) return;

    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [resetExpiresAt]);

  // Đổi mật khẩu
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (countdown <= 0) {
      setError("Phiên đổi mật khẩu đã hết hạn. Vui lòng thực hiện lại!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        "http://localhost:3001/api/v1/user-service/forgot-password/password-change",
        {
          new_password: newPassword,
        },
        {
          timeout: 10_000,
          withCredentials: true,
        },
      );

      setSuccess(
        "Đổi mật khẩu thành công. Đang chuyển đến trang đăng nhập...",
      );

      // Xóa thông tin session của quá trình quên mật khẩu
      sessionStorage.removeItem("forgotPasswordEmail");
      sessionStorage.removeItem("forgotPasswordOtpExpiresAt");
      sessionStorage.removeItem("forgotPasswordResetExpiresAt");

      window.setTimeout(() => {
        router.push("/admin/login");
      }, 1200);
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

        setError(
          error.response.data?.message || "Đổi mật khẩu thất bại.",
        );
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f3f5f8] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT - BRAND */}
        <section className="relative hidden overflow-hidden bg-[#1e3a5f] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-white/10" />
          <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full border-[38px] border-white/5" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-xl font-black text-[#1e3a5f]">
                S
              </div>

              <span className="text-xl font-bold">SmartHub Admin</span>
            </div>

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
              Admin account recovery
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Tạo mật khẩu mới an toàn.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-blue-100/80">
              Thiết lập mật khẩu mới để bảo vệ tài khoản quản trị và tiếp tục
              sử dụng hệ thống SmartHub.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl">
                🔑
              </div>

              <div>
                <p className="font-semibold">Mật khẩu mới</p>
                <p className="mt-1 text-sm text-blue-100/70">
                  Bảo vệ tài khoản quản trị
                </p>
              </div>
            </div>

            <div className="h-1 w-20 rounded-full bg-blue-200" />
          </div>
        </section>

        {/* RIGHT - FORM */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e3a5f] font-black text-white">
                S
              </div>

              <span className="text-lg font-bold text-[#1e3a5f]">
                SmartHub Admin
              </span>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    ✓
                  </div>
                  <span className="mt-2 text-center text-xs font-semibold text-[#1e3a5f]">
                    Kiểm tra email
                  </span>
                </div>

                <div className="mx-3 mt-[18px] h-[2px] flex-1 bg-[#1e3a5f]" />

                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    ✓
                  </div>
                  <span className="mt-2 text-center text-xs font-semibold text-[#1e3a5f]">
                    Xác thực OTP
                  </span>
                </div>

                <div className="mx-3 mt-[18px] h-[2px] flex-1 bg-[#1e3a5f]" />

                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    3
                  </div>
                  <span className="mt-2 text-center text-xs font-semibold text-[#1e3a5f]">
                    Đổi mật khẩu
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-9">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Đổi mật khẩu
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Tạo mật khẩu mới cho tài khoản{" "}
                <span className="font-semibold text-gray-800">
                  {email}
                </span>
                .
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* New password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Mật khẩu mới
                </label>

                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  minLength={6}
                  required
                  disabled={loading || countdown <= 0}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1e3a5f] focus:ring-4 focus:ring-[#1e3a5f]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Xác nhận mật khẩu mới
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  minLength={6}
                  required
                  disabled={loading || countdown <= 0}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1e3a5f] focus:ring-4 focus:ring-[#1e3a5f]/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* Countdown */}
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  countdown > 0
                    ? "bg-blue-50 text-[#1e3a5f]"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {countdown > 0
                  ? `Phiên đổi mật khẩu còn ${countdown}s`
                  : "Phiên đổi mật khẩu đã hết hạn."}
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {/* Success */}
              {success && (
                <p
                  role="status"
                  className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || countdown <= 0}
                className="h-12 w-full rounded-xl bg-[#1e3a5f] font-semibold text-white shadow-lg shadow-[#1e3a5f]/20 transition hover:bg-[#172f4d] focus:outline-none focus:ring-4 focus:ring-[#1e3a5f]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
              Nhớ mật khẩu rồi?{" "}
              <button
                type="button"
                onClick={() => router.push("/admin/login")}
                className="font-bold text-[#1e3a5f] hover:text-blue-800"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}