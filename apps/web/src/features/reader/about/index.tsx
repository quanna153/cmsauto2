import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, BarChart3, Clock3, Newspaper } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { getAboutCards } from "./adapter";

function href(locale: Locale, path: string) {
  return `/${locale}${path}`;
}

function InfoPill({
  align = "left",
  description,
  icon,
  title
}: {
  align?: "left" | "right";
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div
      className={`absolute z-10 w-[13.5rem] rounded-lg border border-[#e3edf7] bg-white/95 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.16)] backdrop-blur ${
        align === "left" ? "left-0 top-[5.2rem]" : "right-0 top-4"
      }`}
    >
      <div className="flex gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#e8f8ff] text-[#24aee4]">{icon}</span>
        <span>
          <strong className="block text-sm font-semibold text-[#111633]">{title}</strong>
          <span className="mt-2 block text-xs leading-5 text-[#687386]">{description}</span>
        </span>
      </div>
    </div>
  );
}

export async function AboutFeature({ locale }: { locale: Locale }) {
  const cards = await getAboutCards();

  return (
    <main className="bg-white text-[#111633]">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.72fr)] lg:items-center lg:py-20">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#24aee4]">Tầm nhìn CoinRadar</p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-normal text-[#111633] sm:text-5xl lg:text-[3.35rem]">
            <span className="text-[#24aee4]">Tầm nhìn</span> - Kết nối người Việt với dòng chảy tài chính số toàn cầu.
          </h1>
          <div className="mt-7 max-w-3xl space-y-5 text-base leading-8 text-[#5f6f82] sm:text-lg sm:leading-9">
            <p>
              CoinRadar hướng tới trở thành nền tảng truyền thông và dữ liệu crypto uy tín dành cho cộng đồng nhà đầu tư Việt, đóng vai trò cầu nối
              giữa người dùng với công nghệ blockchain, Web3 và thị trường tài chính số toàn cầu.
            </p>
            <p>
              Trong dài hạn, CoinRadar mong muốn góp phần xây dựng một cộng đồng nhà đầu tư có kiến thức, tư duy độc lập và khả năng thích nghi với
              những thay đổi của nền kinh tế số; đồng thời trở thành điểm đến thông tin đáng tin cậy cho những ai muốn theo dõi, nghiên cứu và khám phá
              thị trường crypto một cách chuyên nghiệp.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-md bg-[#0f4fe6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d43c4]"
              href={href(locale, "/markets")}
            >
              Xem thị trường <ArrowRight size={16} />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-[#d8e2ef] px-5 py-3 text-sm font-semibold text-[#111633] transition hover:border-[#24aee4] hover:text-[#0f4fe6]"
              href={href(locale, "/knowledge")}
            >
              Khám phá kiến thức <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto min-h-[22rem] w-full max-w-[34rem] lg:min-h-[30rem]" aria-hidden="true">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full border-t-[3px] border-[#2eaaf4]" />
          <InfoPill
            description="Tổng hợp và phân tích tự động, có chọn lọc bởi đội ngũ biên tập."
            icon={<Newspaper size={17} />}
            title="100+ nguồn tin"
          />
          <InfoPill
            align="right"
            description="Cập nhật giá, ETF, dòng tiền và tin tức thị trường."
            icon={<BarChart3 size={17} />}
            title="24/7"
          />
          <div className="absolute bottom-0 right-4 h-[22rem] w-[22rem] overflow-hidden rounded-full bg-[#eaf4fb] shadow-[0_22px_60px_rgba(36,174,228,0.2)] sm:h-[27rem] sm:w-[27rem] lg:h-[30rem] lg:w-[30rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(36,174,228,0.5)_0,rgba(36,174,228,0.18)_18%,transparent_32%)]" />
            <div className="absolute -left-8 top-10 h-56 w-36 rotate-[-18deg] rounded-[55%] bg-[radial-gradient(circle,#2d68ad_1.8px,transparent_2px)] [background-size:8px_8px] opacity-75" />
            <div className="absolute right-12 top-8 h-64 w-44 rotate-[12deg] rounded-[50%] bg-[radial-gradient(circle,#2d68ad_1.8px,transparent_2px)] [background-size:8px_8px] opacity-75" />
            <div className="absolute bottom-12 left-14 h-36 w-40 rotate-[24deg] rounded-[50%] bg-[radial-gradient(circle,#2d68ad_1.8px,transparent_2px)] [background-size:8px_8px] opacity-70" />
            <div className="absolute bottom-6 right-8 h-52 w-24 rotate-[16deg] rounded-[50%] bg-[radial-gradient(circle,#2d68ad_1.8px,transparent_2px)] [background-size:8px_8px] opacity-70" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-14 md:grid-cols-3">
        {cards.map((card) => (
          <article className="rounded-lg border border-[#dbe5f0] bg-[#f8fbff] p-5" key={card.title}>
            <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-white text-[#0f4fe6] shadow-sm">
              <Clock3 size={18} />
            </div>
            <h2 className="text-base font-semibold text-[#111633]">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#687386]">{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
