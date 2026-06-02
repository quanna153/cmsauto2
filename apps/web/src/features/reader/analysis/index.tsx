import type { Locale } from "@cmsauto/contracts";
import { ReaderScaffold } from "@/features/reader/scaffold";
import { getAnalysisCards } from "./adapter";
export async function AnalysisFeature({ locale }: { locale: Locale }) { return <ReaderScaffold cards={await getAnalysisCards()} description="Scaffold trang phân tích. Team sửa module này mà không đụng homepage." eyebrow="Analysis" locale={locale} title="Phân tích" />; }
