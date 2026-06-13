import type { Locale } from "@cmsauto/contracts";
import {
  ArrowRight,
  Award,
  Bitcoin,
  BookOpen,
  Bookmark,
  Boxes,
  ChevronRight,
  CircleDot,
  Clock,
  FileText,
  Globe2,
  GraduationCap,
  LineChart,
  Mail,
  Network,
  Rocket,
  Scale,
  ShieldCheck,
  Star,
  Trophy
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { ReaderMarketTicker } from "@/components/reader/reader-market-ticker";
import type { KnowledgePageContent } from "./model";
import { getKnowledgePage } from "./adapter";

type LearningPath = {
  badge: string;
  description: string;
  duration: string;
  lessons: string;
  level: string;
  title: string;
};

type TopicCard = {
  count: string;
  color: string;
  icon: LucideIcon;
  title: string;
};

type GlossaryItem = {
  description: string;
  term: string;
};

type FeaturedArticle = {
  duration: string;
  level: string;
  slug: string;
  title: string;
};

type CollectionCard = {
  count: string;
  icon: LucideIcon;
  title: string;
};

const heroFeatures = [
  { description: "Học từ cơ bản đến nâng cao", icon: BookOpen, title: "Lộ trình rõ ràng" },
  { description: "Biên tập bởi đội ngũ chuyên môn", icon: ShieldCheck, title: "Nội dung đáng tin cậy" },
  { description: "Bám sát thị trường 24/7", icon: Award, title: "Cập nhật liên tục" }
];

const learningPaths: LearningPath[] = [
  {
    badge: "Dành cho người mới",
    description: "Hiểu đúng về blockchain, tiền mã hóa và cách thị trường vận hành.",
    duration: "2h 30m",
    lessons: "12 bài học",
    level: "01",
    title: "Crypto Cơ Bản"
  },
  {
    badge: "Trung cấp",
    description: "Phân tích kỹ thuật, quản trị rủi ro và chiến lược giao dịch hiệu quả.",
    duration: "4h 10m",
    lessons: "16 bài học",
    level: "02",
    title: "Đầu Tư & Giao Dịch"
  },
  {
    badge: "Nâng cao",
    description: "Khám phá DeFi, lending, AMM, derivatives và yield optimization.",
    duration: "6h 45m",
    lessons: "18 bài học",
    level: "03",
    title: "DeFi Toàn Diện"
  },
  {
    badge: "Nâng cao",
    description: "Đọc dữ liệu on-chain, theo dõi dòng tiền và hành vi của smart money.",
    duration: "5h 20m",
    lessons: "14 bài học",
    level: "04",
    title: "Phân Tích On-chain"
  }
];

const topicCards: TopicCard[] = [
  { color: "#64748B", count: "28 bài viết", icon: Boxes, title: "Blockchain" },
  { color: "#F7931A", count: "36 bài viết", icon: Bitcoin, title: "Bitcoin" },
  { color: "#6B7CFF", count: "42 bài viết", icon: Network, title: "Altcoin" },
  { color: "#3B82F6", count: "55 bài viết", icon: Globe2, title: "DeFi" },
  { color: "#7C3AED", count: "31 bài viết", icon: Rocket, title: "NFT & Gaming" },
  { color: "#2563EB", count: "29 bài viết", icon: CircleDot, title: "Web3" },
  { color: "#B58D07", count: "18 bài viết", icon: Scale, title: "Pháp lý" },
  { color: "#111827", count: "26 bài viết", icon: Star, title: "Kiến thức khác" }
];

const glossaryItems: GlossaryItem[] = [
  { description: "Chiến lược nắm giữ dài hạn bất chấp biến động ngắn hạn.", term: "HODL" },
  { description: "Nỗi sợ bỏ lỡ cơ hội, khiến nhà đầu tư mua theo cảm xúc.", term: "FOMO" },
  { description: "All Time High - Mức giá cao nhất mọi thời đại.", term: "ATH" },
  { description: "Decentralized Finance - Tài chính phi tập trung.", term: "DeFi" },
  { description: "Total Value Locked - Tổng giá trị bị khóa trong giao thức.", term: "TVL" }
];

const featuredArticles: FeaturedArticle[] = [
  { duration: "8 phút đọc", level: "Cơ bản", slug: "bitcoin-la-gi-huong-dan-chi-tiet-cho-nguoi-moi", title: "Bitcoin là gì? Hướng dẫn chi tiết cho người mới" },
  { duration: "12 phút đọc", level: "Trung cấp", slug: "phan-tich-ky-thuat-co-ban-ho-tro-khang-cu-va-xu-huong", title: "Phân tích kỹ thuật cơ bản: Hỗ trợ, kháng cự và xu hướng" },
  { duration: "10 phút đọc", level: "Trung cấp", slug: "defi-la-gi-tim-hieu-he-sinh-thai-defi-tu-a-den-z", title: "DeFi là gì? Tìm hiểu hệ sinh thái DeFi từ A đến Z" },
  { duration: "14 phút đọc", level: "Nâng cao", slug: "on-chain-la-gi-cach-doc-du-lieu-on-chain-hieu-qua", title: "On-chain là gì? Cách đọc dữ liệu on-chain hiệu quả" },
  { duration: "9 phút đọc", level: "Trung cấp", slug: "quan-tri-rui-ro-trong-crypto-7-nguyen-tac-vang", title: "Quản trị rủi ro trong crypto: 7 nguyên tắc vàng" }
];

const collectionCards: CollectionCard[] = [
  { count: "9 bài viết", icon: GraduationCap, title: "Chuỗi bài cho người mới" },
  { count: "15 bài viết", icon: LineChart, title: "Phân tích kỹ thuật A-Z" },
  { count: "22 bài viết", icon: Trophy, title: "DeFi từ cơ bản đến nâng cao" },
  { count: "12 bài viết", icon: Globe2, title: "Web3 & tương lai Internet" },
  { count: "30 bài viết", icon: BookOpen, title: "Thuật ngữ cần biết" }
];

export async function KnowledgeFeature({ locale }: { locale: Locale }) {
  try {
    const content = await getKnowledgePage(locale);

    if (!content.taxonomy.length || !content.lessons.length) {
      return <KnowledgeEmptyState content={content} />;
    }

    return <KnowledgePage locale={locale} />;
  } catch {
    return <KnowledgeErrorState locale={locale} />;
  }
}

function KnowledgePage({ locale }: { locale: Locale }) {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#111827]">
      <ReaderMarketTicker />

      <div className="mx-auto max-w-7xl px-5 py-10 md:py-12">
        <HeroSection />
        <LearningPathSection />
        <TopicSection />
        <ReferenceSection locale={locale} />
        <CollectionSection />
        <NewsletterSection />
      </div>
    </main>
  );
}

function SectionHeader({ title, action }: { action: string; title: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-[#111827]">{title}</h2>
      <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#A88412]" type="button">
        {action}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_36rem] lg:items-start">
      <div className="pt-2 md:pt-8">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#4B5563]">Kiến thức crypto</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.08] text-[#111827] md:text-5xl">
          Học crypto bài bản,
          <span className="block text-[#B58D07]">nắm vững thị trường.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-[#64748B]">
          Kiến thức đáng tin cậy, dễ hiểu và luôn cập nhật. Dành cho người mới bắt đầu và cả nhà đầu tư chuyên nghiệp.
        </p>

        <div className="mt-11 grid gap-5 md:grid-cols-3">
          {heroFeatures.map((feature) => (
            <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3" key={feature.title}>
              <span className="flex size-7 items-center justify-center rounded-md border border-[#C8A227] text-[#C8A227]">
                <feature.icon size={17} />
              </span>
              <div>
                <h3 className="text-sm font-black">{feature.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <article className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_44px_rgba(17,24,39,0.08)] md:p-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-black">Hành trình học của bạn</h2>
          <button className="inline-flex items-center gap-2 text-sm font-bold text-[#A88412]" type="button">
            Xem chi tiết <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[11rem_minmax(0,1fr)] md:items-center">
          <div
            aria-label="Hoàn thành 63 phần trăm"
            className="relative size-44 rounded-full"
            style={{ background: "conic-gradient(#B58D07 0 63%, #EEF0F2 63% 100%)" }}
          >
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center">
              <span className="text-4xl font-black">63%</span>
              <span className="mt-1 text-sm text-[#64748B]">Hoàn thành</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-[#94A3B8]">Tiếp tục học</p>
            <h3 className="mt-2 text-lg font-black">DeFi cơ bản: AMM và Yield Farming</h3>
            <div className="mt-5 h-2 rounded-full bg-[#E5E7EB]">
              <div className="h-2 w-[64%] rounded-full bg-[#B58D07]" />
            </div>
            <p className="mt-3 text-sm text-[#64748B]">Bài 5/8 · 15 phút còn lại</p>
            <button className="mt-5 rounded-lg bg-[#B58D07] px-5 py-3 text-sm font-black text-white transition hover:bg-[#C8A227]" type="button">
              Tiếp tục học
            </button>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 border-t border-[#E5E7EB] pt-5 text-center">
          {[
            ["12", "Bài đã học"],
            ["8", "Huy hiệu"],
            ["24h 30m", "Thời gian học"]
          ].map(([value, label]) => (
            <div className="border-r border-[#E5E7EB] last:border-r-0" key={label}>
              <p className="text-2xl font-black">{value}</p>
              <p className="mt-1 text-sm text-[#64748B]">{label}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function LearningPathSection() {
  return (
    <section className="mt-14">
      <SectionHeader action="Xem tất cả lộ trình" title="Lộ trình học tập" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {learningPaths.map((path) => (
          <article className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_14px_34px_rgba(17,24,39,0.05)]" key={path.title}>
            <div className="flex items-start justify-between gap-4">
              <span className="text-xl font-black text-[#B58D07]">{path.level}</span>
              <span className="rounded-full bg-[#F8E8B5] px-3 py-1 text-xs font-bold text-[#A88412]">{path.badge}</span>
            </div>
            <h3 className="mt-8 text-xl font-black">{path.title}</h3>
            <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[#64748B]">{path.description}</p>
            <div className="mt-8 flex items-center justify-between gap-4 text-sm text-[#64748B]">
              <span>{path.lessons} · {path.duration}</span>
              <ChevronRight size={19} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TopicSection() {
  return (
    <section className="mt-12">
      <SectionHeader action="Xem tất cả chủ đề" title="Chủ đề nổi bật" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {topicCards.map((topic) => (
          <article className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-6 text-center shadow-[0_14px_34px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:border-[#D6A300]/45 hover:shadow-[0_18px_40px_rgba(181,141,7,0.12)]" key={topic.title}>
            <span
              className="mx-auto flex size-12 items-center justify-center rounded-full border"
              style={{ backgroundColor: `${topic.color}14`, borderColor: `${topic.color}24`, color: topic.color }}
            >
              <topic.icon size={24} />
            </span>
            <h3 className="mt-4 text-sm font-black">{topic.title}</h3>
            <p className="mt-2 text-sm text-[#64748B]">{topic.count}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReferenceSection({ locale }: { locale: Locale }) {
  return (
    <section className="mt-10 grid gap-5 lg:grid-cols-2">
      <article className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.08em]">Từ điển crypto</h2>
            <p className="mt-4 text-sm text-[#64748B]">Giải thích các thuật ngữ quan trọng trong thị trường tiền mã hóa.</p>
          </div>
          <button className="inline-flex items-center gap-2 text-sm font-bold text-[#A88412]" type="button">
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-7 divide-y divide-[#E5E7EB]">
          {glossaryItems.map((item) => (
            <article className="grid grid-cols-[2.25rem_minmax(0,1fr)_1.25rem] items-center gap-4 py-4" key={item.term}>
              <span className="flex size-8 items-center justify-center rounded-md border border-[#E5E7EB] text-[#64748B]">
                <FileText size={16} />
              </span>
              <div>
                <h3 className="font-black">{item.term}</h3>
                <p className="mt-1 text-sm text-[#64748B]">{item.description}</p>
              </div>
              <ChevronRight className="text-[#64748B]" size={18} />
            </article>
          ))}
        </div>
      </article>

      <article className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-black uppercase tracking-[0.08em]">Bài viết nổi bật</h2>
          <button className="inline-flex items-center gap-2 text-sm font-bold text-[#A88412]" type="button">
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-7 divide-y divide-[#E5E7EB]">
          {featuredArticles.map((article, index) => (
            <article className="grid grid-cols-[2.25rem_minmax(0,1fr)_1.5rem] gap-4 py-4" key={article.title}>
              <span className="text-xl font-black text-[#B58D07]">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className="font-black leading-6 transition hover:text-[#A88412] focus:outline-none focus:ring-2 focus:ring-[#C8A227] focus:ring-offset-2"
                    href={`/${locale}/${article.slug}`}
                  >
                    {article.title}
                  </Link>
                  <span className="rounded-full bg-[#F8E8B5] px-2.5 py-1 text-xs font-bold text-[#A88412]">{article.level}</span>
                </div>
                <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#64748B]">
                  <Clock size={14} /> {article.duration}
                </p>
              </div>
              <Bookmark className="mt-1 text-[#64748B]" size={19} />
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function CollectionSection() {
  return (
    <section className="mt-10 rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <SectionHeader action="Xem tất cả" title="Bộ sưu tập học tập" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {collectionCards.map((collection) => (
          <article className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 rounded-lg border border-[#E5E7EB] bg-white p-4" key={collection.title}>
            <span className="flex size-11 items-center justify-center rounded-lg bg-[#FFF6DB] text-[#B58D07]">
              <collection.icon size={22} />
            </span>
            <div>
              <h3 className="font-black leading-5">{collection.title}</h3>
              <p className="mt-2 text-sm text-[#64748B]">{collection.count}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="mt-10 rounded-lg border border-[#EBD9A6] bg-[linear-gradient(90deg,#FFF8E4,#FFFFFF_52%,#FFF4CE)] p-6 shadow-[0_14px_34px_rgba(168,132,18,0.08)] md:p-8">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_38rem] md:items-center">
        <div className="flex items-center gap-5">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-[#B58D07] text-white shadow-[0_14px_28px_rgba(181,141,7,0.25)]">
            <Mail size={42} />
          </span>
          <div>
            <h2 className="text-2xl font-black">Không bỏ lỡ kiến thức mới</h2>
            <p className="mt-3 text-sm leading-6 text-[#64748B]">Nhận bài viết, hướng dẫn và tài liệu chất lượng hằng tuần từ CoinRadar.</p>
          </div>
        </div>

        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <label className="sr-only" htmlFor="knowledge-newsletter-email">Email</label>
          <input
            className="h-12 rounded-lg border border-[#E5E7EB] bg-white px-5 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#C8A227]"
            id="knowledge-newsletter-email"
            placeholder="Nhập email của bạn"
            type="email"
          />
          <button className="h-12 rounded-lg bg-[#B58D07] px-5 text-sm font-black text-white transition hover:bg-[#C8A227]" type="submit">
            Đăng ký ngay
          </button>
        </form>
      </div>
    </section>
  );
}

export function KnowledgeLoadingState() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-56 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="mt-5 grid gap-5 lg:grid-cols-4">
          <div className="h-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
        </div>
      </div>
    </main>
  );
}

function KnowledgeEmptyState({ content }: { content: KnowledgePageContent }) {
  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#A88412]">{content.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black">{content.emptyTitle}</h1>
        <p className="mt-3 leading-7 text-[#4B5563]">{content.emptyDescription}</p>
      </section>
    </main>
  );
}

function KnowledgeErrorState({ locale }: { locale: Locale }) {
  const isVietnamese = locale === "vi-vn";

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#f3c6c6] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#c2410c]">Knowledge</p>
        <h1 className="mt-2 text-2xl font-black">
          {isVietnamese ? "Không tải được trang kiến thức" : "Could not load knowledge"}
        </h1>
        <p className="mt-3 leading-7 text-[#4B5563]">
          {isVietnamese
            ? "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/knowledge."
            : "Please try again later or check the reader/knowledge adapter."}
        </p>
      </section>
    </main>
  );
}
