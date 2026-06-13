"use client";

import type { Locale } from "@cmsauto/contracts";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { CoinRadarLogo } from "@/components/reader/brand-logo";

const navItems = {
  "vi-vn": [
    { label: "Về chúng tôi", path: "/about" },
    { label: "Kiến thức", path: "/knowledge" },
    { label: "Thị trường", path: "/markets" },
    { label: "Phân tích", path: "/analysis" },
    { label: "Tin tức", path: "/articles" }
  ],
  "en-us": [
    { label: "About", path: "/about" },
    { label: "Knowledge", path: "/knowledge" },
    { label: "Markets", path: "/markets" },
    { label: "Analysis", path: "/analysis" },
    { label: "News", path: "/articles" }
  ]
} satisfies Record<Locale, Array<{ label: string; path: string }>>;

export function ReaderHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const searchLabel = locale === "vi-vn" ? "Tìm kiếm" : "Search";
  const menuLabel = menuOpen
    ? locale === "vi-vn" ? "Đóng menu" : "Close menu"
    : locale === "vi-vn" ? "Mở menu" : "Open menu";

  return (
    <header className="sticky top-0 z-50 border-b border-[#2B313D] bg-[#0F1115]/96 text-white shadow-[0_10px_30px_rgba(15,17,21,0.22)] backdrop-blur" id="top">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
        <CoinRadarLogo href={`/${locale}`} tone="dark" />

        <nav className="ml-auto hidden items-center justify-end gap-1.5 text-sm font-medium md:flex">
          {navItems[locale].map((item) => {
            const itemHref = `/${locale}${item.path}`;
            const isActive = pathname === itemHref || pathname.startsWith(`${itemHref}/`);

            return (
              <Link
                className={`rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-white/10 text-[#F5E7B3]" : "text-white/78 hover:bg-white/8 hover:text-[#F5E7B3]"
                }`}
                href={itemHref}
                key={item.path}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            aria-label={searchLabel}
            className="flex size-10 items-center justify-center rounded-lg border border-[#C8A227]/40 bg-white/8 text-[#F5E7B3] transition hover:border-[#F5E7B3] hover:bg-[#C8A227] hover:text-[#0F1115]"
            href={`/${locale}/search`}
          >
            <Search size={19} />
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            aria-label={searchLabel}
            className="flex size-10 items-center justify-center rounded-lg border border-[#C8A227]/40 bg-white/8 text-[#F5E7B3] transition hover:border-[#F5E7B3] hover:bg-[#C8A227] hover:text-[#0F1115]"
            href={`/${locale}/search`}
          >
            <Search size={19} />
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label={menuLabel}
            className="flex size-10 items-center justify-center rounded-lg border border-white/16 bg-white/8 text-white"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {menuOpen ? (
        <nav className="border-t border-[#2B313D] bg-[#0F1115] px-5 py-3 text-sm font-semibold md:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {navItems[locale].map((item) => {
              const itemHref = `/${locale}${item.path}`;
              const isActive = pathname === itemHref || pathname.startsWith(`${itemHref}/`);

              return (
                <Link
                  className={`rounded-lg px-3 py-2.5 transition ${
                    isActive ? "bg-white/10 text-[#F5E7B3]" : "text-white/78 hover:bg-white/8 hover:text-[#F5E7B3]"
                  }`}
                  href={itemHref}
                  key={item.path}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
