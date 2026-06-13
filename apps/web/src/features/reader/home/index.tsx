import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BookOpenText, Mail, ShieldCheck, TrendingUp, WalletCards } from "lucide-react";
import Link from "next/link";

import { getReaderArticles } from "../adapter";
import type { ReaderArticle } from "../model";
import { HeroArticleCarousel, HeroPriceCard, InlineMarketTicker, MarketPulse, TopGainers, type LiveCoin } from "./home-live-market";

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

const fallbackFeature: FeatureArticle = {
  title: "Bitcoin vượt $107K: Dòng tiền ETF và kỳ vọng cắt giảm lãi suất",
  excerpt:
    "Dòng tiền tổ chức tiếp tục chảy mạnh vào các quỹ ETF Bitcoin spot, trong khi dữ liệu lạm phát hạ nhiệt làm gia tăng kỳ vọng Fed sớm nới lỏng chính sách.",
  href: "/analysis",
  tag: "Tin nổi bật"
};

const latestUpdates = [
  ["10:58", "Thị trường", "Bitcoin vượt vùng kháng cự quan trọng, thanh lý vị thế Short tăng cao trong 24 giờ"],
  ["09:42", "ETF", "ETF Bitcoin spot ghi nhận dòng tiền ròng dương sau chuỗi phiên trầm lắng"],
  ["08:15", "Vĩ mô", "CPI Mỹ hạ nhiệt, kỳ vọng cắt giảm lãi suất tăng trong nhóm tài sản rủi ro"],
  ["07:30", "DeFi", "TVL DeFi phục hồi nhẹ, dòng tiền quay lại các giao thức lending"]
];

const topics = [
  ["Bitcoin", "Cập nhật giá, phân tích on-chain và dữ liệu quan trọng.", "₿"],
  ["Altcoin", "Xu hướng altcoin, chỉ số mùa altcoin và các dự án nổi bật.", "◇"],
  ["DeFi", "TVL, yield, airdrop và các cơ hội trong hệ sinh thái DeFi.", "▱"],
  ["On-chain", "Dữ liệu on-chain, dòng tiền cá voi và hành vi nhà đầu tư.", "⬡"],
  ["Pháp lý", "Quy định, chính sách và tác động đến thị trường.", "▣"],
  ["Hướng dẫn", "Kiến thức nền tảng, hướng dẫn đầu tư cho người mới.", "□"]
];

const editorPicks = [
  ["Phân tích", "On-chain tuần qua: Dòng tiền lớn đang dịch chuyển sang đâu?", "Phân tích dữ liệu on-chain, ví cá voi và xu hướng tích lũy mới nhất.", "/analysis"],
  ["Kiến thức", "Halving Bitcoin là gì? Tác động đến giá BTC ra sao?", "Giải thích cơ chế halving và những gì lịch sử thị trường thường ghi nhận.", "/knowledge"],
  ["Thị trường", "5 altcoin có thể hưởng lợi khi Bitcoin tăng giá", "Danh sách và luận điểm ngắn gọn để theo dõi trong giai đoạn mới.", "/markets"],
  ["Hướng dẫn", "Cách bảo mật ví crypto cho người mới", "Checklist bảo mật ví, seed phrase và các lỗi thường gặp.", "/knowledge"]
];

const beginnerSteps = [
  ["01", "Hiểu cơ bản", "Nắm các khái niệm nền tảng trong 15 phút."],
  ["02", "Chọn ví an toàn", "Chọn ví phù hợp và cách bảo mật."],
  ["03", "Đọc dữ liệu thị trường", "Cách đọc bảng giá, chỉ số và on-chain."],
  ["04", "Quản trị rủi ro", "Nguyên tắc phân bổ vốn và quản trị rủi ro."]
];

function href(locale: Locale, path: string) {
  return `/${locale}${path}`;
}

function articleHref(locale: Locale, article: ReaderArticle) {
  return article.livePath || href(locale, `/articles/${article.slug}`);
}

function mapHeroSlides(locale: Locale, articles: ReaderArticle[]): FeatureArticle[] {
  const slides = articles.slice(0, 5).map((article) => ({
    title: article.title,
    excerpt: article.excerpt || fallbackFeature.excerpt,
    href: articleHref(locale, article),
    tag: article.primaryKeyword || fallbackFeature.tag
  }));

  return slides.length ? slides : [{ ...fallbackFeature, href: href(locale, fallbackFeature.href) }];
}

function HeroSection({ slides, locale }: { slides: FeatureArticle[]; locale: Locale }) {
  return (
    <section className="relative overflow-hidden bg-[#FAFAF7]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(213,163,25,0.14),transparent_32%),radial-gradient(circle_at_86%_26%,rgba(213,163,25,0.1),transparent_30%)]" />
      <InlineMarketTicker coins={coreCoins.slice(0, 6)} />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-10 md:py-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(26rem,0.9fr)] lg:items-center">
        <HeroArticleCarousel marketHref={href(locale, "/markets")} slides={slides} />
        <HeroPriceCard coin={coreCoins[0]} />
      </div>
    </section>
  );
}

function LatestUpdates({ locale }: { locale: Locale }) {
  return (
    <article className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_16px_44px_rgba(17,17,17,0.05)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#111111]">Cập nhật mới nhất</h2>
        <Link className="inline-flex items-center gap-1 text-xs font-semibold text-[#A97900]" href={href(locale, "/articles")}>
          Xem tất cả <ArrowRight size={14} />
        </Link>
      </div>
      <div className="space-y-4">
        {latestUpdates.map(([time, tag, title]) => (
          <Link className="grid grid-cols-[3.4rem_4.3rem_minmax(0,1fr)] gap-3 text-sm transition hover:text-[#A97900]" href={href(locale, "/articles")} key={`${time}-${title}`}>
            <span className="text-[#6B7280]">{time}</span>
            <span className="h-fit rounded-md bg-[#F4E4B5] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#8A6500]">{tag}</span>
            <span className="font-semibold leading-5 text-[#111111]">{title}</span>
          </Link>
        ))}
      </div>
    </article>
  );
}

function DashboardSection({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-5 py-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,0.86fr)_18rem]">
      <LatestUpdates locale={locale} />
      <MarketPulse coins={coreCoins.slice(0, 4)} marketHref={href(locale, "/markets")} />
      <TopGainers coins={coreCoins} marketHref={href(locale, "/markets")} />
    </section>
  );
}

function TopicsSection({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-2">
      <h2 className="border-t border-[#E7DFCF] pt-5 text-sm font-semibold uppercase tracking-[0.08em] text-[#111111]">Khám phá chủ đề</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {topics.map(([title, text, mark]) => (
          <Link className="group rounded-2xl border border-[#E7DFCF] bg-white p-4 shadow-[0_14px_34px_rgba(17,17,17,0.04)] transition hover:-translate-y-0.5 hover:border-[#D5A319] hover:bg-[#FFFDF8]" href={href(locale, title === "Thị trường" ? "/markets" : title === "Hướng dẫn" ? "/knowledge" : "/articles")} key={title}>
            <span className="flex size-11 items-center justify-center rounded-full bg-[#FFF2CA] text-xl font-semibold text-[#B88400]">{mark}</span>
            <h3 className="mt-4 text-sm font-semibold text-[#111111]">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-[#5F6673]">{text}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#A97900]">
              Khám phá <ArrowRight className="transition group-hover:translate-x-0.5" size={14} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EditorPicks({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-5 flex items-center justify-between border-t border-[#E7DFCF] pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#111111]">Lựa chọn của biên tập</h2>
        <Link className="inline-flex items-center gap-1 text-sm font-semibold text-[#A97900]" href={href(locale, "/articles")}>
          Xem tất cả <ArrowRight size={15} />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {editorPicks.map(([tag, title, text, path]) => (
          <Link className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,0.04)] transition hover:-translate-y-0.5 hover:border-[#D5A319]" href={href(locale, path)} key={title}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8A6500]">{tag}</p>
            <h3 className="mt-4 text-lg font-semibold leading-6 text-[#111111]">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#5F6673]">{text}</p>
            <p className="mt-5 text-xs text-[#6B7280]">11/06/2026 · 8 phút đọc</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function BeginnerJourney() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-8">
      <div className="rounded-2xl border border-[#E7D094] bg-[linear-gradient(115deg,#FFFDF8,#FFF2CA)] p-5 shadow-[0_16px_44px_rgba(184,132,0,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A97900]">Hành trình cho người mới</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#111111]">4 bước để bắt đầu với crypto</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {beginnerSteps.map(([step, title, text], index) => {
            const icons = [BookOpenText, WalletCards, TrendingUp, ShieldCheck];
            const Icon = icons[index];

            return (
              <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 rounded-xl bg-white/65 p-4" key={step}>
                <span className="flex size-12 items-center justify-center rounded-full border border-[#E7D094] bg-white text-[#B88400]">
                  <Icon size={22} />
                </span>
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

function Newsletter() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10">
      <div className="grid gap-4 rounded-2xl bg-[#08090B] p-6 text-white md:grid-cols-[minmax(0,1fr)_24rem] md:items-center">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-xl bg-[#D5A319] text-white shadow-[0_12px_30px_rgba(213,163,25,0.28)]">
            <Mail size={24} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">Không bỏ lỡ cơ hội trong thị trường crypto</h2>
            <p className="mt-1 text-sm text-white/70">Bản tin CoinRadar gửi mỗi sáng: thị trường, phân tích và cơ hội đáng chú ý.</p>
          </div>
        </div>
        <form className="flex gap-2">
          <input className="h-12 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#D5A319]" placeholder="Nhập email của bạn" type="email" />
          <button className="h-12 rounded-xl bg-[#D5A319] px-5 text-sm font-semibold text-white transition hover:bg-[#B88400]" type="button">
            Đăng ký ngay
          </button>
        </form>
      </div>
    </section>
  );
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
      <HeroSection slides={heroSlides} locale={locale} />
      <DashboardSection locale={locale} />
      <TopicsSection locale={locale} />
      <EditorPicks locale={locale} />
      <BeginnerJourney />
      <Newsletter />
    </main>
  );
}
