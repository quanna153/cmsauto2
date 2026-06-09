"use client";

import { Activity, Newspaper } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MarketCoin = {
  symbol: "BTC" | "ETH" | "SOL";
  pair: string;
  price: number;
  change: number;
};

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
};

const fallbackCoins: MarketCoin[] = [
  { symbol: "BTC", pair: "BTCUSDT", price: 107240, change: 2.14 },
  { symbol: "ETH", pair: "ETHUSDT", price: 3841, change: 1.87 },
  { symbol: "SOL", pair: "SOLUSDT", price: 175.2, change: 3.21 }
];

const glossary = ["BTC", "ETF", "DEX", "L2", "TVL", "RWA"];

function formatPrice(price: number) {
  return price.toLocaleString("en-US", {
    maximumFractionDigits: price >= 100 ? 0 : price >= 1 ? 2 : 4
  });
}

function MiniMarketChart({ coins }: { coins: MarketCoin[] }) {
  const boost = Math.max(-8, Math.min(8, coins.reduce((total, coin) => total + coin.change, 0))) * 2;
  const curve = `M0 ${148 - boost} C42 ${134 - boost} 58 ${150 - boost} 92 ${126 - boost} C130 ${98 - boost} 154 ${112 - boost} 190 ${90 - boost} C232 ${65 - boost} 262 ${74 - boost} 294 ${55 - boost} C334 ${31 - boost} 365 ${44 - boost} 420 ${20 - boost}`;

  return (
    <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 420 180" aria-hidden="true">
      <defs>
        <linearGradient id="home-radar-chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="#d7e7dc" strokeWidth="1">
        {[36, 72, 108, 144].map((y) => (
          <line key={y} x1="0" x2="420" y1={y} y2={y} />
        ))}
        {[70, 140, 210, 280, 350].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="180" />
        ))}
      </g>
      <path d={`${curve} L420 180 L0 180 Z`} fill="url(#home-radar-chart-fill)" />
      <path d={curve} fill="none" stroke="#16a34a" strokeLinecap="round" strokeWidth="3" />
      <g transform={`translate(420 ${20 - boost})`}>
        <rect fill="#03130b" height="24" rx="6" width="76" x="-86" y="-12" />
        <text fill="#ffffff" fontSize="11" fontWeight="700" textAnchor="middle" x="-48" y="4">
          {formatPrice(coins[0]?.price ?? fallbackCoins[0].price)}
        </text>
        <circle cx="0" cy="0" fill="#22c55e" r="5" stroke="#ffffff" strokeWidth="2" />
      </g>
    </svg>
  );
}

function ClockCard({ now }: { now: Date | null }) {
  const visibleTime = now ?? new Date(2026, 0, 1, 10, 10, 0);
  const seconds = visibleTime.getSeconds();
  const minutes = visibleTime.getMinutes() + seconds / 60;
  const hours = (visibleTime.getHours() % 12) + minutes / 60;

  return (
    <div className="rounded-lg border border-[#d7e7dc] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <div className="relative mx-auto size-24 rounded-full border border-[#d7e7dc] bg-white shadow-inner">
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#03130b]" />
        <span
          className="absolute left-1/2 top-1/2 h-1 w-8 origin-left -translate-y-1/2 rounded-full bg-[#16a34a]"
          style={{ transform: `rotate(${minutes * 6 - 90}deg)` }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-1 w-7 origin-left -translate-y-1/2 rounded-full bg-[#03130b]"
          style={{ transform: `rotate(${hours * 30 - 90}deg)` }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-0.5 w-10 origin-left -translate-y-1/2 rounded-full bg-[#03130b]/70"
          style={{ transform: `rotate(${seconds * 6 - 90}deg)` }}
        />
      </div>
    </div>
  );
}

function SentimentCard({ value }: { value: number }) {
  const optimistic = Math.max(0, Math.min(100, value));
  const cautious = 100 - optimistic;

  return (
    <div className="rounded-lg border border-[#d7e7dc] bg-white p-4 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
      <div className="mb-3 flex items-center justify-between text-sm font-semibold">
        <span className="text-[#16a34a]">Lạc quan {optimistic}%</span>
        <span className="text-[#07110c]/55">Thận trọng {cautious}%</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[#07110c]/12">
        <span className="bg-[#22c55e] transition-all" style={{ width: `${optimistic}%` }} />
        <span className="flex-1 bg-[#07110c]/45" />
      </div>
    </div>
  );
}

export function HomeMarketRadar() {
  const [coins, setCoins] = useState<MarketCoin[]>(fallbackCoins);
  const [sentiment, setSentiment] = useState(64);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clockId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMarket() {
      try {
        const symbols = encodeURIComponent(JSON.stringify(fallbackCoins.map((coin) => coin.pair)));
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`);
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as BinanceTicker[];
        if (cancelled) {
          return;
        }

        setCoins((current) =>
          current.map((coin) => {
            const live = payload.find((item) => item.symbol === coin.pair);
            if (!live) {
              return coin;
            }

            return {
              ...coin,
              change: Number(live.priceChangePercent),
              price: Number(live.lastPrice)
            };
          })
        );
      } catch {
        // Giữ dữ liệu dự phòng để khối radar không bị trống khi API tạm giới hạn.
      }
    }

    void loadMarket();
    const intervalId = window.setInterval(loadMarket, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSentiment() {
      try {
        const response = await fetch("https://api.alternative.me/fng/?limit=1&format=json");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { data?: Array<{ value?: string }> };
        const value = Number(payload.data?.[0]?.value);
        if (!cancelled && Number.isFinite(value)) {
          setSentiment(Math.round(value));
        }
      } catch {
        // API tâm lý cộng đồng có fallback để UI vẫn ổn định.
      }
    }

    void loadSentiment();
    const intervalId = window.setInterval(loadSentiment, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const strongestCoin = useMemo(() => coins.reduce((best, coin) => (coin.change > best.change ? coin : best), coins[0] ?? fallbackCoins[0]), [coins]);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.1fr_0.8fr]">
      <div className="flex flex-col justify-center gap-4">
        <div>
          <p className="mb-2.5 text-sm font-bold text-[#047857]">Bảng thuật ngữ</p>
          <div className="rounded-lg border border-[#d7e7dc] bg-white p-2.5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <div className="flex flex-wrap gap-2">
              {glossary.map((item) => (
                <span className="flex size-10 items-center justify-center rounded-full border border-[#d7e7dc] bg-[#f6fbf7] text-xs font-black text-[#07110c]" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2.5 text-sm font-bold text-[#047857]">Tin nhanh</p>
          <div className="rounded-lg border border-[#d7e7dc] bg-white p-3.5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#03130b] text-[#22c55e]">
                <Newspaper size={16} />
              </span>
              <p className="text-sm font-bold leading-5 text-[#07110c]">
                {strongestCoin.symbol} đang dẫn nhịp radar với biến động {strongestCoin.change >= 0 ? "+" : ""}
                {strongestCoin.change.toFixed(2)}% trong 24 giờ.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#d7e7dc] bg-white p-4 shadow-[0_18px_44px_rgba(17,24,39,0.08)]">
        <div className="mb-4 flex items-center gap-2 text-[#07110c]">
          <Activity className="text-[#16a34a]" size={17} />
          <p className="text-base font-black">Radar thị trường</p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {coins.map((coin) => (
            <div className="flex items-center gap-2.5 rounded-lg border border-[#d7e7dc] bg-[#f6fbf7] p-2.5" key={coin.symbol}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#03130b] text-xs font-black text-[#22c55e]">{coin.symbol.slice(0, 1)}</span>
              <span>
                <strong className="block text-sm text-[#07110c]">{coin.symbol}</strong>
                <span className="block text-xs text-[#5f6b63]">${formatPrice(coin.price)}</span>
                <span className={`block text-xs font-bold ${coin.change >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                  {coin.change >= 0 ? "+" : ""}
                  {coin.change.toFixed(2)}%
                </span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 h-36 overflow-hidden rounded-lg border border-[#d7e7dc] bg-white p-3 md:h-40">
          <MiniMarketChart coins={coins} />
        </div>
        <div className="mt-3 rounded-lg border border-[#d7e7dc] bg-[#f6fbf7] p-3.5 text-sm leading-6 text-[#5f6b63]">
          Dữ liệu giá lấy từ Binance API, cập nhật định kỳ để radar không bị đứng khi thị trường đổi nhịp.
        </div>
      </div>

      <div className="flex flex-col justify-center gap-4">
        <div>
          <p className="mb-2.5 text-sm font-bold text-[#047857]">Nhịp cập nhật</p>
          <ClockCard now={now} />
        </div>
        <div>
          <p className="mb-2.5 text-sm font-bold text-[#047857]">Tâm lý cộng đồng</p>
          <SentimentCard value={sentiment} />
        </div>
      </div>
    </div>
  );
}
