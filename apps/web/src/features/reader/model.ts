import type { Locale } from "@cmsauto/contracts";

export type ReaderArticleImage = {
  id: string;
  kind: "hero" | "inline" | "thumbnail";
  provider: string;
  model: string;
  status: "planned" | "generated" | "failed";
  prompt: string;
  revisedPrompt?: string;
  url?: string;
  base64?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  aspectRatio: "16:9" | "4:3" | "1:1" | "3:4";
  altText: string;
  caption?: string;
  createdAt: string;
};

export type ReaderArticle = {
  id: string;
  articleId: string;
  articleSection?: "knowledge" | "articles" | "markets" | "analysis";
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
  heroImage?: ReaderArticleImage;
  thumbnailImage?: ReaderArticleImage;
  inlineImages?: ReaderArticleImage[];
  authorName?: string;
  authorTitle?: string;
  authorBio?: string;
};

export type ReaderListResponse = {
  articles: ReaderArticle[];
  page: number;
  pageSize: number;
  total: number;
};
