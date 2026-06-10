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

const aboutLinks: FooterLink[] = [
  { label: "Về CoinRadar", path: "/about" },
  { label: "Điều Khoản Sử Dụng", path: "/about" },
  { label: "Chính Sách Bảo Mật", path: "/about" },
  { label: "Miễn Trừ Trách Nhiệm", path: "/about" },
  { label: "Chính Sách Kiểm Chứng Thông Tin", path: "/about" },
  { label: "Chính Sách Biên Tập", path: "/about" },
  { label: "Chính Sách Chỉnh Sửa", path: "/about" },
  { label: "Liên hệ", path: "/about" }
];

const newsLinks: FooterLink[] = [
  { label: "Bitcoin", path: "/articles" },
  { label: "Altcoin", path: "/articles" },
  { label: "Blockchain", path: "/articles" },
  { label: "DeFi", path: "/articles" },
  { label: "Pháp Lý", path: "/articles" },
  { label: "Cảnh Báo Lừa Đảo", path: "/articles" }
];
const marketLinks: FooterLink[] = [
  { label: "Dự Đoán Thị Trường", path: "/markets" },
  { label: "Phân Tích Thị Trường", path: "/analysis" }
];
const knowledgeLinks: FooterLink[] = [
  { label: "Cho Người Mới", path: "/knowledge" },
  { label: "Cho Nhà Giao Dịch", path: "/knowledge" },
  { label: "Người Nổi Tiếng", path: "/knowledge" }
];

export function ReaderFooter({ locale }: { locale: Locale }) {
  const homeHref = `/${locale}`;
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
            CoinRadar mang đến góc nhìn toàn diện về thị trường Crypto dành cho nhà đầu tư Việt. Dữ liệu được cập nhật liên tục, trình bày trực
            quan, giúp bạn theo dõi biến động, nhận diện xu hướng và đưa ra quyết định chủ động hơn.
          </p>
          <form className="mt-6 flex max-w-md overflow-hidden rounded-lg border border-[#C8A227]/35 bg-white/6">
            <label className="sr-only" htmlFor="footer-email">
              Địa chỉ email của bạn
            </label>
            <input
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm text-white placeholder:text-white/58 focus:outline-none"
              id="footer-email"
              placeholder="Địa chỉ email của bạn"
              type="email"
            />
            <button className="bg-[#C8A227] px-5 py-3 text-sm font-bold text-[#0F1115] transition hover:bg-[#F5E7B3]" type="button">
              Liên Hệ Ngay
            </button>
          </form>
        </section>

        <FooterColumn links={aboutLinks} locale={locale} title="Về chúng tôi" />
        <FooterColumn links={knowledgeLinks} locale={locale} title="Kiến Thức" />
        <FooterColumn links={newsLinks} locale={locale} title="Tin Tức" />
        <FooterColumn links={marketLinks} locale={locale} title="Thị Trường" />
      </div>

      <div className="border-t border-white/10 bg-[#111827] px-5 py-4">
        <div className="relative mx-auto max-w-7xl text-center text-xs font-semibold text-white/70">
          Copyright © CoinRadar Việt Nam 2026. All Rights Reserved
          <a
            aria-label={isNearTop ? "Xuống cuối trang" : "Lên đầu trang"}
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
