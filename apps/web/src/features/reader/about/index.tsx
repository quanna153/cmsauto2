import type { Locale } from "@cmsauto/contracts";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Globe2,
  Lightbulb,
  Mail,
  NotebookText,
  Rocket,
  Scale,
  SearchCheck,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ReaderMarketTicker } from "@/components/reader/reader-market-ticker";
import type { AboutPageContent } from "./model";
import { getAboutPage } from "./adapter";

type IconText = {
  description: string;
  icon: LucideIcon;
  title: string;
};

type Principle = IconText & {
  number: string;
};

type WorkflowStep = IconText & {
  number: string;
};

type TeamMetric = {
  icon: LucideIcon;
  label: string;
  value: string;
};

const heroFeatures: IconText[] = [
  { description: "Tin tức & dữ liệu mới nhất", icon: Zap, title: "Cập nhật mỗi ngày" },
  { description: "Tiếng Việt & English", icon: Globe2, title: "Đa ngôn ngữ" },
  { description: "Góc nhìn cho nhà đầu tư Việt", icon: Shield, title: "Tập trung thị trường Việt" }
];

const editorialPrinciples: Principle[] = [
  {
    description: "Không nhận tài trợ để đánh đổi nội dung.",
    icon: Scale,
    number: "01",
    title: "Độc lập & khách quan"
  },
  {
    description: "Dữ liệu từ nguồn uy tín, trích dẫn rõ ràng.",
    icon: CheckCircle2,
    number: "02",
    title: "Chính xác & có kiểm chứng"
  },
  {
    description: "Giải thích đơn giản, ví dụ thực tế, có ích.",
    icon: NotebookText,
    number: "03",
    title: "Dễ hiểu & thực tiễn"
  },
  {
    description: "Nêu rõ nguồn, thời gian cập nhật và phương pháp.",
    icon: FileText,
    number: "04",
    title: "Minh bạch"
  },
  {
    description: "Lắng nghe độc giả, không ngừng cải thiện.",
    icon: Users,
    number: "05",
    title: "Ưu tiên cộng đồng"
  }
];

const workflowSteps: WorkflowStep[] = [
  {
    description: "Theo dõi thị trường 24/7 từ các nguồn uy tín toàn cầu và trong nước.",
    icon: ClipboardCheck,
    number: "1",
    title: "Thu thập dữ liệu"
  },
  {
    description: "Xác minh thông tin, loại bỏ tin đồn và nhiễu, ưu tiên dữ liệu có bằng chứng.",
    icon: SearchCheck,
    number: "2",
    title: "Lọc & xác minh"
  },
  {
    description: "Đội ngũ phân tích đưa ra góc nhìn, bối cảnh và tác động đến thị trường.",
    icon: BarChart3,
    number: "3",
    title: "Phân tích & diễn giải"
  },
  {
    description: "Biên tập viên kiểm tra chất lượng, ngữ cảnh và tính nhất quán.",
    icon: FileCheck2,
    number: "4",
    title: "Biên tập & kiểm duyệt"
  },
  {
    description: "Xuất bản đúng thời điểm, cập nhật khi có diễn biến mới nhất.",
    icon: Sparkles,
    number: "5",
    title: "Xuất bản & cập nhật"
  }
];

const coreValues: IconText[] = [
  { description: "Xây dựng lòng tin bằng sự chính xác và nhất quán.", icon: Shield, title: "Tin cậy" },
  { description: "Nhanh nhưng không vội, đúng nhưng không chậm.", icon: Zap, title: "Tốc độ" },
  { description: "Học hỏi không ngừng để giải thích sâu hơn.", icon: Lightbulb, title: "Hiểu biết" },
  { description: "Chịu trách nhiệm với nội dung và cộng đồng.", icon: FileText, title: "Trách nhiệm" },
  { description: "Phát triển cùng độc giả, vì lợi ích chung.", icon: Users, title: "Cộng đồng" },
  { description: "Ứng dụng công nghệ để nâng tầm trải nghiệm.", icon: Rocket, title: "Đổi mới" }
];

const readerCommitments = [
  "Không shill coin, không pump & dump.",
  "Không viết theo yêu cầu dự án.",
  "Không che giấu xung đột lợi ích.",
  "Luôn nêu rủi ro cùng cơ hội.",
  "Tôn trọng pháp luật Việt Nam và quốc tế."
];

const teamMetrics: TeamMetric[] = [
  { icon: NotebookText, label: "Nhà báo & biên tập", value: "12+" },
  { icon: TrendingUp, label: "Nhà phân tích", value: "8+" },
  { icon: Sparkles, label: "Kỹ sư & sản phẩm", value: "6+" },
  { icon: Users, label: "Cố vấn & đối tác", value: "15+" }
];

export async function AboutFeature({ locale }: { locale: Locale }) {
  try {
    const content = await getAboutPage(locale);

    if (!content?.pillars.length || !content.principles.length) {
      return <AboutEmptyState content={content} />;
    }

    return <AboutPage />;
  } catch {
    return <AboutErrorState locale={locale} />;
  }
}

function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#111827]">
      <ReaderMarketTicker />
      <HeroSection />
      <div className="mx-auto max-w-7xl px-5 pb-10 md:pb-14">
        <MissionSection />
        <WorkflowSection />
        <ValuesSection />
        <TeamSection />
        <NewsletterSection />
      </div>
    </main>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-9 px-5 py-10 md:grid-cols-[minmax(0,1fr)_560px] md:items-center md:py-12">
      <div>
        <SectionEyebrow>CoinRadar</SectionEyebrow>
        <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-normal text-[#111827] md:text-6xl">
          Về CoinRadar
          <span className="block text-[#B78F00]">và đội ngũ CoinRadar</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-[#4B5563]">
          CoinRadar biến dữ liệu thị trường, kiến thức và phân tích thành những bản tin dễ đọc, có ngữ cảnh
          và hữu ích cho quyết định mỗi ngày của bạn.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {heroFeatures.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="grid grid-cols-[28px_minmax(0,1fr)] gap-3" key={feature.title}>
                <Icon aria-hidden="true" className="mt-0.5 text-[#B78F00]" size={24} strokeWidth={1.8} />
                <div>
                  <h2 className="text-sm font-black text-[#111827]">{feature.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#64748B]">{feature.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <HeroStatsCard />
    </section>
  );
}

function HeroStatsCard() {
  const stats = [
    { label: "Năm hoạt động", value: "08+" },
    { label: "Độc giả hằng tháng", value: "300K+" },
    { label: "Lượt xem trang", value: "3.2M+" },
    { label: "Bài viết & phân tích", value: "500+" }
  ];

  return (
    <aside className="rounded-lg border border-[#E5E7EB] bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="h-56 w-full">
        <svg aria-label="Biểu đồ tăng trưởng CoinRadar" className="h-full w-full" role="img" viewBox="0 0 560 230">
          <defs>
            <linearGradient id="aboutBarGold" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#D6A900" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#D6A900" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="aboutLineGold" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#F5E7B3" />
              <stop offset="100%" stopColor="#C89700" />
            </linearGradient>
          </defs>
          <g stroke="#E5E7EB" strokeDasharray="5 7" strokeWidth="1">
            <path d="M24 48H536" />
            <path d="M24 104H536" />
            <path d="M24 160H536" />
          </g>
          <g fill="url(#aboutBarGold)">
            {[
              46, 40, 62, 54, 70, 67, 78, 91, 86, 104, 96, 112, 122, 118, 137, 128, 145, 151, 138, 166,
              158, 171, 184, 205
            ].map((height, index) => (
              <rect height={height} key={index} rx="3" width="8" x={38 + index * 20} y={198 - height} />
            ))}
          </g>
          <path
            d="M36 158 C72 145, 94 160, 118 134 S168 126, 194 112 S244 92, 268 98 S318 72, 344 78 S392 90, 418 62 S464 62, 492 42 S520 32, 536 12"
            fill="none"
            stroke="url(#aboutLineGold)"
            strokeLinecap="round"
            strokeWidth="3"
          />
          {[36, 118, 194, 268, 344, 418, 492, 536].map((x, index) => {
            const y = [158, 134, 112, 98, 78, 62, 42, 12][index]!;
            return <circle cx={x} cy={y} fill="#FFF7D6" key={x} r="4" stroke="#D6A900" strokeWidth="2" />;
          })}
          <path d="M24 207H536" stroke="#E5E7EB" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-y-5 divide-x-0 border-t border-[#E5E7EB] pt-6 md:grid-cols-4 md:divide-x md:divide-[#E5E7EB]">
        {stats.map((stat) => (
          <div className="px-2 first:pl-0 md:px-6 md:first:pl-0 md:last:pr-0" key={stat.label}>
            <p className="text-3xl font-black leading-none text-[#111827]">{stat.value}</p>
            <p className="mt-2 text-xs leading-5 text-[#64748B]">{stat.label}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function MissionSection() {
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <article className="rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
        <SectionEyebrow>Sứ mệnh của chúng tôi</SectionEyebrow>
        <h2 className="mt-8 max-w-lg text-3xl font-black leading-tight text-[#111827]">
          Giúp bạn hiểu thị trường crypto dễ dàng hơn và hành động thông minh hơn
        </h2>
        <p className="mt-8 max-w-lg text-sm leading-8 text-[#4B5563]">
          Chúng tôi tin rằng kiến thức đúng đắn là lợi thế. Sứ mệnh của CoinRadar là cung cấp thông tin
          nhanh, chính xác và có chiều sâu, giúp cộng đồng đầu tư crypto tại Việt Nam tự tin hơn trong
          mọi quyết định.
        </p>
        <a
          className="mt-24 inline-flex items-center gap-2 rounded-md bg-[#B78F00] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#9F7B00]"
          href="#team"
        >
          Tìm hiểu thêm về chúng tôi
          <ArrowRight aria-hidden="true" size={16} />
        </a>
      </article>

      <article className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
        <SectionEyebrow>Nguyên tắc biên tập</SectionEyebrow>
        <div className="mt-5 space-y-2">
          {editorialPrinciples.map((principle) => {
            const Icon = principle.icon;

            return (
              <div
                className="grid grid-cols-[44px_minmax(0,1fr)_34px] items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white px-5 py-4"
                key={principle.title}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#B78F00] text-sm font-black text-white">
                  {principle.number}
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#111827]">{principle.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#64748B]">{principle.description}</p>
                </div>
                <Icon aria-hidden="true" className="text-[#9CA3AF]" size={24} strokeWidth={1.8} />
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="mt-8 rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <SectionEyebrow>Quy trình sản xuất nội dung</SectionEyebrow>
      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === workflowSteps.length - 1;

          return (
            <article className="relative" key={step.title}>
              <div className="flex items-center gap-5 lg:justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#B78F00]">
                  <Icon aria-hidden="true" size={24} strokeWidth={1.7} />
                </span>
                {!isLast ? (
                  <ArrowRight aria-hidden="true" className="hidden text-[#111827] lg:block" size={18} strokeWidth={1.5} />
                ) : null}
              </div>
              <div className="mt-5 grid grid-cols-[24px_minmax(0,1fr)] gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#E6C86B] text-[11px] font-black text-[#B78F00]">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#111827]">{step.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[#4B5563]">{step.description}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ValuesSection() {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
      <article className="rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
        <SectionEyebrow>Giá trị cốt lõi</SectionEyebrow>
        <div className="mt-9 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {coreValues.map((value) => {
            const Icon = value.icon;

            return (
              <article className="grid grid-cols-[32px_minmax(0,1fr)] gap-4" key={value.title}>
                <Icon aria-hidden="true" className="mt-1 text-[#B78F00]" size={26} strokeWidth={1.7} />
                <div>
                  <h3 className="text-sm font-black text-[#111827]">{value.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-[#4B5563]">{value.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </article>

      <article className="rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
        <SectionEyebrow>Cam kết với độc giả</SectionEyebrow>
        <ul className="mt-8 space-y-5">
          {readerCommitments.map((item) => (
            <li className="flex gap-3 text-sm leading-6 text-[#111827]" key={item}>
              <Check aria-hidden="true" className="mt-0.5 shrink-0 text-[#B78F00]" size={18} strokeWidth={2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <a
          className="mt-12 grid grid-cols-[44px_minmax(0,1fr)_22px] items-center gap-4 rounded-lg bg-[#0F141B] p-5 text-white transition hover:bg-[#171E28]"
          href="mailto:hello@coinradar.vn"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[#B78F00]/50 text-[#D6A900]">
            <Mail aria-hidden="true" size={25} strokeWidth={1.8} />
          </span>
          <span>
            <span className="block text-base font-black">Góp ý & đồng hành cùng CoinRadar</span>
            <span className="mt-1 block text-xs text-[#CBD5E1]">Mọi góp ý của bạn giúp chúng tôi phục vụ tốt hơn.</span>
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#D6A900]">
              Liên hệ với chúng tôi
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="text-[#D6A900]" size={20} />
        </a>
      </article>
    </section>
  );
}

function TeamSection() {
  return (
    <section
      className="mt-8 grid gap-8 rounded-lg border border-[#E5E7EB] bg-white p-8 shadow-[0_16px_40px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(0,1fr)_680px] lg:items-center"
      id="team"
    >
      <div>
        <SectionEyebrow>Đội ngũ CoinRadar</SectionEyebrow>
        <h2 className="mt-8 max-w-md text-2xl font-black leading-tight text-[#111827]">
          Nhà báo, nhà phân tích và builder đam mê thị trường crypto
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-8 text-[#4B5563]">
          Chúng tôi là một nhóm đa dạng với chung mục tiêu: mang đến nội dung có giá trị và trải nghiệm
          tốt nhất cho nhà đầu tư Việt Nam.
        </p>
        <a className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#B78F00]" href="#newsletter">
          Tìm hiểu về đội ngũ
          <ArrowRight aria-hidden="true" size={16} />
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {teamMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-6 text-center shadow-sm" key={metric.label}>
              <Icon aria-hidden="true" className="mx-auto text-[#9CA3AF]" size={33} strokeWidth={1.7} />
              <h3 className="mt-5 min-h-10 text-sm font-black leading-5 text-[#111827]">{metric.label}</h3>
              <p className="mt-3 text-4xl font-black text-[#111827]">{metric.value}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section
      className="mt-8 grid gap-6 rounded-lg bg-[linear-gradient(110deg,#D2A300_0%,#B78F00_48%,#8C6A00_100%)] p-7 text-white shadow-[0_20px_45px_rgba(183,143,0,0.22)] md:grid-cols-[minmax(0,1fr)_620px] md:items-center"
      id="newsletter"
    >
      <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-5">
        <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/35 bg-white/10">
          <Mail aria-hidden="true" size={31} strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-2xl font-black">Không bỏ lỡ cơ hội trong thị trường crypto</h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/85">
            Đăng ký nhận bản tin CoinRadar hằng ngày với tin tức nóng, phân tích chuyên sâu và cơ hội đầu tư.
          </p>
        </div>
      </div>
      <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
        <label className="sr-only" htmlFor="about-newsletter-email">
          Email
        </label>
        <input
          className="h-12 rounded-md border border-white/30 bg-white px-5 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#111827] focus:ring-2 focus:ring-white/45"
          id="about-newsletter-email"
          placeholder="Nhập email của bạn"
          type="email"
        />
        <button className="h-12 rounded-md bg-[#0F141B] px-6 text-sm font-black text-white transition hover:bg-[#1F2937]" type="submit">
          Đăng ký ngay
        </button>
      </form>
    </section>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B78F00]">{children}</p>;
}

export function AboutLoadingState() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-64 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="h-80 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-80 animate-pulse rounded-lg bg-[#E5E7EB]" />
        </div>
      </div>
    </main>
  );
}

function AboutEmptyState({ content }: { content: AboutPageContent }) {
  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#B78F00]">{content?.eyebrow ?? "CoinRadar"}</p>
        <h1 className="mt-2 text-2xl font-black">{content?.emptyTitle ?? "Chưa có nội dung"}</h1>
        <p className="mt-3 leading-7 text-[#4B5563]">
          {content?.emptyDescription ?? "Trang giới thiệu chưa có dữ liệu để hiển thị."}
        </p>
      </section>
    </main>
  );
}

function AboutErrorState({ locale }: { locale: Locale }) {
  const isVietnamese = locale === "vi-vn";

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#F3C6C6] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#C2410C]">About</p>
        <h1 className="mt-2 text-2xl font-black">
          {isVietnamese ? "Không tải được trang giới thiệu" : "Could not load the about page"}
        </h1>
        <p className="mt-3 leading-7 text-[#4B5563]">
          {isVietnamese
            ? "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/about."
            : "Please try again later or check the reader/about adapter."}
        </p>
      </section>
    </main>
  );
}
