"use client";

import type { Locale } from "@cmsauto/contracts";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CoinRadarLogo } from "@/components/reader/brand-logo";

const navItems = [
  { label: "Về chúng tôi", path: "/about" },
  { label: "Kiến thức", path: "/knowledge" },
  { label: "Thị trường", path: "/markets" },
  { label: "Phân tích", path: "/analysis" },
  { label: "Tin tức", path: "/articles" }
];

export function ReaderHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#d7e7dc] bg-white/96 text-[#07110c] shadow-[0_8px_24px_rgba(3,19,11,0.04)] backdrop-blur" id="top">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
        <CoinRadarLogo href={`/${locale}`} tone="light" />

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-1.5 text-sm font-medium">
          {navItems.map((item) => {
            const itemHref = `/${locale}${item.path}`;
            const isActive = pathname === itemHref || pathname.startsWith(`${itemHref}/`);

            return (
              <Link
                className={`rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-[#f3f5f4] text-[#008b4a]" : "text-[#07110c] hover:bg-[#f3f5f4] hover:text-[#008b4a]"
                }`}
                href={itemHref}
                key={item.path}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            aria-label="Tìm kiếm"
            className="flex size-10 items-center justify-center rounded-lg bg-[#f3f5f4] text-[#07110c] transition hover:bg-[#e8ecea] hover:text-[#008b4a]"
            href={`/${locale}/search`}
          >
            <Search size={19} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
