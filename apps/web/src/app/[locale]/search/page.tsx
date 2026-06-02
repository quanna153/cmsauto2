import { notFound } from "next/navigation";
import { SearchFeature } from "@/features/reader/search";
import { isLocale } from "@/features/reader/locale";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <SearchFeature locale={locale} />; }

