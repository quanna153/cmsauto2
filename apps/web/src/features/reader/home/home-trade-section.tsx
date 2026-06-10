"use client";

import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { publicApiUrl } from "@/lib/api";

import { TradingViewChart } from "../markets/trading-view-chart";

type TradeCoin = {
  name: string;
  symbol: string;
  pair: string;
  price: number;
  change: number;
};

type MarketTicker = {
  pair: string;
  price: number;
  changePercent: number;
};

const tradeCoins: TradeCoin[] = [
  { name: "Bitcoin", symbol: "BTC", pair: "BTCUSDT", price: 63447, change: 1.29 },
  { name: "Ethereum", symbol: "ETH", pair: "ETHUSDT", price: 3841, change: 1.68 },
  { name: "Tether", symbol: "USDT", pair: "USDCUSDT", price: 1, change: -0.02 },
  { name: "BNB", symbol: "BNB", pair: "BNBUSDT", price: 682, change: 0.56 },
  { name: "USDC", symbol: "USDC", pair: "USDCUSDT", price: 1, change: 0.01 },
  { name: "XRP", symbol: "XRP", pair: "XRPUSDT", price: 0.618, change: -1.22 },
  { name: "Solana", symbol: "SOL", pair: "SOLUSDT", price: 175.2, change: 0.45 },
  { name: "TRON", symbol: "TRX", pair: "TRXUSDT", price: 0.28, change: -0.56 },
  { name: "Hyperliquid", symbol: "HYPE", pair: "HYPEUSDT", price: 35.2, change: 2.32 }
];

function href(locale: Locale, path: string) {
  return `/${locale}${path}`;
}

function formatPrice(price: number) {
  const precision = price >= 100 ? 2 : price >= 1 ? 3 : 5;
  return price.toLocaleString("en-US", {
    maximumFractionDigits: precision,
    minimumFractionDigits: price >= 100 ? 2 : 0
  });
}

function coinIconUrl(symbol: string) {
  return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
}

function CoinLogo({ symbol, size = "sm" }: { symbol: string; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "size-10" : "size-7";
  const textSize = size === "md" ? "text-base" : "text-xs";

  return (
    <span className={`${sizeClass} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white`}>
      <img
        alt={`${symbol} logo`}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) {
            fallback.style.display = "flex";
          }
        }}
        src={coinIconUrl(symbol)}
      />
      <span className={`hidden h-full w-full items-center justify-center rounded-full bg-[#0F1115] ${textSize} font-black text-[#F5E7B3]`}>
        {symbol.slice(0, 1)}
      </span>
    </span>
  );
}

export function HomeTradeSection({ locale }: { locale: Locale }) {
  const [selectedSymbol, setSelectedSymbol] = useState(tradeCoins[0].symbol);
  const [query, setQuery] = useState("");
  const [coins, setCoins] = useState<TradeCoin[]>(tradeCoins);

  useEffect(() => {
    let cancelled = false;

    async function loadPrices() {
      try {
        const pairs = Array.from(new Set(tradeCoins.map((coin) => coin.pair))).join(",");
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
        // Giữ fallback để chart và danh sách coin luôn có nội dung.
      }
    }

    void loadPrices();
    const intervalId = window.setInterval(loadPrices, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const selectedCoin = coins.find((coin) => coin.symbol === selectedSymbol) ?? coins[0];
  const filteredCoins = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return coins;
    }

    return coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(normalized));
  }, [coins, query]);

  return (
    <section className="mx-auto max-w-7xl px-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A88412]">Trade</p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#111827] md:text-3xl">Biểu đồ giá coin theo thời gian thực</h2>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-[#A88412] transition hover:text-[#111827]" href={href(locale, "/markets")}>
          Mở trang thị trường <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_18px_44px_rgba(17,24,39,0.06)]">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-4">
              <CoinLogo size="md" symbol={selectedCoin.symbol} />
              <div>
                <p className="text-sm font-medium text-[#4B5563]">
                  {selectedCoin.name} {selectedCoin.symbol}
                </p>
                <h3 className="text-2xl font-semibold tracking-tight text-[#111827]">${formatPrice(selectedCoin.price)}</h3>
              </div>
            </div>
            <span className={`text-sm font-semibold ${selectedCoin.change >= 0 ? "text-[#15803D]" : "text-[#dc2626]"}`}>
              {selectedCoin.change >= 0 ? "+" : ""}
              {selectedCoin.change.toFixed(2)}%
            </span>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {["1D", "7D", "30D", "1Y", "All"].map((item, index) => (
              <button
                className={`h-8 rounded-lg px-3.5 text-sm font-medium transition ${
                  index === 0 ? "bg-[#C8A227] text-[#0F1115]" : "bg-[#FAFAF7] text-[#4B5563] hover:bg-[#F5E7B3] hover:text-[#111827]"
                }`}
                key={item}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-lg">
            <TradingViewChart heightClass="h-[22rem] md:h-[27rem]" symbol={`BINANCE:${selectedCoin.pair}`} />
            <div className="pointer-events-none absolute inset-0 p-4">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-[#F5E7B3]/80">
                <span>Live preview</span>
                <span>{selectedCoin.symbol}/USDT</span>
              </div>
              <svg aria-hidden="true" className="mt-7 h-[70%] w-full opacity-60" preserveAspectRatio="none" viewBox="0 0 640 260">
                <defs>
                  <linearGradient id="home-trading-preview-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#C8A227" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#C8A227" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="#F5E7B3" strokeOpacity="0.12" strokeWidth="1">
                  {[52, 104, 156, 208].map((y) => <line key={y} x1="0" x2="640" y1={y} y2={y} />)}
                  {[80, 160, 240, 320, 400, 480, 560].map((x) => <line key={x} x1={x} x2={x} y1="0" y2="260" />)}
                </g>
                <path d="M0 218 C52 198 88 226 138 174 C188 118 232 142 284 108 C350 66 408 92 468 54 C536 12 590 34 640 22 L640 260 L0 260 Z" fill="url(#home-trading-preview-fill)" />
                <path d="M0 218 C52 198 88 226 138 174 C188 118 232 142 284 108 C350 66 408 92 468 54 C536 12 590 34 640 22" fill="none" stroke="#C8A227" strokeLinecap="round" strokeWidth="4" />
              </svg>
            </div>
          </div>
        </article>

        <aside className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_18px_44px_rgba(17,24,39,0.06)]">
          <label className="text-sm font-medium text-[#111827]" htmlFor="home-coin-search">
            Chọn coin
          </label>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" size={17} />
            <input
              className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-[#4B5563]/70 focus:border-[#C8A227] focus:ring-4 focus:ring-[#C8A227]/15"
              id="home-coin-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm coin..."
              value={query}
            />
          </div>
          <div className="mt-4 max-h-[27rem] space-y-1 overflow-y-auto pr-1" role="list">
            {filteredCoins.map((coin, index) => {
              const active = coin.symbol === selectedCoin.symbol;

              return (
                <button
                  className={`grid w-full grid-cols-[1.8rem_2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
                    active ? "bg-[#F5E7B3]/45" : "hover:bg-[#FAFAF7]"
                  }`}
                  key={coin.symbol}
                  onClick={() => setSelectedSymbol(coin.symbol)}
                  role="listitem"
                  type="button"
                >
                  <span className="text-sm font-semibold text-[#4B5563]">{index + 1}</span>
                  <CoinLogo symbol={coin.symbol} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#111827]">{coin.name}</span>
                    <span className="block text-xs text-[#4B5563]">{coin.symbol}</span>
                  </span>
                  <span className={`text-xs font-semibold ${coin.change >= 0 ? "text-[#15803D]" : "text-[#dc2626]"}`}>
                    {coin.change >= 0 ? "+" : ""}
                    {coin.change.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
