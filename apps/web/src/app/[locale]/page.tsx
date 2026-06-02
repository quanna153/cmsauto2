import { notFound } from "next/navigation";

import { ReaderHomeFeature } from "@/features/reader/home";
import { isLocale } from "@/features/reader/locale";

export default async function ReaderHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ReaderHomeFeature locale={locale} />;
}

