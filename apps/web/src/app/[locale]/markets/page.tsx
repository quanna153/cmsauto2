import { notFound } from "next/navigation";
import { MarketsFeature } from "@/features/reader/markets";
import { isLocale } from "@/features/reader/locale";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <MarketsFeature locale={locale} />; }
