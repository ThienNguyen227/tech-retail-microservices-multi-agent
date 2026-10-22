import type { ReactNode } from "react";
import AdminHeader from "./components/AdminHeader";
import Sidebar from "./components/Sidebar";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef6f7]">
      <AdminHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="min-w-0 flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}