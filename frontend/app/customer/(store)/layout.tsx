import type { ReactNode } from "react";
import CustomerHeader from "./components/CustomerHeader";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef6f7]">
      <CustomerHeader />

      <main className="flex-1">{children}</main>
    </div>
  );
}