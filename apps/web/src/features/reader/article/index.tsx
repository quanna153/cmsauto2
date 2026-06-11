import type { Locale } from "@cmsauto/contracts";
import { CalendarDays, Clock3, Copy, UserRound } from "lucide-react";
import Link from "next/link";

import { ArticleBody } from "@/components/reader/article-body";
import { ArticleCard } from "@/components/reader/article-card";
import { localeCopy } from "@/features/reader/locale";
import type { ReaderArticle } from "@/features/reader/model";

type MarkdownSection = {
  id: string;
  level: 1 | 2 | 3;
  markdown: string;
  title: string;
};

export function ReaderArticleFeature({ article, related }: { article: ReaderArticle; related: ReaderArticle[] }) {
  const copy = localeCopy(article.locale as Locale);
  const sections = splitMarkdownSections(article.markdown, article.title);
  const featuredRelated = related.slice(0, 5);

  return (
    <main className="bg-[#F5F5F2]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-5 lg:py-12">
        <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <header className="border-b border-[#E5E7EB] pb-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">{article.primaryKeyword || copy.articles}</p>
              <h1 className="mt-4 max-w-5xl text-[34px] font-bold leading-tight text-[#111827] sm:text-[42px]">
                {article.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-[#4B5563]">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatDateTime(article.publishedAt, article.locale)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  {article.locale === "vi-vn" ? "Đăng bởi " : "By "}{article.authorName || "CMS Auto"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  {readingTime(article)}
                </span>
              </div>
              <p className="mt-7 max-w-5xl text-lg font-medium leading-8 text-[#111827]">{article.excerpt}</p>
            </header>

            {sections.items.length > 0 ? <QuickView sections={sections.items} /> : null}

            <ArticleReadingStyles />
            <div className="reader-article-body mt-8 max-w-5xl">
              {sections.intro ? <ArticleBody markdown={sections.intro} showToc={false} /> : null}
              {sections.items.map((section) => (
                <section className="scroll-mt-24" id={section.id} key={section.id}>
                  <ArticleBody markdown={section.markdown} showToc={false} />
                </section>
              ))}
            </div>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <section className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_34px_rgba(17,24,39,0.06)]">
              <div className="flex items-center justify-between bg-[#0F1115] px-4 py-4 text-white">
                <h2 className="text-lg font-bold">{article.locale === "vi-vn" ? "Bài viết khác" : "More articles"}</h2>
                <Copy className="h-5 w-5 text-[#F5E7B3]" />
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {featuredRelated.length > 0
                  ? featuredRelated.map((item, index) => <SidebarArticle article={item} index={index} key={item.id} />)
                  : <p className="p-4 text-sm leading-6 text-[#4B5563]">{article.locale === "vi-vn" ? "Bài viết khác sẽ hiển thị tại đây." : "More articles will appear here."}</p>}
              </div>
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#111827]">{article.locale === "vi-vn" ? "Thông tin bài viết" : "Article details"}</h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="font-semibold text-[#4B5563]">{article.locale === "vi-vn" ? "Chủ đề" : "Topic"}</dt>
                  <dd className="mt-1 font-bold text-[#111827]">{article.primaryKeyword || copy.articles}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[#4B5563]">{article.locale === "vi-vn" ? "Tác giả" : "Author"}</dt>
                  <dd className="mt-1 font-bold text-[#111827]">{article.authorName || "CMS Auto"}</dd>
                  {article.authorTitle ? <dd className="mt-1 text-xs font-semibold text-[#A88412]">{article.authorTitle}</dd> : null}
                  {article.authorBio ? <dd className="mt-2 leading-6 text-[#4B5563]">{article.authorBio}</dd> : null}
                </div>
                <div>
                  <dt className="font-semibold text-[#4B5563]">{article.locale === "vi-vn" ? "Từ khóa phụ" : "Secondary keywords"}</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {(article.secondaryKeywords.length ? article.secondaryKeywords : [article.primaryKeyword || copy.articles]).map((keyword) => (
                      <span className="rounded border border-[#E5E7EB] bg-[#FAFAF7] px-2 py-1 text-xs font-semibold text-[#111827]" key={keyword}>
                        {keyword}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </article>

        {related.length > 0 ? (
          <section className="mt-14 border-t border-[#E5E7EB] pt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold text-[#111827]">{copy.related}</h2>
              <Link className="text-sm font-semibold text-[#A88412]" href={`/${article.locale}/articles`}>{copy.articles}</Link>
            </div>
            <div className="grid gap-4 md:grid-cols-3">{related.slice(0, 3).map((item) => <ArticleCard article={item} key={item.id} />)}</div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function ArticleReadingStyles() {
  return (
    <style>
      {`
        .reader-article-body .article-prose {
          color: #111827;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 18px;
          line-height: 1.78;
        }

        .reader-article-body .article-prose p,
        .reader-article-body .article-prose li {
          text-align: justify;
          text-justify: inter-word;
        }

        .reader-article-body .article-prose h1,
        .reader-article-body .article-prose h2,
        .reader-article-body .article-prose h3 {
          color: #111827;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-weight: 700;
          line-height: 1.3;
          text-align: left;
        }

        .reader-article-body .article-prose h1 {
          font-size: 28px;
          margin-top: 32px;
        }

        .reader-article-body .article-prose h2 {
          font-size: 23px;
          margin-top: 32px;
        }

        .reader-article-body .article-prose h3 {
          font-size: 18px;
          margin-top: 24px;
        }

        .reader-article-body .article-prose p,
        .reader-article-body .article-prose ul,
        .reader-article-body .article-prose ol,
        .reader-article-body .article-prose blockquote {
          margin: 16px 0;
        }

        .reader-article-body .article-prose blockquote {
          border-left: 4px solid #C8A227;
          padding-left: 16px;
        }

        .reader-article-body .article-prose a {
          color: #A88412;
          font-weight: 700;
        }

        .reader-article-body .article-prose img {
          border-radius: 6px;
        }
      `}
    </style>
  );
}

function QuickView({ sections }: { sections: MarkdownSection[] }) {
  return (
    <nav className="mt-8 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6" aria-label="Xem nhanh">
      <h2 className="text-center text-xl font-bold text-[#111827]">Xem nhanh</h2>
      <ol className="mt-5 space-y-3">
        {sections.slice(0, 8).map((section) => (
          <li className="text-[15px] font-bold leading-6" key={section.id}>
            <Link className="grid grid-cols-[26px_minmax(0,1fr)] gap-2 text-[#111827] transition hover:text-[#A88412]" href={`#${section.id}`}>
              <span className="text-[#A88412]">[+]</span>
              <span>{section.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function SidebarArticle({ article, index }: { article: ReaderArticle; index: number }) {
  return (
    <Link className="grid grid-cols-[30px_minmax(0,1fr)] gap-3 px-4 py-4 transition hover:bg-[#FAFAF7]" href={`/${article.locale}/${article.slug}`}>
      <span className="text-sm font-bold text-[#C8A227]">{String(index + 1).padStart(2, "0")}</span>
      <span className="min-w-0">
        <span className="line-clamp-2 text-[14px] font-bold leading-6 text-[#111827]">{article.title}</span>
        <span className="mt-2 block text-sm text-[#4B5563]">{formatDate(article.publishedAt, article.locale)}</span>
      </span>
    </Link>
  );
}

function splitMarkdownSections(markdown: string, articleTitle: string) {
  const lines = markdown.split(/\r?\n/);
  const intro: string[] = [];
  const items: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;
  const seenIds = new Map<string, number>();
  let isAtDocumentStart = true;

  for (const line of lines) {
    const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());

    if (match) {
      const title = cleanHeading(match[2] ?? "");
      if (isAtDocumentStart && match[1].length === 1 && sameHeading(title, articleTitle)) {
        isAtDocumentStart = false;
        continue;
      }
      if (current) items.push(current);
      const id = uniqueId(title, seenIds);
      current = {
        id,
        level: match[1].length as 1 | 2 | 3,
        markdown: line,
        title
      };
      isAtDocumentStart = false;
      continue;
    }

    if (line.trim()) isAtDocumentStart = false;
    if (current) {
      current.markdown += `\n${line}`;
    } else {
      intro.push(line);
    }
  }

  if (current) items.push(current);
  return { intro: intro.join("\n").trim(), items };
}

function sameHeading(left: string, right: string) {
  return slugify(left) === slugify(right);
}

function cleanHeading(value: string) {
  return value
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueId(title: string, seenIds: Map<string, number>) {
  const base = slugify(title) || "section";
  const seen = seenIds.get(base) ?? 0;
  seenIds.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen + 1}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateTime(value: string, locale: Locale) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat(locale, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).format(date);
  return `${day} | ${time}`;
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function readingTime(article: ReaderArticle) {
  const words = article.markdown.split(/\s+/).filter(Boolean).length || article.excerpt.split(/\s+/).filter(Boolean).length;
  return article.locale === "vi-vn" ? `${Math.max(1, Math.ceil(words / 220))} phút đọc` : `${Math.max(1, Math.ceil(words / 220))} min read`;
}
