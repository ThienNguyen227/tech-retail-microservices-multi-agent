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
    const emailFromQuery = searchParams.get("email") || "";
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
    const email = sessionStorage.getItem("forgotPasswordEmail");

    if (!email) {
      router.replace("/customer/forgot-password");
    }
  }, [router]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Không tìm thấy email1");
      return;
    }

    if (otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP!");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/user-service/forgot-password/otp-verifying",
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

      sessionStorage.setItem("forgotPasswordResetExpiresAt", data.reset_expires_at);

      router.push("/customer/forgot-password-change");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Server không phản hồi
        if (!error.response) {
          if (error.code === "ECONNABORTED") {
            setError("Server phản hồi quá lâu. Vui lòng thử lại sau!");
          } else {
            setError("Không thể kết nối đến server. Vui lòng thử lại.");
          }

          return;
        }

        // Server trả về lỗi 4xx / 5xx
        setError(
          error.response.data?.message ||
            "Xác thực OTP thất bại.",
        );
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;

    setError("");
    setResending(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/api/v1/user-service/forgot-password/otp-resending",
        {
          user_email: email,
        },
        {
          timeout: 10_000,
        },
      );

      const data = response.data;

      sessionStorage.setItem("forgotPasswordOtpExpiresAt", data.otp_expires_at);

      setExpiresAt(data.otp_expires_at);
      setOtp("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Server không phản hồi
        if (!error.response) {
          if (error.code === "ECONNABORTED") {
            setError("Server phản hồi quá lâu. Vui lòng thử lại sau!");
          } else {
            setError("Không thể kết nối đến server. Vui lòng thử lại.");
          }

          return;
        }

        // Server trả về lỗi 4xx / 5xx
        setError(
          error.response.data?.message ||
          "Gửi lại OTP thất bại.",
        );
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef6f7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-[#0c56631a] lg:grid-cols-[0.9fr_1.1fr]">
        {/* LEFT - BRAND / INFORMATION */}
        <section className="relative hidden overflow-hidden bg-[#073b4c] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-[#2ec4b6]/20" />
          <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full border-[38px] border-[#ffd166]/15" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2ec4b6] text-xl font-black text-[#073b4c]">
                S
              </div>

              <span className="text-xl font-bold tracking-tight">
                SmartHub
              </span>
            </div>

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-[#2ec4b6]">
              Account recovery
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Xác thực để tiếp tục.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-[#c6e4e5]">
              Nhập mã OTP được gửi đến email của bạn để xác minh và tiếp tục
              quá trình khôi phục mật khẩu.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f8f5] text-2xl">
                🔐
              </div>

              <div>
                <p className="font-semibold">Mã xác thực</p>

                <p className="mt-1 text-sm text-[#a9d4d6]">
                  OTP có thời hạn bảo mật
                </p>
              </div>
            </div>

            <div className="h-1 w-20 rounded-full bg-[#ffd166]" />
          </div>
        </section>

        {/* RIGHT - OTP FORM */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#073b4c] font-black text-white">
                S
              </div>

              <span className="text-lg font-bold text-[#073b4c]">
                SmartHub
              </span>
            </div>

            <div className="mb-7">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {/* Bước 1 - Hoàn thành */}
                  <div className="flex flex-col items-center">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#168b87] text-sm font-bold text-white">
                      ✓
                    </div>

                    <span className="mt-2 text-xs font-semibold text-[#168b87]">
                      Kiểm tra email
                    </span>
                  </div>

                  {/* Line 1 - Đã hoàn thành */}
                  <div className="mx-3 h-[2px] flex-1 bg-[#168b87]" />

                  {/* Bước 2 - Đang focus */}
                  <div className="flex flex-col items-center">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#168b87] text-sm font-bold text-white">
                      2
                    </div>

                    <span className="mt-2 text-xs font-semibold text-[#168b87]">
                      Xác thực OTP
                    </span>
                  </div>

                  {/* Line 2 - Chưa đến */}
                  <div className="mx-3 h-[2px] flex-1 bg-[#d9e4e5]" />

                  {/* Bước 3 - Chưa thực hiện */}
                  <div className="flex flex-col items-center">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8eeee] text-sm font-bold text-[#8ca0a4]">
                      3
                    </div>

                    <span className="mt-2 text-xs text-[#8ca0a4]">
                      Thay đổi mật khẩu
                    </span>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#12313a]">
                Xác thực OTP
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#70858b]">
                Nhập mã OTP gồm 6 số đã gửi đến{" "}
                <span className="font-semibold text-[#12313a]">
                  {email || "email của bạn"}
                </span>
                .
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* OTP */}
              <div className="rounded-2xl border border-[#dfe9ea] bg-[#f9fbfb] p-4">
                <label
                  htmlFor="otp"
                  className="mb-3 block text-sm font-semibold text-[#29444b]"
                >
                  Nhập mã OTP
                </label>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="Nhập 6 số OTP"
                  maxLength={6}
                  required
                  disabled={loading}
                  className="h-14 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-center text-xl font-bold tracking-[0.35em] text-[#12313a] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-[#a4b4b7] focus:border-[#168b87] focus:ring-4 focus:ring-[#168b8718] disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {/* Countdown / Resend */}
              <div className="flex items-center justify-between gap-3 text-sm text-[#70858b]">
                <span>
                  {countdown > 0
                    ? `OTP còn hiệu lực trong ${countdown}s`
                    : "OTP đã hết hạn."}
                </span>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || countdown > 0}
                  className="font-semibold text-[#168b87] transition hover:text-[#073b4c] disabled:cursor-not-allowed disabled:text-[#9bb0b2]"
                >
                  {resending ? "Đang gửi..." : "Gửi lại OTP"}
                </button>
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || countdown <= 0}
                className="h-12 w-full rounded-xl bg-[#168b87] font-semibold text-white shadow-lg shadow-[#168b8730] transition hover:bg-[#10736f] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#168b8730] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Đang xác thực..." : "Xác thực OTP"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#70858b]">
              Nhập sai email?{" "}
              <button
                type="button"
                onClick={() => router.push("/customer/forgot-password")}
                className="font-bold text-[#168b87] hover:text-[#073b4c]"
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

