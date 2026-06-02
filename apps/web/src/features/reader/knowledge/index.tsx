import type { Locale } from "@cmsauto/contracts";
import { ReaderScaffold } from "@/features/reader/scaffold";
import { getKnowledgeCards } from "./adapter";
export async function KnowledgeFeature({ locale }: { locale: Locale }) { return <ReaderScaffold cards={await getKnowledgeCards()} description="Scaffold taxonomy kiến thức để team hoàn thiện card, filter và nội dung." eyebrow="Knowledge" locale={locale} title="Kiến thức" />; }
