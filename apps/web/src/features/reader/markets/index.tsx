import type { Locale } from "@cmsauto/contracts";
import { ReaderScaffold } from "@/features/reader/scaffold";
import { getMarketCards } from "./adapter";
export async function MarketsFeature({ locale }: { locale: Locale }) { return <ReaderScaffold cards={await getMarketCards()} description="Scaffold trang thị trường. Thay mock adapter bằng data source trong task riêng." eyebrow="Markets" locale={locale} title="Thị trường" />; }
