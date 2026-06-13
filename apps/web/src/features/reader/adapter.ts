import type { Locale } from "@cmsauto/contracts";

import { publicApiUrl } from "@/lib/api";
import { getFallbackReaderArticles } from "./fallback-articles";
import type { ReaderArticle, ReaderListResponse } from "./model";

export async function getReaderArticles(locale: Locale) {
  const fallbackArticles = getFallbackReaderArticles(locale);
  const response = await fetch(publicApiUrl(`/public/articles?locale=${locale}&page=1&pageSize=50`), { cache: "no-store" });
  if (!response.ok) return fallbackArticles;

  const articles = ((await response.json()) as ReaderListResponse).articles;
  return articles.length > 0 ? articles : fallbackArticles;
}

export async function getReaderArticle(locale: Locale, slug: string) {
  const response = await fetch(publicApiUrl(`/public/articles/${locale}/${slug}`), { cache: "no-store" });
  if (response.status === 404) {
    return getFallbackReaderArticles(locale).find((article) => article.slug === slug) ?? null;
  }

  if (!response.ok) throw new Error("Không tải được bài viết.");
  return ((await response.json()) as { article: ReaderArticle }).article;
}
