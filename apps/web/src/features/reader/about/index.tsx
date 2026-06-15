import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, CheckCircle2, FileCheck2, Layers3, Mail, Newspaper, ShieldCheck, Target, UsersRound } from "lucide-react";
import Link from "next/link";

import { CryptoSphere } from "@/features/reader/home/crypto-sphere";

const copy = {
  "vi-vn": {
    eyebrow: "Về CoinRadar",
    title: "Một phòng tin crypto tập trung vào dữ liệu, bối cảnh và sự rõ ràng",
    lead: "CoinRadar giúp người đọc theo dõi thị trường tài sản số bằng nội dung dễ đọc, có kiểm chứng và không chạy theo tín hiệu mua bán cảm tính.",
    cta: "Đọc tin mới",
    contact: "Liên hệ biên tập",
    proofTitle: "Nguyên tắc biên tập",
    workflowTitle: "Cách chúng tôi xử lý thông tin",
    audienceTitle: "CoinRadar phục vụ ai",
    pillarsTitle: "Nội dung chúng tôi tập trung",
    guardrailsTitle: "Những điều chúng tôi không làm",
    metrics: [["24/7", "Theo dõi thị trường"], ["2 ngôn ngữ", "Việt Nam và quốc tế"], ["0", "Tín hiệu mua bán ép buộc"]],
    audience: [
      ["Người mới", "Cần hiểu khái niệm, ví, sàn, rủi ro và cách đọc bảng giá trước khi ra quyết định."],
      ["Nhà đầu tư theo dõi thị trường", "Cần một nơi tổng hợp giá, dòng tiền, tin tức và bối cảnh một cách dễ quét."],
      ["Người làm nội dung crypto", "Cần nguồn tham khảo có cấu trúc, thuật ngữ nhất quán và góc nhìn có kiểm chứng."]
    ],
    pillars: [
      ["Thị trường", "Giá, vốn hóa, volume, dominance và biến động đáng chú ý trong ngày."],
      ["Kiến thức", "Bài nền tảng về Bitcoin, blockchain, DeFi, ví cá nhân và quản trị rủi ro."],
      ["Phân tích", "Luận điểm dựa trên dữ liệu on-chain, dòng tiền, vĩ mô và các kịch bản có điều kiện."],
      ["Tin tức", "Sự kiện quan trọng được viết lại ngắn gọn, có bối cảnh và tránh giật tít."]
    ],
    guardrails: [
      "Không bán tín hiệu mua bán.",
      "Không phóng đại lợi nhuận hoặc tạo cảm giác chắc thắng.",
      "Không che giấu khi dữ liệu chỉ là fallback hoặc chưa được API xác nhận.",
      "Không thay thế quyết định và trách nhiệm của người đọc."
    ],
    principles: [
      ["Minh bạch", "Nêu rõ nguồn dữ liệu, bối cảnh và thời điểm cập nhật."],
      ["Không thổi phồng", "Không biến headline thành lời khuyên đầu tư."],
      ["Dễ kiểm chứng", "Ưu tiên thông tin có thể đối chiếu và đọc lại."]
    ],
    workflow: [
      ["Thu thập", "Giá, tin tức, dòng tiền và thay đổi chính sách."],
      ["Lọc nhiễu", "Loại bỏ tin chưa có nguồn hoặc không đủ tác động."],
      ["Biên tập", "Viết lại bằng ngôn ngữ dễ hiểu và có ngữ cảnh."],
      ["Cập nhật", "Điều chỉnh khi dữ liệu hoặc sự kiện thay đổi."]
    ]
  },
  "en-us": {
    eyebrow: "About CoinRadar",
    title: "A crypto newsroom focused on data, context and clarity",
    lead: "CoinRadar helps readers follow digital asset markets through clear, verifiable coverage without turning headlines into trading signals.",
    cta: "Read latest",
    contact: "Contact editors",
    proofTitle: "Editorial principles",
    workflowTitle: "How we process information",
    audienceTitle: "Who CoinRadar serves",
    pillarsTitle: "What we focus on",
    guardrailsTitle: "What we do not do",
    metrics: [["24/7", "Market monitoring"], ["2 languages", "Vietnam and global"], ["0", "Forced buy/sell signals"]],
    audience: [
      ["Beginners", "Need clear concepts, wallets, exchanges, risks and price-board reading before making decisions."],
      ["Market followers", "Need one place for prices, capital flows, news and context that is easy to scan."],
      ["Crypto content teams", "Need structured references, consistent terminology and verifiable angles."]
    ],
    pillars: [
      ["Markets", "Prices, market cap, volume, dominance and notable daily moves."],
      ["Knowledge", "Foundational explainers on Bitcoin, blockchain, DeFi, wallets and risk management."],
      ["Analysis", "Data-led theses across on-chain activity, flows, macro and conditional scenarios."],
      ["News", "Important events rewritten with context, clarity and no sensational framing."]
    ],
    guardrails: [
      "No buy or sell signals.",
      "No exaggerated profit claims or false certainty.",
      "No hiding when data is fallback or not yet confirmed by API.",
      "No replacement for the reader's own responsibility."
    ],
    principles: [
      ["Transparent", "Show data sources, context and update timing."],
      ["No hype", "Do not turn headlines into investment advice."],
      ["Verifiable", "Prioritize information readers can check again."]
    ],
    workflow: [
      ["Collect", "Prices, news, capital flows and policy changes."],
      ["Filter", "Remove unsourced or low-impact noise."],
      ["Edit", "Rewrite into clear language with context."],
      ["Update", "Adjust when data or events change."]
    ]
  }
} satisfies Record<Locale, {
  contact: string;
  cta: string;
  audience: string[][];
  audienceTitle: string;
  eyebrow: string;
  guardrails: string[];
  guardrailsTitle: string;
  lead: string;
  metrics: string[][];
  pillars: string[][];
  pillarsTitle: string;
  principles: string[][];
  proofTitle: string;
  title: string;
  workflow: string[][];
  workflowTitle: string;
}>;

export function AboutFeature({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const metricNotes = locale === "vi-vn"
    ? [
        "Giá, tin tức và biến động lớn được rà soát theo nhịp thị trường.",
        "Nội dung được biên tập để người đọc Việt vẫn theo dõi được dòng tin quốc tế.",
        "CoinRadar chỉ cung cấp bối cảnh và dữ liệu, không ép người đọc mua bán."
      ]
    : [
        "Prices, news and major moves are reviewed around the market clock.",
        "Coverage is edited so Vietnamese readers can follow global crypto context.",
        "CoinRadar provides data and context without pushing readers into trades."
      ];
  const marketPanel = locale === "vi-vn"
    ? {
        title: "Bảng tín hiệu đọc nhanh",
        subtitle: "Tách các chỉ số quan trọng để người đọc nhìn được nhịp thị trường trước khi vào bài.",
        chips: ["Giá", "Volume", "Dominance"],
        rows: [["BTC/USDT", "+1.62%", "Động lượng"], ["ETH/USDT", "+0.85%", "Thanh khoản"], ["Altcoin", "42%", "Độ rộng"]]
      }
    : {
        title: "Quick signal board",
        subtitle: "Separates the key indicators readers need before opening a full story.",
        chips: ["Price", "Volume", "Dominance"],
        rows: [["BTC/USDT", "+1.62%", "Momentum"], ["ETH/USDT", "+0.85%", "Liquidity"], ["Altcoins", "42%", "Breadth"]]
      };

  return (
    <main className="overflow-hidden bg-[#FAFAF7] text-[#111827]">
      <section className="relative mx-auto grid max-w-7xl gap-7 px-5 py-8 md:py-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(23rem,0.72fr)] lg:items-center">
        <div className="pointer-events-none absolute right-[-16rem] top-[-10rem] h-[32rem] w-[32rem] rounded-full bg-[#E8D391]/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase text-[#A88412]">{c.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">{c.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#4B5563]">{c.lead}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#B88400] px-5 text-sm font-bold text-white transition hover:bg-[#111827]" href={`/${locale}/articles`}>
              {c.cta} <ArrowRight size={16} />
            </Link>
            <a className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#E0D4B6] bg-white px-5 text-sm font-bold text-[#111827] transition hover:border-[#C8A227]" href="mailto:hello@coinradar.vn">
              <Mail size={16} /> {c.contact}
            </a>
          </div>
        </div>

        <aside className="relative h-[22rem] overflow-visible rounded-2xl border border-[#E7DFCF] bg-white shadow-[0_28px_70px_rgba(17,24,39,0.08)] [transform:perspective(900px)_rotateX(1deg)_rotateY(-3deg)] md:h-[24rem] lg:h-[25rem]">
          <CryptoSphere locale={locale} />
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="grid border-y border-[#D8D2C4] bg-white/75 backdrop-blur md:grid-cols-3">
          {c.metrics.map(([value, label], index) => (
            <div className="group relative overflow-hidden px-6 py-5 md:border-r md:border-[#E5DDCA] last:md:border-r-0" key={label}>
              <span className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 bg-[#C8A227] transition duration-500 group-hover:scale-x-100" />
              <p className="text-4xl font-semibold tracking-tight text-[#A88412]">{value}</p>
              <p className="mt-2 text-sm font-semibold text-[#111827]">{label}</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#667085]">{metricNotes[index]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="grid overflow-hidden border-y border-[#D8D2C4] bg-white lg:grid-cols-[19rem_minmax(0,1fr)]">
          <header className="border-b border-[#D8D2C4] p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#A88412]">Editorial system</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">{c.proofTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-[#667085]">{c.workflowTitle}</p>
          </header>
          <div className="divide-y divide-[#E7DFCF]">
            {c.principles.map(([title, text], index) => {
              const icons = [ShieldCheck, Newspaper, CheckCircle2];
              const Icon = icons[index] ?? ShieldCheck;
              return (
                <article className="group relative grid gap-4 px-6 py-5 transition duration-300 hover:bg-[#111827] hover:text-white md:grid-cols-[3rem_10rem_minmax(0,1fr)] md:items-center" key={title}>
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-[#C8A227] transition duration-300 group-hover:scale-y-100" />
                  <span className="text-xs font-bold tracking-[0.18em] text-[#A88412] transition group-hover:text-[#F5E7B3]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="inline-flex items-center gap-3 font-semibold">
                    <Icon className="size-5 text-[#A88412] transition group-hover:text-[#F5E7B3]" />
                    {title}
                  </span>
                  <span className="text-sm leading-7 text-[#667085] transition group-hover:text-white/72">{text}</span>
                </article>
              );
            })}
            {c.workflow.map(([title, text], index) => {
              const icons = [Layers3, FileCheck2, UsersRound, CheckCircle2];
              const Icon = icons[index] ?? CheckCircle2;
              return (
                <article className="group relative grid gap-4 px-6 py-5 transition duration-300 hover:bg-[#F8F3E4] md:grid-cols-[3rem_10rem_minmax(0,1fr)] md:items-center" key={title}>
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-[#111827] transition duration-300 group-hover:scale-y-100" />
                  <span className="text-xs font-bold tracking-[0.18em] text-[#A88412]">{String(index + c.principles.length + 1).padStart(2, "0")}</span>
                  <span className="inline-flex items-center gap-3 font-semibold">
                    <Icon className="size-5 text-[#111827]" />
                    {title}
                  </span>
                  <span className="text-sm leading-7 text-[#667085]">{text}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-12">
        <div className="relative overflow-hidden border border-[#111827] bg-[#0B111C] p-6 text-white shadow-[0_28px_72px_rgba(17,24,39,0.2)] md:p-8">
          <div className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-[#C8A227]/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
            <header>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5E7B3]">Audience map</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">{c.audienceTitle}</h2>
              <p className="mt-4 text-sm leading-7 text-white/62">Ba nhóm độc giả chính được tách thành các dải ưu tiên để nội dung phục vụ đúng nhu cầu đọc.</p>
            </header>
            <div className="grid gap-4">
              {c.audience.map(([title, text], index) => (
                <article className="group relative overflow-hidden border border-white/10 bg-white/[0.035] px-5 py-5 transition duration-300 hover:-translate-y-0.5 hover:border-[#F5E7B3]/60 hover:bg-white/[0.075] hover:shadow-[0_20px_54px_rgba(0,0,0,0.22)]" key={title}>
                  <span className="pointer-events-none absolute right-5 top-2 text-7xl font-semibold leading-none text-white/[0.035] transition group-hover:text-[#F5E7B3]/10">{String(index + 1).padStart(2, "0")}</span>
                  <div className="relative grid gap-3 md:grid-cols-[8rem_minmax(0,1fr)] md:items-center">
                    <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#F5E7B3]">Segment {String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{title}</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/68">{text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden border border-[#D8D2C4] bg-[#D8D2C4] md:grid-cols-4 md:auto-rows-[12rem]">
          <header className="bg-white p-6 md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A88412]">Coverage mosaic</p>
            <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight">{c.pillarsTitle}</h2>
          </header>
          {c.pillars.map(([title, text], index) => (
            <article
              className={`group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-0.5 ${
                index === 0
                  ? "flex flex-col bg-[#111827] text-white md:col-span-2 md:row-span-3"
                  : index === 1
                    ? "bg-[#F7F2E4]"
                    : index === 3
                      ? "bg-white md:col-span-2"
                      : "bg-white"
              }`}
              key={title}
            >
              <span className={`absolute right-5 top-4 text-5xl font-semibold leading-none ${index === 0 ? "text-white/10" : "text-[#C8A227]/18"}`}>{String(index + 1).padStart(2, "0")}</span>
              <Target className={`relative size-6 ${index === 0 ? "text-[#F5E7B3]" : "text-[#A88412]"}`} />
              <h3 className={`relative mt-6 text-xl font-semibold ${index === 0 ? "max-w-md text-3xl leading-tight" : ""}`}>{title}</h3>
              <p className={`relative mt-3 text-sm leading-7 ${index === 0 ? "max-w-xl text-white/68" : "text-[#667085]"}`}>{text}</p>
              {index === 0 ? (
                <div className="relative mt-8 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:grid-cols-[minmax(0,1.1fr)_minmax(11rem,0.8fr)]">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(245,231,179,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(245,231,179,0.06)_1px,transparent_1px)] bg-[size:2.75rem_2.75rem]" />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F5E7B3]">{marketPanel.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{marketPanel.subtitle}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {marketPanel.chips.map((chip) => (
                        <span className="rounded-full border border-[#F5E7B3]/25 bg-[#F5E7B3]/10 px-3 py-1 text-xs font-semibold text-[#F5E7B3]" key={chip}>
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="relative space-y-3 rounded-xl border border-white/10 bg-[#080D16]/70 p-3">
                    {marketPanel.rows.map(([pair, value, label], rowIndex) => (
                      <div className="text-xs" key={pair}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-white/82">{pair}</span>
                          <span className="font-bold text-[#86EFAC]">{value}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
                          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.06em] text-white/42">{label}</span>
                          <span className="relative h-2 overflow-hidden rounded-full bg-white/10">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#F5E7B3] to-[#C8A227]"
                            style={{ width: `${58 + rowIndex * 12}%` }}
                          />
                          <span className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <span className={`absolute inset-x-6 bottom-5 h-px origin-left scale-x-0 transition duration-500 group-hover:scale-x-100 ${index === 0 ? "bg-[#F5E7B3]" : "bg-[#C8A227]"}`} />
            </article>
          ))}
        </div>

        <div className="grid overflow-hidden border border-[#111827] bg-[#080B12] text-white lg:grid-cols-[17rem_minmax(0,1fr)]">
          <header className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F5E7B3]">Command rail</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">{c.guardrailsTitle}</h2>
            <div className="mt-6 h-px bg-gradient-to-r from-[#F5E7B3] to-transparent" />
          </header>
          <div className="p-4 md:p-6">
            <div className="border border-white/10 bg-black/30 font-mono text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-white/50">
                <span className="size-2 rounded-full bg-[#F87171]" />
                <span className="size-2 rounded-full bg-[#FBBF24]" />
                <span className="size-2 rounded-full bg-[#34D399]" />
                <span className="ml-2">coinradar/editorial-guardrails</span>
              </div>
              <ul className="divide-y divide-white/10">
                {c.guardrails.map((item, index) => (
                  <li className="group grid gap-3 px-4 py-4 transition duration-300 hover:bg-[#F5E7B3]/8 md:grid-cols-[5.5rem_minmax(0,1fr)_2rem] md:items-center" key={item}>
                    <span className="text-[#F5E7B3]">$ rule:{String(index + 1).padStart(2, "0")}</span>
                    <span className="leading-7 text-white/72 transition group-hover:text-white">{item}</span>
                    <CheckCircle2 className="size-5 text-[#F5E7B3]" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
