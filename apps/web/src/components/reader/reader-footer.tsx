"use client";

import type { Locale } from "@cmsauto/contracts";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CoinRadarLogo } from "@/components/reader/brand-logo";

type FooterLink = {
  label: string;
  path: string;
};

const footerCopy = {
  "vi-vn": {
    description: "CoinRadar mang đến góc nhìn rõ ràng về thị trường crypto cho người đọc Việt. Dữ liệu, kiến thức và phân tích được trình bày ngắn gọn để bạn theo dõi biến động mỗi ngày.",
    emailLabel: "Địa chỉ email của bạn",
    emailPlaceholder: "Địa chỉ email của bạn",
    contact: "Liên hệ",
    copyright: "Copyright © CoinRadar Việt Nam 2026. All Rights Reserved",
    down: "Xuống cuối trang",
    up: "Lên đầu trang",
    columns: [
      { title: "Về chúng tôi", links: [{ label: "Về CoinRadar", path: "/about" }, { label: "Nguyên tắc biên tập", path: "/about" }, { label: "Liên hệ", path: "/about" }] },
      { title: "Kiến thức", links: [{ label: "Cho người mới", path: "/knowledge" }, { label: "DeFi", path: "/knowledge" }, { label: "Quản trị rủi ro", path: "/knowledge" }] },
      { title: "Tin tức", links: [{ label: "Bitcoin", path: "/articles" }, { label: "Altcoin", path: "/articles" }, { label: "Blockchain", path: "/articles" }] },
      { title: "Thị trường", links: [{ label: "Bảng giá", path: "/markets" }, { label: "Phân tích", path: "/analysis" }] }
    ]
  },
  "en-us": {
    description: "CoinRadar delivers clear crypto market context for global readers. Data, explainers and analysis are presented in a focused format for daily market tracking.",
    emailLabel: "Your email address",
    emailPlaceholder: "Your email address",
    contact: "Contact",
    copyright: "Copyright © CoinRadar Global 2026. All Rights Reserved",
    down: "Go to footer",
    up: "Back to top",
    columns: [
      { title: "About", links: [{ label: "About CoinRadar", path: "/about" }, { label: "Editorial principles", path: "/about" }, { label: "Contact", path: "/about" }] },
      { title: "Knowledge", links: [{ label: "Beginners", path: "/knowledge" }, { label: "DeFi", path: "/knowledge" }, { label: "Risk management", path: "/knowledge" }] },
      { title: "News", links: [{ label: "Bitcoin", path: "/articles" }, { label: "Altcoins", path: "/articles" }, { label: "Blockchain", path: "/articles" }] },
      { title: "Markets", links: [{ label: "Prices", path: "/markets" }, { label: "Analysis", path: "/analysis" }] }
    ]
  }
} satisfies Record<Locale, {
  columns: Array<{ links: FooterLink[]; title: string }>;
  contact: string;
  copyright: string;
  description: string;
  down: string;
  emailLabel: string;
  emailPlaceholder: string;
  up: string;
}>;

export function ReaderFooter({ locale }: { locale: Locale }) {
  const homeHref = `/${locale}`;
  const c = footerCopy[locale];
  const [isNearTop, setIsNearTop] = useState(true);

  useEffect(() => {
    let frameId = 0;

    const updateDirection = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const nextIsNearTop = window.scrollY < Math.max(160, maxScroll / 2);
      setIsNearTop((current) => (current === nextIsNearTop ? current : nextIsNearTop));
    };

    const handleScroll = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateDirection();
      });
    };

    updateDirection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleScroll);
    const intervalId = window.setInterval(updateDirection, 200);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.clearInterval(intervalId);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleScrollToggle = () => {
    window.scrollTo({
      top: isNearTop ? document.documentElement.scrollHeight : 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="bg-[#0F1115] text-white" id="site-footer">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_1fr_0.8fr_0.8fr_0.8fr]">
        <section>
          <CoinRadarLogo href={homeHref} tone="dark" />
          <p className="mt-5 max-w-md text-sm font-medium leading-6 text-white/76">
            {c.description}
          </p>
          <form className="mt-6 flex max-w-md overflow-hidden rounded-lg border border-[#C8A227]/35 bg-white/6">
            <label className="sr-only" htmlFor="footer-email">
              {c.emailLabel}
            </label>
            <input
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm text-white placeholder:text-white/58 focus:outline-none"
              id="footer-email"
              placeholder={c.emailPlaceholder}
              type="email"
            />
            <button className="bg-[#C8A227] px-5 py-3 text-sm font-bold text-[#0F1115] transition hover:bg-[#F5E7B3]" type="button">
              {c.contact}
            </button>
          </form>
        </section>

        {c.columns.map((column) => (
          <FooterColumn key={column.title} links={column.links} locale={locale} title={column.title} />
        ))}
      </div>

      <div className="border-t border-white/10 bg-[#111827] px-5 py-4">
        <div className="relative mx-auto max-w-7xl text-center text-xs font-semibold text-white/70">
          {c.copyright}
          <a
            aria-label={isNearTop ? c.down : c.up}
            className="fixed bottom-5 right-5 z-40 flex size-11 items-center justify-center rounded-lg bg-[#C8A227] text-[#0F1115] shadow-lg shadow-slate-950/20 transition hover:bg-[#F5E7B3] focus:outline-none focus:ring-2 focus:ring-[#C8A227] focus:ring-offset-2 focus:ring-offset-[#111827]"
            href={isNearTop ? "#site-footer" : "#top"}
            onClick={handleScrollToggle}
          >
            {isNearTop ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, locale }: { title: string; links: FooterLink[]; locale: Locale }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-base font-black">{title}</h2>
      <ul className="mt-4 grid gap-3 text-sm text-white/72">
        {links.map((link) => (
          <li key={link.label}>
            <Link className="transition hover:text-[#F5E7B3]" href={`/${locale}${link.path}`}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
