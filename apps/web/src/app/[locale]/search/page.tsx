import { notFound } from "next/navigation";

import { SearchFeature } from "@/features/reader/search";
import { isLocale } from "@/features/reader/locale";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { q } = await searchParams;
  return <SearchFeature locale={locale} query={q ?? ""} />;
}
