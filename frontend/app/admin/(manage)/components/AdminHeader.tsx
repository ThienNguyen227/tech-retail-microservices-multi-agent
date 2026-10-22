"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {Store, User, LogOut, ChevronDown, ShieldCheck} from "lucide-react";
import axios from "axios";
import { clearAccessToken } from "@/lib/access_token/access_token";

export default function AdminHeader() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  //================================== SYNC USERNAME (ADMIN INFORMATION) =======================================//
  useEffect(() => {
    function syncUserName() {
      setUserName(sessionStorage.getItem("userName") ?? "");
    }

    syncUserName();

    window.addEventListener("admin-profile-updated", syncUserName);

    return () => {
      window.removeEventListener("admin-profile-updated", syncUserName);
    };
  }, []);

  //================================== LOGOUT =======================================//
  async function handleLogout() {
    try {
      await axios.post(
        "http://localhost:3001/api/v1/admin-session/user-service/logout",
        {},
        {
          withCredentials: true,
          timeout: 10000,
        },
      );
    } catch (error) {
      console.error("ADMIN LOGOUT ERROR:", error);
    } finally {
      const keys = ["userName", "userId", "adminSessionId"];
      clearAccessToken();

      keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      setUserName("");
      router.replace("/admin/login");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/admin/dashboard"
            className="group flex shrink-0 items-center gap-3"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-[#0f172a] text-white shadow-md transition-transform group-hover:scale-105">
              <Store size={23} strokeWidth={2.4} />
            </div>

            <div>
              <div className="text-lg font-extrabold tracking-tight text-[#0f172a]">
                SmartHub
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Admin Console
              </div>
            </div>
          </Link>

          {/* Center title */}
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-slate-800">
              Hệ thống quản trị
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Quản lý hoạt động kinh doanh bán lẻ
            </p>
          </div>

          {/* Admin profile */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 sm:flex">
              <ShieldCheck size={17} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">
                Quản trị viên
              </span>
            </div>

            {userName && (
              <Link
                href="/admin/profile"
                className="group flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-50"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-700">
                  <User size={18} strokeWidth={2} />
                </div>

                <div className="hidden max-w-[130px] sm:block">
                  <p className="text-[11px] text-slate-400">
                    Xin chào,
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                    {userName}
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className="hidden text-slate-400 sm:block"
                />
              </Link>
            )}

            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            {/* Logout */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              aria-label="Đăng xuất Admin"
              className="flex h-10 items-center gap-2 rounded-xl px-3 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              <span className="hidden text-sm font-medium md:inline">
                Đăng xuất
              </span>
            </button>
          </div>
        </div>        
      </header>

      {/* 1. LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-600">
              <LogOut size={22} />
            </div>

            <h2
              id="logout-title"
              className="text-center text-lg font-bold text-slate-800"
            >
              Xác nhận đăng xuất
            </h2>

            <p className="mt-2 text-center text-sm text-slate-500">
              Bạn có chắc muốn đăng xuất khỏi tài khoản không?
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}