// import type { ReactNode } from "react";
// import CustomerHeader from "./components/CustomerHeader";
// import AIChatbox from "./components/AIChatbox";

// export default function CustomerLayout({
//   children,
// }: Readonly<{
//   children: ReactNode;
// }>) {
//   return (
//     <div className="flex min-h-screen flex-col bg-[#eef6f7]">
//       <CustomerHeader />

//       <main className="flex-1">{children}</main>

//       <AIChatbox />
//     </div>
//   );
// }


import type { ReactNode } from 'react';

import CustomerHeader from './components/CustomerHeader';
import AIChatbox from './components/AIChatbox';
import { ProductCompareProvider } from './components/ProductCompareProvider';
import ProductCompareBar from './components/ProductComparePhoneBar';

export default function CustomerLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProductCompareProvider>
      <div className="flex min-h-screen flex-col bg-[#eef6f7]">
        <CustomerHeader />

        <main className="flex-1">{children}</main>

        <AIChatbox />
        <ProductCompareBar />
      </div>
    </ProductCompareProvider>
  );
}
