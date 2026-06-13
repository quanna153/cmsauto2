import type { Locale } from "@cmsauto/contracts";
import { Bookmark, BookOpen, ChevronDown, Clock3, Filter, Flame, Search, Zap } from "lucide-react";
import Link from "next/link";

import { getReaderArticles } from "@/features/reader/adapter";
import { localeCopy } from "@/features/reader/locale";
import type { ReaderArticle } from "@/features/reader/model";

import { getMockArticles } from "./mock";

const defaultCategories = {
  "vi-vn": ["Tất cả", "Thị trường", "Bitcoin", "Altcoin", "DeFi", "NFT & GameFi", "Web3", "Pháp lý", "Công nghệ", "Sự kiện"],
  "en-us": ["All", "Markets", "Bitcoin", "Altcoin", "DeFi", "NFT & GameFi", "Web3", "Legal", "Technology", "Events"]
} satisfies Record<Locale, string[]>;

const marketPulse = [
  { label: "Tổng vốn hóa thị trường", value: "$2.56T", trend: "+1.32%", tone: "up" },
  { label: "BTC Dominance", value: "53.1%", trend: "-0.42%", tone: "down" },
  { label: "Fear & Greed Index", value: "72", trend: "Tham lam", tone: "up" },
  { label: "Altcoin Season Index", value: "43", trend: "Trung lập", tone: "flat" }
];

export async function ReaderArticlesFeature({ locale }: { locale: Locale }) {
  const copy = localeCopy(locale);
  const apiArticles = await getReaderArticles(locale);
  const articles = sortNewestFirst(apiArticles.length > 0 ? apiArticles : getMockArticles(locale));
  const [featured, ...newsFeed] = articles;
  const popular = articles.slice(0, 5);
  const hotTopics = buildHotTopics(articles, locale);
  const isVi = locale === "vi-vn";

  return (
    <main className="bg-[#F7F7F4] text-[#111827]">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-5 border-b border-[#E3E5E8] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#080B11] sm:text-4xl lg:text-[42px]">
                {isVi ? "Tin tức crypto mới nhất" : "Latest crypto news"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647084] sm:text-base">
                {isVi
                  ? "Cập nhật nhanh và chính xác các diễn biến quan trọng từ thị trường crypto."
                  : "Fast, focused coverage of the most important crypto market moves."}
              </p>
            </div>
            <Link
              className="inline-flex h-11 w-fit items-center gap-2 rounded-lg border border-[#D8DDE5] bg-white px-4 text-sm font-bold text-[#111827] shadow-sm transition hover:border-[#C8A227] hover:text-[#A88412]"
              href={`/${locale}/search`}
            >
              <Search className="h-4 w-4" />
              {copy.search}
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {defaultCategories[locale].map((category, index) => (
              <Link
                className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${
                  index === 0
                    ? "border-[#C8950B] bg-[#B98200] text-white shadow-[0_10px_24px_rgba(184,130,0,0.18)]"
                    : "border-[#DCE1E8] bg-white text-[#394456] hover:border-[#C8A227] hover:text-[#A88412]"
                }`}
                href={index === 0 ? `/${locale}/articles` : `/${locale}/search?q=${encodeURIComponent(category)}`}
                key={category}
              >
                {category}
              </Link>
            ))}
            <Link
              className="ml-0 inline-flex items-center gap-2 rounded-lg border border-[#DCE1E8] bg-white px-4 py-2 text-sm font-bold text-[#394456] transition hover:border-[#C8A227] hover:text-[#A88412] lg:ml-auto"
              href={`/${locale}/search`}
            >
              <Filter className="h-4 w-4" />
              {isVi ? "Bộ lọc" : "Filters"}
            </Link>
          </div>

          {articles.length > 0 && featured ? (
            <div className="mt-6 space-y-4">
              <FeaturedArticle article={featured} isVi={isVi} />
              <NewsList articles={newsFeed} isVi={isVi} locale={locale} />
            </div>
          ) : (
            <EmptyState isVi={isVi} />
          )}
        </div>

        <aside className="space-y-5 lg:pt-[4.25rem]">
          <PopularPanel articles={popular} isVi={isVi} />
          <HotTopicsPanel topics={hotTopics} isVi={isVi} />
          <MarketPulsePanel isVi={isVi} />
        </aside>
      </section>
    </main>
  );
}

function FeaturedArticle({ article, isVi }: { article: ReaderArticle; isVi: boolean }) {
  return (
    <Link
      className="group grid overflow-hidden rounded-xl border border-[#E0C984] bg-white shadow-[0_18px_55px_rgba(17,24,39,0.06)] transition hover:border-[#C8A227] lg:grid-cols-[minmax(0,1fr)_390px]"
      href={articleHref(article)}
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-[#B98200]">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#C8950B] text-white">
              <Zap className="h-5 w-5 fill-current" />
            </span>
            {isVi ? "Tin nổi bật" : "Featured"}
          </span>
          <Bookmark className="h-5 w-5 text-[#B98200]" />
        </div>
        <h2 className="mt-5 text-2xl font-bold leading-tight text-[#080B11] transition group-hover:text-[#A88412] sm:text-[28px]">
          {article.title}
        </h2>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#647084] sm:text-base">{article.excerpt}</p>
        <ArticleMeta article={article} className="mt-6" isVi={isVi} />
      </div>

      <div className="border-t border-[#E7E1D0] bg-[#FCFBF7] p-5 sm:p-7 lg:border-l lg:border-t-0">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6D778B]">{isVi ? "Thống kê nổi bật" : "Key stats"}</p>
        <div className="mt-4 divide-y divide-[#E5E7EB]">
          {featuredStats(article, isVi).map((stat) => (
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-4 text-sm" key={stat.label}>
              <span className="min-w-0 text-[#667085]">{stat.label}</span>
              <span className="font-bold text-[#080B11]">{stat.value}</span>
              <span className={`text-xs font-bold ${stat.tone === "up" ? "text-[#079455]" : "text-[#E23B45]"}`}>{stat.trend}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

function NewsList({ articles, isVi, locale }: { articles: ReaderArticle[]; isVi: boolean; locale: Locale }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-xl border border-[#E3E5E8] bg-white px-6 py-10 text-center shadow-sm">
        <h2 className="text-xl font-bold text-[#080B11]">{isVi ? "Chưa có thêm tin mới" : "No more news yet"}</h2>
        <p className="mt-2 text-sm leading-6 text-[#647084]">
          {isVi ? "Các bài đã xuất bản tiếp theo sẽ hiển thị trong danh sách này." : "Newly published articles will appear in this feed."}
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#E3E5E8] bg-white shadow-[0_16px_44px_rgba(17,24,39,0.04)]">
      <div className="divide-y divide-[#E6E9EE]">
        {articles.slice(0, 7).map((article) => (
          <Link className="group grid gap-3 px-4 py-5 transition hover:bg-[#FAF8EF] sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6" href={articleHref(article)} key={article.id}>
            <div className="grid min-w-0 grid-cols-[10px_minmax(0,1fr)] gap-4">
              <span className="mt-2 size-1.5 rounded-full bg-[#080B11]" />
              <span className="min-w-0">
                <h3 className="line-clamp-2 text-base font-bold leading-6 text-[#111827] transition group-hover:text-[#A88412] sm:text-lg">{article.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#647084]">{article.excerpt}</p>
              </span>
            </div>
            <div className="ml-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#667085] sm:ml-0 sm:justify-end">
              <span className="rounded-md bg-[#F2E9FF] px-2.5 py-1 text-[#7A4AC7]">{article.primaryKeyword || (isVi ? "Tin tức" : "News")}</span>
              <span>{formatTime(article.publishedAt, locale)}</span>
              <span>•</span>
              <span>{readingTime(article, isVi)}</span>
              <Bookmark className="h-4 w-4 text-[#8B95A5]" />
            </div>
          </Link>
        ))}
      </div>
      <Link
        className="m-5 flex items-center justify-center gap-2 rounded-lg border border-[#C8950B] px-4 py-3 text-sm font-bold text-[#A36F00] transition hover:bg-[#FFF8E1]"
        href={`/${locale}/search`}
      >
        {isVi ? "Xem thêm tin tức" : "Load more news"}
        <ChevronDown className="h-4 w-4" />
      </Link>
    </section>
  );
}

function PopularPanel({ articles, isVi }: { articles: ReaderArticle[]; isVi: boolean }) {
  return (
    <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 shadow-[0_16px_42px_rgba(17,24,39,0.04)]">
      <h2 className="text-lg font-bold text-[#080B11]">{isVi ? "Đọc nhiều" : "Most read"}</h2>
      <div className="mt-4 divide-y divide-[#E6E9EE]">
        {articles.map((article, index) => (
          <Link className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 py-4 first:pt-0 last:pb-0" href={articleHref(article)} key={article.id}>
            <span className="text-lg font-bold text-[#B98200]">{String(index + 1).padStart(2, "0")}</span>
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-bold leading-6 text-[#111827] transition hover:text-[#A88412]">{article.title}</span>
              <span className="mt-1 block text-xs font-semibold text-[#667085]">{formatTime(article.publishedAt, article.locale)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HotTopicsPanel({ topics, isVi }: { topics: string[]; isVi: boolean }) {
  return (
    <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 shadow-[0_16px_42px_rgba(17,24,39,0.04)]">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold text-[#080B11]">
        <Flame className="h-5 w-5 text-[#F97316]" />
        {isVi ? "Chủ đề nóng" : "Hot topics"}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <Link
            className="rounded-md border border-[#E1E5EC] bg-[#FBFCFE] px-3 py-1.5 text-xs font-semibold text-[#475467] transition hover:border-[#C8A227] hover:text-[#A88412]"
            href="#"
            key={topic}
          >
            #{topic}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MarketPulsePanel({ isVi }: { isVi: boolean }) {
  return (
    <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 shadow-[0_16px_42px_rgba(17,24,39,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-[#080B11]">Market pulse</h2>
        <Link className="text-xs font-bold text-[#A36F00]" href="#">{isVi ? "Xem toàn bộ" : "View all"} →</Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-[#E6E9EE]">
        {marketPulse.map((item) => (
          <div className="bg-white p-4" key={item.label}>
            <p className="text-xs font-semibold text-[#667085]">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#080B11]">{item.value}</p>
            <p className={`mt-1 text-xs font-bold ${item.tone === "down" ? "text-[#E23B45]" : item.tone === "up" ? "text-[#079455]" : "text-[#B98200]"}`}>
              {item.trend}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E8EBEF]">
              <div className={`h-full rounded-full ${item.tone === "down" ? "w-2/5 bg-[#E23B45]" : item.tone === "up" ? "w-3/4 bg-[#C8950B]" : "w-1/2 bg-[#C8950B]"}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ isVi }: { isVi: boolean }) {
  return (
    <div className="mt-8 rounded-xl border border-[#E3E5E8] bg-white px-8 py-14 text-center shadow-sm">
      <BookOpen className="mx-auto h-10 w-10 text-[#A88412]" />
      <h2 className="mt-4 text-xl font-bold">{isVi ? "Chưa có bài viết" : "No articles yet"}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647084]">
        {isVi ? "Bài published sẽ xuất hiện tại đây sau khi đồng bộ từ CMS." : "Published articles will appear here after CMS sync."}
      </p>
    </div>
  );
}

function ArticleMeta({ article, className, isVi }: { article: ReaderArticle; className?: string; isVi: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs font-semibold text-[#667085] ${className ?? ""}`}>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-4 w-4" />
        {formatDateTime(article.publishedAt, article.locale)}
      </span>
      <span>•</span>
      <span className="inline-flex items-center gap-1.5">
        <BookOpen className="h-4 w-4" />
        {readingTime(article, isVi)}
      </span>
    </div>
  );
}

function featuredStats(article: ReaderArticle, isVi: boolean) {
  return [
    { label: isVi ? "Dòng vốn ETF (tuần qua)" : "ETF inflow (week)", value: "$1.24B", trend: "▲ 38.6%", tone: "up" },
    { label: article.primaryKeyword || (isVi ? "Chủ đề chính" : "Primary topic"), value: article.primaryKeyword || "Crypto", trend: "▲ 1.26%", tone: "up" },
    { label: "BTC Dominance", value: "53.1%", trend: "▼ 0.42%", tone: "down" }
  ] as const;
}

function buildHotTopics(articles: ReaderArticle[], locale: Locale) {
  const fallbacks = locale === "vi-vn"
    ? ["ETF Bitcoin", "Ethereum Fusaka", "Solana ETF", "DeFi", "Stablecoin", "IPO", "Regulation", "Airdrop"]
    : ["Bitcoin ETF", "Ethereum Fusaka", "Solana ETF", "DeFi", "Stablecoin", "IPO", "Regulation", "Airdrop"];
  const topics = articles.flatMap((article) => [article.primaryKeyword, ...article.secondaryKeywords]).filter(Boolean);
  return unique([...topics, ...fallbacks]).slice(0, 8);
}

function sortNewestFirst(articles: ReaderArticle[]) {
  return [...articles].sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime());
}

function articleHref(article: ReaderArticle) {
  return article.livePath || `/${article.locale}/${article.slug}`;
}

function formatDateTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function readingTime(article: ReaderArticle, isVi: boolean) {
  const words = `${article.title} ${article.excerpt} ${article.markdown}`.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(2, Math.ceil(words / 220));
  return isVi ? `${minutes} phút đọc` : `${minutes} min read`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
