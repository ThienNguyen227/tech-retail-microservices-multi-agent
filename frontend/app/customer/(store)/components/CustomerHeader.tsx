// "use client";

// import Link from "next/link";
// import { FormEvent, useState, useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function CustomerHeader() {
//   const router = useRouter();
//   const [keyword, setKeyword] = useState("");
//   const [userName, setUserName] = useState("");

//   useEffect(() => {
//     setUserName(
//       localStorage.getItem("userName") ??
//         sessionStorage.getItem("userName") ??
//         "",
//     );
//   }, []);

//   async function handleLogout() {
//     const refreshToken =
//       localStorage.getItem("refreshToken") ??
//       sessionStorage.getItem("refreshToken");

//     try {
//       if (refreshToken) {
//         await fetch("http://localhost:3001/auth/customer/logout", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             refresh_token: refreshToken,
//           }),
//         });
//       }
//     } finally {
//       const keys = [
//         "accessToken",
//         "refreshToken",
//         "userType",
//         "userName",
//         "userId",
//       ];

//       keys.forEach((key) => {
//         localStorage.removeItem(key);
//         sessionStorage.removeItem(key);
//       });

//       router.push("/customer/login");
//     }
//   }

//   function handleSearch(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     const query = keyword.trim();

//     if (query) {
//       router.push(`/customer/search?q=${encodeURIComponent(query)}`);
//     }
//   }


//   return (
//     <header className="border-b border-slate-200 bg-white">
//       <div className="mx-auto flex h-18 max-w-7xl items-center gap-5 px-4 py-3 sm:px-6">
//         <Link
//           href="/customer/home"
//           className="flex shrink-0 items-center gap-2 text-xl font-bold text-[#073b4c]"
//         >
//           <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#168b87] font-black text-white">
//             S
//           </span>

//           <span className="hidden sm:block">SmartHub</span>
//         </Link>

//         <form
//           onSubmit={handleSearch}
//           className="mx-auto flex w-full max-w-xl items-center"
//         >
//           <input
//             type="search"
//             value={keyword}
//             onChange={(event) => setKeyword(event.target.value)}
//             placeholder="Tìm kiếm sản phẩm..."
//             className="h-11 w-full rounded-l-xl border border-slate-300 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
//           />

//           <button
//             type="submit"
//             className="h-11 rounded-r-xl bg-[#168b87] px-5 text-sm font-semibold text-white transition hover:bg-[#10736f]"
//           >
//             Tìm kiếm
//           </button>
//         </form>

//         {userName ? (
//           <div className="flex items-center gap-3">
//             <Link
//               href="/customer/profile"
//               className="text-sm font-semibold text-[#073b4c] hover:text-[#168b87]"
//             >
//               Xin chào, {userName}
//             </Link>

//             <button
//               type="button"
//               onClick={handleLogout}
//               className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
//             >
//               Đăng xuất
//             </button>
//           </div>
//         ) : (
//           <Link
//             href="/customer/login"
//             className="rounded-xl border border-[#168b87] px-4 py-2 text-sm font-semibold text-[#168b87]"
//           >
//             Đăng nhập
//           </Link>
//         )}
//       </div>
//     </header>
//   );
// }


"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  Heart,
  ChevronDown,
  Store,
} from "lucide-react";

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

  async function handleLogout() {
    const refreshToken =
      localStorage.getItem("refreshToken") ??
      sessionStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await fetch("http://localhost:3001/auth/customer/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });
      }
    } finally {
      const keys = [
        "accessToken",
        "refreshToken",
        "userType",
        "userName",
        "userId",
      ];

      keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      router.push("/customer/login");
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = keyword.trim();

    if (query) {
      router.push(`/customer/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      {/* Top header */}
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/customer/home"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#168b87] to-[#073b4c] text-white shadow-md transition-transform group-hover:scale-105">
            <Store size={23} strokeWidth={2.4} />
          </div>

          <div className="hidden sm:block">
            <div className="text-lg font-extrabold tracking-tight text-[#073b4c]">
              SmartHub
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Smart Technology
            </div>
          </div>
        </Link>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="mx-auto flex w-full max-w-2xl"
        >
          <div className="relative w-full">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#168b87] focus:bg-white focus:ring-4 focus:ring-[#168b8715]"
            />
          </div>

          <button
            type="submit"
            className="ml-2 flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#168b87] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10736f] hover:shadow-md active:scale-[0.98]"
          >
            <Search size={17} />
            <span className="hidden md:inline">Tìm kiếm</span>
          </button>
        </form>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Wishlist */}
          <button
            type="button"
            aria-label="Sản phẩm yêu thích"
            className="relative hidden h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#168b87] sm:flex"
          >
            <Heart size={21} strokeWidth={1.9} />
          </button>

          {/* Cart */}
          <button
            type="button"
            aria-label="Giỏ hàng"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-[#168b87]"
          >
            <ShoppingCart size={21} strokeWidth={1.9} />

            <span className="absolute right-1 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#168b87] px-1 text-[10px] font-bold text-white">
              0
            </span>
          </button>

          {/* Divider */}
          <div className="mx-2 hidden h-7 w-px bg-slate-200 sm:block" />

          {userName ? (
            <div className="flex items-center gap-2">
              {/* User */}
              <Link
                href="/customer/profile"
                className="group flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-50"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f5f4] text-[#168b87]">
                  <User size={18} strokeWidth={2} />
                </div>

                <div className="hidden max-w-[120px] lg:block">
                  <p className="text-[11px] text-slate-400">Xin chào</p>
                  <p className="truncate text-sm font-semibold text-[#073b4c] group-hover:text-[#168b87]">
                    {userName}
                  </p>
                </div>

                <ChevronDown
                  size={15}
                  className="hidden text-slate-400 lg:block"
                />
              </Link>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất"
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
                <span className="hidden text-sm font-medium xl:inline">
                  Đăng xuất
                </span>
              </button>
            </div>
          ) : (
            <Link
              href="/customer/login"
              className="flex h-10 items-center gap-2 rounded-xl bg-[#168b87] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10736f] hover:shadow-md"
            >
              <User size={17} />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="hidden border-t border-slate-100 bg-white md:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-7 px-4 sm:px-6 lg:px-8">
          <Link
            href="/customer/home"
            className="text-sm font-semibold text-[#168b87]"
          >
            Trang chủ
          </Link>

          <Link
            href="/customer/products"
            className="text-sm font-medium text-slate-600 transition hover:text-[#168b87]"
          >
            Sản phẩm
          </Link>

          <Link
            href="/customer/categories"
            className="text-sm font-medium text-slate-600 transition hover:text-[#168b87]"
          >
            Danh mục
          </Link>

          <Link
            href="/customer/orders"
            className="text-sm font-medium text-slate-600 transition hover:text-[#168b87]"
          >
            Đơn hàng
          </Link>

          <Link
            href="/customer/warranty"
            className="text-sm font-medium text-slate-600 transition hover:text-[#168b87]"
          >
            Bảo hành
          </Link>
        </div>
      </div>
    </header>
  );
}

