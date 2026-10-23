"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ChevronRight,
  UserPlus,
  UserRoundPlus,
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
    children: [
      {
        title: "Tạo tài khoản nhân viên",
        href: "/admin/create-employee",
        icon: UserPlus,
      },
      {
        title: "Tạo tài khoản khách hàng",
        href: "/admin/manage-account/create-customer",
        icon: UserRoundPlus,
      },
    ],
  },
  {
    title: "Quản lý thông tin nhân viên",
    href: "/admin/manage-employee",
    icon: Users,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Menu chính
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          const isParentActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  isParentActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <Icon size={19} strokeWidth={2} />
                <span className="flex-1">{item.title}</span>

                {item.children && (
                  <ChevronRight
                    size={15}
                    className={`transition-transform ${
                      isParentActive ? "rotate-90" : ""
                    }`}
                  />
                )}
              </Link>

              {item.children && isParentActive && (
                <div className="ml-5 mt-1 space-y-1 border-l border-slate-200 pl-3">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                          isChildActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                        }`}
                      >
                        <ChildIcon size={16} />
                        <span>{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

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