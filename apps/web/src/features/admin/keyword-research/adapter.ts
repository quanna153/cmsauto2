import { postJson } from "@/lib/api";
import type { KeywordRefreshRequest, KeywordResearchRequest, KeywordResearchResponse } from "./model";

export async function suggestKeywords(input: KeywordResearchRequest) {
  return await postJson<KeywordResearchResponse>("/keywords/suggest", input);
}

export async function refreshKeywordVolumes(input: KeywordRefreshRequest) {
  return await postJson<KeywordResearchResponse>("/keywords/refresh-volume", input);
}
