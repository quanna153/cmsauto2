import type { Locale } from "@cmsauto/contracts";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  CheckCircle2,
  CircleAlert,
  Coins,
  Database,
  Gauge,
  Landmark,
  LineChart,
  Mail,
  Scale,
  Shield,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ReaderMarketTicker } from "@/components/reader/reader-market-ticker";
import type { AnalysisPageContent } from "./model";
import { getAnalysisPage } from "./adapter";

type FeaturePoint = {
  description: string;
  icon: LucideIcon;
  title: string;
};

type ThesisCard = {
  description: string;
  icon: LucideIcon;
  status: string;
  tone: "positive" | "neutral" | "caution";
  title: string;
};

type ScenarioCard = {
  bullets: string[];
  icon: LucideIcon;
  label: string;
  path: string;
  range: string;
  title: string;
  tone: "positive" | "base" | "negative";
};

type SignalCard = {
  detail: string;
  icon: LucideIcon;
  label: string;
  status: string;
  value: string;
};

type WeeklyArgument = {
  date: string;
  title: string;
};

type RiskItem = {
  icon: LucideIcon;
  status: "positive" | "neutral" | "negative";
  subtitle: string;
  title: string;
};

type RecentRow = {
  author: string;
  category: string;
  title: string;
  updated: string;
};

const heroFeatures: FeaturePoint[] = [
  { description: "từ nhiều nguồn uy tín", icon: Database, title: "Dữ liệu on-chain" },
  { description: "dựa trên mô hình", icon: BarChart3, title: "Phân tích hệ thống" },
  { description: "và kịch bản thị trường", icon: Target, title: "Luận điểm rõ ràng" }
];

const thesisCards: ThesisCard[] = [
  {
    description: "Dòng tiền bắt đầu quay trở lại các tài sản lớn và một số sector có nền tảng cơ bản mạnh.",
    icon: LineChart,
    status: "Tích cực",
    title: "Thị trường trong giai đoạn hồi phục có chọn lọc",
    tone: "positive"
  },
  {
    description: "ETF ghi nhận mua ròng, nguồn cung stablecoin tiếp tục tăng - tín hiệu hỗ trợ xu hướng.",
    icon: Coins,
    status: "Trung lập",
    title: "Dòng tiền ETF và stablecoin là động lực chính",
    tone: "neutral"
  },
  {
    description: "Dữ liệu lập mặt MV và thanh khoản hệ thống có thể tạo biến động mạnh trong ngắn hạn.",
    icon: Shield,
    status: "Thận trọng",
    title: "Rủi ro ngắn hạn đến từ vĩ mô và thanh khoản",
    tone: "caution"
  }
];

const scenarioCards: ScenarioCard[] = [
  {
    bullets: ["Dòng tiền ETF tiếp tục vào ròng", "Stablecoin supply tăng mạnh", "Vĩ mô ủng hộ tâm lý risk-on"],
    icon: TrendingUp,
    label: "Xác suất 40%",
    path: "M0 58 C20 46 38 52 58 40 C82 24 104 36 126 26 C148 14 166 28 186 18 C210 8 232 16 260 6",
    range: "72,000 - 78,000",
    title: "Kịch bản tích cực",
    tone: "positive"
  },
  {
    bullets: ["Đi ngang tích lũy trong biên độ rộng", "Dòng tiền phân hóa theo ngành", "Chỉ tín hiệu vĩ mô rõ ràng hơn"],
    icon: Target,
    label: "Xác suất 40%",
    path: "M0 40 C20 30 34 44 54 32 C74 22 90 40 110 30 C132 18 150 34 170 26 C194 16 216 24 238 12 C248 8 254 20 260 16",
    range: "63,000 - 71,000",
    title: "Kịch bản cơ sở",
    tone: "base"
  },
  {
    bullets: ["Dữ liệu vĩ mô xấu hơn dự kiến", "Rút ròng ETF, thanh khoản suy giảm", "Tâm lý thị trường chuyển tiêu cực"],
    icon: TrendingDown,
    label: "Xác suất 20%",
    path: "M0 18 C18 28 34 22 54 34 C72 44 92 38 112 50 C132 62 154 52 176 64 C198 76 224 66 260 82",
    range: "54,000 - 62,000",
    title: "Kịch bản tiêu cực",
    tone: "negative"
  }
];

const onchainSignals: SignalCard[] = [
  { detail: "7 ngày qua", icon: Database, label: "Netflow Exchange", status: "Giảm áp lực bán", value: "-$245.3M" },
  { detail: "Vùng tích lũy", icon: Landmark, label: "NUPL (BTC)", status: "Trung lập", value: "0.58" },
  { detail: "Thợ mỏ đang tích lũy", icon: Zap, label: "Miners Position Index", status: "Tích cực", value: "2.11" },
  { detail: "+2.10% (7 ngày)", icon: Coins, label: "Stablecoin Supply", status: "Dòng tiền vào thị trường", value: "$162.3B" },
  { detail: "Chưa quá nóng", icon: Gauge, label: "MVRV Z-Score", status: "Trung lập", value: "2.45" }
];

const weeklyArguments: WeeklyArgument[] = [
  { date: "11/06/2026", title: "Bitcoin giữ vững hỗ trợ 65K, mục tiêu 72K trong Q2?" },
  { date: "11/06/2026", title: "Dòng tiền ETF tiếp tục vào ròng - Động lực cho BTC & ETH" },
  { date: "10/06/2026", title: "Altcoin nào có thể bứt phá nếu BTC vượt 70K?" },
  { date: "11/06/2026", title: "Phân tích on-chain: Cá voi đang mua thêm ETH?" },
  { date: "09/06/2026", title: "Thanh khoản stablecoin tăng - Tín hiệu tích cực" }
];

const riskItems: RiskItem[] = [
  { icon: ShieldCheck, status: "positive", subtitle: "Tích cực", title: "Xu hướng thị trường" },
  { icon: CircleAlert, status: "positive", subtitle: "Tích cực", title: "Thanh khoản & Dòng tiền" },
  { icon: Landmark, status: "neutral", subtitle: "Trung lập", title: "Định giá" },
  { icon: Shield, status: "negative", subtitle: "Thận trọng", title: "Vĩ mô" },
  { icon: Scale, status: "neutral", subtitle: "Trung lập", title: "Rủi ro pháp lý" },
  { icon: WalletCards, status: "positive", subtitle: "Tích cực", title: "Tâm lý thị trường" }
];

const recentRows: RecentRow[] = [
  { author: "CoinRadar Team", category: "Thị trường vĩ mô", title: "Bitcoin giữ vững hỗ trợ 65K, mục tiêu 72K trong Q2?", updated: "11/06/2026 · 10:45" },
  { author: "Hữu Ích", category: "Dòng tiền", title: "Dòng tiền ETF tiếp tục vào ròng - Động lực cho BTC & ETH", updated: "11/06/2026 · 09:10" },
  { author: "Rạch Mạch", category: "Altcoin", title: "Altcoin nào có thể bứt phá nếu BTC vượt 70K?", updated: "10/06/2026 · 18:30" },
  { author: "CoinRadar Team", category: "On-chain", title: "Phân tích on-chain: Cá voi đang mua thêm ETH?", updated: "10/06/2026 · 16:20" },
  { author: "Hữu Ích", category: "Dòng tiền", title: "Thanh khoản stablecoin tăng - Tín hiệu tích cực", updated: "09/06/2026 · 14:05" }
];

export async function AnalysisFeature({ locale }: { locale: Locale }) {
  try {
    const content = await getAnalysisPage(locale);

    if (!content.theses.length || !content.reports.length) {
      return <AnalysisEmptyState content={content} />;
    }

    return <AnalysisPage />;
  } catch {
    return <AnalysisErrorState locale={locale} />;
  }
}

function AnalysisPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#111827]">
      <ReaderMarketTicker />

      <div className="mx-auto max-w-7xl px-5 py-10">
        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <HeroSection />
          <SentimentCard />
        </section>

        <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <MainThesisSection />
            <ScenarioSection />
            <OnchainSignalSection />
            <MarketPerspectiveSection />
          </div>

          <aside className="space-y-4 lg:-mt-1">
            <WeeklyArguments />
            <PremiumReportCard />
            <RiskChecklist />
          </aside>
        </div>

        <RecentAnalysisTable />
        <NewsletterSection />
      </div>
    </main>
  );
}

function SectionHeader({ title, action }: { action?: string; title: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="text-sm font-black uppercase tracking-[0.08em] text-[#111827]">{title}</h2>
      {action ? (
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#A88412]" type="button">
          {action}
          <ArrowRight size={16} />
        </button>
      ) : null}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[21rem] overflow-hidden border-b border-[#E5E7EB] pb-8">
      <HeroChartBackdrop />
      <div className="relative max-w-2xl pt-6">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#A88412]">Phân tích</p>
        <h1 className="mt-4 text-5xl font-black leading-[1.08] text-[#111827] md:text-6xl">
          Phân tích xu hướng
          <span className="block">thị trường crypto</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-[#64748B]">
          Góc nhìn sâu và dữ liệu on-chain, vĩ mô và tâm lý thị trường để giúp bạn ra quyết định tốt hơn.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {heroFeatures.map((feature) => (
            <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3" key={feature.title}>
              <span className="flex size-8 items-center justify-center rounded-md border border-[#C8A227] bg-[#FFF8E4] text-[#B58D07]">
                <feature.icon size={18} />
              </span>
              <div>
                <h3 className="text-sm font-black">{feature.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#64748B]">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroChartBackdrop() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute right-0 top-5 hidden h-72 w-[32rem] text-[#E7C66A] opacity-45 lg:block" viewBox="0 0 520 260">
      <g stroke="currentColor" strokeOpacity="0.14">
        {Array.from({ length: 12 }).map((_, index) => (
          <line key={`v-${index}`} x1={index * 44} x2={index * 44} y1="0" y2="260" />
        ))}
        {Array.from({ length: 7 }).map((_, index) => (
          <line key={`h-${index}`} x1="0" x2="520" y1={index * 40} y2={index * 40} />
        ))}
      </g>
      <path d="M8 210 C50 170 72 190 112 142 C156 88 178 150 212 116 C252 74 282 98 320 58 C358 20 398 58 442 22 C472 0 494 26 512 10" fill="none" stroke="currentColor" strokeWidth="2" />
      {[70, 112, 152, 196, 242, 292, 336, 384, 432, 480].map((x, index) => (
        <g key={x} opacity={0.85}>
          <line stroke="currentColor" strokeWidth="2" x1={x} x2={x} y1={62 + (index % 3) * 18} y2={150 - (index % 4) * 14} />
          <rect fill="#F8D786" height={34 + (index % 3) * 14} rx="3" width="13" x={x - 6} y={82 + (index % 4) * 10} />
        </g>
      ))}
    </svg>
  );
}

function SentimentCard() {
  return (
    <aside className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_44px_rgba(17,24,39,0.08)]">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-black">Chỉ số tâm lý thị trường</h2>
        <CircleAlert className="text-[#94A3B8]" size={16} />
      </div>
      <p className="mt-5 text-4xl font-semibold">72</p>
      <div className="mt-3 grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:items-center lg:grid-cols-1 xl:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="relative mx-auto size-44">
          <svg aria-label="Chỉ số tâm lý 72" className="size-full" viewBox="0 0 180 180">
            <path d="M32 118 A62 62 0 0 1 148 118" fill="none" stroke="#E5E7EB" strokeLinecap="round" strokeWidth="16" />
            <path d="M32 118 A62 62 0 0 1 72 62" fill="none" stroke="#22A06B" strokeLinecap="round" strokeWidth="16" />
            <path d="M74 61 A62 62 0 0 1 128 72" fill="none" stroke="#F5B51B" strokeLinecap="round" strokeWidth="16" />
            <path d="M129 73 A62 62 0 0 1 148 118" fill="none" stroke="#D1D5DB" strokeLinecap="round" strokeWidth="16" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <span className="text-5xl font-black">72</span>
            <span className="mt-1 text-sm text-[#64748B]">Tham lam</span>
          </div>
        </div>
        <div className="divide-y divide-[#E5E7EB] text-sm">
          {[
            ["Now", "72"],
            ["Yesterday", "68"],
            ["Last week", "61"],
            ["Last month", "55"]
          ].map(([label, value]) => (
            <div className="flex justify-between py-3" key={label}>
              <span className="text-[#64748B]">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <button className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-[#A88412]" type="button">
        Xem chi tiết chỉ số <ArrowRight size={16} />
      </button>
    </aside>
  );
}

function MainThesisSection() {
  const toneClass = {
    caution: "border-[#E5E7EB] text-[#DC2626] bg-[#FEE2E2]",
    neutral: "border-[#E5E7EB] text-[#A88412] bg-[#F8E8B5]",
    positive: "border-[#D6A300] text-[#15803D] bg-[#DCFCE7]"
  };

  return (
    <section>
      <SectionHeader title="Luận điểm chính" />
      <div className="grid gap-4 md:grid-cols-3">
        {thesisCards.map((thesis) => (
          <article className={`rounded-lg border bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)] ${thesis.tone === "positive" ? "border-[#D6A300]" : "border-[#E5E7EB]"}`} key={thesis.title}>
            <h3 className="min-h-[3.5rem] text-lg font-black leading-6">{thesis.title}</h3>
            <p className="mt-3 min-h-[4.75rem] text-sm leading-6 text-[#64748B]">{thesis.description}</p>
            <div className="mt-8 flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-black ${toneClass[thesis.tone]}`}>{thesis.status}</span>
              <thesis.icon className="text-[#D6A300]" size={38} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScenarioSection() {
  return (
    <section className="mt-9">
      <SectionHeader action="Xem phương pháp" title="Kịch bản thị trường (30 ngày)" />
      <div className="grid gap-4 md:grid-cols-3">
        {scenarioCards.map((scenario) => (
          <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]" key={scenario.title}>
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
              <span className={`flex size-10 items-center justify-center rounded-full ${scenario.tone === "negative" ? "bg-[#FEE2E2] text-[#EF4444]" : scenario.tone === "base" ? "bg-[#FEF3C7] text-[#D6A300]" : "bg-[#DCFCE7] text-[#22A06B]"}`}>
                <scenario.icon size={21} />
              </span>
              <div>
                <h3 className="font-black">{scenario.title}</h3>
                <p className="mt-1 text-sm text-[#64748B]">{scenario.label}</p>
              </div>
            </div>
            <p className="mt-6 text-3xl font-semibold">{scenario.range}</p>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">BTC/USDT</p>
            <ul className="mt-5 grid gap-2 text-sm text-[#4B5563]">
              {scenario.bullets.map((bullet) => (
                <li className="flex gap-2" key={bullet}>
                  <span className={scenario.tone === "negative" ? "text-[#EF4444]" : scenario.tone === "base" ? "text-[#D6A300]" : "text-[#22A06B]"}>•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 h-20">
              <Sparkline path={scenario.path} tone={scenario.tone} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Sparkline({ path, tone }: { path: string; tone: "positive" | "base" | "negative" }) {
  const stroke = tone === "negative" ? "#EF4444" : tone === "base" ? "#F5B51B" : "#22A06B";
  const fill = tone === "negative" ? "#FEE2E2" : tone === "base" ? "#FEF3C7" : "#DCFCE7";

  return (
    <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 260 90">
      <path d={`${path} L260 90 L0 90 Z`} fill={fill} opacity="0.68" />
      <path d={path} fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function OnchainSignalSection() {
  return (
    <section className="mt-9">
      <SectionHeader action="Xem tất cả" title="Tín hiệu on-chain nổi bật" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {onchainSignals.map((signal) => (
          <article className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-6 text-center shadow-[0_14px_34px_rgba(17,24,39,0.04)]" key={signal.label}>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#FAFAF7] text-[#111827]">
              <signal.icon size={22} />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-[#4B5563]">{signal.label}</h3>
            <p className="mt-2 text-2xl font-black">{signal.value}</p>
            <p className="mt-2 text-xs text-[#64748B]">{signal.detail}</p>
            <p className={`mt-4 text-xs font-black ${signal.status.includes("Tích") || signal.status.includes("Dòng") || signal.status.includes("Giảm") || signal.status.includes("Thợ") ? "text-[#15803D]" : "text-[#A88412]"}`}>{signal.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MarketPerspectiveSection() {
  return (
    <section className="mt-9 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <div className="border-b border-[#E5E7EB] px-5 pt-5">
        <SectionHeader action="Xem tất cả" title="Góc nhìn thị trường" />
      </div>
      <div className="grid divide-y divide-[#E5E7EB] md:grid-cols-4 md:divide-x md:divide-y-0">
        <article className="p-5">
          <h3 className="font-black">Phân bổ vốn hóa</h3>
          <p className="mt-1 text-sm text-[#64748B]">Tổng vốn hóa thị trường</p>
          <p className="mt-6 text-3xl font-semibold">$2.56T</p>
          <p className="mt-2 text-sm font-bold text-[#15803D]">▲ 1.32%</p>
          <div className="mt-4 grid gap-2 text-sm">
            {[
              ["Bitcoin", "53.1%", "#C8A227"],
              ["Ethereum", "17.8%", "#64748B"],
              ["Altcoin khác", "29.1%", "#CBD5E1"]
            ].map(([label, value, color]) => (
              <div className="grid grid-cols-[0.75rem_1fr_auto] items-center gap-2" key={label}>
                <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[#64748B]">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="p-5">
          <h3 className="font-black">Dòng tiền ETF (US)</h3>
          <p className="mt-1 text-sm text-[#64748B]">7 ngày qua</p>
          <p className="mt-6 text-3xl font-semibold">+$1.24B</p>
          <p className="mt-2 text-sm font-semibold">Dòng tiền ròng</p>
          <MiniBars />
        </article>
        <article className="p-5">
          <h3 className="font-black">Bitcoin Dominance</h3>
          <p className="mt-1 text-sm text-[#64748B]">Tỷ lệ BTC.D</p>
          <p className="mt-6 text-3xl font-semibold">53.1%</p>
          <p className="mt-2 text-sm font-bold text-[#DC2626]">▼ 0.42%</p>
          <div className="mt-5 h-16">
            <Sparkline path="M0 34 C18 42 30 30 48 38 C70 48 88 34 106 40 C130 50 148 30 168 22 C188 14 204 24 228 16 C244 10 252 20 260 18" tone="base" />
          </div>
        </article>
        <article className="p-5">
          <h3 className="font-black">Altcoin Season Index</h3>
          <p className="mt-1 text-sm text-[#64748B]">Chỉ số mùa altcoin</p>
          <p className="mt-6 text-3xl font-semibold">43</p>
          <p className="mt-2 text-sm font-semibold">Trung lập</p>
          <div className="mt-8">
            <div className="h-2 rounded-full bg-[#E5E7EB]">
              <div className="h-2 w-[43%] rounded-full bg-[#C8A227]" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#94A3B8]"><span>0</span><span>100</span></div>
          </div>
        </article>
      </div>
    </section>
  );
}

function MiniBars() {
  const bars = [12, 24, 18, 36, 58, 22, 44, 16, 30, 48, 70, 34, 62, 78];
  return (
    <div className="mt-6 flex h-20 items-end gap-2">
      {bars.map((height, index) => (
        <span className="w-3 rounded-t bg-[#22A06B]" key={index} style={{ height: `${height}%`, opacity: index % 3 === 0 ? 0.55 : 0.9 }} />
      ))}
    </div>
  );
}

function WeeklyArguments() {
  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="font-black uppercase tracking-[0.08em]">Luận điểm tuần này</h2>
        <button className="inline-flex items-center gap-2 text-xs font-bold text-[#A88412]" type="button">Xem tất cả <ArrowRight size={14} /></button>
      </div>
      <div className="mt-5 divide-y divide-[#E5E7EB]">
        {weeklyArguments.map((item, index) => (
          <article className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 py-4" key={item.title}>
            <span className="font-black text-[#B58D07]">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="font-black leading-6">{item.title}</h3>
              <p className="mt-1 text-sm text-[#64748B]">{item.date}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PremiumReportCard() {
  return (
    <section className="overflow-hidden rounded-lg bg-[#0F1115] p-5 text-white shadow-[0_18px_44px_rgba(17,24,39,0.18)]">
      <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4">
        <div>
          <h2 className="text-xl font-black">Báo cáo phân tích độc quyền</h2>
          <p className="mt-3 text-sm leading-6 text-white/75">Nhận báo cáo chuyên sâu hằng tuần từ đội ngũ CoinRadar Research.</p>
          <button className="mt-5 rounded-lg bg-[#C8A227] px-5 py-3 text-sm font-black text-[#0F1115]" type="button">Đăng ký nhận báo cáo</button>
        </div>
        <span className="flex size-20 items-center justify-center rounded-full border border-[#C8A227]/35 bg-[#C8A227]/10 text-[#C8A227]">
          <FileReportIcon />
        </span>
      </div>
    </section>
  );
}

function FileReportIcon() {
  return (
    <span className="relative flex size-12 items-center justify-center rounded-lg border-2 border-current">
      <FileTextIconLines />
    </span>
  );
}

function FileTextIconLines() {
  return (
    <svg aria-hidden="true" className="size-8" viewBox="0 0 32 32">
      <path d="M9 7h10l4 4v14H9z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M19 7v5h5M12 16h8M12 20h8M12 24h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function RiskChecklist() {
  const statusClass = {
    negative: "bg-[#DC2626] text-white",
    neutral: "bg-[#F5B51B] text-white",
    positive: "bg-[#22A06B] text-white"
  };

  return (
    <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <h2 className="font-black uppercase tracking-[0.08em]">Checklist rủi ro</h2>
      <div className="mt-4 divide-y divide-[#E5E7EB]">
        {riskItems.map((item) => (
          <article className="grid grid-cols-[2.5rem_minmax(0,1fr)_1.25rem] items-center gap-3 py-4" key={item.title}>
            <span className="flex size-9 items-center justify-center rounded-lg border border-[#EBD9A6] bg-[#FFF8E4] text-[#B58D07]">
              <item.icon size={19} />
            </span>
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-[#64748B]">{item.subtitle}</p>
            </div>
            <span className={`flex size-5 items-center justify-center rounded-full ${statusClass[item.status]}`}>
              {item.status === "positive" ? <CheckCircle2 size={14} /> : item.status === "negative" ? <CircleAlert size={13} /> : <span className="h-0.5 w-2 rounded bg-white" />}
            </span>
          </article>
        ))}
      </div>
      <button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#A88412]" type="button">
        Xem phương pháp đánh giá <ArrowRight size={16} />
      </button>
    </section>
  );
}

function RecentAnalysisTable() {
  return (
    <section className="mt-9 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="font-black uppercase tracking-[0.08em]">Bài phân tích mới nhất</h2>
        <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#A88412]" type="button">Xem tất cả <ArrowRight size={16} /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] text-left text-sm">
          <thead className="border-b border-[#E5E7EB] text-xs text-[#64748B]">
            <tr>
              {[
                { id: "index", label: "" },
                { id: "title", label: "Tiêu đề" },
                { id: "category", label: "Chuyên mục" },
                { id: "author", label: "Tác giả" },
                { id: "updated", label: "Cập nhật" },
                { id: "bookmark", label: "" }
              ].map((column) => (
                <th className="px-5 py-3 font-semibold" key={column.id}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {recentRows.map((row, index) => (
              <tr className="transition hover:bg-[#FAFAF7]" key={row.title}>
                <td className="px-5 py-3 font-semibold text-[#64748B]">{index + 1}</td>
                <td className="px-5 py-3 font-black">{row.title}</td>
                <td className="px-5 py-3"><span className="rounded-full bg-[#F5F5F2] px-3 py-1 text-xs font-semibold text-[#64748B]">{row.category}</span></td>
                <td className="px-5 py-3 text-[#4B5563]">{row.author}</td>
                <td className="px-5 py-3 text-[#4B5563]">{row.updated}</td>
                <td className="px-5 py-3 text-[#64748B]"><Bookmark size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="mt-6 rounded-lg border border-[#EBD9A6] bg-[linear-gradient(90deg,#FFF8E4,#FFFFFF_52%,#FFF4CE)] p-6 shadow-[0_14px_34px_rgba(168,132,18,0.08)]">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_36rem] md:items-center">
        <div className="flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-lg border-2 border-[#B58D07] text-[#B58D07]">
            <Mail size={36} />
          </span>
          <div>
            <h2 className="text-2xl font-black">Không bỏ lỡ phân tích quan trọng</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748B]">Nhận email phân tích thị trường, on-chain và cơ hội đầu tư nổi bật mỗi tuần.</p>
          </div>
        </div>
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <label className="sr-only" htmlFor="analysis-newsletter-email">Email</label>
          <input className="h-12 rounded-lg border border-[#E5E7EB] bg-white px-5 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#C8A227]" id="analysis-newsletter-email" placeholder="Nhập email của bạn" type="email" />
          <button className="h-12 rounded-lg bg-[#B58D07] px-5 text-sm font-black text-white transition hover:bg-[#C8A227]" type="submit">
            Đăng ký ngay
          </button>
        </form>
      </div>
    </section>
  );
}

export function AnalysisLoadingState() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="h-56 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="h-72 animate-pulse rounded-lg bg-[#E5E7EB]" />
          <div className="h-72 animate-pulse rounded-lg bg-[#E5E7EB]" />
        </div>
      </div>
    </main>
  );
}

function AnalysisEmptyState({ content }: { content: AnalysisPageContent }) {
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

function AnalysisErrorState({ locale }: { locale: Locale }) {
  const isVietnamese = locale === "vi-vn";

  return (
    <main className="min-h-screen bg-[#FAFAF7] px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-[#f3c6c6] bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase text-[#c2410c]">Analysis</p>
        <h1 className="mt-2 text-2xl font-black">
          {isVietnamese ? "Không tải được trang phân tích" : "Could not load analysis"}
        </h1>
        <p className="mt-3 leading-7 text-[#4B5563]">
          {isVietnamese
            ? "Vui lòng thử lại sau hoặc kiểm tra adapter của feature reader/analysis."
            : "Please try again later or check the reader/analysis adapter."}
        </p>
      </section>
    </main>
  );
}
