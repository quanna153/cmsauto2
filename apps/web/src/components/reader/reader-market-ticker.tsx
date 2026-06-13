"use client";

import { useEffect, useMemo, useState } from "react";

import { publicApiUrl } from "@/lib/api";

type LiveMarketTicker = {
  pair: string;
  symbol: string;
  price: number;
  changePercent: number;
  checkedAt: string;
};

const tickerPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

const fallbackTickers: LiveMarketTicker[] = [
  { checkedAt: new Date(0).toISOString(), changePercent: 1.26, pair: "BTCUSDT", price: 68245.12, symbol: "BTC" },
  { checkedAt: new Date(0).toISOString(), changePercent: 0.85, pair: "ETHUSDT", price: 3782.45, symbol: "ETH" },
  { checkedAt: new Date(0).toISOString(), changePercent: -0.23, pair: "BNBUSDT", price: 607.11, symbol: "BNB" },
  { checkedAt: new Date(0).toISOString(), changePercent: 2.11, pair: "SOLUSDT", price: 175.34, symbol: "SOL" },
  { checkedAt: new Date(0).toISOString(), changePercent: 0.61, pair: "XRPUSDT", price: 0.5123, symbol: "XRP" }
];

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1 ? 2 : 4,
    minimumFractionDigits: value >= 1 ? 2 : 4
  })}`;
}

function formatCheckedAt(value: string | null) {
  if (!value) return "Đang cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Đang cập nhật";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function ReaderMarketTicker() {
  const [tickers, setTickers] = useState<LiveMarketTicker[]>(fallbackTickers);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let requestInFlight = false;

    async function loadTickerData() {
      if (requestInFlight) return;
      requestInFlight = true;

      try {
        const response = await fetch(publicApiUrl(`/public/markets/tickers?pairs=${encodeURIComponent(tickerPairs.join(","))}`), {
          cache: "no-store"
        });
        if (response.ok) {
          const payload = (await response.json()) as { tickers: LiveMarketTicker[] };
          if (!cancelled) {
            setTickers(payload.tickers);
            setLastCheckedAt(payload.tickers.find((ticker) => ticker.checkedAt)?.checkedAt ?? new Date().toISOString());
          }
        }
      } catch {
        // Keep the fallback row visible if the market API is temporarily unavailable.
      } finally {
        requestInFlight = false;
      }
    }

    void loadTickerData();
    const intervalId = window.setInterval(loadTickerData, 1_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const orderedTickers = useMemo(() => {
    const byPair = new Map(tickers.map((ticker) => [ticker.pair, ticker]));
    return tickerPairs.map((pair) => byPair.get(pair) ?? fallbackTickers.find((ticker) => ticker.pair === pair)!).filter(Boolean);
  }, [tickers]);

  return (
    <section className="border-b border-[#E5E7EB] bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-5 py-3 text-xs font-semibold text-[#64748B]">
        {orderedTickers.map((ticker) => {
          const positive = ticker.changePercent >= 0;

          return (
            <div className="flex shrink-0 items-center gap-2" key={ticker.pair}>
              <span className="text-[#64748B]">{ticker.symbol}/USDT</span>
              <span className="text-[#111827]">{formatUsd(ticker.price)}</span>
              <span className={positive ? "text-[#15803D]" : "text-[#DC2626]"}>
                {positive ? "▲" : "▼"} {Math.abs(ticker.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
        <span className="ml-auto shrink-0 rounded-md border border-[#E5E7EB] bg-[#FAFAF7] px-2 py-1 text-[11px] text-[#64748B]">VND</span>
        <span className="shrink-0 text-[11px] text-[#94A3B8]">Cập nhật: {formatCheckedAt(lastCheckedAt)}</span>
      </div>
    </section>
  );
}
