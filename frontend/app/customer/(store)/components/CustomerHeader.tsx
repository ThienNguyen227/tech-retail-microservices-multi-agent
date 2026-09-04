"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerHeader() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(
      localStorage.getItem("userName") ??
        sessionStorage.getItem("userName") ??
        "",
    );
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = keyword.trim();

    if (query) {
      router.push(`/customer/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-5 px-4 py-3 sm:px-6">
        <Link
          href="/customer/home"
          className="flex shrink-0 items-center gap-2 text-xl font-bold text-[#073b4c]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#168b87] font-black text-white">
            S
          </span>

          <span className="hidden sm:block">SmartHub</span>
        </Link>

        <form
          onSubmit={handleSearch}
          className="mx-auto flex w-full max-w-xl items-center"
        >
          <input
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="h-11 w-full rounded-l-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
          />

          <button
            type="submit"
            className="h-11 rounded-r-xl bg-[#168b87] px-5 text-sm font-semibold text-white transition hover:bg-[#10736f]"
          >
            Tìm kiếm
          </button>
        </form>

        {userName ? (
          <Link href="/customer/profile">
            Xin chào, {userName}
          </Link>
        ) : (
          <Link href="/customer/login">Đăng nhập</Link>
        )}
      </div>
    </header>
  );
}