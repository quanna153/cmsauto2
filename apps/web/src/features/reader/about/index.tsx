import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, Building2, CheckCircle2, FileText, Users, Workflow } from "lucide-react";

import type { AboutPageContent, AboutPillar } from "./model";
import { getAboutPage } from "./adapter";

const pillarToneClass: Record<AboutPillar["tone"], string> = {
  amber: "bg-[#F5E7B3] text-[#0F1115]",
  blue: "bg-[#FAFAF7] text-[#111827]",
  green: "bg-[#F5E7B3]/70 text-[#A88412]",
  violet: "bg-[#111827] text-[#F5E7B3]",
};

export async function AboutFeature({ locale }: { locale: Locale }) {
  try {
    const content = await getAboutPage(locale);

    if (!content.pillars.length || !content.principles.length) {
      return <AboutEmptyState content={content} />;
    }

    return <AboutPage content={content} locale={locale} />;
  } catch {
    return <AboutErrorState locale={locale} />;
  }
}

function AboutPage({ content, locale }: { content: AboutPageContent; locale: Locale }) {
  const featuredPrinciple = content.principles[0]!;
  const heroSuffix = locale === "vi-vn" ? "và đội ngũ CoinRadar" : "and the editorial team";
  const featureTitle = locale === "vi-vn" ? "Tòa soạn CoinRadar" : "CoinRadar newsroom";
  const closingTitle = locale === "vi-vn" ? "Cam kết biên tập" : "Editorial commitment";

  return (
    <main className="min-h-screen bg-[#F5F5F2] text-[#111827]">
      <section className="border-b border-[#E5E7EB] bg-[#FAFAF7] px-5 py-10 text-center md:py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase text-[#A88412]">{content.heroBadge}</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-black uppercase leading-tight md:text-5xl">
            {content.title} <span className="text-[#A88412]">{heroSuffix}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#4B5563] md:text-base">{content.lead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-[#E5E7EB] py-4 text-xs font-semibold text-[#4B5563]">
            {content.meta.map((item) => (
              <span className="inline-flex items-center gap-2" key={item}>
                <span className="h-2 w-2 rounded-full bg-[#C8A227]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 md:py-10">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <article className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <div className="min-h-[244px] bg-[linear-gradient(135deg,#0F1115,#2B2413_58%,#111827)] p-6 text-white md:p-8">
              <span className="inline-flex rounded-lg border border-[#C8A227]/35 bg-[#F5E7B3]/55 px-4 py-1.5 text-xs font-bold text-[#0F1115]">
                {content.eyebrow}
              </span>
              <p className="mt-7 text-xs font-semibold text-[#F5E7B3]">{content.heroBadge}</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight md:text-3xl">{featureTitle}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#F5E7B3]">{content.summary}</p>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-[#A88412]">{featuredPrinciple.tag}</p>
                <h3 className="mt-2 text-base font-black">{featuredPrinciple.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4B5563]">{featuredPrinciple.description}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#C8A227] px-5 py-2.5 text-xs font-bold text-[#0F1115]">
                {content.principlesLinkLabel}
                <ArrowRight size={14} />
              </span>
            </div>
          </article>

          <aside className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                <CheckCircle2 size={16} className="text-[#C8A227]" />
                {content.principlesHeading}
              </h2>
              <span className="text-xs font-semibold text-[#C8A227]">{locale}</span>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {content.principles.map((principle, index) => (
                <article className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 px-4 py-4" key={principle.title}>
                  <span className="text-sm font-bold text-[#C8A227]">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-sm font-bold leading-5">{principle.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#4B5563]">{principle.tag}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <p className="text-xs font-black uppercase text-[#A88412]">{content.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-black">{content.pillarsHeading}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#4B5563]">{content.pillarsDescription}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {content.pillars.map((pillar) => (
                <article className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm" key={pillar.title}>
                  <div className={`${pillarToneClass[pillar.tone]} flex min-h-24 items-center justify-between gap-4 px-5 py-5`}>
                    <span className="text-2xl font-black">{pillar.marker}</span>
                    <span className="rounded-lg bg-white/70 px-3 py-1 text-xs font-bold">{pillar.eyebrow}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#4B5563]">{pillar.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                  <Users size={16} className="text-[#C8A227]" />
                  {content.teamHeading}
                </h2>
                <span className="text-xs font-semibold text-[#C8A227]">{locale}</span>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {content.metrics.map((metric) => (
                  <div className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 px-4 py-4" key={metric.label}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8A227] text-xs font-black text-[#0F1115]">
                      {metric.value}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{metric.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#4B5563]">{metric.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                <FileText size={16} className="text-[#C8A227]" />
                {locale === "vi-vn" ? "Ghi chú biên tập" : "Editorial notes"}
              </h2>
              <div className="mt-4 space-y-4">
                {content.teamNotes.map((note) => (
                  <article key={note.title}>
                    <h3 className="text-sm font-black">{note.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#4B5563]">{note.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-10 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <h2 className="inline-flex items-center gap-2 text-sm font-black">
              <Workflow size={16} className="text-[#C8A227]" />
              {content.workflowHeading}
            </h2>
            <span className="text-xs font-bold text-[#C8A227]">{content.workflowLinkLabel}</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {content.workflow.map((step, index) => (
              <article className="grid grid-cols-[38px_minmax(0,1fr)] gap-3" key={step.title}>
                <span className="flex h-8 w-8 items-center justify-center rounded bg-[#F5E7B3] text-xs font-black text-[#A88412]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-black">{step.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#4B5563]">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-[#E5E7EB] bg-[linear-gradient(135deg,#0F1115,#2B2413_58%,#111827)] p-5 text-white shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#F5E7B3]">{content.heroBadge}</p>
              <h2 className="mt-2 text-xl font-black">{closingTitle}</h2>
            </div>
            <Building2 size={28} className="text-[#F5E7B3]" />
          </div>
        </section>
      </div>
    </main>
  );
}

export function AboutLoadingState() {
  return (
    <main className="min-h-screen bg-[#F5F5F2] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-56 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="h-72 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-72 animate-pulse rounded-lg bg-[#E5E7EB]" />
        </div>
      </div>
    </main>
  );
}

function AboutEmptyState({ content }: { content: AboutPageContent }) {
  return (
    <main className="min-h-screen bg-[#F5F5F2] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#A88412]">{content.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black">{content.emptyTitle}</h1>
        <p className="mt-3 leading-7 text-[#4B5563]">{content.emptyDescription}</p>
      </section>
    </main>
  );
}

function AboutErrorState({ locale }: { locale: Locale }) {
  const isVietnamese = locale === "vi-vn";

  return (
    <main className="min-h-screen bg-[#F5F5F2] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#f3c6c6] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#c2410c]">About</p>
        <h1 className="mt-2 text-2xl font-black">
          {isVietnamese ? "Không tải được trang giới thiệu" : "Could not load the about page"}
        </h1>
        <p className="mt-3 leading-7 text-[#4B5563]">
          {isVietnamese
            ? "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/about."
            : "Please try again later or check the reader/about adapter."}
        </p>
      </section>
    </main>
  );
}
