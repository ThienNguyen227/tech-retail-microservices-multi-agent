"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const getRemainingSeconds = (expiresAt: string | null): number => {
  if (!expiresAt) return 0;

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
};

export default function ForgotPasswordOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const emailFromStorage = sessionStorage.getItem("forgotPasswordEmail");
    const emailFromQuery = searchParams.get("email") || emailFromStorage || "";

    setEmail(emailFromQuery);
    setExpiresAt(sessionStorage.getItem("forgotPasswordOtpExpiresAt"));
  }, [searchParams]);

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(getRemainingSeconds(expiresAt));
    };

    updateCountdown();

    if (!expiresAt) return;

    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("forgotPasswordEmail");

    if (!storedEmail) {
      router.replace("/admin/forgot-password");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Không tìm thấy email. Vui lòng nhập lại email!");
      return;
    }

    if (otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP!");
      return;
    }

    if (countdown <= 0) {
      setError("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới!");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/admin-session/user-service/forgot-password/otp-verifying",
        {
          user_email: email,
          otp_code: otp,
        },
        {
          timeout: 10_000,
          withCredentials: true,
        },
      );

      const data = response.data;

      sessionStorage.setItem(
        "forgotPasswordResetExpiresAt",
        data.reset_expires_at,
      );

      router.push("/admin/forgot-password-change");
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
            : message || "Xác thực OTP thất bại.",
        );
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending || countdown > 0) return;

    setError("");
    setResending(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/admin-session/user-service/forgot-password/otp-resending",
        {
          user_email: email,
        },
        {
          timeout: 10_000,
        },
      );

      const data = response.data;

      sessionStorage.setItem(
        "forgotPasswordOtpExpiresAt",
        data.otp_expires_at,
      );

      setExpiresAt(data.otp_expires_at);
      setOtp("");
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
            : message || "Gửi lại OTP thất bại.",
        );
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7fb] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/70 lg:grid-cols-2">
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
              Xác minh danh tính của bạn.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-blue-100/80">
              Nhập mã OTP được gửi đến email của bạn để xác minh danh tính
              và tiếp tục quá trình khôi phục mật khẩu.
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
                  Mã OTP có thời hạn xác thực
                </p>
              </div>
            </div>

            <div className="h-1 w-16 rounded-full bg-blue-300" />
          </div>
        </section>

        {/* RIGHT - OTP FORM */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1e3a5f] font-extrabold text-white">
                S
              </div>

              <span className="text-lg font-bold text-[#1e3a5f]">
                SmartHub
              </span>
            </div>

            {/* STEP INDICATOR */}
            <div className="mb-9">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    ✓
                  </div>
                  <span className="mt-2 text-center text-xs font-semibold text-[#1e3a5f]">
                    Email
                  </span>
                </div>

                <div className="mx-3 mb-5 h-px flex-1 bg-[#1e3a5f]" />

                <div className="flex flex-col items-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    2
                  </div>
                  <span className="mt-2 text-center text-xs font-semibold text-[#1e3a5f]">
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
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Khôi phục tài khoản
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-800">
                Xác thực OTP
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Nhập mã OTP gồm 6 số đã gửi đến{" "}
                <span className="font-semibold text-slate-800">
                  {email || "email của bạn"}
                </span>
                .
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label
                  htmlFor="otp"
                  className="mb-3 block text-sm font-semibold text-slate-700"
                >
                  Mã xác thực OTP
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Nhập 6 số OTP"
                  maxLength={6}
                  required
                  disabled={loading}
                  className="h-14 w-full rounded-lg border border-slate-200 bg-white px-4 text-center text-xl font-bold tracking-[0.45em] text-slate-800 outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {/* Countdown / Resend */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span
                  className={
                    countdown > 0 ? "text-slate-500" : "font-medium text-red-500"
                  }
                >
                  {countdown > 0
                    ? `OTP còn hiệu lực ${countdown}s`
                    : "OTP đã hết hạn."}
                </span>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className="font-semibold text-[#1e3a5f] transition hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resending ? "Đang gửi..." : "Gửi lại OTP"}
                </button>
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
                disabled={loading || countdown <= 0}
                className="h-12 w-full rounded-lg bg-[#1e3a5f] font-semibold text-white shadow-md shadow-blue-900/10 transition hover:bg-[#294d7a] focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Muốn nhập lại email?{" "}
              <button
                type="button"
                onClick={() => router.push("/admin/forgot-password")}
                className="font-semibold text-[#1e3a5f] transition hover:text-blue-600"
              >
                Quay lại
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}