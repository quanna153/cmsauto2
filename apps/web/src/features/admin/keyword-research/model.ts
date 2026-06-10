export type KeywordResearchLanguage = "vi" | "en";

export type KeywordResearchIntent = "informational" | "commercial" | "comparison" | "transactional";

export type KeywordResearchRow = {
  id: string;
  keyword: string;
  intent: KeywordResearchIntent;
  cluster: string;
  monthlyVolume: number | null;
  provider: string;
  checkedAt: string | null;
  status: "verified" | "missing" | "failed";
};

export type KeywordResearchRequest = {
  seedKeyword: string;
  language: KeywordResearchLanguage;
  prompt: string;
};

export type KeywordRefreshRequest = {
  language: KeywordResearchLanguage;
  keywordIdeas: Array<Pick<KeywordResearchRow, "id" | "keyword" | "intent" | "cluster">>;
};

export type KeywordResearchResponse = {
  keywordIdeas: KeywordResearchRow[];
  recordId?: string;
};
