import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BookOpenText, Clock3, Flame, LineChart, PenLine, UserRound } from "lucide-react";
import Link from "next/link";

import { getReaderArticles } from "../adapter";
import type { ReaderArticle } from "../model";
import { HomeIntroSection, HomeVisionSection } from "./brand-sections";
import { HomeTradeSection } from "./home-trade-section";
import { QuickMarketWatch } from "./quick-market-watch";
import { hotPosts, type SidebarPost } from "./mock";

type FeatureArticle = {
  title: string;
  excerpt: string;
  href: string;
  author: string;
  meta: string;
};

const fallbackFeatured: FeatureArticle = {
  title: "Bitcoin vượt $107,000, tổ chức lớn tiếp tục tích lũy trước chu kỳ mới",
  excerpt: "Các quỹ ETF Bitcoin spot ghi nhận dòng tiền vào mạnh, trong khi nhà đầu tư cá nhân cũng đẩy mạnh theo dõi vùng giá quan trọng.",
  href: "/analysis",
  author: "Nguyễn Minh Tuấn",
  meta: "2 giờ trước"
};

const knowledgeStories = [
  {
    title: "Bitcoin Halving tác động đến nguồn cung BTC và giá Bitcoin như thế nào?",
    excerpt: "Giải thích chu kỳ Halving, cơ chế giảm phát hành và cách nhà đầu tư Việt theo dõi các giai đoạn trước, trong và sau sự kiện.",
    motif: "HALVING",
    tone: "from-[#0F1115] via-[#2B2413] to-[#C8A227]"
  },
  {
    title: "Tổng quan về Bitcoin: kiến thức nền tảng trước khi đọc biểu đồ",
    excerpt: "Nắm cách mạng lưới vận hành, vai trò miner và những yếu tố thường ảnh hưởng đến dòng tiền.",
    motif: "BTC",
    tone: "from-[#111827] via-[#2B2413] to-[#C8A227]"
  },
  {
    title: "Whitepaper Crypto là gì? Cách đọc trước khi đánh giá dự án",
    excerpt: "Nhìn nhanh tokenomics, roadmap, đội ngũ và những tín hiệu cần kiểm chứng.",
    motif: "DOC",
    tone: "from-[#111827] via-[#2B2413] to-[#C8A227]"
  }
];

const marketStories = [
  {
    title: "Dòng tiền ETF và nhịp BTC trong phiên Mỹ",
    metric: "+3.2%",
    note: "Biến động nổi bật"
  },
  {
    title: "Nhóm Layer-1 phục hồi sau vùng tích lũy ngắn",
    metric: "6 coin",
    note: "Đang được theo dõi"
  },
  {
    title: "Stablecoin giữ thanh khoản cao ở các sàn lớn",
    metric: "24/7",
    note: "Radar thị trường"
  }
];

const categoryTeasers = [
  {
    label: "Kiến thức",
    href: "/knowledge",
    icon: BookOpenText,
    title: "Nền tảng để đọc thị trường",
    text: "Giải thích thuật ngữ, case study, ETF, miner và các khái niệm giúp bạn hiểu bối cảnh trước khi ra quyết định."
  },
  {
    label: "Thị trường",
    href: "/markets",
    icon: LineChart,
    title: "Theo dõi nhịp giá có chọn lọc",
    text: "Tập trung vào coin chính, biến động đáng chú ý và các tín hiệu giúp bạn không bị nhiễu bởi quá nhiều con số."
  },
  {
    label: "Phân tích",
    href: "/analysis",
    icon: PenLine,
    title: "Góc nhìn sâu hơn dữ liệu",
    text: "Kết hợp on-chain, macro và dòng tiền để đọc vì sao một biến động giá có thể quan trọng."
  }
];

function href(locale: Locale, path: string) {
  return `/${locale}${path}`;
}

function formatPublishedTime(value?: string) {
  if (!value) {
    return fallbackFeatured.meta;
  }

  const publishedAt = new Date(value);
  if (Number.isNaN(publishedAt.getTime())) {
    return fallbackFeatured.meta;
  }

  return publishedAt.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function mapFeaturedArticle(locale: Locale, articles: ReaderArticle[]): FeatureArticle {
  const article = articles[0];
  if (!article) {
    return {
      ...fallbackFeatured,
      href: href(locale, fallbackFeatured.href)
    };
  }

  return {
    title: article.title,
    excerpt: article.excerpt || fallbackFeatured.excerpt,
    href: article.livePath || href(locale, `/articles/${article.slug}`),
    author: article.authorName || "CoinRadar Editorial",
    meta: formatPublishedTime(article.publishedAt)
  };
}

function mapHotPosts(articles: ReaderArticle[]): SidebarPost[] {
  if (articles.length < 4) {
    return hotPosts;
  }

  return articles.slice(0, 4).map((article, index) => ({
    title: article.title,
    meta: `${article.primaryKeyword || (index % 2 === 0 ? "Phân tích" : "Kiến thức")} · ${formatPublishedTime(article.publishedAt)}`
  }));
}

function FeatureSpotlight({ article }: { article: FeatureArticle }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_18px_44px_rgba(17,24,39,0.06)]">
      <div className="relative overflow-hidden bg-[#0F1115] px-6 py-7 text-white md:px-8 md:py-9">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_60%_35%,rgba(200,162,39,0.24),transparent_48%)]" />
        <span className="relative inline-flex rounded-lg border border-[#F5E7B3]/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#F5E7B3]">
          Tiêu điểm
        </span>
        <p className="relative mt-7 text-sm font-normal text-white/62">Thị trường · Phân tích</p>
        <h2 className="relative mt-3 max-w-4xl text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          {article.title}
        </h2>
        <div className="relative mt-5 flex flex-wrap gap-4 text-sm text-white/64">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={16} />
            {article.meta}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound size={16} />
            {article.author}
          </span>
          <span>5 phút đọc</span>
        </div>
      </div>
      <div className="grid gap-5 px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <p className="text-sm leading-7 text-[#4B5563] md:text-base">{article.excerpt}</p>
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#C8A227] px-6 text-sm font-bold text-[#0F1115] transition hover:bg-[#0F1115] hover:text-white"
          href={article.href}
        >
          Đọc đầy đủ <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}

function HotNewsPanel({ posts, locale }: { posts: SidebarPost[]; locale: Locale }) {
  return (
    <aside className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_18px_44px_rgba(17,24,39,0.06)]">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-[#111827]">
          <Flame className="text-[#C8A227]" size={20} />
          Tin tức nổi bật
        </h2>
        <Link className="text-sm font-medium text-[#A88412] transition hover:text-[#111827]" href={href(locale, "/articles")}>
          Tất cả
        </Link>
      </div>
      <div role="list">
        {posts.map((post, index) => (
          <Link
            className="grid grid-cols-[2.6rem_minmax(0,1fr)] gap-3 border-b border-[#E5E7EB] px-5 py-4 transition last:border-b-0 hover:bg-[#FAFAF7]"
            href={href(locale, "/articles")}
            key={post.title}
            role="listitem"
          >
            <span className="pt-1 text-2xl font-semibold leading-none text-[#C8A227]">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <span className="line-clamp-2 text-sm font-medium leading-6 text-[#111827] md:text-base">{post.title}</span>
              <span className="mt-2 block text-sm text-[#4B5563]">{post.meta}</span>
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

function ArticleFocusSection({ article, posts, locale }: { article: FeatureArticle; posts: SidebarPost[]; locale: Locale }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-5 px-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <FeatureSpotlight article={article} />
      <HotNewsPanel locale={locale} posts={posts} />
    </section>
  );
}

function KnowledgeCategory({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-7xl px-5">
      <div className="mb-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#A88412]">Kiến thức</p>
        <h2 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight tracking-normal text-[#111827] md:text-3xl">
          Góc nhìn thị trường, xu hướng và chiến lược đầu tư Bitcoin
        </h2>
        <p className="mt-3 max-w-5xl text-sm leading-7 text-[#4B5563] md:text-base">
          Theo dõi các case study, phân tích ETF, miner, regulation và biến động thị trường crypto theo góc nhìn dễ hiểu cho nhà đầu tư cá nhân.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Link
          className="group overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_34px_rgba(17,24,39,0.05)] transition hover:-translate-y-0.5 hover:border-[#C8A227]"
          href={href(locale, "/knowledge")}
        >
          <div className={`relative min-h-64 overflow-hidden bg-gradient-to-br ${knowledgeStories[0].tone} p-6 text-white`}>
            <div className="absolute -right-12 -top-12 size-44 rounded-full border border-white/20 bg-white/10" />
            <div className="absolute bottom-6 left-6 text-5xl font-black tracking-tight text-white/18">{knowledgeStories[0].motif}</div>
            <div className="absolute right-8 top-8 flex size-24 items-center justify-center rounded-full border border-[#F5E7B3]/45 bg-[#C8A227]/18 text-4xl font-black text-[#F5E7B3]">
              ₿
            </div>
          </div>
          <div className="p-5">
            <h3 className="text-xl font-semibold leading-7 text-[#111827]">{knowledgeStories[0].title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#4B5563]">{knowledgeStories[0].excerpt}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#A88412]">
              Đọc kiến thức <ArrowRight className="transition group-hover:translate-x-0.5" size={16} />
            </span>
          </div>
        </Link>

        <div className="grid gap-4">
          {knowledgeStories.slice(1).map((story) => (
            <Link
              className={`group relative min-h-48 overflow-hidden rounded-lg border border-[#E5E7EB] bg-gradient-to-br ${story.tone} p-5 text-white shadow-[0_14px_34px_rgba(17,24,39,0.08)] transition hover:-translate-y-0.5`}
              href={href(locale, "/knowledge")}
              key={story.title}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(255,255,255,0.22),transparent_30%)]" />
              <div className="absolute -bottom-12 -right-8 text-8xl font-black text-white/10">{story.motif}</div>
              <div className="relative">
                <h3 className="max-w-xl text-xl font-semibold leading-7">{story.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/78">{story.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#F5E7B3]">
                  Xem thêm <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketCategory({ locale }: { locale: Locale }) {
  return (
    <section className="mx-auto max-w-7xl px-5">
      <div className="grid gap-5 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)] lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#A88412]">Thị trường</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#111827] md:text-3xl">Nhịp giá, dòng tiền và tín hiệu</h2>
          <p className="mt-3 text-sm leading-7 text-[#4B5563]">
            Một khu theo dõi nhanh để bạn nhìn thấy nhóm tài sản nổi bật, thay đổi đáng chú ý và các mốc cần mở biểu đồ sâu hơn.
          </p>
          <Link className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#A88412]" href={href(locale, "/markets")}>
            Vào thị trường <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {marketStories.map((item, index) => (
            <Link
              className={`rounded-lg border p-4 transition hover:-translate-y-0.5 ${
                index === 0 ? "border-[#C8A227] bg-[#FAFAF7]" : "border-[#E5E7EB] bg-[#F5F5F2]"
              }`}
              href={href(locale, "/markets")}
              key={item.title}
            >
              <span className="text-2xl font-semibold text-[#A88412]">{item.metric}</span>
              <h3 className="mt-3 text-sm font-medium leading-6 text-[#111827]">{item.title}</h3>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4B5563]">{item.note}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalysisCategory({ locale }: { locale: Locale }) {
  const cards = [
    {
      title: "Dự báo giá Bitcoin năm 2026",
      text: "4 kịch bản $40,000-$150,000 theo vĩ mô, ETF & Halving"
    },
    {
      title: "Dự báo giá Ethereum (ETH) 2026",
      text: "Những yếu tố có thể thay đổi cuộc chơi"
    },
    {
      title: "Dự báo giá Solana năm 2026",
      text: "Kịch bản tăng trưởng và rủi ro"
    },
    {
      title: "Dự báo giá AVAX 2026",
      text: "Xu hướng, vùng hỗ trợ/kháng cự & 3 kịch bản trade"
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A88412]">Phân tích</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-medium leading-tight text-[#111827] md:text-3xl">Theo dõi nhanh dữ liệu và bối cảnh thị trường</h2>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#A88412]" href={href(locale, "/analysis")}>
          Xem phân tích <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,0.72fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              className="group rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)] transition hover:-translate-y-0.5 hover:border-[#C8A227] hover:bg-[#FAFAF7]"
              href={href(locale, "/analysis")}
              key={card.title}
            >
              <h3 className="text-base font-medium leading-6 text-[#A88412] md:text-lg">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">{card.text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#A88412]">
                Đọc thêm <ArrowRight className="transition group-hover:translate-x-0.5" size={16} />
              </span>
            </Link>
          ))}
        </div>
        <QuickMarketWatch />
      </div>
    </section>
  );
}

function CategoryShowcaseSection({ locale }: { locale: Locale }) {
  return (
    <div className="space-y-8">
      <KnowledgeCategory locale={locale} />
      <MarketCategory locale={locale} />
      <AnalysisCategory locale={locale} />
      <HomeVisionSection />
      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="grid gap-4 md:grid-cols-3">
          {categoryTeasers.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                className="group rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_14px_34px_rgba(17,24,39,0.05)] transition hover:-translate-y-0.5 hover:border-[#C8A227]"
                href={href(locale, item.href)}
                key={item.label}
              >
                <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[#0F1115] text-[#F5E7B3]">
                  <Icon size={19} />
                </span>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#A88412]">{item.label}</p>
                <h3 className="mt-2 text-lg font-semibold text-[#111827]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4B5563]">{item.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#A88412]">
                  Đi tới trang <ArrowRight className="transition group-hover:translate-x-0.5" size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export async function ReaderHomeFeature({ locale }: { locale: Locale }) {
  let articles: ReaderArticle[] = [];
  try {
    articles = await getReaderArticles(locale);
  } catch {
    articles = [];
  }

  const featuredArticle = mapFeaturedArticle(locale, articles);
  const featuredPosts = mapHotPosts(articles);

  return (
    <main className="bg-[#F5F5F2] font-sans text-[#111827]">
      <HomeIntroSection />
      <div className="space-y-8 py-8">
        <ArticleFocusSection article={featuredArticle} locale={locale} posts={featuredPosts} />
        <HomeTradeSection locale={locale} />
        <CategoryShowcaseSection locale={locale} />
      </div>
    </main>
  );
}
