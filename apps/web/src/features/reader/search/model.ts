import type { ReaderArticle } from "@/features/reader/model";

/**
 * SearchResult re-exports ReaderArticle so the search feature
 * can swap to a real API later without changing component types.
 */
export type SearchResult = ReaderArticle;

export type SearchState =
  | { status: "idle" }
  | { status: "results"; results: SearchResult[] }
  | { status: "empty"; query: string };
