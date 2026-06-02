import type { Locale } from "@cmsauto/contracts";
import Link from "next/link";

import { ArticleCard } from "@/components/reader/article-card";
import { localeCopy } from "@/features/reader/locale";
import { getReaderArticles } from "@/features/reader/adapter";

export async function ReaderHomeFeature({ locale }: { locale: Locale }) {
  const copy = localeCopy(locale);
  const articles = await getReaderArticles(locale);
  const featured = articles[0];
  return <main className="mx-auto max-w-6xl px-5 py-8"><section className="grid gap-5 border-b pb-8 lg:grid-cols-[1.4fr_0.6fr]">{featured ? <Link className="rounded-2xl bg-[#172033] p-7 text-white" href={`/${locale}/${featured.slug}`}><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4c865]">{copy.featured}</p><h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight">{featured.title}</h1><p className="mt-4 max-w-2xl leading-7 text-white/70">{featured.excerpt}</p></Link> : <div className="rounded-2xl bg-[#172033] p-7 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e4c865]">{copy.featured}</p><h1 className="mt-4 font-serif text-4xl font-bold">CMS Auto Reader</h1><p className="mt-4 text-white/70">Published articles will appear here.</p></div>}<aside className="rounded-2xl border bg-white p-5"><h2 className="font-bold">{copy.latest}</h2><div className="mt-3 grid gap-3">{articles.slice(1, 4).map((article) => <Link className="border-t pt-3 text-sm font-semibold hover:text-[#80640b]" href={`/${locale}/${article.slug}`} key={article.id}>{article.title}</Link>)}</div></aside></section><section className="py-8"><div className="mb-4 flex items-end justify-between"><h2 className="font-serif text-2xl font-bold">{copy.latest}</h2><Link className="text-sm font-semibold text-[#80640b]" href={`/${locale}/articles`}>{copy.articles}</Link></div><div className="grid gap-4 md:grid-cols-3">{articles.map((article) => <ArticleCard article={article} key={article.id} />)}</div></section></main>;
}

