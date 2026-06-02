import type { Locale } from "@cmsauto/contracts";

import { publicApiUrl } from "@/lib/api";
import type { ReaderArticle, ReaderListResponse } from "./model";

export async function getReaderArticles(locale: Locale) {
  const response = await fetch(publicApiUrl(`/public/articles?locale=${locale}&page=1&pageSize=50`), { next: { revalidate: 60 } });
  if (!response.ok) return [] as ReaderArticle[];
  return ((await response.json()) as ReaderListResponse).articles;
}

export async function getReaderArticle(locale: Locale, slug: string) {
  const response = await fetch(publicApiUrl(`/public/articles/${locale}/${slug}`), { next: { revalidate: 60 } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Không tải được bài viết.");
  return ((await response.json()) as { article: ReaderArticle }).article;
}

