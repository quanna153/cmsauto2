export type ReaderMarketTickerItem = {
  pair: string;
  symbol: string;
  price: number;
  changePercent: number;
  volume24h?: number;
  checkedAt?: string;
  status?: "verified" | "fallback";
};

export type ReaderGlobalMarketStats = {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  ethDominance: number;
  stale: boolean;
  checkedAt: string;
};

export const readerTickerPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ARBUSDT", "FETUSDT", "OPUSDT", "SUIUSDT", "MKRUSDT"];

export const readerFallbackTickers: ReaderMarketTickerItem[] = [
  { changePercent: 0.19, pair: "BTCUSDT", price: 63702.12, symbol: "BTC", volume24h: 2_960_000_000 },
  { changePercent: 1.28, pair: "ETHUSDT", price: 3487.64, symbol: "ETH", volume24h: 1_740_000_000 },
  { changePercent: 0.74, pair: "BNBUSDT", price: 604.38, symbol: "BNB", volume24h: 620_000_000 },
  { changePercent: 2.43, pair: "SOLUSDT", price: 148.72, symbol: "SOL", volume24h: 910_000_000 },
  { changePercent: -0.61, pair: "XRPUSDT", price: 0.5234, symbol: "XRP", volume24h: 420_000_000 },
  { changePercent: 1.16, pair: "ARBUSDT", price: 0.8124, symbol: "ARB", volume24h: 180_000_000 },
  { changePercent: 3.08, pair: "FETUSDT", price: 1.284, symbol: "FET", volume24h: 210_000_000 },
  { changePercent: -0.37, pair: "OPUSDT", price: 1.742, symbol: "OP", volume24h: 150_000_000 },
  { changePercent: 2.05, pair: "SUIUSDT", price: 1.103, symbol: "SUI", volume24h: 190_000_000 },
  { changePercent: 0.92, pair: "MKRUSDT", price: 2341.8, symbol: "MKR", volume24h: 84_000_000 }
].map((ticker) => ({ ...ticker, checkedAt: new Date(0).toISOString(), status: "fallback" as const }));

export const readerFallbackGlobalStats: ReaderGlobalMarketStats = {
  btcDominance: 53.1,
  checkedAt: new Date(0).toISOString(),
  ethDominance: 17.8,
  stale: true,
  totalMarketCapUsd: 2_560_000_000_000,
  totalVolumeUsd: 98_420_000_000
};

export function mergeReaderTickers(pairs: string[], liveTickers: ReaderMarketTickerItem[] = []) {
  const fallbackByPair = new Map(readerFallbackTickers.map((ticker) => [ticker.pair, ticker]));
  const liveByPair = new Map(liveTickers.map((ticker) => [ticker.pair, { ...ticker, status: ticker.status ?? ("verified" as const) }]));

  return pairs.map((pair, index) => {
    const live = liveByPair.get(pair);
    if (live && Number.isFinite(live.price) && live.price > 0) return live;
    return fallbackByPair.get(pair) ?? {
      changePercent: index % 2 === 0 ? 0.8 : -0.4,
      checkedAt: new Date(0).toISOString(),
      pair,
      price: Math.max(0.01, 100 / (index + 1)),
      status: "fallback" as const,
      symbol: pair.replace(/USDT$/, "")
    };
  });
}

export function formatReaderUsd(value: number) {
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 100 ? 2 : value >= 1 ? 3 : 4,
    minimumFractionDigits: value >= 100 ? 2 : value >= 1 ? 2 : 4
  })}`;
}

export function formatReaderCompactUsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  return formatReaderUsd(value);
}
