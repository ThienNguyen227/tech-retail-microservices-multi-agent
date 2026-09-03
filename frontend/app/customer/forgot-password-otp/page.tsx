"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Không tìm thấy email.");
      return;
    }

    if (otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3001/auth/customer/forgot-password/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: email,
            otp_code: otp,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Xác thực OTP thất bại.");
        return;
      }

      sessionStorage.setItem("forgotPasswordUserId", String(data.user_id));

      router.push("/customer/forgot-password-change");
    } catch {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;

    setError("");
    setResending(true);

    try {
      const response = await fetch(
        "http://localhost:3001/auth/customer/forgot-password/resend-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: email,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gửi lại OTP thất bại.");
        return;
      }

      sessionStorage.setItem(
        "forgotPasswordOtpExpiresAt",
        data.otp_expires_at,
      );
      setExpiresAt(data.otp_expires_at);
      setOtp("");
    } catch {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
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
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#168b87]">
                Bước 2/3
              </p>

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

