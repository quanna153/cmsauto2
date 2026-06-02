import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getReaderArticle, getReaderArticles } from "@/features/reader/adapter";
import { ReaderArticleFeature } from "@/features/reader/article";
import { isLocale } from "@/features/reader/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const article = await getReaderArticle(locale, slug);
  return article ? { title: article.metaTitle || article.title, description: article.metaDescription || article.excerpt } : {};
}

export default async function ReaderArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = await getReaderArticle(locale, slug);
  if (!article) notFound();
  const related = (await getReaderArticles(locale)).filter((item) => item.slug !== slug);
  return <ReaderArticleFeature article={article} related={related} />;
}

