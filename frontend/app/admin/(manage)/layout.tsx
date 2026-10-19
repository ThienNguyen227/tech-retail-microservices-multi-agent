import type { ReactNode } from "react";
import AdminHeader from "./components/AdminHeader";

export default function AdminLayout({children}: Readonly<{children: ReactNode}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef6f7]">
      <AdminHeader />

      <main className="flex-1">{children}</main>

    </div>
  );
}