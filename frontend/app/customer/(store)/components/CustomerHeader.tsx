"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Store,
  Smartphone,
  Laptop,
  Tablet,
  Home,
  ShoppingBag,
  ShieldCheck,
  List,
  Gift,
} from "lucide-react";
import { clearAccessToken } from "@/lib/access_token/customer_access_token";
import { customerUserService } from "@/lib/axios/services/customer-services/user_service";
import { customerCartService } from "@/lib/axios/services/customer-services/cart_service";
import { customerOrderService } from "@/lib/axios/services/customer-services/order_service";
import { customerCustomerService } from "@/lib/axios/services/customer-services/warranty_service";

export default function CustomerHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [keyword, setKeyword] = useState("");
  const [userName, setUserName] = useState("");
  const [cartCount, setCartCount] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [warrantyCount, setWarrantyCount] = useState<number>(0);

  async function fetchWarrantyCount() {
    const userId = sessionStorage.getItem("userId");

    if (!userId) {
      setWarrantyCount(0);
      return;
    }

    try {
      const data = await customerCustomerService.getWarranty();

      setWarrantyCount(data.total ?? 0);
    } catch (err) {
      console.error("Lỗi lấy số lượng bảo hành:", err);
    }
  }

  // =========================
  // USER NAME
  // =========================
  useEffect(() => {
    function syncUserName() {
      setUserName(
        localStorage.getItem("userName") ?? sessionStorage.getItem("userName") ?? "",
      );
    }

    syncUserName();

    window.addEventListener("customer-profile-updated", syncUserName);

    return () => {
      window.removeEventListener(
        "customer-profile-updated",
        syncUserName,
      );
    };
  }, []);

  //================================== LOGOUT =======================================//
  async function handleLogout() {
    try {
      await customerUserService.logout();
    } catch (error) {
      console.error("CUSTOMER LOGOUT ERROR:", error);
    } finally {
      const keys = ["userName", "userId", "customerSessionId"];

      clearAccessToken();

      keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      setUserName("");
      router.replace("/customer/login");
    }
  }

  // =========================
  // SEARCH
  // =========================
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = keyword.trim();

    if (query) {
      router.push(
        `/customer/search?q=${encodeURIComponent(query)}`,
      );
    }
  }

  // =========================
  // CART + ORDER COUNT
  // =========================
  useEffect(() => {
    async function fetchCartCount() {
      const userId = sessionStorage.getItem("userId");

      if (!userId) {
        setCartCount(0);
        return;
      }

      try {
        const data = await customerCartService.getCart();
        const cartData = data.cart ?? data;

        const totalItems = (cartData.items || []).reduce(
          (sum: number, item: any) =>
            sum + (item.quantity || 0),
          0,
        );

        setCartCount(totalItems);
      } catch (err) {
        console.error(
          "Lỗi lấy số lượng giỏ hàng:",
          err,
        );
      }
    }

    async function fetchOrderCount() {
      const userId = sessionStorage.getItem("userId");

      if (!userId) {
        setOrderCount(0);
        return;
      }

      try {
        const data = await customerOrderService.getOrderList();

        setOrderCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error("Lỗi lấy số lượng đơn hàng:", err);
      }
    }

    fetchCartCount();
    fetchOrderCount();
    fetchWarrantyCount();

    window.addEventListener(
      "cart-updated",
      fetchCartCount,
    );

    window.addEventListener(
      "order-updated",
      fetchOrderCount,
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        fetchCartCount,
      );

      window.removeEventListener(
        "order-updated",
        fetchOrderCount,
      );
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      {/* =========================
          TOP HEADER
      ========================== */}
      <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/customer/home"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#168b87] to-[#073b4c] text-white shadow-md transition-transform group-hover:scale-105">
            <Store
              size={23}
              strokeWidth={2.4}
            />
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
              onChange={(event) =>
                setKeyword(event.target.value)
              }
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#168b87] focus:bg-white focus:ring-4 focus:ring-[#168b8715]"
            />
          </div>

          <button
            type="submit"
            className="ml-2 flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#168b87] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10736f] hover:shadow-md active:scale-[0.98]"
          >
            <Search size={17} />

            <span className="hidden md:inline">
              Tìm kiếm
            </span>
          </button>
        </form>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Cart */}
          <Link
            href="/customer/cart"
            aria-label="Giỏ hàng"
            title="Giỏ hàng của tôi"
            className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl
              transition-all duration-300 ease-out
              ${
                pathname.startsWith("/customer/cart")
                  ? "bg-gradient-to-br from-[#168b87] to-[#08645f] text-white shadow-lg shadow-[#168b87]/30"
                  : "bg-transparent text-slate-500 hover:bg-[#e6f5f4] hover:text-[#168b87] hover:shadow-md hover:shadow-[#168b87]/10"
              }
              hover:-translate-y-1 active:translate-y-0 active:scale-95`}
          >
            <ShoppingCart
              size={27}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
            />

            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#168b87] px-1 text-[10px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}

            <span
              className="pointer-events-none absolute left-1/2 top-[calc(100%+12px)] z-50
                -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg
                bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0
                shadow-lg transition-all duration-200
                group-hover:translate-y-0 group-hover:opacity-100"
            >
              Giỏ hàng của tôi
            </span>
          </Link>

          {/* Orders */}
          <Link
            href="/customer/order"
            aria-label="Đơn hàng"
            title="Đơn hàng của tôi"
            className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl
              transition-all duration-300 ease-out
              ${
                pathname.startsWith("/customer/order")
                  ? "bg-gradient-to-br from-[#168b87] to-[#08645f] text-white shadow-lg shadow-[#168b87]/30"
                  : "bg-transparent text-slate-500 hover:bg-[#e6f5f4] hover:text-[#168b87] hover:shadow-md hover:shadow-[#168b87]/10"
              }
              hover:-translate-y-1 active:translate-y-0 active:scale-95`}
          >
            <ShoppingBag
              size={27}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
            />

            {orderCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#168b87] px-1 text-[10px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                {orderCount > 99 ? "99+" : orderCount}
              </span>
            )}

            <span
              className="pointer-events-none absolute left-1/2 top-[calc(100%+12px)] z-50
                -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg
                bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0
                shadow-lg transition-all duration-200
                group-hover:translate-y-0 group-hover:opacity-100"
            >
              Đơn hàng của tôi
            </span>
          </Link>

          {/* Warranty */}
          <Link
            href="/customer/warranty"
            aria-label="Bảo hành của tôi"
            title="Bảo hành của tôi"
            className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl
              transition-all duration-300 ease-out
              ${
                pathname.startsWith("/customer/warranty")
                  ? "bg-gradient-to-br from-[#168b87] to-[#08645f] text-white shadow-lg shadow-[#168b87]/30"
                  : "bg-transparent text-slate-500 hover:bg-[#e6f5f4] hover:text-[#168b87] hover:shadow-md hover:shadow-[#168b87]/10"
              }
              hover:-translate-y-1 active:translate-y-0 active:scale-95`}
          >
            <ShieldCheck
              size={30}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]"
            />

            {warrantyCount > 0 && (
              <span
            className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#168b87] px-1 text-[10px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-110"
          >
            {warrantyCount > 99 ? "99+" : warrantyCount}
          </span>
            )}

            {/* Tooltip */}
            <span
              className="pointer-events-none absolute left-1/2 top-[calc(100%+12px)] z-50
                -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg
                bg-slate-800 px-3 py-1.5 text-xs font-medium text-white opacity-0
                shadow-lg transition-all duration-200
                group-hover:translate-y-0 group-hover:opacity-100"
            >
              Bảo hành của tôi
            </span>
          </Link>

          {/* Divider */}
          <div className="mx-2 hidden h-7 w-px bg-slate-200 sm:block" />

          {/* User */}
          {userName ? (
            <div className="flex items-center gap-2">
              <Link
                href="/customer/profile/account-information"
                className="group flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-50"
              >
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f5f4] text-[#168b87]">
                  <User
                    size={18}
                    strokeWidth={2}
                  />
                </div>

                <div className="hidden max-w-[120px] lg:block">
                  <p className="text-[11px] text-slate-400">
                    Xin chào
                  </p>

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

      {/* =========================
          NAVIGATION
      ========================== */}
      <div className="border-t border-slate-100 bg-white">
  {/* Desktop */}
  <div className="mx-auto hidden h-[58px] max-w-7xl items-center gap-2 px-4 sm:px-6 lg:flex">
    {[
      {
        label: "Trang chủ",
        href: "/customer/home",
        icon: Home,
        active: pathname === "/customer/home",
      },
      {
        label: "Điện thoại",
        href: "/customer/product-category/dien-thoai-di-dong",
        icon: Smartphone,
        active: pathname.startsWith("/customer/product-category/dien-thoai-di-dong"),
      },
      {
        label: "Laptop",
        href: "/customer/product-category/may-tinh-xach-tay",
        icon: Laptop,
        active: pathname.startsWith("/customer/product-category/may-tinh-xach-tay"),
      },
      {
        label: "Máy tính bảng",
        href: "/customer/product-category/may-tinh-bang",
        icon: Tablet,
        active: pathname.startsWith("/customer/product-category/may-tinh-bang"),
      },
      {
        label: "Chương trình khuyến mãi",
        href: "/customer/promotion-list",
        icon: Gift,
        active: pathname.startsWith("/customer/promotion-list"),
      },
      {
        label: "Chính sách bảo hành",
        href: "/customer/warranty-list",
        icon: ShieldCheck,
        active: pathname.startsWith("/customer/warranty-list"),
      },
    ].map((item) => {
      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          className={`group flex h-10 items-center gap-2 rounded-xl px-4 text-sm transition-all duration-300 ${
            item.active
              ? "bg-gradient-to-r from-[#168b87] to-[#08645f] font-semibold text-white shadow-md shadow-[#168b87]/20"
              : "font-medium text-slate-600 hover:bg-[#e6f5f4] hover:text-[#168b87]"
          }`}
        >
          <Icon
            size={19}
            strokeWidth={2}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <span>{item.label}</span>
        </Link>
      );
    })}
  </div>

  {/* Mobile dropdown */}
  <div className="relative px-4 py-2 lg:hidden">
    <button
      type="button"
      onClick={() => setIsCategoryOpen((prev) => !prev)}
      className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-[#168b87] hover:bg-[#e6f5f4] hover:text-[#168b87]"
    >
      <span className="flex items-center gap-2">
        <List />
        Danh mục
      </span>

      <ChevronDown
        size={19}
        className={`transition-transform duration-300 ${
          isCategoryOpen ? "rotate-180 text-[#168b87]" : ""
        }`}
      />
    </button>

    {isCategoryOpen && (
      <div className="absolute left-4 right-4 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/10">
        {[
          {
            label: "Trang chủ",
            href: "/customer/home",
            icon: Home,
            active: pathname === "/customer/home",
          },
          {
            label: "Điện thoại",
            href: "/customer/product-category/dien-thoai-di-dong",
            icon: Smartphone,
            active: pathname.startsWith("/customer/product-category/dien-thoai-di-dong"),
          },
          {
            label: "Laptop",
            href: "/customer/product-category/may-tinh-xach-tay",
            icon: Laptop,
            active: pathname.startsWith("/customer/product-category/may-tinh-xach-tay"),
          },
          {
            label: "Máy tính bảng",
            href: "/customer/product-category/may-tinh-bang",
            icon: Tablet,
            active: pathname.startsWith("/customer/product-category/may-tinh-bang"),
          },
          {
            label: "Chương trình khuyến mãi",
            href: "/customer/promotion-list",
            icon: Gift,
            active: pathname.startsWith("/customer/promotion-list"),
          },
          {
            label: "Chính sách bảo hành",
            href: "/customer/warranty-list",
            icon: ShieldCheck,
            active: pathname.startsWith("/customer/warranty-list"),
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsCategoryOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all duration-200 ${
                item.active
                  ? "bg-[#e6f5f4] font-semibold text-[#168b87]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#168b87]"
              }`}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{item.label}</span>

              {item.active && (
                <span className="ml-auto h-2 w-2 rounded-full bg-[#168b87]" />
              )}
            </Link>
          );
        })}
      </div>
    )}
  </div>
</div>
    </header>
  );
}

