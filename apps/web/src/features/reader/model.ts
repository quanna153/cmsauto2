import type { Locale } from "@cmsauto/contracts";

export type ReaderArticle = {
  id: string;
  articleId: string;
  slug: string;
  locale: Locale;
  language: "vi" | "en";
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  markdown: string;
  publishedAt: string;
  livePath: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
};

export type ReaderListResponse = {
  articles: ReaderArticle[];
  page: number;
  pageSize: number;
  total: number;
};

