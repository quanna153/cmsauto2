import { notFound } from "next/navigation";
import { KnowledgeFeature } from "@/features/reader/knowledge";
import { isLocale } from "@/features/reader/locale";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <KnowledgeFeature locale={locale} />; }
