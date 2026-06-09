import type { Locale } from "@cmsauto/contracts";

import { ArticleBody } from "@/components/reader/article-body";
import { ArticleCard } from "@/components/reader/article-card";
import { localeCopy } from "@/features/reader/locale";
import type { ReaderArticle } from "@/features/reader/model";

export function ReaderArticleFeature({ article, related }: { article: ReaderArticle; related: ReaderArticle[] }) {
  const copy = localeCopy(article.locale as Locale);
  return <main className="mx-auto max-w-6xl px-5 py-8"><article className="grid gap-8 lg:grid-cols-[minmax(0,760px)_260px]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a88412]">{article.primaryKeyword}</p><h1 className="mt-3 text-4xl font-bold leading-tight">{article.title}</h1><p className="mt-4 text-sm text-[#687386]">{new Date(article.publishedAt).toLocaleDateString(article.locale)}</p><div className="mt-7"><ArticleBody markdown={article.markdown} /></div></div><aside><div className="sticky top-5 rounded-xl border bg-white p-4"><h2 className="font-bold">{copy.related}</h2><div className="mt-3 grid gap-3">{related.slice(0, 4).map((item) => <a className="border-t pt-3 text-sm font-semibold hover:text-[#80640b]" href={`/${item.locale}/${item.slug}`} key={item.id}>{item.title}</a>)}</div></div></aside></article>{related.length ? <section className="mt-12 border-t pt-8"><h2 className="mb-4 text-2xl font-bold">{copy.related}</h2><div className="grid gap-4 md:grid-cols-3">{related.slice(0, 3).map((item) => <ArticleCard article={item} key={item.id} />)}</div></section> : null}</main>;
}

