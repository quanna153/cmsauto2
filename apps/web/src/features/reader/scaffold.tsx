import type { Locale } from "@cmsauto/contracts";

export function ReaderScaffold({ locale, eyebrow, title, description, cards }: { locale: Locale; eyebrow: string; title: string; description: string; cards: Array<{ title: string; description: string }> }) {
  return <main className="mx-auto max-w-6xl bg-[#F5F5F2] px-5 py-10"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A88412]">{eyebrow} · {locale}</p><h1 className="mt-3 text-4xl font-bold text-[#111827]">{title}</h1><p className="mt-3 max-w-2xl leading-7 text-[#4B5563]">{description}</p><div className="mt-8 grid gap-4 md:grid-cols-3">{cards.map((card) => <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-sm" key={card.title}><h2 className="font-bold text-[#111827]">{card.title}</h2><p className="mt-2 text-sm leading-6 text-[#4B5563]">{card.description}</p></article>)}</div></main>;
}
