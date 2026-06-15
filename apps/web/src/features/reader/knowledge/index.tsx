import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BarChart3, BookOpenText, GraduationCap, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { ArticleCard } from "@/components/reader/article-card";
import { getReaderArticles } from "@/features/reader/adapter";
import { getFallbackReaderArticles } from "@/features/reader/fallback-articles";
import type { ReaderArticle } from "@/features/reader/model";

import { LearningVisual } from "./learning-visual";

const copy = {
  "vi-vn": {
    eyebrow: "Kiến thức",
    title: "Bản đồ kiến thức crypto dễ đọc",
    lead: "Từ khái niệm nền tảng đến cách đọc thị trường, CoinRadar gom bài hướng dẫn theo cụm chủ đề để người đọc chọn đúng thứ mình cần.",
    start: "Bắt đầu học",
    allArticles: "Xem tất cả bài",
    tracksTitle: "Cụm chủ đề nên đọc",
    focusTitle: "Ba lớp kiến thức cốt lõi",
    articlesTitle: "Bài kiến thức nổi bật",
    glossaryTitle: "Bộ khái niệm cần nắm",
    minutes: "phút đọc",
    focus: [
      ["Tài sản", "Coin, token, ví, private key và cách giao dịch được xác nhận."],
      ["Dữ liệu", "Giá, volume, vốn hóa, dominance và tín hiệu dễ gây nhiễu."],
      ["Rủi ro", "Bảo mật ví, phân bổ vốn, tránh FOMO và nhận diện thông tin thiếu nguồn."]
    ],
    tracks: [
      ["Nền tảng crypto", "Blockchain, ví cá nhân, private key và cách giao dịch được xác nhận."],
      ["Đọc dữ liệu thị trường", "Giá, volume, vốn hóa, dominance và cách tránh nhiễu ngắn hạn."],
      ["DeFi & hệ sinh thái", "AMM, lending, stablecoin, TVL và rủi ro smart contract."],
      ["Kỷ luật đầu tư", "Quản trị rủi ro, phân bổ vốn và tránh quyết định theo FOMO."]
    ],
    glossary: ["Blockchain", "Ví crypto", "DeFi", "TVL", "Dominance", "Funding rate"]
  },
  "en-us": {
    eyebrow: "Knowledge",
    title: "A readable crypto knowledge map",
    lead: "From first principles to market reading, CoinRadar organizes explainers by topic clusters so readers can pick what they need.",
    start: "Start learning",
    allArticles: "View all articles",
    tracksTitle: "Topic clusters",
    focusTitle: "Core knowledge layers",
    articlesTitle: "Featured explainers",
    glossaryTitle: "Concepts to know",
    minutes: "min read",
    focus: [
      ["Assets", "Coins, tokens, wallets, private keys and how transactions settle."],
      ["Data", "Price, volume, market cap, dominance and signals that often create noise."],
      ["Risk", "Wallet safety, capital allocation, avoiding FOMO and spotting weak sourcing."]
    ],
    tracks: [
      ["Crypto foundations", "Blockchain, personal wallets, private keys and how transactions settle."],
      ["Market data reading", "Price, volume, market cap, dominance and avoiding short-term noise."],
      ["DeFi ecosystems", "AMMs, lending, stablecoins, TVL and smart contract risk."],
      ["Investment discipline", "Risk management, capital allocation and avoiding FOMO-driven decisions."]
    ],
    glossary: ["Blockchain", "Wallets", "DeFi", "TVL", "Dominance", "Funding rate"]
  }
} satisfies Record<Locale, {
  allArticles: string;
  articlesTitle: string;
  eyebrow: string;
  focus: string[][];
  focusTitle: string;
  glossary: string[];
  glossaryTitle: string;
  lead: string;
  minutes: string;
  start: string;
  title: string;
  tracks: string[][];
  tracksTitle: string;
}>;

export async function KnowledgeFeature({ locale }: { locale: Locale }) {
  const articles = await loadKnowledgeArticles(locale);
  const featured = articles[0];
  const c = copy[locale];

  return (
    <main className="overflow-hidden bg-[#FAFAF7] text-[#111827]">
      <section className="relative mx-auto grid max-w-7xl gap-7 px-5 py-8 md:py-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(22rem,0.68fr)] lg:items-center">
        <div className="pointer-events-none absolute left-[-12rem] top-[-14rem] size-[28rem] rounded-full bg-[#E8D391]/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A88412]">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">{c.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#4B5563]">{c.lead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#B88400] px-5 text-sm font-bold text-white transition hover:bg-[#111827]" href={featured ? articleHref(featured) : `/${locale}/articles`}>
              {c.start} <ArrowRight size={16} />
            </Link>
            <Link className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#E0D4B6] bg-white px-5 text-sm font-bold text-[#111827] transition hover:border-[#C8A227]" href={`/${locale}/articles`}>
              <BookOpenText size={16} /> {c.allArticles}
            </Link>
          </div>
        </div>

        <aside className="relative h-[23rem] overflow-visible md:h-[25rem] lg:h-[26rem]">
          <LearningVisual locale={locale} />
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)]">
          <SectionTitle title={c.focusTitle} />
          <div className="grid gap-3 md:grid-cols-3">
            {c.focus.map(([title, text], index) => {
              const icons = [GraduationCap, BarChart3, ShieldCheck];
              const Icon = icons[index] ?? GraduationCap;
              return (
              <article className="group rounded-xl bg-[#FAFAF7] p-4 transition hover:bg-[#111827] hover:text-white" key={title}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white text-[#A88412] shadow-sm transition group-hover:bg-[#F5E7B3]">
                  <Icon size={18} />
                </span>
                <h2 className="mt-4 font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5F6673]">{text}</p>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <SectionTitle title={c.tracksTitle} />
          <div className="grid gap-4 md:grid-cols-2">
            {c.tracks.map(([title, text], index) => {
              const icons = [GraduationCap, Layers3, Sparkles, ShieldCheck];
              const Icon = icons[index] ?? BookOpenText;
              return (
                <article className="group rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)] transition hover:-translate-y-1 hover:border-[#C8A227]" key={title}>
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#111827] text-[#F5E7B3] shadow-[0_14px_30px_rgba(17,24,39,0.18)] transition group-hover:rotate-3">
                      <Icon size={21} />
                    </span>
                    <span className="mt-1 h-px flex-1 bg-gradient-to-r from-[#C8A227]/55 to-transparent" />
                  </div>
                  <h2 className="mt-6 text-lg font-semibold">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#5F6673]">{text}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8">
            <SectionTitle title={c.articlesTitle} />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {articles.slice(0, 6).map((article) => (
                <ArticleCard article={article} key={article.id} />
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          {featured ? <FeaturedLesson article={featured} minutesLabel={c.minutes} /> : null}
          <section className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)]">
            <h2 className="text-lg font-semibold">{c.glossaryTitle}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {c.glossary.map((item) => (
                <span className="rounded-lg border border-[#E3DAC6] bg-[#FFFCF3] px-3 py-2 text-sm font-semibold text-[#4B5563]" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

async function loadKnowledgeArticles(locale: Locale) {
  try {
    const articles = await getReaderArticles(locale);
    const filtered = articles.filter((article) => article.articleSection === "knowledge");
    return filtered.length ? filtered : getFallbackReaderArticles(locale).filter((article) => article.articleSection === "knowledge");
  } catch {
    return getFallbackReaderArticles(locale).filter((article) => article.articleSection === "knowledge");
  }
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">{title}</h2>;
}

function FeaturedLesson({ article, minutesLabel }: { article: ReaderArticle; minutesLabel: string }) {
  return (
    <Link className="group block rounded-2xl bg-[#111827] p-5 text-white shadow-[0_24px_58px_rgba(17,24,39,0.18)] transition hover:-translate-y-1" href={articleHref(article)}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F5E7B3]">{article.primaryKeyword}</p>
      <h2 className="mt-4 text-xl font-semibold leading-7 transition group-hover:text-[#F5E7B3]">{article.title}</h2>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/72">{article.excerpt}</p>
      <p className="mt-5 text-sm font-semibold text-[#F5E7B3]">{readingTime(article)} {minutesLabel}</p>
    </Link>
  );
}

function articleHref(article: ReaderArticle) {
  return article.livePath || `/${article.locale}/${article.slug}`;
}

function readingTime(article: ReaderArticle) {
  return Math.max(2, Math.ceil(`${article.title} ${article.excerpt} ${article.markdown}`.split(/\s+/).filter(Boolean).length / 220));
}
