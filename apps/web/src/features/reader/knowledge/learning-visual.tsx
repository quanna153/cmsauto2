import type { Locale } from "@cmsauto/contracts";
import { BookOpenText, DatabaseZap, ShieldCheck } from "lucide-react";

const visualCopy = {
  "vi-vn": {
    label: "Knowledge atlas",
    title: "Crypto map",
    layers: ["Nền tảng", "Dữ liệu", "Rủi ro"]
  },
  "en-us": {
    label: "Knowledge atlas",
    title: "Crypto map",
    layers: ["Basics", "Data", "Risk"]
  }
} satisfies Record<Locale, {
  label: string;
  layers: string[];
  title: string;
}>;

const icons = [BookOpenText, DatabaseZap, ShieldCheck];

export function LearningVisual({ locale }: { locale: Locale }) {
  const c = visualCopy[locale];

  return (
    <div className="relative h-full min-h-[27rem] overflow-visible">
      <div className="pointer-events-none absolute inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_42%_42%,rgba(200,162,39,0.22),transparent_42%)] blur-2xl" />

      <div className="relative top-4 min-h-[25rem] overflow-hidden rounded-[1.75rem] border border-[#1F2937]/15 bg-[#111827] p-5 text-white shadow-[0_34px_80px_rgba(17,24,39,0.18)] md:left-4">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(245,231,179,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(245,231,179,0.06)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        <div className="pointer-events-none absolute -right-24 top-8 z-0 size-72 rounded-full border border-[#F5E7B3]/16" />
        <div className="pointer-events-none absolute right-10 top-16 z-0 size-44 rounded-full border border-dashed border-[#F5E7B3]/18" />
        <div className="pointer-events-none absolute right-28 top-32 z-0 size-16 rounded-full bg-[#F5E7B3]/14 blur-xl" />

        <div className="relative z-10 flex items-start justify-between gap-5">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#F5E7B3]">{c.label}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-none">{c.title}</h2>
          </div>
          <span className="rounded-full border border-[#F5E7B3]/20 bg-[#F5E7B3]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#F5E7B3]">
            2026
          </span>
        </div>

        <div className="relative z-10 mt-7 grid gap-3">
          {c.layers.map((layer, index) => {
            const Icon = icons[index] ?? BookOpenText;

            return (
              <div className="group grid grid-cols-[3.25rem_minmax(0,1fr)_3rem] items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.07] p-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#F5E7B3]/45" key={layer}>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F5E7B3] text-[#111827] shadow-[0_14px_34px_rgba(245,231,179,0.15)]">
                  <Icon size={21} />
                </span>
                <span className="text-lg font-semibold">{layer}</span>
                <span className="text-right text-3xl font-black tabular-nums text-white/16">0{index + 1}</span>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-5 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#F5E7B3]/42 to-transparent" />
      </div>
    </div>
  );
}
