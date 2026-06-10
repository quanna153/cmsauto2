"use client";

import { BarChart3, ChartNoAxesCombined } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { publicApiUrl } from "@/lib/api";

type QuickCoin = {
  symbol: "BTC" | "ETH" | "SOL";
  pair: string;
  price: number;
  change: number;
};

type MarketTicker = {
  pair: string;
  price: number;
  changePercent: number;
};

const fallbackCoins: QuickCoin[] = [
  { symbol: "BTC", pair: "BTCUSDT", price: 63808, change: 2.71 },
  { symbol: "ETH", pair: "ETHUSDT", price: 1692.07, change: 3.75 },
  { symbol: "SOL", pair: "SOLUSDT", price: 67.3, change: 3.65 }
];

function formatPrice(price: number) {
  return price.toLocaleString("en-US", {
    maximumFractionDigits: price >= 100 ? 2 : 2,
    minimumFractionDigits: price >= 100 ? 2 : 2
  });
}

function MiniSparkline({ leadPrice }: { leadPrice: number }) {
  return (
    <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 420 150">
      <defs>
        <linearGradient id="quick-watch-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C8A227" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C8A227" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <g stroke="#dbe9e1" strokeWidth="1">
        {[30, 60, 90, 120].map((y) => (
          <line key={y} x1="0" x2="420" y1={y} y2={y} />
        ))}
        {[54, 108, 162, 216, 270, 324, 378].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="150" />
        ))}
      </g>
      <path d="M0 132 C42 120 58 137 98 105 C142 68 166 88 210 72 C254 56 284 66 326 36 C362 8 390 6 420 24 L420 150 L0 150 Z" fill="url(#quick-watch-fill)" />
      <path d="M0 132 C42 120 58 137 98 105 C142 68 166 88 210 72 C254 56 284 66 326 36 C362 8 390 6 420 24" fill="none" stroke="#C8A227" strokeLinecap="round" strokeWidth="3" />
      <g transform="translate(0 34)">
        <rect fill="#ffffff" height="18" rx="4" stroke="#C8A227" width="72" x="0" y="-9" />
        <text fill="#A88412" fontSize="10" fontWeight="600" x="7" y="4">
          {formatPrice(leadPrice)}
        </text>
        <circle cx="82" cy="0" fill="#C8A227" r="4" stroke="#111827" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function QuickMarketWatch() {
  const [coins, setCoins] = useState<QuickCoin[]>(fallbackCoins);

  useEffect(() => {
    let cancelled = false;

    async function loadPrices() {
      try {
        const pairs = fallbackCoins.map((coin) => coin.pair).join(",");
        const response = await fetch(publicApiUrl(`/public/markets/tickers?pairs=${encodeURIComponent(pairs)}`));
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { tickers: MarketTicker[] };
        if (cancelled) {
          return;
        }

        setCoins((current) =>
          current.map((coin) => {
            const live = payload.tickers.find((item) => item.pair === coin.pair);
            if (!live) {
              return coin;
            }

            return {
              ...coin,
              change: live.changePercent,
              price: live.price
            };
          })
        );
      } catch {
        // Giữ fallback để card không bị trắng khi API thị trường tạm giới hạn.
      }
    }

    void loadPrices();
    const intervalId = window.setInterval(loadPrices, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const leadPrice = coins[0]?.price ?? fallbackCoins[0].price;
  const summary = useMemo(() => {
    const strongest = coins.reduce((best, coin) => (coin.change > best.change ? coin : best), coins[0] ?? fallbackCoins[0]);
    return `${strongest.symbol} đang dẫn nhịp với ${strongest.change >= 0 ? "+" : ""}${strongest.change.toFixed(2)}% trong 24 giờ.`;
  }, [coins]);

  return (
    <article className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF7] p-4 shadow-[0_18px_44px_rgba(17,24,39,0.06)]">
      <div className="mb-4 flex items-center gap-2 text-[#111827]">
        <ChartNoAxesCombined size={19} strokeWidth={2} />
        <h3 className="text-lg font-medium">Theo dõi nhanh</h3>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
        <div className="grid grid-cols-3 gap-2 px-4 py-4 text-center">
          {coins.map((coin) => (
            <div className="flex items-center justify-center gap-2" key={coin.symbol}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0F1115] text-sm font-semibold text-[#F5E7B3]">
                {coin.symbol.slice(0, 1)}
              </span>
              <span className="text-left">
                <span className="block text-sm font-medium text-[#111827]">{coin.symbol}</span>
                <span className="block text-sm text-[#4B5563]">${formatPrice(coin.price)}</span>
                <span className="block text-sm text-[#15803D]">
                  {coin.change >= 0 ? "+" : ""}
                  {coin.change.toFixed(2)}%
                </span>
              </span>
            </div>
          ))}
        </div>
        <div className="h-32 px-3 pb-3">
          <MiniSparkline leadPrice={leadPrice} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#E5E7EB] bg-white p-4 text-[#4B5563]">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-[#F5E7B3] bg-[#F5E7B3]/55 text-[#0F1115]">
          <BarChart3 size={21} />
        </span>
        <p className="text-sm leading-6">
          {summary} Cập nhật nhanh biến động BTC, ETH, SOL để bạn nắm nhịp thị trường trước khi mở biểu đồ chi tiết.
        </p>
      </div>
    </article>
  );
}
