import type { Metadata } from "next";

import { QueryProvider } from "@/components/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CoinRadar",
    template: "%s | CoinRadar"
  },
  description: "Radar tin tức, kiến thức và dữ liệu thị trường crypto dành cho nhà đầu tư Việt."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

