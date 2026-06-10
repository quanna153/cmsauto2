import { Router } from "express";
import { localeSchema } from "@cmsauto/contracts";

import { readPublishedArticleBySlug, readPublishedArticles } from "../store.js";
import type { PublishedArticle } from "../types.js";

export const publicReaderRouter = Router();

type MarketTicker = {
  pair: string;
  symbol: string;
  price: number;
  changePercent: number;
  provider: "binance" | "fallback";
  status: "verified" | "fallback";
  checkedAt: string;
};

type MarketTickerResponse = {
  tickers: MarketTicker[];
  stale: boolean;
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
};

const defaultMarketPairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const marketCacheTtlMs = 30_000;
const marketCache = new Map<string, { expiresAt: number; response: MarketTickerResponse }>();
const fallbackMarketData: Record<string, { symbol: string; price: number; changePercent: number }> = {
  BTCUSDT: { symbol: "BTC", price: 107240, changePercent: 2.14 },
  ETHUSDT: { symbol: "ETH", price: 3841, changePercent: 1.87 },
  SOLUSDT: { symbol: "SOL", price: 175.2, changePercent: 3.21 },
  USDCUSDT: { symbol: "USDC", price: 1, changePercent: 0.01 },
  BNBUSDT: { symbol: "BNB", price: 682, changePercent: 0.56 },
  XRPUSDT: { symbol: "XRP", price: 0.618, changePercent: -1.22 },
  TRXUSDT: { symbol: "TRX", price: 0.28, changePercent: -0.56 },
  HYPEUSDT: { symbol: "HYPE", price: 35.2, changePercent: 2.32 }
};

function parsePositiveInteger(value: unknown, fallback: number, max: number) {
  const numberValue = Number(value ?? fallback);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(1, Math.floor(numberValue)));
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}

export function filterPublishedArticlesForSearch(articles: PublishedArticle[], query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  return articles.filter((article) => {
    const searchableText = [
      article.title,
      article.excerpt,
      article.metaTitle,
      article.metaDescription,
      article.primaryKeyword,
      ...article.secondaryKeywords
    ].map(normalizeSearchText).join(" ");

    return searchableText.includes(normalizedQuery);
  });
}

export function paginatePublishedArticles<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function pairToSymbol(pair: string) {
  return pair.replace(/(?:USDT|USDC|USD|BTC|ETH)$/u, "") || pair;
}

function normalizeMarketPairs(rawPairs: unknown) {
  const input = typeof rawPairs === "string" && rawPairs.trim()
    ? rawPairs.split(",")
    : defaultMarketPairs;
  const pairs = input
    .map((pair) => pair.trim().toUpperCase())
    .filter((pair, index, allPairs) =>
      /^[A-Z0-9]{3,24}$/u.test(pair) && allPairs.indexOf(pair) === index
    )
    .slice(0, 100);

  return pairs.length > 0 ? pairs : defaultMarketPairs;
}

function fallbackTicker(pair: string, checkedAt: string): MarketTicker {
  const fallback = fallbackMarketData[pair] ?? {
    symbol: pairToSymbol(pair),
    price: 0,
    changePercent: 0
  };

  return {
    pair,
    symbol: fallback.symbol,
    price: fallback.price,
    changePercent: fallback.changePercent,
    provider: "fallback",
    status: "fallback",
    checkedAt
  };
}

function mapBinanceTicker(pair: string, payload: BinanceTicker | undefined, checkedAt: string): MarketTicker {
  const price = Number(payload?.lastPrice);
  const changePercent = Number(payload?.priceChangePercent);

  if (!payload || !Number.isFinite(price) || !Number.isFinite(changePercent)) {
    return fallbackTicker(pair, checkedAt);
  }

  return {
    pair,
    symbol: pairToSymbol(pair),
    price,
    changePercent,
    provider: "binance",
    status: "verified",
    checkedAt
  };
}

export async function readMarketTickers(
  pairs: string[],
  fetcher: typeof fetch = fetch
): Promise<MarketTickerResponse> {
  const normalizedPairs = normalizeMarketPairs(pairs.join(","));
  const cacheKey = normalizedPairs.join(",");
  const cached = marketCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response;
  }

  const checkedAt = new Date().toISOString();
  let response: MarketTickerResponse;

  try {
    const binanceResponse = await fetcher(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(normalizedPairs))}`,
      { signal: AbortSignal.timeout(8_000) }
    );
    if (!binanceResponse.ok) {
      throw new Error(`Binance API returned ${binanceResponse.status}.`);
    }

    const payload = await binanceResponse.json() as BinanceTicker[];
    const byPair = new Map(payload.map((item) => [item.symbol, item]));
    const tickers = normalizedPairs.map((pair) => mapBinanceTicker(pair, byPair.get(pair), checkedAt));
    response = {
      tickers,
      stale: tickers.some((ticker) => ticker.status === "fallback")
    };
  } catch {
    response = {
      tickers: normalizedPairs.map((pair) => fallbackTicker(pair, checkedAt)),
      stale: true
    };
  }

  marketCache.set(cacheKey, { expiresAt: Date.now() + marketCacheTtlMs, response });
  return response;
}

publicReaderRouter.get("/articles", async (request, response, next) => {
  try {
    const locale = localeSchema.parse(request.query.locale ?? "vi-vn");
    const page = parsePositiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = parsePositiveInteger(request.query.pageSize, 20, 100);
    const articles = await readPublishedArticles(locale);
    response.json({
      articles: paginatePublishedArticles(articles, page, pageSize),
      page,
      pageSize,
      total: articles.length
    });
  } catch (error) {
    next(error);
  }
});

publicReaderRouter.get("/articles/search", async (request, response, next) => {
  try {
    const locale = localeSchema.parse(request.query.locale ?? "vi-vn");
    const page = parsePositiveInteger(request.query.page, 1, Number.MAX_SAFE_INTEGER);
    const pageSize = parsePositiveInteger(request.query.pageSize, 20, 50);
    const query = typeof request.query.q === "string" ? request.query.q : "";
    const articles = filterPublishedArticlesForSearch(await readPublishedArticles(locale), query);
    response.json({
      articles: paginatePublishedArticles(articles, page, pageSize),
      page,
      pageSize,
      total: articles.length
    });
  } catch (error) {
    next(error);
  }
});

publicReaderRouter.get("/articles/:locale/:slug", async (request, response, next) => {
  try {
    const locale = localeSchema.parse(request.params.locale);
    const article = await readPublishedArticleBySlug(locale, request.params.slug);
    if (!article) {
      response.status(404).json({ error: "Không tìm thấy bài viết." });
      return;
    }
    response.json({ article });
  } catch (error) {
    next(error);
  }
});

publicReaderRouter.get("/markets/tickers", async (request, response, next) => {
  try {
    response.json(await readMarketTickers(normalizeMarketPairs(request.query.pairs)));
  } catch (error) {
    next(error);
  }
});
