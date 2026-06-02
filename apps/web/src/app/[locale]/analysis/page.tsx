import { notFound } from "next/navigation";
import { AnalysisFeature } from "@/features/reader/analysis";
import { isLocale } from "@/features/reader/locale";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <AnalysisFeature locale={locale} />; }
