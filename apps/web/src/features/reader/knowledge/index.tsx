import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BookOpenText, CheckCircle2, GraduationCap, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { ArticleCard } from "@/components/reader/article-card";
import { getReaderArticles } from "@/features/reader/adapter";
import { getFallbackReaderArticles } from "@/features/reader/fallback-articles";
import { CryptoSphere } from "@/features/reader/home/crypto-sphere";
import type { ReaderArticle } from "@/features/reader/model";

const copy = {
  "vi-vn": {
    eyebrow: "Kiến thức",
    title: "Học crypto theo lộ trình rõ ràng",
    lead: "Từ khái niệm nền tảng đến cách đọc thị trường, CoinRadar gom các bài hướng dẫn thành những cụm dễ theo dõi và dễ áp dụng.",
    start: "Bắt đầu học",
    allArticles: "Xem tất cả bài",
    tracksTitle: "Lộ trình nên đọc",
    focusTitle: "Nên học theo thứ tự",
    articlesTitle: "Bài kiến thức nổi bật",
    glossaryTitle: "Bộ khái niệm cần nắm",
    minutes: "phút đọc",
    focus: [
      ["01", "Hiểu tài sản", "Coin, token, ví, private key và cách giao dịch được xác nhận."],
      ["02", "Đọc dữ liệu", "Giá, volume, vốn hóa, dominance và tín hiệu dễ gây nhiễu."],
      ["03", "Quản trị rủi ro", "Bảo mật ví, phân bổ vốn, tránh FOMO và nhận diện thông tin thiếu nguồn."]
    ],
    tracks: [
      ["01", "Nền tảng crypto", "Blockchain, ví cá nhân, private key và cách giao dịch được xác nhận."],
      ["02", "Đọc dữ liệu thị trường", "Giá, volume, vốn hóa, dominance và cách tránh nhiễu ngắn hạn."],
      ["03", "DeFi & hệ sinh thái", "AMM, lending, stablecoin, TVL và rủi ro smart contract."],
      ["04", "Kỷ luật đầu tư", "Quản trị rủi ro, phân bổ vốn và tránh quyết định theo FOMO."]
    ],
    glossary: ["Blockchain", "Ví crypto", "DeFi", "TVL", "Dominance", "Funding rate"]
  },
  "en-us": {
    eyebrow: "Knowledge",
    title: "Learn crypto through a clear path",
    lead: "From first principles to market reading, CoinRadar organizes explainers into practical clusters that readers can follow without noise.",
    start: "Start learning",
    allArticles: "View all articles",
    tracksTitle: "Suggested paths",
    focusTitle: "Recommended order",
    articlesTitle: "Featured explainers",
    glossaryTitle: "Concepts to know",
    minutes: "min read",
    focus: [
      ["01", "Understand assets", "Coins, tokens, wallets, private keys and how transactions settle."],
      ["02", "Read data", "Price, volume, market cap, dominance and signals that often create noise."],
      ["03", "Manage risk", "Wallet safety, capital allocation, avoiding FOMO and spotting weak sourcing."]
    ],
    tracks: [
      ["01", "Crypto foundations", "Blockchain, personal wallets, private keys and how transactions settle."],
      ["02", "Market data reading", "Price, volume, market cap, dominance and avoiding short-term noise."],
      ["03", "DeFi ecosystems", "AMMs, lending, stablecoins, TVL and smart contract risk."],
      ["04", "Investment discipline", "Risk management, capital allocation and avoiding FOMO-driven decisions."]
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

        <aside className="relative h-[21rem] overflow-visible rounded-2xl border border-[#E7DFCF] bg-white shadow-[0_28px_70px_rgba(17,24,39,0.08)] [transform:perspective(900px)_rotateX(1deg)_rotateY(-3deg)] md:h-[23rem] lg:h-[24rem]">
          <CryptoSphere locale={locale} />
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)]">
          <SectionTitle title={c.focusTitle} />
          <div className="grid gap-3 md:grid-cols-3">
            {c.focus.map(([step, title, text]) => (
              <article className="rounded-xl bg-[#FAFAF7] p-4" key={title}>
                <p className="text-xs font-bold text-[#A88412]">{step}</p>
                <h2 className="mt-2 font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5F6673]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <SectionTitle title={c.tracksTitle} />
          <div className="grid gap-4 md:grid-cols-2">
            {c.tracks.map(([step, title, text], index) => {
              const icons = [GraduationCap, Layers3, Sparkles, ShieldCheck];
              const Icon = icons[index] ?? CheckCircle2;
              return (
                <article className="group rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_18px_46px_rgba(17,24,39,0.05)] transition hover:-translate-y-1 hover:border-[#C8A227]" key={title}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-[#111827] text-[#F5E7B3] shadow-[0_14px_30px_rgba(17,24,39,0.18)] transition group-hover:rotate-3">
                      <Icon size={21} />
                    </span>
                    <span className="text-2xl font-semibold text-[#C8A227]">{step}</span>
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
                <Link className="rounded-lg border border-[#E3DAC6] bg-[#FFFCF3] px-3 py-2 text-sm font-semibold text-[#4B5563] transition hover:border-[#C8A227] hover:text-[#A88412]" href={`/${locale}/search?q=${encodeURIComponent(item)}`} key={item}>
                  {item}
                </Link>
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
