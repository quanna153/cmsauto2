import type { Locale } from "@cmsauto/contracts";
import { Search } from "lucide-react";
import Link from "next/link";

import { localeCopy } from "@/features/reader/locale";

export function ReaderHeader({ locale }: { locale: Locale }) {
  const copy = localeCopy(locale);
  return <header className="border-b bg-[#172033] text-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4"><Link className="font-serif text-xl font-bold text-[#e4c865]" href={`/${locale}`}>{copy.brand}</Link><nav className="flex flex-wrap items-center gap-4 text-sm text-white/75"><Link href={`/${locale}/markets`}>{copy.markets}</Link><Link href={`/${locale}/knowledge`}>{copy.knowledge}</Link><Link href={`/${locale}/analysis`}>{copy.analysis}</Link><Link href={`/${locale}/articles`}>{copy.articles}</Link><Link aria-label={copy.search} href={`/${locale}/search`}><Search size={17} /></Link></nav></div></header>;
}

