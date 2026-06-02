import Link from "next/link";

import type { ReaderArticle } from "@/features/reader/model";

export function ArticleCard({ article }: { article: ReaderArticle }) {
  return <Link className="group rounded-xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md" href={`/${article.locale}/${article.slug}`}><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a88412]">{article.primaryKeyword || "Article"}</p><h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-[#80640b]">{article.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[#687386]">{article.excerpt}</p><p className="mt-4 text-xs text-[#687386]">{new Date(article.publishedAt).toLocaleDateString(article.locale)}</p></Link>;
}

