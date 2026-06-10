import Link from "next/link";

import type { ReaderArticle } from "@/features/reader/model";

export function ArticleCard({ article }: { article: ReaderArticle }) {
  return (
    <Link
      className="group block rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#C8A227] hover:shadow-[0_18px_42px_rgba(17,24,39,0.1)]"
      href={`/${article.locale}/${article.slug}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">{article.primaryKeyword || "Article"}</p>
      <h3 className="mt-2 line-clamp-3 text-lg font-bold leading-snug text-[#111827] transition group-hover:text-[#A88412]">{article.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#4B5563]">{article.excerpt}</p>
      <p className="mt-4 border-t border-[#E5E7EB] pt-3 text-xs font-semibold text-[#6B7280]">
        {new Date(article.publishedAt).toLocaleDateString(article.locale)}
      </p>
    </Link>
  );
}
