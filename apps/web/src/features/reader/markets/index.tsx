import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BarChart3, CircleDollarSign, Search, TrendingUp } from "lucide-react";

import type { MarketPageContent, MarketSignal } from "./model";
import { getMarketsPage } from "./adapter";

const signalToneClass: Record<MarketSignal["tone"], string> = {
  amber: "bg-[#fff5cf] text-[#8a5a00]",
  blue: "bg-[#e3f1ff] text-[#155b91]",
  green: "bg-[#dcf8e9] text-[#0c7a45]",
  violet: "bg-[#eee6ff] text-[#6140a8]",
};

export async function MarketsFeature({ locale }: { locale: Locale }) {
  try {
    const content = await getMarketsPage(locale);

    if (!content.assets.length || !content.signals.length) {
      return <MarketsEmptyState content={content} />;
    }

    return <MarketsPage content={content} locale={locale} />;
  } catch {
    return <MarketsErrorState locale={locale} />;
  }
}

function MarketsPage({ content, locale }: { content: MarketPageContent; locale: Locale }) {
  const featuredBrief = content.briefs[0]!;
  const primaryAsset = content.assets[0]!;
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
                {featuredBrief.tag}
              </span>
              <p className="mt-7 text-xs font-semibold text-[#9ecbb4]">{content.eyebrow}</p>
              <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight md:text-3xl">{featuredBrief.title}</h2>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[#c9ddcf]">
                <span>{primaryAsset.name}</span>
                <span>{primaryAsset.price}</span>
                <span className={primaryAsset.trend === "up" ? "text-[#73e0a1]" : "text-[#ff9b9b]"}>{primaryAsset.change}</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-7 text-[#5e7168]">{featuredBrief.description}</p>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0da75b] px-5 py-2.5 text-xs font-bold text-white">
                {content.briefsLinkLabel}
                <ArrowRight size={14} />
              </span>
            </div>
          </article>

          <aside className="rounded-lg border border-[#d9e9df] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e4f0e9] px-4 py-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-bold">
                <TrendingUp size={16} className="text-[#0da75b]" />
                {content.briefsHeading}
              </h2>
              <span className="text-xs font-semibold text-[#0da75b]">{content.briefsLinkLabel}</span>
            </div>
            <div className="divide-y divide-[#e8f1ec]">
              {content.briefs.map((brief, index) => (
                <article className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 px-4 py-4" key={brief.title}>
                  <span className="text-sm font-bold text-[#10a962]">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-sm font-bold leading-5">{brief.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#6b7c74]">{brief.tag}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="rounded-lg border border-[#d9e9df] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-[#0b9b5b]">Trade</p>
                <h2 className="mt-2 text-2xl font-black">{content.assetsHeading}</h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4bd3b] text-sm font-black text-white">
                    {primaryAsset.symbol.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{primaryAsset.name}</p>
                    <p className="text-lg font-black">{primaryAsset.price}</p>
                  </div>
                </div>
              </div>
              <span className={primaryAsset.trend === "up" ? "text-sm font-black text-[#0da75b]" : "text-sm font-black text-[#ef4444]"}>
                {primaryAsset.change}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["1D", "7D", "30D", "1Y", "All"].map((range, index) => (
                <span
                  className={index === 0 ? "rounded-full bg-[#0da75b] px-3 py-1 text-xs font-bold text-white" : "rounded-full bg-[#f0f5f2] px-3 py-1 text-xs font-bold text-[#66786f]"}
                  key={range}
                >
                  {range}
                </span>
              ))}
            </div>

            <div className="mt-4 flex h-[340px] items-end gap-2 rounded-lg bg-[#eef2f0] px-5 py-6">
              {primaryAsset.bars.concat([60, 74, 68, 82, 76, 90]).map((height, index) => (
                <span
                  className="flex-1 rounded-t bg-[#0da75b]/70"
                  key={`${primaryAsset.symbol}-chart-${index}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </article>

          <aside className="rounded-lg border border-[#d9e9df] bg-white shadow-sm">
            <div className="border-b border-[#e4f0e9] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">{content.assetsLinkLabel}</h2>
                <BarChart3 size={16} className="text-[#0da75b]" />
              </div>
              <div className="mt-3 flex h-9 items-center gap-2 rounded border border-[#dfe9e3] px-3 text-xs text-[#8a9891]">
                <Search size={14} />
                <span>{locale === "vi-vn" ? "Tìm coin..." : "Search coin..."}</span>
              </div>
            </div>
            <div className="divide-y divide-[#e8f1ec]">
              {content.assets.map((asset, index) => (
                <article className="grid grid-cols-[24px_34px_minmax(0,1fr)_70px] items-center gap-2 px-4 py-3" key={asset.symbol}>
                  <span className="text-xs font-bold text-[#8a9891]">{index + 1}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef8f2] text-xs font-black text-[#0b9b5b]">
                    {asset.symbol.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-black">{asset.name}</p>
                    <p className="text-[11px] font-semibold text-[#8a9891]">{asset.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{asset.price}</p>
                    <p className={asset.trend === "up" ? "text-xs font-black text-[#0da75b]" : "text-xs font-black text-[#ef4444]"}>
                      {asset.change}
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
            <h2 className="mt-2 text-2xl font-black">{content.signalsHeading}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5e7168]">{content.signalsDescription}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {content.signals.map((signal) => (
                <article className="overflow-hidden rounded-lg border border-[#d9e9df] bg-white shadow-sm" key={signal.title}>
                  <div className={`${signalToneClass[signal.tone]} flex min-h-24 items-center justify-between gap-4 px-5 py-5`}>
                    <span className="text-sm font-black uppercase">{signal.label}</span>
                    <CircleDollarSign size={24} />
                  </div>
                  <div className="p-5">
                    <h3 className="font-black">{signal.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#60736a]">{signal.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-[#d9e9df] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#e4f0e9] px-4 py-3">
                <h2 className="text-sm font-bold">{content.watchHeading}</h2>
                <span className="text-xs font-semibold text-[#0da75b]">{content.watchLinkLabel}</span>
              </div>
              <div className="space-y-4 p-4">
                {content.watchItems.map((item, index) => (
                  <article className="grid grid-cols-[34px_minmax(0,1fr)] gap-3" key={item.title}>
                    <span className="text-sm font-bold text-[#10a962]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-black">{item.title}</h3>
                        <span className="shrink-0 rounded bg-[#e8f8ef] px-2 py-1 text-xs font-black text-[#0b9b5b]">
                          {item.value}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#6b7c74]">{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d9e9df] bg-[linear-gradient(135deg,#03160f,#07361f_58%,#031009)] p-4 text-white shadow-sm">
              <p className="text-xs font-bold uppercase text-[#73e0a1]">{locale}</p>
              <p className="mt-2 text-lg font-black">{content.heroBadge}</p>
              <p className="mt-2 text-xs leading-5 text-[#c9ddcf]">{content.summary}</p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

export function MarketsLoadingState() {
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

function MarketsEmptyState({ content }: { content: MarketPageContent }) {
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

function MarketsErrorState({ locale }: { locale: Locale }) {
  const isVietnamese = locale === "vi-vn";

  return (
    <main className="min-h-screen bg-[#f5fbf7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#f3c6c6] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#c2410c]">Markets</p>
        <h1 className="mt-2 text-2xl font-black">
          {isVietnamese ? "Không tải được trang thị trường" : "Could not load markets"}
        </h1>
        <p className="mt-3 leading-7 text-[#60736a]">
          {isVietnamese
            ? "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/markets."
            : "Please try again later or check the reader/markets adapter."}
        </p>
      </section>
    </main>
  );
}
