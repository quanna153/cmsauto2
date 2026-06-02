import { notFound } from "next/navigation";
import { ReaderArticlesFeature } from "@/features/reader/articles";
import { isLocale } from "@/features/reader/locale";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <ReaderArticlesFeature locale={locale} />; }
