import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BookOpen, Clock, ListChecks } from "lucide-react";

import type { KnowledgePageContent, KnowledgeTaxonomy } from "./model";
import { getKnowledgePage } from "./adapter";

const taxonomyToneClass: Record<KnowledgeTaxonomy["tone"], string> = {
  amber: "bg-[#fff5cf] text-[#8a5a00]",
  blue: "bg-[#e3f1ff] text-[#155b91]",
  green: "bg-[#dcf8e9] text-[#0c7a45]",
  violet: "bg-[#eee6ff] text-[#6140a8]",
};

export async function KnowledgeFeature({ locale }: { locale: Locale }) {
  try {
    const content = await getKnowledgePage(locale);

    if (!content.taxonomy.length || !content.lessons.length) {
      return <KnowledgeEmptyState content={content} />;
    }

    return <KnowledgePage content={content} locale={locale} />;
  } catch {
    return <KnowledgeErrorState locale={locale} />;
  }
}

function KnowledgePage({ content, locale }: { content: KnowledgePageContent; locale: Locale }) {
  const featuredLesson = content.lessons[0]!;
  const heroSuffix = locale === "vi-vn" ? "cho nhà đầu tư Việt" : "for crypto investors";

  return (
    <main className="min-h-screen bg-[#f5fbf7] text-[#071b14]">
      <section className="border-b border-[#dcefe5] bg-[#f1fff8] px-5 py-10 text-center md:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase text-[#0b9b5b]">{content.heroBadge}</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">
            {content.title} <span className="text-[#0b9b5b]">{heroSuffix}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#5e7168] md:text-base">{content.lead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-[#dcefe5] py-4 text-xs font-semibold text-[#456157]">
            {content.meta.map((item) => (
              <span className="inline-flex items-center gap-2" key={item}>
                <span className="h-2 w-2 rounded-full bg-[#10a962]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 md:py-10">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <article className="overflow-hidden rounded-lg border border-[#d9e9df] bg-white shadow-sm">
            <div className="min-h-[244px] bg-[linear-gradient(135deg,#03160f,#07361f_58%,#031009)] p-6 text-white md:p-8">
              <span className="inline-flex rounded-full border border-[#66d59a]/40 bg-[#e9fff3] px-4 py-1.5 text-xs font-bold text-[#087943]">
                {content.eyebrow}
              </span>
              <p className="mt-7 text-xs font-semibold text-[#9ecbb4]">
                {featuredLesson.level} · {featuredLesson.duration}
              </p>
              <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight md:text-3xl">{featuredLesson.title}</h2>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#c9ddcf]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {featuredLesson.duration}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {featuredLesson.tag}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-7 text-[#5e7168]">{featuredLesson.description}</p>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0da75b] px-5 py-2.5 text-xs font-bold text-white">
                {content.lessonsLinkLabel}
                <ArrowRight size={14} />
              </span>
            </div>
          </article>

          <aside className="rounded-lg border border-[#d9e9df] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e4f0e9] px-4 py-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                <BookOpen size={16} className="text-[#0da75b]" />
                {content.lessonsHeading}
              </h2>
              <span className="text-xs font-semibold text-[#0da75b]">{locale}</span>
            </div>
            <div className="divide-y divide-[#e8f1ec]">
              {content.lessons.map((lesson, index) => (
                <article className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 px-4 py-4" key={lesson.title}>
                  <span className="text-sm font-bold text-[#10a962]">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-sm font-bold leading-5">{lesson.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#6b7c74]">
                      {lesson.level} · {lesson.duration}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <p className="text-xs font-black uppercase text-[#0b9b5b]">{content.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-black">{content.taxonomyHeading}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5e7168]">{content.taxonomyDescription}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {content.taxonomy.map((item) => (
                <article className="overflow-hidden rounded-lg border border-[#d9e9df] bg-white shadow-sm" key={item.title}>
                  <div className={`${taxonomyToneClass[item.tone]} flex min-h-24 items-center justify-between gap-4 px-5 py-5`}>
                    <span className="text-sm font-black uppercase">{item.label}</span>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">{item.count}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#60736a]">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-[#d9e9df] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e4f0e9] px-4 py-3">
                <h2 className="text-sm font-bold">{content.metricsHeading}</h2>
                <ListChecks size={16} className="text-[#0da75b]" />
              </div>
              <div className="divide-y divide-[#e8f1ec]">
                {content.metrics.map((metric) => (
                  <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 px-4 py-4" key={metric.label}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0da75b] text-xs font-black text-white">
                      {metric.value}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{metric.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6b7c74]">{metric.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d9e9df] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold">{content.glossaryHeading}</h2>
              <div className="mt-4 space-y-4">
                {content.glossary.map((item) => (
                  <article key={item.term}>
                    <h3 className="text-sm font-black">{item.term}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#6b7c74]">{item.definition}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-10 rounded-lg border border-[#d9e9df] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#e4f0e9] pb-4">
            <h2 className="text-sm font-black">{content.pathHeading}</h2>
            <span className="text-xs font-bold text-[#0da75b]">{content.pathLinkLabel}</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {content.path.map((step) => (
              <article className="grid grid-cols-[38px_minmax(0,1fr)] gap-3" key={step.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded bg-[#e8f8ef] text-xs font-black text-[#0b9b5b]">
                  {step.marker}
                </span>
                <div>
                  <h3 className="text-sm font-black">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#6b7c74]">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function KnowledgeLoadingState() {
  return (
    <main className="min-h-screen bg-[#f5fbf7] px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="h-56 animate-pulse rounded-lg bg-[#dcefe5]" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="h-72 animate-pulse rounded-lg bg-[#dcefe5]" />
          <div className="h-72 animate-pulse rounded-lg bg-[#dcefe5]" />
        </div>
      </div>
    </main>
  );
}

function KnowledgeEmptyState({ content }: { content: KnowledgePageContent }) {
  return (
    <main className="min-h-screen bg-[#f5fbf7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#d9e9df] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#0b9b5b]">{content.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black">{content.emptyTitle}</h1>
        <p className="mt-3 leading-7 text-[#60736a]">{content.emptyDescription}</p>
      </section>
    </main>
  );
}

function KnowledgeErrorState({ locale }: { locale: Locale }) {
  const isVietnamese = locale === "vi-vn";

  return (
    <main className="min-h-screen bg-[#f5fbf7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#f3c6c6] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#c2410c]">Knowledge</p>
        <h1 className="mt-2 text-2xl font-black">
          {isVietnamese ? "Không tải được trang kiến thức" : "Could not load knowledge"}
        </h1>
        <p className="mt-3 leading-7 text-[#60736a]">
          {isVietnamese
            ? "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/knowledge."
            : "Please try again later or check the reader/knowledge adapter."}
        </p>
      </section>
    </main>
  );
}
