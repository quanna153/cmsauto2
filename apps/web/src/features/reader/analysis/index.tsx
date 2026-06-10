import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BarChart3, Clock, FileText, ShieldAlert, TrendingUp, UserRound } from "lucide-react";

import type { AnalysisIndicator, AnalysisPageContent, AnalysisThesis } from "./model";
import { getAnalysisPage } from "./adapter";

const thesisToneClass: Record<AnalysisThesis["tone"], string> = {
  amber: "bg-[#F5E7B3] text-[#0F1115]",
  blue: "bg-[#FAFAF7] text-[#111827]",
  green: "bg-[#F5E7B3]/70 text-[#A88412]",
  violet: "bg-[#111827] text-[#F5E7B3]",
};

const indicatorTrendClass: Record<AnalysisIndicator["trend"], string> = {
  down: "text-[#ef4444]",
  neutral: "text-[#4B5563]",
  up: "text-[#15803D]",
};

export async function AnalysisFeature({ locale }: { locale: Locale }) {
  try {
    const content = await getAnalysisPage(locale);

    if (!content.theses.length || !content.reports.length) {
      return <AnalysisEmptyState content={content} />;
    }

    return <AnalysisPage content={content} locale={locale} />;
  } catch {
    return <AnalysisErrorState locale={locale} />;
  }
}

function AnalysisPage({ content, locale }: { content: AnalysisPageContent; locale: Locale }) {
  const featuredReport = content.reports[0]!;
  const heroSuffix = locale === "vi-vn" ? "cho quyết định có dữ liệu" : "for data-led decisions";

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
                {featuredReport.tag}
              </span>
              <p className="mt-7 text-xs font-semibold text-[#F5E7B3]">{content.eyebrow}</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight md:text-3xl">{featuredReport.title}</h2>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#F5E7B3]">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound size={14} />
                  {featuredReport.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {featuredReport.readTime}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-7 text-[#4B5563]">{featuredReport.description}</p>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#C8A227] px-5 py-2.5 text-xs font-bold text-[#0F1115]">
                {content.reportsLinkLabel}
                <ArrowRight size={14} />
              </span>
            </div>
          </article>

          <aside className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                <FileText size={16} className="text-[#C8A227]" />
                {content.reportsHeading}
              </h2>
              <span className="text-xs font-semibold text-[#C8A227]">{locale}</span>
            </div>
            <div className="divide-y divide-[#E5E7EB]">
              {content.reports.map((report, index) => (
                <article className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 px-4 py-4" key={report.title}>
                  <span className="text-sm font-bold text-[#C8A227]">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-sm font-bold leading-5">{report.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#4B5563]">
                      {report.author} · {report.readTime}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5 text-sm leading-7 text-[#4B5563] shadow-sm">
          {content.summary}
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <p className="text-xs font-black uppercase text-[#A88412]">{content.heroBadge}</p>
            <h2 className="mt-2 text-2xl font-black">{content.thesisHeading}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#4B5563]">{content.thesisDescription}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {content.theses.map((thesis) => (
                <article className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-sm" key={thesis.title}>
                  <div className={`${thesisToneClass[thesis.tone]} flex min-h-24 items-center justify-between gap-4 px-5 py-5`}>
                    <span className="text-sm font-black uppercase">{thesis.label}</span>
                    <span className="rounded-lg bg-white/70 px-3 py-1 text-xs font-bold">{thesis.confidence}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black">{thesis.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#4B5563]">{thesis.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                  <TrendingUp size={16} className="text-[#C8A227]" />
                  {content.indicatorsHeading}
                </h2>
                <span className="text-xs font-semibold text-[#C8A227]">{content.indicatorsLinkLabel}</span>
              </div>
              <div className="space-y-4 p-4">
                {content.indicators.map((indicator) => (
                  <article key={indicator.label}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-sm font-black">{indicator.label}</h3>
                      <span className={`shrink-0 text-sm font-black ${indicatorTrendClass[indicator.trend]}`}>
                        {indicator.value}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[#4B5563]">{indicator.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                  <ShieldAlert size={16} className="text-[#b7791f]" />
                  {content.risksHeading}
                </h2>
                <span className="text-xs font-semibold text-[#C8A227]">{content.risksLinkLabel}</span>
              </div>
              <div className="space-y-4 p-4">
                {content.risks.map((risk) => (
                  <article className="grid grid-cols-[38px_minmax(0,1fr)] gap-3" key={risk.title}>
                    <span className="flex h-8 w-8 items-center justify-center rounded bg-[#F5E7B3] text-xs font-black text-[#0F1115]">
                      {risk.marker}
                    </span>
                    <div>
                      <h3 className="text-sm font-black">{risk.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-[#4B5563]">{risk.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-10 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <h2 className="inline-flex items-center gap-2 text-sm font-black">
              <BarChart3 size={16} className="text-[#C8A227]" />
              {content.metricsHeading}
            </h2>
            <span className="text-xs font-bold text-[#C8A227]">{locale}</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {content.metrics.map((metric) => (
              <article className="grid grid-cols-[44px_minmax(0,1fr)] gap-3" key={metric.label}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C8A227] text-xs font-black text-[#0F1115]">
                  {metric.value}
                </span>
                <div>
                  <h3 className="text-sm font-black">{metric.label}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#4B5563]">{metric.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function AnalysisLoadingState() {
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

function AnalysisEmptyState({ content }: { content: AnalysisPageContent }) {
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

function AnalysisErrorState({ locale }: { locale: Locale }) {
  const isVietnamese = locale === "vi-vn";

  return (
    <main className="min-h-screen bg-[#F5F5F2] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#f3c6c6] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#c2410c]">Analysis</p>
        <h1 className="mt-2 text-2xl font-black">
          {isVietnamese ? "Không tải được trang phân tích" : "Could not load analysis"}
        </h1>
        <p className="mt-3 leading-7 text-[#4B5563]">
          {isVietnamese
            ? "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/analysis."
            : "Please try again later or check the reader/analysis adapter."}
        </p>
      </section>
    </main>
  );
}
