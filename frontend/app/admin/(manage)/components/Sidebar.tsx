"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Store,
  Boxes,
  ShoppingCart,
  Tag,
  CreditCard,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    title: "Tổng quan",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Quản lý tài khoản",
    href: "/admin/manage-account",
    icon: Users,
  },
  // {
  //   title: "Sản phẩm",
  //   href: "/admin/products",
  //   icon: Package,
  // },
  // {
  //   title: "Nhân viên",
  //   href: "/admin/employees",
  //   icon: Users,
  // },
  // {
  //   title: "Chi nhánh",
  //   href: "/admin/branches",
  //   icon: Store,
  // },
  // {
  //   title: "Kho hàng",
  //   href: "/admin/inventory",
  //   icon: Boxes,
  // },
  // {
  //   title: "Đơn hàng",
  //   href: "/admin/orders",
  //   icon: ShoppingCart,
  // },
  // {
  //   title: "Khuyến mãi",
  //   href: "/admin/promotions",
  //   icon: Tag,
  // },
  // {
  //   title: "Thanh toán",
  //   href: "/admin/payments",
  //   icon: CreditCard,
  // },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Sidebar heading */}
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Quản trị hệ thống
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Quản lý cửa hàng
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Menu chính
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <Icon size={19} strokeWidth={2} />

              <span className="flex-1">{item.title}</span>

              <ChevronRight
                size={15}
                className={`transition-transform ${
                  isActive
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-700">
            SmartHub Admin
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Hệ thống quản lý bán lẻ
          </p>
        </div>
      </div>
    </aside>
  );
}