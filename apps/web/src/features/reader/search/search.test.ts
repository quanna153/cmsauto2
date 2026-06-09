import { describe, expect, it, vi, afterEach } from "vitest";

import { searchArticles } from "./adapter";
import { searchMockArticles } from "./mock";

// Stub global fetch so unit tests run without a real API server.
// The adapter falls back to mock data when fetch throws.
function mockFetchFail() {
  vi.stubGlobal("fetch", () => Promise.reject(new Error("no server")));
}

function mockFetchSuccess(articles = searchMockArticles) {
  vi.stubGlobal(
    "fetch",
    () =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            articles,
            page: 1,
            pageSize: 50,
            total: articles.length,
          }),
      } as Response)
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchArticles — adapter", () => {
  it("returns empty array when query is blank", async () => {
    mockFetchSuccess();
    expect(await searchArticles("", "vi-vn")).toEqual([]);
    expect(await searchArticles("   ", "vi-vn")).toEqual([]);
  });

  it("matches articles by title (case-insensitive)", async () => {
    mockFetchSuccess();
    const results = await searchArticles("BITCOIN", "vi-vn");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (r) =>
          r.title.toLowerCase().includes("bitcoin") ||
          r.excerpt.toLowerCase().includes("bitcoin") ||
          r.primaryKeyword.toLowerCase().includes("bitcoin") ||
          r.secondaryKeywords.some((kw) => kw.toLowerCase().includes("bitcoin"))
      )
    ).toBe(true);
  });

  it("matches articles by excerpt", async () => {
    mockFetchSuccess();
    const results = await searchArticles("blockchain", "vi-vn");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns empty array when no article matches", async () => {
    mockFetchSuccess();
    const results = await searchArticles("xxxxnotexist", "vi-vn");
    expect(results).toEqual([]);
  });

  it("filters by locale — en-us results do not appear in vi-vn search", async () => {
    // API returns only vi-vn articles for this locale
    const viArticles = searchMockArticles.filter((a) => a.locale === "vi-vn");
    mockFetchSuccess(viArticles);
    const results = await searchArticles("bitcoin", "vi-vn");
    expect(results.every((r) => r.locale === "vi-vn")).toBe(true);
  });

  it("falls back to mock data when API is unavailable", async () => {
    mockFetchFail();
    // Should not throw; should return filtered mock results
    const results = await searchArticles("bitcoin", "vi-vn");
    expect(Array.isArray(results)).toBe(true);
  });

  it("matches by secondaryKeywords", async () => {
    mockFetchSuccess();
    const results = await searchArticles("smart contract", "vi-vn");
    expect(results.length).toBeGreaterThan(0);
  });
});
