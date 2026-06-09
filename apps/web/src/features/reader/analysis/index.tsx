import type { Locale } from "@cmsauto/contracts";

import { ReaderScaffold } from "@/features/reader/scaffold";

import { getAnalysisCards } from "./adapter";

export async function AnalysisFeature({ locale }: { locale: Locale }) {
  return (
    <ReaderScaffold
      cards={await getAnalysisCards()}
      description="Các bài phân tích mock giúp người đọc theo dõi xu hướng, nhóm tài sản và dòng tiền trong thị trường Crypto."
      eyebrow="Analysis"
      locale={locale}
      title="Phân tích thị trường"
    />
  );
}
