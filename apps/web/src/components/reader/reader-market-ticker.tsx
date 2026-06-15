"use client";

import type { Locale } from "@cmsauto/contracts";
import { useEffect, useMemo, useState } from "react";

import { mergeReaderTickers, readerTickerPairs, type ReaderMarketTickerItem } from "@/features/reader/market-data";
import { publicApiUrl } from "@/lib/api";

const tickerPairs = readerTickerPairs.slice(0, 5);

const labels = {
  "vi-vn": {
    sample: "Dữ liệu mẫu",
    source: "Nguồn"
  },
  "en-us": {
    sample: "Sample data",
    source: "Source"
  }
} satisfies Record<Locale, Record<string, string>>;

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1 ? 2 : 4,
    minimumFractionDigits: value >= 1 ? 2 : 4
  })}`;
}

function coinIconUrl(symbol: string) {
  return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
}

function CoinLogo({ symbol }: { symbol: string }) {
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-[#E5E7EB]">
      <img
        alt={`${symbol} logo`}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
        src={coinIconUrl(symbol)}
      />
      <span className="hidden h-full w-full items-center justify-center bg-[#111827] text-xs font-semibold text-[#F5E7B3]">
        {symbol.slice(0, 1)}
      </span>
    </span>
  );
}

export function ReaderMarketTicker({ locale = "vi-vn" }: { locale?: Locale }) {
  const [tickers, setTickers] = useState<ReaderMarketTickerItem[]>(() => mergeReaderTickers(tickerPairs));
  const hasLiveData = tickers.some((ticker) => ticker.status !== "fallback");
  const copy = labels[locale];

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
          const payload = (await response.json()) as { tickers: ReaderMarketTickerItem[] };
          if (!cancelled) setTickers(mergeReaderTickers(tickerPairs, payload.tickers));
        }
      } catch {
        if (!cancelled) setTickers(mergeReaderTickers(tickerPairs));
      } finally {
        requestInFlight = false;
      }
    }

    void loadTickerData();
    const intervalId = window.setInterval(loadTickerData, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const marqueeItems = useMemo(() => [...tickers, ...tickers], [tickers]);

  return (
    <section className="relative w-full overflow-hidden border-y border-[#EFE7D6] bg-white">
      <div className="reader-ticker-track flex h-14 w-max items-center gap-10 whitespace-nowrap text-sm">
        {marqueeItems.map((ticker, index) => {
          const positive = ticker.changePercent >= 0;

          return (
            <div className="flex shrink-0 items-center gap-3 border-r border-[#EFE7D6] pr-8" key={`${ticker.pair}-${index}`}>
              <CoinLogo symbol={ticker.symbol} />
              <span className="font-semibold text-[#4B5563]">{ticker.symbol}/USDT</span>
              <span className="font-semibold text-[#111827]">{formatUsd(ticker.price)}</span>
              <span className={`font-semibold ${positive ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                {positive ? "▲" : "▼"} {Math.abs(ticker.changePercent).toFixed(2)}%
              </span>
            </div>
          );
        })}
        <span className="shrink-0 rounded-md border border-[#E5E7EB] bg-[#FAFAF7] px-2 py-1 text-xs font-semibold text-[#64748B]">
          {copy.source}: {hasLiveData ? "Binance/API" : copy.sample}
        </span>
      </div>
      <style>{`
        .reader-ticker-track {
          animation: reader-ticker-slide 92s linear infinite;
          will-change: transform;
        }

        @keyframes reader-ticker-slide {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
