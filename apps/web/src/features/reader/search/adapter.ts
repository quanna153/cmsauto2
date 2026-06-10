import type { Locale } from "@cmsauto/contracts";

import type { ReaderArticle, ReaderListResponse } from "@/features/reader/model";
import { publicApiUrl } from "../../../lib/api";
import { searchMockArticles } from "./mock";
import type { SearchResult } from "./model";

const MAX_PAGE_SIZE = 50;

/**
 * Filter predicate: case-insensitive match against title, excerpt,
 * primaryKeyword, and secondaryKeywords.
 */
function matchesQuery(article: ReaderArticle, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  return (
    article.title.toLowerCase().includes(q) ||
    article.excerpt.toLowerCase().includes(q) ||
    article.primaryKeyword.toLowerCase().includes(q) ||
    article.secondaryKeywords.some((kw) => kw.toLowerCase().includes(q))
  );
}

/**
 * Fetch published search results from the real API and keep a defensive
 * client-side filter for older local API instances.
 * Falls back to mock data when the API call fails (e.g. dev without API).
 *
 * NOTE: This intentionally reuses the existing GET /public/articles
 * endpoint — no new API route is introduced. A dedicated search
 * endpoint (core-reader-search-api ticket) can replace this later
 * by swapping the fetch URL.
 */
export async function searchArticles(
  query: string,
  locale: Locale
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let articles: ReaderArticle[];
  try {
    const url = publicApiUrl(
      `/public/articles/search?locale=${locale}&q=${encodeURIComponent(trimmed)}&page=1&pageSize=${MAX_PAGE_SIZE}`
    );
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as ReaderListResponse;
    articles = data.articles;
  } catch {
    // Graceful fallback: filter mock so UI is never broken in dev
    articles = searchMockArticles.filter((a) => a.locale === locale);
  }

  return articles.filter((a) => matchesQuery(a, trimmed));
}

/**
 * @deprecated Used only by the old scaffold. Prefer searchArticles().
 */
export async function getSearchMock(): Promise<SearchResult[]> {
  return searchMockArticles;
}
