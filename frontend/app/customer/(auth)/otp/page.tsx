"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const OTP_LENGTH = 6;

const getRemainingSeconds = (expiresAt: string | null): number => {
  if (!expiresAt) return 0;

  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
};

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [passwordHash, setPasswordHash] = useState("");
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const updateCountdown = () => setCountdown(getRemainingSeconds(expiresAt));
    updateCountdown();

    if (!expiresAt) return;
    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email") || "";
    setEmail(emailFromQuery);
    setExpiresAt(sessionStorage.getItem("otpExpiresAt"));

    const draft = sessionStorage.getItem("registerDraft");
    if (!draft) {
      router.replace("/customer/register");
      return;
    }

    try {
      const parsed = JSON.parse(draft);
      setUserName(parsed.user_name || "");
      setUserPhone(parsed.user_phone || "");
      setPasswordHash(parsed.user_password_hash || "");
    } catch {
      sessionStorage.removeItem("registerDraft");
      router.replace("/customer/register");
    }
  }, [router, searchParams]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    const newValue = value.slice(-1);
    nextOtp[index] = newValue;
    setOtp(nextOtp);
    setError("");

    if (newValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const nextOtp = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) {
      nextOtp[i] = pasted[i];
    }

    setOtp(nextOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const otpCode = otp.join("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Không tìm thấy email đăng ký.");
      return;
    }

    if (otpCode.length !== OTP_LENGTH) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    if (!userName || !userPhone || !passwordHash) {
      setError("Dữ liệu đăng ký không hợp lệ. Vui lòng thử lại.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3001/auth/customer/register/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: email,
            otp_code: otpCode,
            user_name: userName,
            user_phone: userPhone,
            user_password_hash: passwordHash,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Xác thực OTP thất bại.");
        return;
      }

      setVerified(true);
      sessionStorage.removeItem("registerDraft");

      setTimeout(() => {
        router.push("/customer/login");
      }, 1200);
    } catch {
      setError("Xác thực OTP thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setError("");
    try {
      const response = await fetch(
        "http://localhost:3001/auth/customer/register/resend-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_email: email,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gửi lại OTP thất bại.");
        return;
      }

      sessionStorage.setItem("otpExpiresAt", data.otp_expires_at);
      setExpiresAt(data.otp_expires_at);
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setVerified(false);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Gửi lại OTP thất bại. Vui lòng thử lại.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef6f7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-[#0c56631a] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#073b4c] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[28px] border-[#2ec4b6]/20" />
          <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full border-[38px] border-[#ffd166]/15" />

          <div className="relative z-10">
            <div className="mb-16 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2ec4b6] text-xl font-black text-[#073b4c]">
                S
              </div>
              <span className="text-xl font-bold tracking-tight">SmartHub</span>
            </div>

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-[#2ec4b6]">
              Xác thực tài khoản
            </p>
            <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Mã OTP đã được gửi đến email của bạn.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#c6e4e5]">
              Vui lòng nhập mã 6 chữ số để hoàn tất quá trình đăng ký tài khoản
              và kích hoạt quyền truy cập.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f8f5] text-2xl">
                🔐
              </div>
              <div>
                <p className="font-semibold">Bảo mật 2 lớp</p>
                <p className="mt-1 text-sm text-[#a9d4d6]">
                  Mã xác thực có hiệu lực ngắn hạn
                </p>
              </div>
            </div>
            <div className="h-1 w-20 rounded-full bg-[#ffd166]" />
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <div className="mb-6 flex items-center gap-3 lg:hidden">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#073b4c] font-black text-white">
                  S
                </div>
                <span className="text-lg font-bold text-[#073b4c]">SmartHub</span>
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#168b87]">
                Bước 2/2
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-[#12313a]">
                Xác thực OTP
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#70858b]">
                Mã xác thực đã được gửi tới{" "}
                <span className="font-semibold text-[#12313a]">
                  {email || "email của bạn"}
                </span>
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-[#dfe9ea] bg-[#f9fbfb] p-4">
                <label className="mb-3 block text-sm font-semibold text-[#29444b]">
                  Nhập mã OTP
                </label>
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={handlePaste}
                      inputMode="numeric"
                      maxLength={1}
                      className="h-14 w-12 rounded-xl border border-[#d9e4e5] bg-white text-center text-xl font-bold text-[#12313a] outline-none transition focus:border-[#168b87] focus:ring-4 focus:ring-[#168b8718]"
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                  {error}
                </p>
              )}

              {verified && (
                <p className="rounded-lg bg-[#eafaf4] px-4 py-3 text-sm text-[#1d7a57]">
                  Xác thực OTP thành công. Đang chuyển hướng đến trang đăng nhập...
                </p>
              )}

              <div className="flex items-center justify-between gap-3 text-sm text-[#70858b]">
                <span>
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Bạn chưa nhận được mã?"}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-semibold text-[#168b87] disabled:cursor-not-allowed disabled:text-[#9bb0b2]"
                  disabled={countdown > 0 || resending}
                >
                  {resending ? "Đang gửi lại..." : "Gửi lại OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#168b87] font-semibold text-white shadow-lg shadow-[#168b8730] transition hover:bg-[#10736f] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#168b8730] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Đang xác thực..." : "Xác thực"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#70858b]">
              <Link
                className="font-bold text-[#168b87] hover:text-[#073b4c]"
                href="/customer/register"
              >
                ← Quay lại đăng ký
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
