import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BarChart3, CheckCircle2, Database, LineChart, Radar, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { ReaderMarketTicker } from "@/components/reader/reader-market-ticker";
import { getReaderArticles } from "@/features/reader/adapter";
import { getFallbackReaderArticles } from "@/features/reader/fallback-articles";
import { formatReaderCompactUsd, readerFallbackGlobalStats } from "@/features/reader/market-data";
import type { ReaderArticle } from "@/features/reader/model";

const copy = {
  "vi-vn": {
    eyebrow: "Phân tích",
    title: "Luận điểm thị trường, dữ liệu và kịch bản hành động",
    lead: "Trang phân tích tập trung vào dòng tiền, on-chain, tâm lý và rủi ro. Mỗi bài cần giúp người đọc hiểu vì sao thị trường đang di chuyển, không chỉ biết giá đang tăng hay giảm.",
    readLatest: "Đọc phân tích mới",
    market: "Xem thị trường",
    thesisTitle: "Khung phân tích",
    reportsTitle: "Bài phân tích nổi bật",
    dashboardTitle: "Bảng tín hiệu nhanh",
    scenariosTitle: "Kịch bản 30 ngày",
    source: "Dữ liệu mẫu khi API chưa phản hồi",
    points: [
      ["Dòng tiền", "ETF, stablecoin supply, exchange flow và thanh khoản trên sàn."],
      ["On-chain", "Ví lớn, luồng nạp/rút, hoạt động mạng và hành vi tích lũy."],
      ["Rủi ro", "Vĩ mô, pháp lý, đòn bẩy và các vùng giá vô hiệu kịch bản."]
    ],
    scenarios: [
      ["Tích cực", "BTC giữ hỗ trợ, thanh khoản mở rộng sang ETH và altcoin lớn.", "40%", "text-[#15803D]", TrendingUp],
      ["Cơ sở", "Thị trường tích lũy trong biên độ, dòng tiền chọn lọc theo sector.", "42%", "text-[#A88412]", LineChart],
      ["Thận trọng", "Tin vĩ mô hoặc rút thanh khoản khiến biến động tăng mạnh.", "18%", "text-[#DC2626]", TrendingDown]
    ]
  },
  "en-us": {
    eyebrow: "Analysis",
    title: "Market theses, data signals and actionable scenarios",
    lead: "Analysis focuses on capital flows, on-chain data, sentiment and risk. Each report should explain why the market is moving, not only whether price is up or down.",
    readLatest: "Read latest analysis",
    market: "View markets",
    thesisTitle: "Analysis framework",
    reportsTitle: "Featured analysis",
    dashboardTitle: "Signal dashboard",
    scenariosTitle: "30-day scenarios",
    source: "Sample data when APIs are unavailable",
    points: [
      ["Capital flow", "ETF flows, stablecoin supply, exchange flow and venue liquidity."],
      ["On-chain", "Large wallets, inflows, outflows, network activity and accumulation behavior."],
      ["Risk", "Macro, regulation, leverage and invalidation zones for each thesis."]
    ],
    scenarios: [
      ["Bullish", "BTC holds support and liquidity expands toward ETH and large altcoins.", "40%", "text-[#15803D]", TrendingUp],
      ["Base", "The market consolidates while capital rotates selectively by sector.", "42%", "text-[#A88412]", LineChart],
      ["Cautious", "Macro news or liquidity withdrawal increases volatility sharply.", "18%", "text-[#DC2626]", TrendingDown]
    ]
  }
} satisfies Record<Locale, {
  dashboardTitle: string;
  eyebrow: string;
  lead: string;
  market: string;
  points: Array<[string, string]>;
  readLatest: string;
  reportsTitle: string;
  scenarios: Array<[string, string, string, string, LucideIcon]>;
  scenariosTitle: string;
  source: string;
  thesisTitle: string;
  title: string;
}>;

export async function AnalysisFeature({ locale }: { locale: Locale }) {
  const articles = await loadAnalysisArticles(locale);
  const featured = articles[0];
  const c = copy[locale];

  return (
    <main className="overflow-hidden bg-[#FAFAF7] text-[#111827]">
      <ReaderMarketTicker locale={locale} />
      <section className="relative mx-auto grid max-w-7xl gap-7 px-5 py-8 md:py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.62fr)] lg:items-center">
        <div className="pointer-events-none absolute right-[-13rem] top-[-12rem] size-[30rem] rounded-full bg-[#E8D391]/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A88412]">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">{c.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#4B5563]">{c.lead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#B88400] px-5 text-sm font-bold text-white transition hover:bg-[#111827]" href={featured ? articleHref(featured) : `/${locale}/articles`}>
              {c.readLatest} <ArrowRight size={16} />
            </Link>
            <Link className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#E0D4B6] bg-white px-5 text-sm font-bold text-[#111827] transition hover:border-[#C8A227]" href={`/${locale}/markets`}>
              <BarChart3 size={16} /> {c.market}
            </Link>
          </div>
        </div>
        <AnalysisPanel locale={locale} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <SectionTitle title={c.thesisTitle} />
          <div className="grid gap-4 md:grid-cols-3">
            {c.points.map(([title, text], index) => {
              const icons = [Database, Radar, ShieldAlert];
              const Icon = icons[index] ?? CheckCircle2;
              return (
                <article className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)] transition hover:-translate-y-1 hover:border-[#C8A227]" key={title}>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[#111827] text-[#F5E7B3]">
                    <Icon size={21} />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#5F6673]">{text}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8">
            <SectionTitle title={c.reportsTitle} />
            <div className="grid gap-4 md:grid-cols-2">
              {articles.slice(0, 4).map((article) => (
                <ReportCard article={article} key={article.id} locale={locale} />
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)]">
            <h2 className="text-lg font-semibold">{c.dashboardTitle}</h2>
            <p className="mt-2 text-xs font-semibold text-[#A88412]">{c.source}</p>
            <div className="mt-5 grid gap-3">
              {[
                ["Market cap", formatReaderCompactUsd(readerFallbackGlobalStats.totalMarketCapUsd), "+1.32%"],
                ["24h volume", formatReaderCompactUsd(readerFallbackGlobalStats.totalVolumeUsd), "+6.21%"],
                ["BTC dominance", `${readerFallbackGlobalStats.btcDominance}%`, "-0.42%"],
                ["ETH dominance", `${readerFallbackGlobalStats.ethDominance}%`, "+0.31%"]
              ].map(([label, value, change]) => (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl bg-[#FAFAF7] p-4" key={label}>
                  <span className="text-sm text-[#5F6673]">{label}</span>
                  <strong className="text-right">{value}</strong>
                  <span className={`col-span-2 text-sm font-semibold ${change.startsWith("-") ? "text-[#DC2626]" : "text-[#15803D]"}`}>{change}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)]">
            <h2 className="text-lg font-semibold">{c.scenariosTitle}</h2>
            <div className="mt-4 grid gap-3">
              {c.scenarios.map(([title, text, chance, tone, Icon]) => (
                <article className="rounded-xl border border-[#EFE7D6] p-4" key={title}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-2 text-sm font-bold ${tone}`}>
                      <Icon size={17} /> {title}
                    </span>
                    <span className="text-sm font-semibold text-[#111827]">{chance}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#5F6673]">{text}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

async function loadAnalysisArticles(locale: Locale) {
  try {
    const articles = await getReaderArticles(locale);
    const filtered = articles.filter((article) => article.articleSection === "analysis");
    return filtered.length ? filtered : getFallbackReaderArticles(locale).filter((article) => article.articleSection === "analysis");
  } catch {
    return getFallbackReaderArticles(locale).filter((article) => article.articleSection === "analysis");
  }
}

function AnalysisPanel({ locale }: { locale: Locale }) {
  const labels = locale === "vi-vn" ? ["ETF", "On-chain", "Rủi ro"] : ["ETF", "On-chain", "Risk"];

  return (
    <aside className="relative min-h-[18rem] rounded-2xl border border-[#E7DFCF] bg-[#111827] p-5 text-white shadow-[0_28px_70px_rgba(17,24,39,0.12)] [transform:perspective(900px)_rotateX(1deg)_rotateY(3deg)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(245,231,179,0.18),transparent_42%)]" />
      <div className="relative flex min-h-[15rem] items-end">
        <svg aria-hidden="true" className="absolute inset-x-3 top-7 h-40 w-[calc(100%-1.5rem)] text-[#F5E7B3]" preserveAspectRatio="none" viewBox="0 0 420 180">
          <g stroke="currentColor" strokeOpacity="0.14">
            {[0, 70, 140, 210, 280, 350, 420].map((x) => <line key={x} x1={x} x2={x} y1="0" y2="180" />)}
            {[30, 70, 110, 150].map((y) => <line key={y} x1="0" x2="420" y1={y} y2={y} />)}
          </g>
          <path d="M0 138 C46 112 62 132 104 84 C146 36 174 78 214 52 C258 24 286 68 328 34 C366 4 390 40 420 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
        </svg>
        <div className="grid w-full grid-cols-3 gap-3">
          {labels.map((label, index) => (
            <div className="rounded-xl border border-white/10 bg-white/7 p-3" key={label}>
              <p className="text-xs text-white/60">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-[#F5E7B3]">{index === 0 ? "+$1.24B" : index === 1 ? "72" : "3/5"}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">{title}</h2>;
}

function ReportCard({ article, locale }: { article: ReaderArticle; locale: Locale }) {
  return (
    <Link className="group block rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)] transition hover:-translate-y-1 hover:border-[#C8A227]" href={articleHref(article)}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">{article.primaryKeyword}</p>
      <h2 className="mt-3 line-clamp-2 text-xl font-semibold leading-7 text-[#111827] transition group-hover:text-[#A88412]">{article.title}</h2>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5F6673]">{article.excerpt}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#A88412]">
        {locale === "vi-vn" ? "Đọc luận điểm" : "Read report"} <ArrowRight className="transition group-hover:translate-x-1" size={16} />
      </span>
    </Link>
  );
}

function articleHref(article: ReaderArticle) {
  return article.livePath || `/${article.locale}/${article.slug}`;
}
