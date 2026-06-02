import type { Metadata } from "next";

import { QueryProvider } from "@/components/query-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CMS Auto",
    template: "%s | CMS Auto"
  },
  description: "Nền tảng nội dung và bài viết tài chính."
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

