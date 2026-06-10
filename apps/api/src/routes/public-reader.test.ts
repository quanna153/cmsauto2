import { describe, expect, it } from "vitest";

import {
  filterPublishedArticlesForSearch,
  paginatePublishedArticles,
  readMarketTickers
} from "./public-reader.js";
import type { PublishedArticle } from "../types.js";

function article(overrides: Partial<PublishedArticle>): PublishedArticle {
  const now = new Date("2026-01-01T00:00:00.000Z").toISOString();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    articleId: overrides.articleId ?? crypto.randomUUID(),
    articleSection: "articles",
    slug: overrides.slug ?? "bitcoin-la-gi",
    locale: overrides.locale ?? "vi-vn",
    language: overrides.language ?? "vi",
    title: overrides.title ?? "Bitcoin là gì?",
    excerpt: overrides.excerpt ?? "Giải thích bitcoin cho người mới.",
    metaTitle: overrides.metaTitle ?? "Bitcoin là gì?",
    metaDescription: overrides.metaDescription ?? "Tìm hiểu blockchain và bitcoin.",
    markdown: overrides.markdown ?? "# Bitcoin",
    publishedAt: overrides.publishedAt ?? now,
    livePath: overrides.livePath ?? "/vi-vn/bitcoin-la-gi",
    internalLinks: overrides.internalLinks ?? [],
    primaryKeyword: overrides.primaryKeyword ?? "bitcoin",
    secondaryKeywords: overrides.secondaryKeywords ?? ["blockchain"],
    ...overrides
  };
}

describe("public reader search helpers", () => {
  it("matches normalized Vietnamese text across reader article fields", () => {
    const results = filterPublishedArticlesForSearch([
      article({ title: "Dự báo giá Chainlink năm 2026", primaryKeyword: "chainlink" }),
      article({ title: "Bitcoin cho người mới", secondaryKeywords: ["ví lạnh", "quản trị rủi ro"] })
    ], "du bao gia");

    expect(results).toHaveLength(1);
    expect(results[0]?.primaryKeyword).toBe("chainlink");
  });

  it("returns an empty result for blank queries", () => {
    expect(filterPublishedArticlesForSearch([article({})], "   ")).toEqual([]);
  });

  it("paginates search results predictably", () => {
    const items = ["a", "b", "c", "d"];
    expect(paginatePublishedArticles(items, 2, 2)).toEqual(["c", "d"]);
    expect(paginatePublishedArticles(items, 3, 2)).toEqual([]);
  });
});

describe("market ticker proxy helpers", () => {
  it("maps Binance responses into stable public ticker data", async () => {
    const fetcher: typeof fetch = async () => new Response(JSON.stringify([
      { symbol: "BTCUSDT", lastPrice: "108000.50", priceChangePercent: "2.25" }
    ]), { status: 200 });

    const result = await readMarketTickers(["BTCUSDT"], fetcher);

    expect(result.stale).toBe(false);
    expect(result.tickers[0]).toMatchObject({
      pair: "BTCUSDT",
      symbol: "BTC",
      price: 108000.5,
      changePercent: 2.25,
      provider: "binance",
      status: "verified"
    });
  });

  it("returns fallback tickers when the provider fails", async () => {
    const fetcher: typeof fetch = async () => {
      throw new Error("network unavailable");
    };

    const result = await readMarketTickers(["TESTUSDT"], fetcher);

    expect(result.stale).toBe(true);
    expect(result.tickers[0]).toMatchObject({
      pair: "TESTUSDT",
      symbol: "TEST",
      provider: "fallback",
      status: "fallback"
    });
  });
});
