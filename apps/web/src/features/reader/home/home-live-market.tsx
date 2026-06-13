"use client";

import type { Locale } from "@cmsauto/contracts";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { publicApiUrl } from "@/lib/api";

import { TradingViewChart } from "../markets/trading-view-chart";

export type LiveCoin = {
  name: string;
  symbol: string;
  pair: string;
};

type MarketTicker = {
  pair: string;
  symbol: string;
  price: number;
  changePercent: number;
  status?: "verified" | "fallback";
};

type MarketResponse = {
  tickers: MarketTicker[];
  stale?: boolean;
};

type MarketState = {
  tickers: Record<string, MarketTicker>;
  isStale: boolean;
};

export type HeroSlide = {
  title: string;
  excerpt: string;
  href: string;
  tag: string;
};

const coinIconOverrides: Record<string, string> = {
  BTC: "btc",
  ETH: "eth",
  BNB: "bnb",
  SOL: "sol",
  XRP: "xrp",
  ARB: "arb",
  FET: "fet",
  OP: "op",
  SUI: "sui",
  MKR: "mkr"
};

const fallbackMarketData: Record<string, Pick<MarketTicker, "price" | "changePercent">> = {
  BTCUSDT: { price: 63_702.12, changePercent: 0.19 },
  ETHUSDT: { price: 3_487.64, changePercent: 1.28 },
  BNBUSDT: { price: 604.38, changePercent: 0.74 },
  SOLUSDT: { price: 148.72, changePercent: 2.43 },
  XRPUSDT: { price: 0.5234, changePercent: -0.61 },
  ARBUSDT: { price: 0.8124, changePercent: 1.16 },
  FETUSDT: { price: 1.284, changePercent: 3.08 },
  OPUSDT: { price: 1.742, changePercent: -0.37 },
  SUIUSDT: { price: 1.103, changePercent: 2.05 },
  MKRUSDT: { price: 2_341.8, changePercent: 0.92 }
};

const marketCopy = {
  "vi-vn": {
    unavailable: "N/A",
    readArticle: "Đọc bài đầy đủ",
    viewMarket: "Xem thị trường",
    switchArticle: "Chuyển sang bài",
    currentPrice: "Giá hiện tại",
    change24h: "Biến động 24h",
    source: "Nguồn",
    refresh: "Cập nhật",
    refreshValue: "30 giây",
    sampleSource: "Dữ liệu mẫu",
    details: "Xem chi tiết",
    topGainers: "Top tăng giá (24h)",
    viewAllMarket: "Xem toàn bộ thị trường",
    liveChart: "Biểu đồ giá coin theo thời gian thực",
    openMarket: "Mở trang thị trường",
    chooseCoin: "Chọn coin",
    searchCoin: "Tìm coin..."
  },
  "en-us": {
    unavailable: "N/A",
    readArticle: "Read full article",
    viewMarket: "View markets",
    switchArticle: "Switch to article",
    currentPrice: "Current price",
    change24h: "24h change",
    source: "Source",
    refresh: "Refresh",
    refreshValue: "30 seconds",
    sampleSource: "Sample data",
    details: "View details",
    topGainers: "Top gainers (24h)",
    viewAllMarket: "View all markets",
    liveChart: "Live crypto price chart",
    openMarket: "Open market page",
    chooseCoin: "Choose coin",
    searchCoin: "Search coins..."
  }
} satisfies Record<Locale, Record<string, string>>;

const HomeMarketContext = createContext<MarketState | null>(null);

function formatPrice(price: number | undefined, locale: Locale) {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return marketCopy[locale].unavailable;
  }

  return price.toLocaleString("en-US", {
    maximumFractionDigits: price >= 100 ? 2 : price >= 1 ? 3 : 5,
    minimumFractionDigits: price >= 100 ? 2 : price >= 1 ? 2 : 4
  });
}

function formatChange(change: number | undefined, locale: Locale) {
  if (typeof change !== "number" || Number.isNaN(change)) {
    return marketCopy[locale].unavailable;
  }

  return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
}

function createFallbackTickers(coins: LiveCoin[]) {
  return Object.fromEntries(coins.map((coin, index) => {
    const fallback = fallbackMarketData[coin.pair] ?? {
      price: Math.max(0.01, 100 / (index + 1)),
      changePercent: index % 3 === 0 ? 1.2 : index % 3 === 1 ? 0.45 : -0.35
    };

    return [coin.pair, {
      pair: coin.pair,
      symbol: coin.symbol,
      price: fallback.price,
      changePercent: fallback.changePercent,
      status: "fallback" as const
    }];
  }));
}

function coinIconUrl(symbol: string) {
  const iconSymbol = coinIconOverrides[symbol] ?? symbol.toLowerCase();
  return `https://assets.coincap.io/assets/icons/${iconSymbol}@2x.png`;
}

function CoinLogo({ symbol, size = "md" }: { symbol: string; size?: "sm" | "md" }) {
  const dimension = size === "md" ? "size-10" : "size-8";

  return (
    <span className={`${dimension} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm`}>
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
      <span className="hidden h-full w-full items-center justify-center rounded-full bg-[#111111] text-xs font-semibold text-[#D5A319]">
        {symbol.slice(0, 1)}
      </span>
    </span>
  );
}

function useTickerFeed(coins: LiveCoin[], enabled = true) {
  const fallbackTickers = useMemo(() => createFallbackTickers(coins), [coins]);
  const [tickers, setTickers] = useState<Record<string, MarketTicker>>(fallbackTickers);
  const [isStale, setIsStale] = useState(true);
  const pairs = useMemo(
    () => Array.from(new Set(coins.map((coin) => coin.pair))).sort().join(","),
    [coins]
  );

  useEffect(() => {
    if (!enabled || !pairs) return;

    setTickers((current) => ({ ...fallbackTickers, ...current }));

    let cancelled = false;
    let requestInFlight = false;

    async function loadTickers() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch(publicApiUrl(`/public/markets/tickers?pairs=${encodeURIComponent(pairs)}`));
        if (!response.ok) {
          if (!cancelled) setIsStale(true);
          return;
        }

        const payload = (await response.json()) as MarketResponse;
        if (cancelled) return;

        const liveTickers = Object.fromEntries(payload.tickers.map((ticker) => [ticker.pair, ticker]));
        setTickers({ ...fallbackTickers, ...liveTickers });
        setIsStale(Boolean(payload.stale) || payload.tickers.length === 0);
      } catch {
        if (!cancelled) setIsStale(true);
      } finally {
        requestInFlight = false;
      }
    }

    void loadTickers();
    const intervalId = window.setInterval(loadTickers, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, fallbackTickers, pairs]);

  return { tickers, isStale };
}

export function HomeMarketProvider({ children, coins }: { children: ReactNode; coins: LiveCoin[] }) {
  const marketState = useTickerFeed(coins);
  return <HomeMarketContext.Provider value={marketState}>{children}</HomeMarketContext.Provider>;
}

export function useLiveTickers(coins: LiveCoin[]) {
  const sharedState = useContext(HomeMarketContext);
  const localState = useTickerFeed(coins, !sharedState);
  return sharedState ?? localState;
}

export function HeroPriceCard({ coin, locale }: { coin: LiveCoin; locale: Locale }) {
  const { tickers, isStale } = useLiveTickers([coin]);
  const ticker = tickers[coin.pair];
  const changePositive = (ticker?.changePercent ?? 0) >= 0;
  const copy = marketCopy[locale];

  return (
    <article className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_20px_55px_rgba(17,17,17,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111111]">{coin.pair.replace("USDT", "/USDT")}</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <h2 className="text-2xl font-semibold text-[#111111] md:text-3xl">${formatPrice(ticker?.price, locale)}</h2>
            <span className={`pb-1 text-sm font-semibold ${changePositive ? "text-[#009A61]" : "text-[#D92D20]"}`}>
              {formatChange(ticker?.changePercent, locale)} (24h)
            </span>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-medium text-[#6B7280]">
          {["1D", "7D", "30D", "1Y"].map((item, index) => (
            <span className={`rounded-lg px-3 py-1.5 ${index === 0 ? "bg-[#F5D98A] text-[#111111]" : "text-[#6B7280]"}`} key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-[#EFE7D6] bg-white">
        <TradingViewChart heightClass="h-[13rem] md:h-[15rem]" locale={locale} symbol="BINANCE:BTCUSDT" theme="light" />
      </div>
      <div className="mt-4 grid divide-y divide-[#EFE7D6] overflow-hidden rounded-xl border border-[#EFE7D6] md:grid-cols-4 md:divide-x md:divide-y-0">
        {[
          [copy.currentPrice, `$${formatPrice(ticker?.price, locale)}`],
          [copy.change24h, formatChange(ticker?.changePercent, locale)],
          [copy.source, isStale || ticker?.status === "fallback" ? copy.sampleSource : "Binance/API"],
          [copy.refresh, copy.refreshValue]
        ].map(([label, value]) => (
          <div className="p-4" key={label}>
            <p className="text-xs text-[#6B7280]">{label}</p>
            <p className="mt-1 text-lg font-semibold text-[#111111]">{value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function HeroArticleCarousel({ slides, marketHref, locale }: { slides: HeroSlide[]; marketHref: string; locale: Locale }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex] ?? slides[0];
  const copy = marketCopy[locale];

  useEffect(() => {
    if (slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  if (!activeSlide) return null;

  return (
    <div>
      <span className="inline-flex rounded-lg bg-[#F4E4B5] px-3 py-1 text-xs font-semibold uppercase text-[#8A6500]">
        {activeSlide.tag}
      </span>
      <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.08] text-[#111111] md:text-5xl">
        {activeSlide.title}
      </h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-[#5F6673]">{activeSlide.excerpt}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#B88400] px-5 text-sm font-semibold text-white transition hover:bg-[#111111]" href={activeSlide.href}>
          {copy.readArticle} <ArrowRight size={17} />
        </Link>
        <Link className="inline-flex h-12 items-center justify-center rounded-xl border border-[#E7DFCF] bg-white px-5 text-sm font-semibold text-[#111111] transition hover:bg-[#FFF6DD]" href={marketHref}>
          {copy.viewMarket}
        </Link>
      </div>
      <div className="mt-8 flex gap-4">
        {slides.slice(0, 5).map((slide, index) => (
          <button
            aria-label={`${copy.switchArticle} ${index + 1}: ${slide.title}`}
            className={`size-2.5 rounded-full transition ${index === activeIndex ? "bg-[#B88400]" : "bg-[#D1D5DB] hover:bg-[#B88400]/60"}`}
            key={`${slide.href}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

export function MarketPulse({ coins, marketHref, locale }: { coins: LiveCoin[]; marketHref: string; locale: Locale }) {
  const { tickers } = useLiveTickers(coins);
  const copy = marketCopy[locale];

  return (
    <article className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_16px_44px_rgba(17,17,17,0.05)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-[#111111]">Market Pulse</h2>
        <Link className="inline-flex items-center gap-1 text-xs font-semibold text-[#A97900]" href={marketHref}>
          {copy.details} <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {coins.slice(0, 4).map((coin) => {
          const ticker = tickers[coin.pair];
          const positive = (ticker?.changePercent ?? 0) >= 0;

          return (
            <div className="rounded-xl border border-[#EFE7D6] bg-[#FFFDF8] p-4" key={coin.pair}>
              <p className="text-xs text-[#6B7280]">{coin.symbol}/USDT</p>
              <p className="mt-2 text-xl font-semibold text-[#111111]">${formatPrice(ticker?.price, locale)}</p>
              <p className={`mt-1 text-xs font-semibold ${positive ? "text-[#159A55]" : "text-[#D92D20]"}`}>
                {formatChange(ticker?.changePercent, locale)}
              </p>
              <svg aria-hidden="true" className="mt-3 h-9 w-full" preserveAspectRatio="none" viewBox="0 0 160 42">
                <path
                  d={positive ? "M0 32 C28 27 38 35 58 22 C80 8 98 18 116 12 C136 5 144 9 160 4" : "M0 6 C28 12 38 8 58 20 C80 34 98 24 116 30 C136 38 144 34 160 40"}
                  fill="none"
                  stroke={positive ? "#D5A319" : "#D92D20"}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function TopGainers({ coins, marketHref, locale }: { coins: LiveCoin[]; marketHref: string; locale: Locale }) {
  const { tickers } = useLiveTickers(coins);
  const copy = marketCopy[locale];
  const sortedCoins = useMemo(
    () =>
      [...coins]
        .filter((coin) => tickers[coin.pair])
        .sort((left, right) => (tickers[right.pair]?.changePercent ?? -Infinity) - (tickers[left.pair]?.changePercent ?? -Infinity))
        .slice(0, 5),
    [coins, tickers]
  );
  const visibleCoins = sortedCoins.length ? sortedCoins : coins.slice(0, 5);

  return (
    <aside className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_16px_44px_rgba(17,17,17,0.05)]">
      <h2 className="text-sm font-semibold uppercase text-[#111111]">{copy.topGainers}</h2>
      <div className="mt-5 space-y-2">
        {visibleCoins.map((coin) => {
          const ticker = tickers[coin.pair];
          const positive = (ticker?.changePercent ?? 0) >= 0;

          return (
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#F3EBDC] pb-3 last:border-b-0" key={coin.pair}>
              <CoinLogo size="sm" symbol={coin.symbol} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111111]">{coin.symbol}</p>
                <p className="text-xs text-[#6B7280]">${formatPrice(ticker?.price, locale)}</p>
              </div>
              <span className={`text-xs font-semibold ${positive ? "text-[#159A55]" : "text-[#D92D20]"}`}>
                {formatChange(ticker?.changePercent, locale)}
              </span>
            </div>
          );
        })}
      </div>
      <Link className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E7DFCF] text-sm font-semibold text-[#A97900] transition hover:bg-[#FFF6DD]" href={marketHref}>
        {copy.viewAllMarket} <ArrowRight size={16} />
      </Link>
    </aside>
  );
}

export function CompactTradeSection({ coins, marketHref, locale }: { coins: LiveCoin[]; marketHref: string; locale: Locale }) {
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [query, setQuery] = useState("");
  const { tickers } = useLiveTickers(coins);
  const filteredCoins = coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selectedCoin = coins.find((coin) => coin.pair === selectedPair) ?? coins[0];
  const selectedTicker = tickers[selectedCoin.pair];
  const copy = marketCopy[locale];

  return (
    <section className="mx-auto max-w-7xl px-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[#A97900]">Trade</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#111111] md:text-3xl">{copy.liveChart}</h2>
        </div>
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#A97900]" href={marketHref}>
          {copy.openMarket} <ArrowRight size={16} />
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <article className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_16px_44px_rgba(17,17,17,0.05)]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <CoinLogo symbol={selectedCoin.symbol} />
              <div>
                <p className="text-sm text-[#6B7280]">{selectedCoin.name} {selectedCoin.symbol}</p>
                <h3 className="text-2xl font-semibold text-[#111111]">${formatPrice(selectedTicker?.price, locale)}</h3>
              </div>
            </div>
            <span className={`${(selectedTicker?.changePercent ?? 0) >= 0 ? "text-[#159A55]" : "text-[#D92D20]"} text-sm font-semibold`}>
              {formatChange(selectedTicker?.changePercent, locale)}
            </span>
          </div>
          <TradingViewChart heightClass="h-[24rem] md:h-[30rem]" locale={locale} symbol={`BINANCE:${selectedCoin.pair}`} />
        </article>
        <aside className="rounded-2xl border border-[#E7DFCF] bg-white p-5 shadow-[0_16px_44px_rgba(17,17,17,0.05)]">
          <label className="text-sm font-semibold text-[#111111]" htmlFor="home-coin-search">{copy.chooseCoin}</label>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={17} />
            <input
              className="h-11 w-full rounded-xl border border-[#E7DFCF] bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-[#9CA3AF] focus:border-[#D5A319] focus:ring-4 focus:ring-[#D5A319]/15"
              id="home-coin-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchCoin}
              value={query}
            />
          </div>
          <div className="mt-4 max-h-[30rem] space-y-1 overflow-y-auto pr-1">
            {filteredCoins.map((coin, index) => {
              const ticker = tickers[coin.pair];
              const active = coin.pair === selectedCoin.pair;
              const positive = (ticker?.changePercent ?? 0) >= 0;

              return (
                <button
                  className={`grid w-full grid-cols-[1.7rem_2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-[#FFF4D4]" : "hover:bg-[#FFFBF1]"}`}
                  key={coin.pair}
                  onClick={() => setSelectedPair(coin.pair)}
                  type="button"
                >
                  <span className="text-sm text-[#6B7280]">{index + 1}</span>
                  <CoinLogo size="sm" symbol={coin.symbol} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#111111]">{coin.name}</span>
                    <span className="block text-xs text-[#6B7280]">{coin.symbol}</span>
                  </span>
                  <span className={`text-xs font-semibold ${positive ? "text-[#159A55]" : "text-[#D92D20]"}`}>{formatChange(ticker?.changePercent, locale)}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

export function InlineMarketTicker({ coins, locale }: { coins: LiveCoin[]; locale: Locale }) {
  const { tickers } = useLiveTickers(coins);

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-[#EFE7D6] bg-white">
      <div className="flex h-14 animate-[coin-home-marquee_70s_linear_infinite] items-center gap-10 whitespace-nowrap">
        {[...coins, ...coins].map((coin, index) => {
          const ticker = tickers[coin.pair];
          const positive = (ticker?.changePercent ?? 0) >= 0;

          return (
            <span className="inline-flex items-center gap-3 border-r border-[#EFE7D6] pr-8" key={`${coin.pair}-${index}`}>
              <CoinLogo size="sm" symbol={coin.symbol} />
              <span className="text-sm font-semibold text-[#111111]">{coin.name}</span>
              <span className="text-sm text-[#111111]">{formatPrice(ticker?.price, locale)}</span>
              <span className={`text-sm font-semibold ${positive ? "text-[#159A55]" : "text-[#D92D20]"}`}>{formatChange(ticker?.changePercent, locale)}</span>
            </span>
          );
        })}
      </div>
      <style>{`@keyframes coin-home-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
