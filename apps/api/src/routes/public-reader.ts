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
  volume24h: number;
  provider: "binance" | "fallback";
  status: "verified" | "fallback";
  checkedAt: string;
};

type MarketTickerResponse = {
  tickers: MarketTicker[];
  stale: boolean;
};

type GlobalMarketStatsResponse = {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  ethDominance: number;
  provider: "coingecko" | "fallback";
  stale: boolean;
  checkedAt: string;
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume?: string;
};

type CoinGeckoGlobalPayload = {
  data?: {
    total_market_cap?: { usd?: number };
    total_volume?: { usd?: number };
    market_cap_percentage?: { btc?: number; eth?: number };
  };
};

const defaultMarketPairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const marketCacheTtlMs = 1_000;
const marketCache = new Map<string, { expiresAt: number; response: MarketTickerResponse }>();
const topMarketCache = new Map<string, { expiresAt: number; response: MarketTickerResponse }>();
const globalMarketCacheTtlMs = 60_000;
let globalMarketCache: { expiresAt: number; response: GlobalMarketStatsResponse } | null = null;
const fallbackMarketData: Record<string, { symbol: string; price: number; changePercent: number; volume24h: number }> = {
  BTCUSDT: { symbol: "BTC", price: 107240, changePercent: 2.14, volume24h: 32_710_000_000 },
  ETHUSDT: { symbol: "ETH", price: 3841, changePercent: 1.87, volume24h: 18_970_000_000 },
  SOLUSDT: { symbol: "SOL", price: 175.2, changePercent: 3.21, volume24h: 2_830_000_000 },
  USDCUSDT: { symbol: "USDC", price: 1, changePercent: 0.01, volume24h: 1_000_000_000 },
  BNBUSDT: { symbol: "BNB", price: 682, changePercent: 0.56, volume24h: 1_680_000_000 },
  XRPUSDT: { symbol: "XRP", price: 0.618, changePercent: -1.22, volume24h: 1_240_000_000 },
  DOGEUSDT: { symbol: "DOGE", price: 0.1412, changePercent: 1.83, volume24h: 1_080_000_000 },
  AVAXUSDT: { symbol: "AVAX", price: 24.18, changePercent: 3.24, volume24h: 558_670_000 },
  TONUSDT: { symbol: "TON", price: 6.82, changePercent: -0.18, volume24h: 276_430_000 },
  TRXUSDT: { symbol: "TRX", price: 0.28, changePercent: -0.56, volume24h: 500_000_000 },
  HYPEUSDT: { symbol: "HYPE", price: 35.2, changePercent: 2.32, volume24h: 350_000_000 }
};
const fallbackGlobalMarketStats = {
  totalMarketCapUsd: 2_560_000_000_000,
  totalVolumeUsd: 98_420_000_000,
  btcDominance: 53.1,
  ethDominance: 17.8
};
const excludedTopMarketBases = new Set(["USDC", "FDUSD", "TUSD", "USDP", "BUSD", "DAI", "USDE", "USD1", "USDS", "PYUSD", "EUR", "TRY", "BRL"]);

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
    changePercent: 0,
    volume24h: 0
  };

  return {
    pair,
    symbol: fallback.symbol,
    price: fallback.price,
    changePercent: fallback.changePercent,
    volume24h: fallback.volume24h,
    provider: "fallback",
    status: "fallback",
    checkedAt
  };
}

function mapBinanceTicker(pair: string, payload: BinanceTicker | undefined, checkedAt: string): MarketTicker {
  const price = Number(payload?.lastPrice);
  const changePercent = Number(payload?.priceChangePercent);
  const volume24h = Number(payload?.quoteVolume);

  if (!payload || !Number.isFinite(price) || !Number.isFinite(changePercent)) {
    return fallbackTicker(pair, checkedAt);
  }

  return {
    pair,
    symbol: pairToSymbol(pair),
    price,
    changePercent,
    volume24h: Number.isFinite(volume24h) ? volume24h : 0,
    provider: "binance",
    status: "verified",
    checkedAt
  };
}

function isTopMarketCandidate(payload: BinanceTicker) {
  const symbol = payload.symbol.toUpperCase();
  const base = pairToSymbol(symbol);
  const price = Number(payload.lastPrice);
  const quoteVolume = Number(payload.quoteVolume);

  return symbol.endsWith("USDT")
    && !excludedTopMarketBases.has(base)
    && Number.isFinite(price)
    && price > 0
    && Number.isFinite(quoteVolume)
    && quoteVolume > 0;
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

export async function readTopMarketTickers(
  limit: number,
  fetcher: typeof fetch = fetch
): Promise<MarketTickerResponse> {
  const normalizedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const cacheKey = String(normalizedLimit);
  const cached = topMarketCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.response;
  }

  const checkedAt = new Date().toISOString();
  let response: MarketTickerResponse;

  try {
    const binanceResponse = await fetcher("https://api.binance.com/api/v3/ticker/24hr", {
      signal: AbortSignal.timeout(8_000)
    });
    if (!binanceResponse.ok) {
      throw new Error(`Binance API returned ${binanceResponse.status}.`);
    }

    const payload = await binanceResponse.json() as BinanceTicker[];
    const tickers = payload
      .filter(isTopMarketCandidate)
      .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))
      .slice(0, normalizedLimit)
      .map((item) => mapBinanceTicker(item.symbol, item, checkedAt));

    if (tickers.length === 0) {
      throw new Error("Binance top market payload is empty.");
    }

    response = {
      tickers,
      stale: tickers.some((ticker) => ticker.status === "fallback")
    };
  } catch {
    const fallbackPairs = Object.keys(fallbackMarketData)
      .filter((pair) => pair.endsWith("USDT"))
      .slice(0, normalizedLimit);
    response = {
      tickers: fallbackPairs.map((pair) => fallbackTicker(pair, checkedAt)),
      stale: true
    };
  }

  topMarketCache.set(cacheKey, { expiresAt: Date.now() + marketCacheTtlMs, response });
  return response;
}

export async function readGlobalMarketStats(
  fetcher: typeof fetch = fetch
): Promise<GlobalMarketStatsResponse> {
  if (globalMarketCache && globalMarketCache.expiresAt > Date.now()) {
    return globalMarketCache.response;
  }

  const checkedAt = new Date().toISOString();
  let response: GlobalMarketStatsResponse;

  try {
    const globalResponse = await fetcher("https://api.coingecko.com/api/v3/global", {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8_000)
    });
    if (!globalResponse.ok) {
      throw new Error(`CoinGecko API returned ${globalResponse.status}.`);
    }

    const payload = await globalResponse.json() as CoinGeckoGlobalPayload;
    const totalMarketCapUsd = Number(payload.data?.total_market_cap?.usd);
    const totalVolumeUsd = Number(payload.data?.total_volume?.usd);
    const btcDominance = Number(payload.data?.market_cap_percentage?.btc);
    const ethDominance = Number(payload.data?.market_cap_percentage?.eth);

    if (![totalMarketCapUsd, totalVolumeUsd, btcDominance, ethDominance].every(Number.isFinite)) {
      throw new Error("CoinGecko global payload is incomplete.");
    }

    response = {
      totalMarketCapUsd,
      totalVolumeUsd,
      btcDominance,
      ethDominance,
      provider: "coingecko",
      stale: false,
      checkedAt
    };
  } catch {
    response = {
      ...fallbackGlobalMarketStats,
      provider: "fallback",
      stale: true,
      checkedAt
    };
  }

  globalMarketCache = { expiresAt: Date.now() + globalMarketCacheTtlMs, response };
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

publicReaderRouter.get("/markets/top-tickers", async (request, response, next) => {
  try {
    response.json(await readTopMarketTickers(parsePositiveInteger(request.query.limit, 100, 100)));
  } catch (error) {
    next(error);
  }
});

publicReaderRouter.get("/markets/global", async (_request, response, next) => {
  try {
    response.json(await readGlobalMarketStats());
  } catch (error) {
    next(error);
  }
});
