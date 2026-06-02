import type { Locale } from "@cmsauto/contracts";

import { ArticleCard } from "@/components/reader/article-card";
import { getReaderArticles } from "@/features/reader/adapter";
import { localeCopy } from "@/features/reader/locale";

export async function ReaderArticlesFeature({ locale }: { locale: Locale }) {
  const copy = localeCopy(locale);
  const articles = await getReaderArticles(locale);
  return <main className="mx-auto max-w-6xl px-5 py-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a88412]">{copy.articles}</p><h1 className="mt-3 font-serif text-4xl font-bold">{copy.latest}</h1><div className="mt-8 grid gap-4 md:grid-cols-3">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div></main>;
}

