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
    <main className="bg-[#F5F5F2] px-5 py-10 text-[#111827]">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-5 border-b border-[#E5E7EB] pb-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">{copy.articles}</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Bài viết Crypto</h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#4B5563]">
              Tin tức, góc nhìn đầu tư và hướng dẫn nền tảng được trình bày theo bố cục đọc nhanh giống một newsroom.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">Latest</p>
            <p className="mt-2 text-3xl font-bold">{articles.length}</p>
            <p className="mt-1 text-sm text-[#4B5563]">bài đang hiển thị</p>
          </div>
        </div>

        {articles.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {articles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-[#E5E7EB] bg-white px-8 py-12 text-center shadow-sm">
            <h2 className="text-xl font-bold">Chưa có bài viết</h2>
            <p className="mt-2 text-sm text-[#4B5563]">Bài published sẽ xuất hiện tại đây sau khi đồng bộ từ CMS.</p>
          </div>
        )}
      </section>
    </main>
  );
}
