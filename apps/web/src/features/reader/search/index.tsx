import type { Locale } from "@cmsauto/contracts";
import { ReaderScaffold } from "@/features/reader/scaffold";
import { getSearchMock } from "./adapter";
export async function SearchFeature({ locale }: { locale: Locale }) { return <ReaderScaffold cards={await getSearchMock()} description="Scaffold trang tìm kiếm. Task riêng sẽ nối query param, API và empty state." eyebrow="Search" locale={locale} title="Tìm kiếm bài viết" />; }
