import type { Locale } from "@cmsauto/contracts";
import { Search } from "lucide-react";

import { ArticleCard } from "@/components/reader/article-card";
import { localeCopy } from "@/features/reader/locale";
import { searchArticles } from "./adapter";

interface SearchFeatureProps {
  locale: Locale;
  query?: string;
}

const copy = {
  "vi-vn": {
    placeholder: "Nhập từ khóa tìm kiếm...",
    button: "Tìm kiếm",
    resultsFor: (q: string) => `Kết quả cho "${q}"`,
    emptyTitle: "Không tìm thấy kết quả",
    emptyDesc: (q: string) =>
      `Không có bài viết nào phù hợp với "${q}". Hãy thử từ khóa khác.`,
    idleTitle: "Tìm kiếm bài viết",
    idleDesc:
      "Nhập từ khóa vào ô tìm kiếm để tìm các bài viết liên quan đến tài chính, crypto và thị trường.",
  },
  "en-us": {
    placeholder: "Search articles...",
    button: "Search",
    resultsFor: (q: string) => `Results for "${q}"`,
    emptyTitle: "No results found",
    emptyDesc: (q: string) =>
      `No articles matched "${q}". Please try a different keyword.`,
    idleTitle: "Search Articles",
    idleDesc:
      "Enter a keyword to find articles about finance, crypto and markets.",
  },
} as const;

export async function SearchFeature({ locale, query = "" }: SearchFeatureProps) {
  const c = copy[locale];
  const nav = localeCopy(locale);
  const trimmed = query.trim();
  const results = trimmed ? await searchArticles(trimmed, locale) : [];
  const hasResults = results.length > 0;

  return (
    <main className="bg-[#F5F5F2] px-5 py-10 text-[#111827]">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">
          {nav.search} · {locale}
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
          {trimmed ? c.resultsFor(trimmed) : c.idleTitle}
        </h1>

        <form
          action={`/${locale}/search`}
          className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row"
          method="get"
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]"
              size={18}
            />
            <input
              aria-label={c.placeholder}
              className="h-12 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-4 text-sm shadow-sm outline-none ring-[#C8A227] transition placeholder:text-[#9CA3AF] focus:ring-2"
              defaultValue={trimmed}
              id="search-input"
              name="q"
              placeholder={c.placeholder}
              type="search"
            />
          </div>
          <button
            className="h-12 rounded-lg bg-[#0F1115] px-5 text-sm font-semibold text-white transition hover:bg-[#C8A227] hover:text-[#0F1115]"
            type="submit"
          >
            {c.button}
          </button>
        </form>

        {!trimmed && (
          <p className="mt-8 max-w-2xl leading-7 text-[#4B5563]">{c.idleDesc}</p>
        )}

        {trimmed && !hasResults && (
          <div className="mt-10 rounded-lg border border-[#E5E7EB] bg-white px-8 py-12 text-center shadow-sm">
            <Search className="mx-auto text-[#C8A227]" size={40} />
            <h2 className="mt-4 text-xl font-bold">{c.emptyTitle}</h2>
            <p className="mt-2 text-sm text-[#4B5563]">{c.emptyDesc(trimmed)}</p>
          </div>
        )}

        {hasResults && (
          <section className="mt-8">
            <p className="mb-4 text-sm text-[#4B5563]">
              {results.length} bài viết
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {results.map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
