import type { Locale } from "@cmsauto/contracts";
import { ReaderScaffold } from "@/features/reader/scaffold";
import { getAboutCards } from "./adapter";
export async function AboutFeature({ locale }: { locale: Locale }) { return <ReaderScaffold cards={await getAboutCards()} description="Trang giới thiệu đã có sẵn cấu trúc để team hoàn thiện nội dung và hình ảnh." eyebrow="About" locale={locale} title="Về CMS Auto" />; }
