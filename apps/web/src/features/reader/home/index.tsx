import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BookOpenText, Mail, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";

import { getReaderArticles } from "../adapter";
import type { ReaderArticle } from "../model";
import {
  HeroArticleCarousel,
  HeroPriceCard,
  HomeMarketProvider,
  InlineMarketTicker,
  MarketPulse,
  TopGainers,
  type LiveCoin
} from "./home-live-market";

type FeatureArticle = {
  title: string;
  excerpt: string;
  href: string;
  tag: string;
};

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
    fallbackTitle: "Theo dõi thị trường crypto với dữ liệu và bối cảnh rõ ràng",
    fallbackExcerpt: "Cập nhật giá, kiến thức và phân tích mới nhất từ CoinRadar.",
    featured: "Tin nổi bật",
    latest: "Cập nhật mới nhất",
    viewAll: "Xem tất cả",
    news: "Tin tức",
    topicsTitle: "Khám phá chủ đề",
    explore: "Khám phá",
    editorPicks: "Lựa chọn của biên tập",
    beginnerEyebrow: "Hành trình cho người mới",
    beginnerTitle: "4 bước để bắt đầu với crypto",
    bulletinTitle: "Theo dõi những diễn biến đáng chú ý của thị trường crypto",
    bulletinText: "Đọc bài mới nhất về thị trường, phân tích và kiến thức trên CoinRadar.",
    bulletinAction: "Xem bài mới",
    readMinutes: "phút đọc",
    noUpdates: "Chưa có bài viết mới."
  },
  "en-us": {
    fallbackTitle: "Follow crypto markets with clear data and context",
    fallbackExcerpt: "Get the latest market updates, explainers and analysis from CoinRadar.",
    featured: "Featured",
    latest: "Latest updates",
    viewAll: "View all",
    news: "News",
    topicsTitle: "Explore topics",
    explore: "Explore",
    editorPicks: "Editor picks",
    beginnerEyebrow: "Beginner journey",
    beginnerTitle: "Four steps to get started with crypto",
    bulletinTitle: "Keep up with the crypto market",
    bulletinText: "Read the latest market coverage, analysis and explainers on CoinRadar.",
    bulletinAction: "Browse latest articles",
    readMinutes: "min read",
    noUpdates: "No new articles yet."
  }
} satisfies Record<Locale, Record<string, string>>;

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
    ["01", "Hiểu cơ bản", "Nắm các khái niệm nền tảng trước khi đọc dữ liệu."],
    ["02", "Chọn ví an toàn", "Chọn ví phù hợp và bảo vệ thông tin khôi phục."],
    ["03", "Đọc thị trường", "Hiểu bảng giá, biến động và các chỉ số chính."],
    ["04", "Quản trị rủi ro", "Xây dựng nguyên tắc phân bổ vốn phù hợp."]
  ],
  "en-us": [
    ["01", "Learn the basics", "Understand core concepts before reading market data."],
    ["02", "Choose a wallet", "Select a suitable wallet and protect recovery details."],
    ["03", "Read the market", "Understand prices, moves and key indicators."],
    ["04", "Manage risk", "Build sensible rules for allocating capital."]
  ]
} satisfies Record<Locale, string[][]>;

function href(locale: Locale, path: string) {
  return `/${locale}${path}`;
}

function articleHref(locale: Locale, article: ReaderArticle) {
  return article.livePath || href(locale, `/${article.slug}`);
}

function mapHeroSlides(locale: Locale, articles: ReaderArticle[]): FeatureArticle[] {
  const copy = homeCopy[locale];
  const slides = articles.slice(0, 5).map((article) => ({
    title: article.title,
    excerpt: article.excerpt || copy.fallbackExcerpt,
    href: articleHref(locale, article),
    tag: article.primaryKeyword || copy.featured
  }));

  return slides.length
    ? slides
    : [{ title: copy.fallbackTitle, excerpt: copy.fallbackExcerpt, href: href(locale, "/articles"), tag: copy.featured }];
}

function HeroSection({ slides, locale }: { slides: FeatureArticle[]; locale: Locale }) {
  return (
    <section className="relative overflow-hidden bg-[#FAFAF7]">
      <InlineMarketTicker coins={coreCoins.slice(0, 6)} locale={locale} />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-10 md:py-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(26rem,0.9fr)] lg:items-center">
        <HeroArticleCarousel locale={locale} marketHref={href(locale, "/markets")} slides={slides} />
        <HeroPriceCard coin={coreCoins[0]} locale={locale} />
      </div>
    </section>
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
        {articles.length === 0 ? <p className="text-sm text-[#6B7280]">{copy.noUpdates}</p> : null}
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
      <div className="rounded-2xl border border-[#E7D094] bg-[#FFF9E8] p-5 shadow-[0_16px_44px_rgba(184,132,0,0.08)]">
        <p className="text-xs font-semibold uppercase text-[#A97900]">{copy.beginnerEyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#111111]">{copy.beginnerTitle}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {beginnerCopy[locale].map(([step, title, text], index) => {
            const icons = [BookOpenText, WalletCards, TrendingUp, ShieldCheck];
            const Icon = icons[index];
            return (
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-xl bg-white p-4" key={step}>
                <span className="flex size-12 items-center justify-center rounded-full border border-[#E7D094] bg-white text-[#B88400]"><Icon size={22} /></span>
                <div>
                  <p className="text-xs font-semibold text-[#B88400]">{step}</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#111111]">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#5F6673]">{text}</p>
                </div>
              </div>
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
          <span className="flex size-14 items-center justify-center rounded-xl bg-[#D5A319] text-white shadow-[0_12px_30px_rgba(213,163,25,0.28)]"><Mail size={24} /></span>
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
  let articles: ReaderArticle[] = [];
  try {
    articles = await getReaderArticles(locale);
  } catch {
    articles = [];
  }

  const heroSlides = mapHeroSlides(locale, articles);
  return (
    <main className="bg-[#FAFAF7] font-sans text-[#111111]">
      <HomeMarketProvider coins={coreCoins}>
        <HeroSection locale={locale} slides={heroSlides} />
        <DashboardSection articles={articles} locale={locale} />
      </HomeMarketProvider>
      <TopicsSection locale={locale} />
      <EditorPicks articles={articles} locale={locale} />
      <BeginnerJourney locale={locale} />
      <Bulletin locale={locale} />
    </main>
  );
}
