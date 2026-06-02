import { notFound } from "next/navigation";

import { ReaderFooter } from "@/components/reader/reader-footer";
import { ReaderHeader } from "@/components/reader/reader-header";
import { isLocale } from "@/features/reader/locale";

export default async function ReaderLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <><ReaderHeader locale={locale} />{children}<ReaderFooter locale={locale} /></>;
}

