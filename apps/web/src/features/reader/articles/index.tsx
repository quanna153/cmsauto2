import type { Locale } from "@cmsauto/contracts";

import { ArticleCard } from "@/components/reader/article-card";
import { getReaderArticles } from "@/features/reader/adapter";
import { localeCopy } from "@/features/reader/locale";

import { getMockArticles } from "./mock";

export async function ReaderArticlesFeature({ locale }: { locale: Locale }) {
  const copy = localeCopy(locale);
  const apiArticles = await getReaderArticles(locale);
  const articles = apiArticles.length > 0 ? apiArticles : getMockArticles(locale);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a88412]">{copy.articles}</p>
      <h1 className="mt-3 text-4xl font-bold">Bài viết Crypto</h1>
      <p className="mt-3 max-w-2xl leading-7 text-[#687386]">Danh sách bài viết mock về tin tức, góc nhìn đầu tư và hướng dẫn cho người mới.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard article={article} key={article.id} />
        ))}
      </div>
    </main>
  );
}
