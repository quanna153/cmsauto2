import type { Locale } from "@cmsauto/contracts";
import { Clock3, Flame, ImageIcon, UserRound, Zap } from "lucide-react";
import Link from "next/link";

import { getReaderArticles } from "@/features/reader/adapter";
import { getFallbackReaderArticles } from "@/features/reader/fallback-articles";
import type { ReaderArticle } from "@/features/reader/model";

import { ArticlesMarketPulse } from "./articles-market-pulse";

const defaultCategories = {
  "vi-vn": ["Tất cả", "Thị trường", "Bitcoin", "Altcoin", "DeFi", "NFT & GameFi", "Web3", "Pháp lý", "Công nghệ", "Sự kiện"],
  "en-us": ["All", "Markets", "Bitcoin", "Altcoin", "DeFi", "NFT & GameFi", "Web3", "Legal", "Technology", "Events"]
} satisfies Record<Locale, string[]>;

export async function ReaderArticlesFeature({ locale }: { locale: Locale }) {
  let apiArticles: ReaderArticle[] = getFallbackReaderArticles(locale);
  try {
    const loadedArticles = await getReaderArticles(locale);
    apiArticles = loadedArticles.length ? loadedArticles : getFallbackReaderArticles(locale);
  } catch {
    apiArticles = getFallbackReaderArticles(locale);
  }
  const articles = sortNewestFirst(apiArticles);
  const [featured, ...newsFeed] = articles;
  const latest = articles.slice(0, 5);
  const hotTopics = buildHotTopics(articles, locale);
  const isVi = locale === "vi-vn";

  return (
    <main className="bg-[#F7F7F4] text-[#111827]">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-5 border-b border-[#E3E5E8] pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#080B11] sm:text-4xl lg:text-[42px]">
                {isVi ? "Tin tức crypto mới nhất" : "Latest crypto news"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#647084] sm:text-base">
                {isVi
                  ? "Cập nhật nhanh và chính xác các diễn biến quan trọng từ thị trường crypto."
                  : "Fast, focused coverage of the most important crypto market moves."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {defaultCategories[locale].map((category, index) => (
              <span
                className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${
                  index === 0
                    ? "border-[#C8950B] bg-[#B98200] text-white shadow-[0_10px_24px_rgba(184,130,0,0.18)]"
                    : "border-[#DCE1E8] bg-white text-[#394456]"
                }`}
                key={category}
              >
                {category}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {featured ? <FeaturedArticle article={featured} isVi={isVi} /> : null}
            <NewsList articles={newsFeed} isVi={isVi} locale={locale} />
          </div>
        </div>

        <aside className="space-y-5 lg:pt-[4.25rem]">
          <LatestPanel articles={latest} isVi={isVi} />
          <HotTopicsPanel isVi={isVi} topics={hotTopics} />
          <ArticlesMarketPulse locale={locale} />
        </aside>
      </section>
    </main>
  );
}

function FeaturedArticle({ article, isVi }: { article: ReaderArticle; isVi: boolean }) {
  return (
    <Link
      className="group grid overflow-hidden rounded-xl border border-[#E0C984] bg-white shadow-[0_18px_55px_rgba(17,24,39,0.06)] transition hover:-translate-y-0.5 hover:border-[#C8A227] hover:shadow-[0_24px_70px_rgba(17,24,39,0.10)] sm:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[290px_minmax(0,1fr)]"
      href={articleHref(article)}
    >
      <ArticleThumbnail article={article} className="h-56 sm:h-full sm:min-h-[260px]" priority />
      <div className="flex min-w-0 flex-col justify-center p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-3 text-xs font-bold uppercase text-[#B98200]">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#C8950B] text-white">
              <Zap className="h-4 w-4 fill-current" />
            </span>
            {isVi ? "Tin nổi bật" : "Featured"}
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-bold leading-tight text-[#080B11] transition group-hover:text-[#A88412] sm:text-[30px]">
          {article.title}
        </h2>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#647084] sm:text-base">{article.excerpt}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-[#667085]">
          <span className="rounded-full bg-[#FFF4CC] px-3 py-1 text-[#9A7100]">{article.primaryKeyword || (isVi ? "Tin tức" : "News")}</span>
          <ArticleMeta article={article} />
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
        {articles.map((article) => (
          <Link
            className="group grid gap-4 px-4 py-5 transition hover:bg-[#FAF8EF] sm:grid-cols-[170px_minmax(0,1fr)] sm:px-6"
            href={articleHref(article)}
            key={article.id}
          >
            <ArticleThumbnail article={article} className="h-36 sm:h-28" />
            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <span className="min-w-0">
                <h3 className="line-clamp-2 text-base font-bold leading-6 text-[#111827] transition group-hover:text-[#A88412] sm:text-lg">{article.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#647084]">{article.excerpt}</p>
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#667085] sm:justify-end">
                <span className="rounded-md bg-[#F2E9FF] px-2.5 py-1 text-[#7A4AC7]">{article.primaryKeyword || (isVi ? "Tin tức" : "News")}</span>
                <span>{formatTime(article.publishedAt, locale)}</span>
                <span>•</span>
                <span>{articleAuthor(article)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function LatestPanel({ articles, isVi }: { articles: ReaderArticle[]; isVi: boolean }) {
  return (
    <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 shadow-[0_16px_42px_rgba(17,24,39,0.04)]">
      <h2 className="text-lg font-bold text-[#080B11]">{isVi ? "Bài mới" : "Latest articles"}</h2>
      <div className="mt-4 divide-y divide-[#E6E9EE]">
        {articles.map((article) => (
          <Link className="group grid grid-cols-[76px_minmax(0,1fr)] gap-3 py-4 first:pt-0 last:pb-0" href={articleHref(article)} key={article.id}>
            <ArticleThumbnail article={article} className="h-16" compact />
            <span className="min-w-0">
              <span className="line-clamp-2 text-sm font-bold leading-6 text-[#111827] transition group-hover:text-[#A88412]">{article.title}</span>
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
          <span
            className="rounded-md border border-[#E1E5EC] bg-[#FBFCFE] px-3 py-1.5 text-xs font-semibold text-[#475467]"
            key={topic}
          >
            #{topic}
          </span>
        ))}
      </div>
    </section>
  );
}

function ArticleThumbnail({
  article,
  className,
  compact = false,
  priority = false
}: {
  article: ReaderArticle;
  className: string;
  compact?: boolean;
  priority?: boolean;
}) {
  const image = article.thumbnailImage ?? article.heroImage;
  const src = imageSource(image);
  const alt = image?.altText || article.title;

  if (src) {
    return (
      <span className={`relative block overflow-hidden rounded-lg bg-[#111827] ${className}`}>
        <img
          alt={alt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          src={src}
        />
        {compact ? (
          <span className="absolute inset-0 bg-gradient-to-tr from-black/28 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        ) : null}
      </span>
    );
  }

  return (
    <span className={`relative flex overflow-hidden rounded-lg border border-[#E3D49B] bg-[#121824] ${className}`}>
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(248,214,109,0.34),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_36%)]" />
      <span className="absolute -right-8 -top-10 size-28 rounded-full border border-[#F8D66D]/30" />
      <span className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F8D66D]">
        <ImageIcon className="h-4 w-4" />
        CoinRadar
      </span>
    </span>
  );
}

function imageSource(image: ReaderArticle["thumbnailImage"] | ReaderArticle["heroImage"]) {
  if (!image) {
    return "";
  }

  if (image.url) {
    if (image.url.startsWith("/api/") || image.url.startsWith("http") || image.url.startsWith("data:")) {
      return image.url;
    }

    return image.url.startsWith("/") ? `/api${image.url}` : image.url;
  }

  if (image.base64) {
    return `data:${image.mimeType ?? "image/png"};base64,${image.base64}`;
  }

  return "";
}

function ArticleMeta({ article, className }: { article: ReaderArticle; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs font-semibold text-[#667085] ${className ?? ""}`}>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-4 w-4" />
        {formatDateTime(article.publishedAt, article.locale)}
      </span>
      <span>•</span>
      <span className="inline-flex items-center gap-1.5">
        <UserRound className="h-4 w-4" />
        {articleAuthor(article)}
      </span>
    </div>
  );
}

function articleAuthor(article: ReaderArticle) {
  return article.authorName?.trim() || "CoinRadar";
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

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
