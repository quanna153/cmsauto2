import { notFound } from "next/navigation";
import { AboutFeature } from "@/features/reader/about";
import { isLocale } from "@/features/reader/locale";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <AboutFeature locale={locale} />; }
