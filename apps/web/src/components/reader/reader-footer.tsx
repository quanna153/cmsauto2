import type { Locale } from "@cmsauto/contracts";
import Link from "next/link";

import { localeCopy } from "@/features/reader/locale";

export function ReaderFooter({ locale }: { locale: Locale }) {
  const copy = localeCopy(locale);
  return <footer className="mt-16 border-t bg-white"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-5 py-8 text-sm text-[#687386] sm:flex-row"><span>© 2026 {copy.brand}</span><div className="flex gap-4"><Link href={`/${locale}`}>{copy.home}</Link><Link href={`/${locale}/about`}>{copy.about}</Link></div></div></footer>;
}

