import type { Locale } from "@cmsauto/contracts";

import { ReaderScaffold } from "@/features/reader/scaffold";

import { getKnowledgeCards } from "./adapter";

export async function KnowledgeFeature({ locale }: { locale: Locale }) {
  return (
    <ReaderScaffold
      cards={await getKnowledgeCards()}
      description="Các chủ đề nền tảng giúp người đọc làm quen với Crypto, blockchain và cách quan sát biểu đồ."
      eyebrow="Knowledge"
      locale={locale}
      title="Kiến thức Crypto"
    />
  );
}
