import type { KeywordResearchRow } from "./model";

export const researchRows: KeywordResearchRow[] = [
  { id: "bitcoin-la-gi", keyword: "bitcoin là gì", intent: "informational", cluster: "bitcoin", monthlyVolume: 12100, provider: "Google Suggest", checkedAt: null, status: "verified" },
  { id: "gia-bitcoin-hom-nay", keyword: "giá bitcoin hôm nay", intent: "commercial", cluster: "bitcoin", monthlyVolume: 8900, provider: "Mock volume", checkedAt: null, status: "verified" },
  { id: "cach-mua-bitcoin", keyword: "cách mua bitcoin", intent: "transactional", cluster: "bitcoin", monthlyVolume: 4400, provider: "Google Suggest", checkedAt: null, status: "verified" }
];
