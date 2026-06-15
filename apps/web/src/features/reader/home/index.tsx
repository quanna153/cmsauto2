import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BookOpenText, CheckCircle2, Newspaper, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";

import { getReaderArticles } from "../adapter";
import { getFallbackReaderArticles } from "../fallback-articles";
import type { ReaderArticle } from "../model";
import {
  HeroPriceCard,
  HomeMarketProvider,
  InlineMarketTicker,
  MarketPulse,
  TopGainers,
  type LiveCoin
} from "./home-live-market";
import { CryptoSphere } from "./crypto-sphere";

const coreCoins: LiveCoin[] = [
  { name: "Bitcoin", symbol: "BTC", pair: "BTCUSDT" },
  { name: "Ethereum", symbol: "ETH", pair: "ETHUSDT" },
  { name: "BNB", symbol: "BNB", pair: "BNBUSDT" },
  { name: "Solana", symbol: "SOL", pair: "SOLUSDT" },
  { name: "XRP", symbol: "XRP", pair: "XRPUSDT" },
  { name: "Arbitrum", symbol: "ARB", pair: "ARBUSDT" },
  { name: "FET", symbol: "FET", pair: "FETUSDT" },
  { name: "Optimism", symbol: "OP", pair: "OPUSDT" },
  { name: "Sui", symbol: "SUI", pair: "SUIUSDT" },
  { name: "Maker", symbol: "MKR", pair: "MKRUSDT" }
];

const homeCopy = {
  "vi-vn": {
    heroEyebrow: "CoinRadar",
    heroTitle: "Đọc thị trường crypto bằng dữ liệu và bối cảnh rõ ràng",
    heroText: "CoinRadar gom giá, dòng tiền, kiến thức và phân tích thành một màn hình dễ đọc để bạn nắm biến động chính mà không bị cuốn theo nhiễu ngắn hạn.",
    heroPrimary: "Xem thị trường",
    heroSecondary: "Đọc tin mới",
    latest: "Cập nhật mới nhất",
    viewAll: "Xem tất cả",
    news: "Tin tức",
    topicsTitle: "Khám phá chủ đề",
    explore: "Khám phá",
    editorPicks: "Lựa chọn của biên tập",
    beginnerEyebrow: "Bộ công cụ cho người mới",
    beginnerTitle: "Những nền tảng cần mở trước khi đọc thị trường",
    bulletinTitle: "Theo dõi những diễn biến đáng chú ý của thị trường crypto",
    bulletinText: "Đọc bài mới nhất về thị trường, phân tích và kiến thức trên CoinRadar.",
    bulletinAction: "Xem bài mới",
    readMinutes: "phút đọc",
    globeEyebrow: "Dữ liệu không biên giới",
    globeTitle: "Một góc nhìn toàn cầu cho thị trường luôn chuyển động",
    globeText: "CoinRadar kết nối giá, dòng tiền và tin tức từ nhiều khu vực để mỗi biến động được đặt đúng trong bối cảnh của nó.",
    globePoints: ["Nguồn tin được chọn lọc", "Dữ liệu thị trường cập nhật", "Bối cảnh rõ ràng, dễ đọc"]
  },
  "en-us": {
    heroEyebrow: "CoinRadar",
    heroTitle: "Read crypto markets with data and context",
    heroText: "CoinRadar brings prices, capital flows, explainers and analysis into one readable surface so readers can track important market moves without short-term noise.",
    heroPrimary: "View markets",
    heroSecondary: "Read latest",
    latest: "Latest updates",
    viewAll: "View all",
    news: "News",
    topicsTitle: "Explore topics",
    explore: "Explore",
    editorPicks: "Editor picks",
    beginnerEyebrow: "Beginner toolkit",
    beginnerTitle: "Foundations to keep open before reading markets",
    bulletinTitle: "Keep up with the crypto market",
    bulletinText: "Read the latest market coverage, analysis and explainers on CoinRadar.",
    bulletinAction: "Browse latest articles",
    readMinutes: "min read",
    globeEyebrow: "Borderless intelligence",
    globeTitle: "A global view of a market that never stops",
    globeText: "CoinRadar connects prices, capital flows and news across regions so every market move appears in the context that shaped it.",
    globePoints: ["Curated industry sources", "Current market data", "Clear, readable context"]
  }
} satisfies Record<Locale, Record<string, string | string[]>>;

const heroSignalCopy = {
  "vi-vn": [
    { label: "Giá realtime", text: "BTC, ETH, altcoin" },
    { label: "Bối cảnh", text: "Tin tức nối với dữ liệu" },
    { label: "Rủi ro", text: "Không ép tín hiệu mua bán" }
  ],
  "en-us": [
    { label: "Realtime prices", text: "BTC, ETH, altcoins" },
    { label: "Context", text: "News linked with data" },
    { label: "Risk", text: "No forced trading signal" }
  ]
} satisfies Record<Locale, Array<{ label: string; text: string }>>;

const topicCopy = {
  "vi-vn": [
    { title: "Bitcoin", text: "Cập nhật giá, phân tích on-chain và dữ liệu quan trọng.", mark: "B", path: "/articles" },
    { title: "Altcoin", text: "Xu hướng altcoin và các dự án nổi bật trên thị trường.", mark: "A", path: "/markets" },
    { title: "DeFi", text: "TVL, lending và các thay đổi trong hệ sinh thái DeFi.", mark: "D", path: "/knowledge" },
    { title: "On-chain", text: "Dòng tiền, ví lớn và hành vi của người tham gia thị trường.", mark: "O", path: "/analysis" },
    { title: "Pháp lý", text: "Quy định và chính sách tác động đến tài sản số.", mark: "P", path: "/articles" },
    { title: "Hướng dẫn", text: "Kiến thức nền tảng và hướng dẫn thực tế cho người mới.", mark: "H", path: "/knowledge" }
  ],
  "en-us": [
    { title: "Bitcoin", text: "Price updates, on-chain analysis and essential data.", mark: "B", path: "/articles" },
    { title: "Altcoins", text: "Altcoin trends and notable projects across the market.", mark: "A", path: "/markets" },
    { title: "DeFi", text: "TVL, lending and developments across DeFi ecosystems.", mark: "D", path: "/knowledge" },
    { title: "On-chain", text: "Capital flows, large wallets and market behavior.", mark: "O", path: "/analysis" },
    { title: "Regulation", text: "Policies and rules shaping digital assets.", mark: "R", path: "/articles" },
    { title: "Guides", text: "Practical foundations for people new to crypto.", mark: "G", path: "/knowledge" }
  ]
} satisfies Record<Locale, Array<{ title: string; text: string; mark: string; path: string }>>;

const beginnerCopy = {
  "vi-vn": [
    ["Hiểu cơ bản", "Nắm các khái niệm nền tảng trước khi đọc dữ liệu."],
    ["Ví an toàn", "Chọn ví phù hợp và bảo vệ thông tin khôi phục."],
    ["Đọc thị trường", "Hiểu bảng giá, biến động và các chỉ số chính."],
    ["Quản trị rủi ro", "Xây dựng nguyên tắc phân bổ vốn phù hợp."]
  ],
  "en-us": [
    ["Learn the basics", "Understand core concepts before reading market data."],
    ["Wallet safety", "Select a suitable wallet and protect recovery details."],
    ["Read the market", "Understand prices, moves and key indicators."],
    ["Manage risk", "Build sensible rules for allocating capital."]
  ]
} satisfies Record<Locale, string[][]>;

function href(locale: Locale, path: string) {
  return `/${locale}${path}`;
}

function articleHref(locale: Locale, article: ReaderArticle) {
  return article.livePath || href(locale, `/${article.slug}`);
}

function HeroSection({ locale }: { locale: Locale }) {
  return (
    <section className="relative overflow-hidden bg-[#FAFAF7]">
      <InlineMarketTicker coins={coreCoins.slice(0, 6)} locale={locale} />
      <div className="relative mx-auto grid max-w-[88rem] gap-8 px-5 py-8 md:py-10 lg:grid-cols-[minmax(22rem,0.76fr)_minmax(42rem,1fr)] lg:items-center xl:grid-cols-[minmax(24rem,0.72fr)_minmax(48rem,1fr)]">
        <FixedHeroIntro locale={locale} />
        <HeroPriceCard coin={coreCoins[0]} locale={locale} />
      </div>
    </section>
  );
}

function FixedHeroIntro({ locale }: { locale: Locale }) {
  const copy = homeCopy[locale];
  const signals = heroSignalCopy[locale];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A97900]">{copy.heroEyebrow}</p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] text-[#111111] md:text-[44px] xl:text-5xl">
        {copy.heroTitle}
      </h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-[#5F6673]">{copy.heroText}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#B88400] px-5 text-sm font-semibold text-white transition hover:bg-[#111111]" href={href(locale, "/markets")}>
          {copy.heroPrimary} <ArrowRight size={17} />
        </Link>
        <Link className="inline-flex h-12 items-center justify-center rounded-xl border border-[#E7DFCF] bg-white px-5 text-sm font-semibold text-[#111111] transition hover:bg-[#FFF6DD]" href={href(locale, "/articles")}>
          {copy.heroSecondary}
        </Link>
      </div>
      <div className="mt-8 max-w-xl rounded-2xl border border-[#111827] bg-[#0E1420] p-4 text-white shadow-[0_18px_46px_rgba(17,24,39,0.12)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#E5BE4B]/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#E5BE4B]">Quick brief</span>
          <span className="text-sm font-semibold">{locale === "vi-vn" ? "Đọc nhanh trước khi vào bài" : "Fast read before the article"}</span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {signals.map((signal) => (
            <div className="group rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/8 transition hover:bg-[#E5BE4B] hover:text-[#111827]" key={signal.label}>
              <span className="block text-[11px] font-semibold leading-4">{signal.label}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-white/58 transition group-hover:text-[#303642]">{signal.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LatestUpdates({ articles, locale }: { articles: ReaderArticle[]; locale: Locale }) {
  const copy = homeCopy[locale];
  return (
    <article className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_16px_44px_rgba(17,17,17,0.05)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-[#111111]">{copy.latest}</h2>
        <Link className="inline-flex items-center gap-1 text-xs font-semibold text-[#A97900]" href={href(locale, "/articles")}>
          {copy.viewAll} <ArrowRight size={14} />
        </Link>
      </div>
      <div className="space-y-4">
        {articles.slice(0, 4).map((article) => (
          <Link className="grid grid-cols-[3.6rem_4.8rem_minmax(0,1fr)] gap-3 text-sm transition hover:text-[#A97900]" href={articleHref(locale, article)} key={article.id}>
            <span className="text-[#6B7280]">{formatTime(article.publishedAt, locale)}</span>
            <span className="h-fit truncate rounded-md bg-[#F4E4B5] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#8A6500]">{article.primaryKeyword || copy.news}</span>
            <span className="line-clamp-2 font-semibold leading-5 text-[#111111]">{article.title}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}

function DashboardSection({ articles, locale }: { articles: ReaderArticle[]; locale: Locale }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,0.86fr)_18rem]">
      <LatestUpdates articles={articles} locale={locale} />
      <MarketPulse coins={coreCoins.slice(0, 4)} locale={locale} marketHref={href(locale, "/markets")} />
      <TopGainers coins={coreCoins} locale={locale} marketHref={href(locale, "/markets")} />
    </section>
  );
}

function TopicsSection({ locale }: { locale: Locale }) {
  const copy = homeCopy[locale];
  return (
    <section className="mx-auto max-w-7xl px-5 py-2">
      <h2 className="border-t border-[#E7DFCF] pt-5 text-sm font-semibold uppercase text-[#111111]">{copy.topicsTitle}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {topicCopy[locale].map((topic) => (
          <Link className="group rounded-2xl border border-[#E7DFCF] bg-white p-4 shadow-[0_14px_34px_rgba(17,17,17,0.04)] transition hover:-translate-y-0.5 hover:border-[#D5A319] hover:bg-[#FFFDF8]" href={href(locale, topic.path)} key={topic.title}>
            <span className="flex size-11 items-center justify-center rounded-full bg-[#FFF2CA] text-xl font-semibold text-[#B88400]">{topic.mark}</span>
            <h3 className="mt-4 text-sm font-semibold text-[#111111]">{topic.title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#5F6673]">{topic.text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#A97900]">
              {copy.explore} <ArrowRight className="transition group-hover:translate-x-0.5" size={14} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function GlobalMarketSection({ locale }: { locale: Locale }) {
  const copy = homeCopy[locale];
  const points = copy.globePoints as string[];

  return (
    <section className="relative scroll-mt-20 overflow-hidden border-y border-[#E7DFCF] bg-white md:scroll-mt-24">
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 lg:grid-cols-[minmax(32rem,1.12fr)_minmax(20rem,0.88fr)] lg:py-12">
        <div className="relative h-[22rem] min-w-0 sm:h-[27rem] lg:h-[31rem]">
          <CryptoSphere locale={locale} />
        </div>
        <div className="max-w-xl lg:justify-self-end">
          <p className="text-xs font-semibold uppercase text-[#A97900]">{copy.globeEyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#111111] md:text-4xl">{copy.globeTitle}</h2>
          <p className="mt-4 text-sm leading-7 text-[#5F6673] md:text-base">{copy.globeText}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {points.map((point) => (
              <div className="flex items-center gap-3 border-t border-[#EFE7D6] pt-3" key={point}>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[#F5D98A]">
                  <CheckCircle2 size={15} />
                </span>
                <span className="text-sm font-semibold text-[#303642]">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EditorPicks({ articles, locale }: { articles: ReaderArticle[]; locale: Locale }) {
  const copy = homeCopy[locale];
  const picks = articles.slice(0, 4);
  if (picks.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-5 flex items-center justify-between border-t border-[#E7DFCF] pt-5">
        <h2 className="text-sm font-semibold uppercase text-[#111111]">{copy.editorPicks}</h2>
        <Link className="inline-flex items-center gap-1 text-sm font-semibold text-[#A97900]" href={href(locale, "/articles")}>
          {copy.viewAll} <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {picks.map((article) => (
          <Link className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,0.04)] transition hover:-translate-y-0.5 hover:border-[#D5A319]" href={articleHref(locale, article)} key={article.id}>
            <p className="text-xs font-semibold uppercase text-[#8A6500]">{article.primaryKeyword || copy.news}</p>
            <h3 className="mt-4 line-clamp-3 text-lg font-semibold leading-6 text-[#111111]">{article.title}</h3>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#5F6673]">{article.excerpt}</p>
            <p className="mt-5 text-xs text-[#6B7280]">{formatDate(article.publishedAt, locale)} · {readingTime(article)} {copy.readMinutes}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BeginnerJourney({ locale }: { locale: Locale }) {
  const copy = homeCopy[locale];
  return (
    <section className="mx-auto max-w-7xl px-5 pb-8">
      <div className="grid overflow-hidden rounded-2xl border border-[#111827] bg-[#111827] text-white shadow-[0_22px_60px_rgba(17,24,39,0.14)] lg:grid-cols-[21rem_minmax(0,1fr)]">
        <header className="relative overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
          <div className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-[#D5A319]/20 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-[#F5D98A]">{copy.beginnerEyebrow}</p>
          <h2 className="relative mt-3 text-3xl font-semibold leading-tight">{copy.beginnerTitle}</h2>
        </header>
        <div className="grid gap-px bg-white/10 p-px sm:grid-cols-2 lg:grid-cols-4">
          {beginnerCopy[locale].map(([title, text], index) => {
            const icons = [BookOpenText, WalletCards, TrendingUp, ShieldCheck];
            const Icon = icons[index];
            return (
              <article className="group bg-[#111827] p-5 transition hover:bg-[#F5D98A]" key={title}>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-white/8 text-[#F5D98A] ring-1 ring-white/12 transition group-hover:bg-[#111827]">
                  <Icon size={21} />
                </span>
                <div className="mt-5">
                  <h3 className="text-sm font-semibold transition group-hover:text-[#111827]">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/62 transition group-hover:text-[#303642]">{text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Bulletin({ locale }: { locale: Locale }) {
  const copy = homeCopy[locale];
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10">
      <div className="grid gap-4 rounded-2xl bg-[#08090B] p-6 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-xl bg-[#D5A319] text-white shadow-[0_12px_30px_rgba(213,163,25,0.28)]"><Newspaper size={24} /></span>
          <div>
            <h2 className="text-xl font-semibold">{copy.bulletinTitle}</h2>
            <p className="mt-1 text-sm text-white/70">{copy.bulletinText}</p>
          </div>
        </div>
        <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#D5A319] px-5 text-sm font-semibold text-white transition hover:bg-[#B88400]" href={href(locale, "/articles")}>
          {copy.bulletinAction} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function formatTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function readingTime(article: ReaderArticle) {
  return Math.max(2, Math.ceil(`${article.title} ${article.excerpt} ${article.markdown}`.split(/\s+/).filter(Boolean).length / 220));
}

export async function ReaderHomeFeature({ locale }: { locale: Locale }) {
  let articles = getFallbackReaderArticles(locale);
  try {
    const apiArticles = await getReaderArticles(locale);
    articles = apiArticles.length ? apiArticles : getFallbackReaderArticles(locale);
  } catch {
    articles = getFallbackReaderArticles(locale);
  }

  return (
    <main className="bg-[#FAFAF7] font-sans text-[#111111]">
      <HomeMarketProvider coins={coreCoins}>
        <HeroSection locale={locale} />
        <GlobalMarketSection locale={locale} />
        <DashboardSection articles={articles} locale={locale} />
      </HomeMarketProvider>
      <TopicsSection locale={locale} />
      <EditorPicks articles={articles} locale={locale} />
      <BeginnerJourney locale={locale} />
      <Bulletin locale={locale} />
    </main>
  );
}
