"use client";

import type { Locale } from "@cmsauto/contracts";
import { ArrowUpRight, Loader2, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CoinRadarLogo } from "@/components/reader/brand-logo";
import { searchArticles } from "@/features/reader/search/adapter";
import type { SearchResult } from "@/features/reader/search/model";

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

const searchCopy = {
  "vi-vn": {
    button: "Tìm bài viết",
    close: "Đóng tìm kiếm",
    placeholder: "Tìm Bitcoin, altcoin, DeFi...",
    hint: "Gõ ít nhất 2 ký tự để tìm bài viết",
    loading: "Đang tìm...",
    empty: "Không tìm thấy bài phù hợp",
    label: "Tìm nhanh trên CoinRadar"
  },
  "en-us": {
    button: "Search articles",
    close: "Close search",
    placeholder: "Search Bitcoin, altcoins, DeFi...",
    hint: "Type at least 2 characters to search articles",
    loading: "Searching...",
    empty: "No matching articles found",
    label: "Quick search on CoinRadar"
  }
} satisfies Record<Locale, Record<string, string>>;

function articleHref(locale: Locale, article: SearchResult) {
  return article.livePath || `/${locale}/${article.slug}`;
}

export function ReaderHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const copy = searchCopy[locale];
  const menuLabel = menuOpen
    ? locale === "vi-vn" ? "Đóng menu" : "Close menu"
    : locale === "vi-vn" ? "Mở menu" : "Open menu";

  useEffect(() => {
    if (!searchOpen) return;
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => window.clearTimeout(focusTimer);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchArticles(trimmed, locale)
        .then((nextResults) => {
          if (!cancelled) setResults(nextResults.slice(0, 6));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [locale, query, searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        setMenuOpen(false);
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (searchPanelRef.current?.contains(target)) return;
      if (target.closest("[data-reader-search-trigger]")) return;
      setSearchOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [searchOpen]);

  function toggleSearch() {
    setSearchOpen((current) => !current);
    setMenuOpen(false);
  }

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
        </nav>

        <button
          aria-expanded={searchOpen}
          aria-label={searchOpen ? copy.close : copy.button}
          className={`hidden h-10 w-[15.5rem] items-center gap-3 rounded-xl border px-3 text-left text-sm transition lg:flex ${
            searchOpen ? "border-[#E5BE4B] bg-[#E5BE4B]/16 text-[#F5E7B3]" : "border-white/18 bg-white/7 text-white/70 hover:border-[#E5BE4B]/70 hover:text-[#F5E7B3]"
          }`}
          data-reader-search-trigger
          onClick={toggleSearch}
          type="button"
        >
          {searchOpen ? <X className="shrink-0" size={18} /> : <Search className="shrink-0" size={18} />}
          <span className="min-w-0 flex-1 truncate">{searchOpen ? copy.close : copy.placeholder}</span>
          <kbd className="rounded-md border border-white/14 px-1.5 py-0.5 text-[10px] font-semibold text-white/42">/</kbd>
        </button>

        <button
          aria-expanded={searchOpen}
          aria-label={searchOpen ? copy.close : copy.button}
          className={`hidden size-10 items-center justify-center rounded-xl border text-white transition md:flex lg:hidden ${
            searchOpen ? "border-[#E5BE4B] bg-[#E5BE4B]/16 text-[#F5E7B3]" : "border-white/18 bg-white/7 hover:border-[#E5BE4B]/70 hover:text-[#F5E7B3]"
          }`}
          data-reader-search-trigger
          onClick={toggleSearch}
          type="button"
        >
          {searchOpen ? <X size={19} /> : <Search size={19} />}
        </button>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            aria-expanded={searchOpen}
            aria-label={searchOpen ? copy.close : copy.button}
            className={`flex size-10 items-center justify-center rounded-lg border text-white ${
              searchOpen ? "border-[#E5BE4B] bg-[#E5BE4B]/16" : "border-white/16 bg-white/8"
            }`}
            data-reader-search-trigger
            onClick={toggleSearch}
            type="button"
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>
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

      {searchOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 top-[4.25rem] z-[70] bg-[#0F1115]/58 px-5 pt-5 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
          role="dialog"
        >
          <div className="mx-auto max-w-3xl" onClick={(event) => event.stopPropagation()} ref={searchPanelRef}>
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-[#FAFAF7] text-[#111827] shadow-[0_26px_80px_rgba(0,0,0,0.35)]">
              <label className="sr-only" htmlFor="reader-header-search">{copy.label}</label>
              <div className="flex items-center gap-3 border-b border-[#E7DFCF] bg-white px-4 py-3">
                <Search className="text-[#8A6500]" size={20} />
                <input
                  className="h-10 min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-[#8B93A1]"
                  id="reader-header-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.placeholder}
                  ref={searchInputRef}
                  value={query}
                />
                {loading ? <Loader2 className="animate-spin text-[#8A6500]" size={18} /> : null}
              </div>
              <div className="max-h-[min(24rem,calc(100vh-11rem))] overflow-y-auto p-2">
                {query.trim().length < 2 ? (
                  <p className="px-3 py-5 text-sm text-[#687386]">{copy.hint}</p>
                ) : !loading && results.length === 0 ? (
                  <p className="px-3 py-5 text-sm text-[#687386]">{copy.empty}</p>
                ) : (
                  <div className="grid gap-1">
                    {results.map((article) => (
                      <Link
                        className="group grid gap-2 rounded-xl px-3 py-3 transition hover:bg-[#FFF3CD] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        href={articleHref(locale, article)}
                        key={article.id}
                      >
                        <span className="min-w-0">
                          <span className="block line-clamp-1 text-sm font-bold text-[#111827]">{article.title}</span>
                          <span className="mt-1 block line-clamp-1 text-xs text-[#687386]">{article.excerpt}</span>
                        </span>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E7DFCF] px-3 py-1 text-xs font-semibold text-[#8A6500] group-hover:border-[#D5A319]">
                          {article.primaryKeyword || (locale === "vi-vn" ? "Bài viết" : "Article")} <ArrowUpRight size={13} />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
