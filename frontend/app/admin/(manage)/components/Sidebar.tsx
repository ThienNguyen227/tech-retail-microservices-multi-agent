"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  UserRoundPlus,
  PanelLeftClose,
  PanelLeftOpen,
  ContactRound,
  UserCog,
  UserRound,
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
    icon: UserCog,
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
    title: "Quản lý nhân viên",
    href: "/admin/manage-employee",
    icon: Users,
  },
  {
    title: "Thông tin nhân viên",
    href: "/admin/employee-information",
    icon: ContactRound,
  },
  {
    title: "Quản lý thông tin khách hàng",
    href: "/admin/manage-customer",
    icon: UserRound,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-slate-100 py-5 ${
          collapsed ? "px-3" : "px-5"
        }`}
      >
        <div
          className={`flex items-center ${
            collapsed ? "flex-col gap-4" : "justify-between gap-3"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={21} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <h2 className="whitespace-nowrap text-sm font-bold text-slate-800">
                  Quản trị hệ thống
                </h2>
                <p className="mt-1 whitespace-nowrap text-xs text-slate-400">
                  Quản lý cửa hàng
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 space-y-1 overflow-y-auto py-5 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Menu chính
          </p>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;

          const isParentActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              pathname.startsWith(`${item.href}/`)) ||
            (item.children?.some((child) => pathname === child.href) ?? false);

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? item.title : undefined}
                className={`group flex items-center rounded-xl py-3 text-sm font-medium transition-all ${
                  collapsed
                    ? "justify-center px-0"
                    : "gap-3 px-3"
                } ${
                  isParentActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <Icon size={19} strokeWidth={2} className="shrink-0" />

                {!collapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">
                      {item.title}
                    </span>

                    {item.children && (
                      <ChevronRight
                        size={15}
                        className={`shrink-0 transition-transform ${
                          isParentActive ? "rotate-90" : ""
                        }`}
                      />
                    )}
                  </>
                )}
              </Link>

              {/* Submenu: chỉ hiển thị khi sidebar mở rộng */}
              {item.children && isParentActive && !collapsed && (
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
                        <ChildIcon size={16} className="shrink-0" />
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

      {/* Footer */}
      <div className={`border-t border-slate-100 ${collapsed ? "p-2" : "p-4"}`}>
        <div
          className={`rounded-xl bg-slate-50 ${
            collapsed ? "flex justify-center p-3" : "p-3"
          }`}
          title={collapsed ? "SmartHub Admin - Hệ thống quản lý bán lẻ" : undefined}
        >
          {collapsed ? (
            <ShieldCheck size={20} className="text-blue-600" />
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-700">
                SmartHub Admin
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Hệ thống quản lý bán lẻ
              </p>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}