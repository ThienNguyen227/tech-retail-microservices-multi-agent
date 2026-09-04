"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
      const response = await fetch(
        "http://localhost:3001/auth/customer/forgot-password/send-otp",
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
        setError(data.message || "Không thể kiểm tra email.");
        return;
      }

      // Dùng cho trang OTP hiển thị đếm ngược theo thời điểm hết hạn từ BE.
      sessionStorage.setItem("forgotPasswordEmail", email);
      sessionStorage.setItem(
        "forgotPasswordOtpExpiresAt",
        data.otp_expires_at,
      );

      router.push(
        `/customer/forgot-password-otp?email=${encodeURIComponent(email)}`,
      );
    } catch {
      setError("Không thể kết nối đến server. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#eef6f7] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-[#0c56631a] lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT - BRAND / INFORMATION */}
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
              Account recovery
            </p>

            <h1 className="max-w-md text-4xl font-bold leading-tight xl:text-5xl">
              Khôi phục tài khoản dễ dàng.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-[#c6e4e5]">
              Nhập email đã đăng ký để nhận mã OTP và tiếp tục khôi phục mật
              khẩu tài khoản của bạn.
            </p>
          </div>

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f8f5] text-2xl">
                🔐
              </div>

              <div>
                <p className="font-semibold">Bảo mật tài khoản</p>

                <p className="mt-1 text-sm text-[#a9d4d6]">
                  Mã OTP giúp xác minh danh tính của bạn
                </p>
              </div>
            </div>

            <div className="h-1 w-20 rounded-full bg-[#ffd166]" />
          </div>
        </section>

        {/* RIGHT - FORM */}
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

            <div className="mb-9">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#168b87]">
                Khôi phục tài khoản
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-[#12313a]">
                Quên mật khẩu
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#70858b]">
                Nhập email đã đăng ký để nhận mã OTP khôi phục mật khẩu.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#29444b]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[#d9e4e5] bg-[#fbfdfd] px-4 text-sm text-[#12313a] outline-none transition placeholder:text-[#a4b4b7] focus:border-[#168b87] focus:ring-4 focus:ring-[#168b8718] disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#168b87] font-semibold text-white shadow-lg shadow-[#168b8730] transition hover:bg-[#10736f] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#168b8730] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Đang kiểm tra..." : "Kiểm tra email"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-[#70858b]">
              Nhớ mật khẩu rồi?{" "}
              <button
                type="button"
                onClick={() => router.push("/customer/login")}
                className="font-bold text-[#168b87] hover:text-[#073b4c]"
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

