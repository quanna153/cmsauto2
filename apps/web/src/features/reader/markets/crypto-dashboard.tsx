"use client";

import type { Locale } from "@cmsauto/contracts";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarClock,
  Flame,
  MoreVertical,
  Scale,
  Settings2,
  Share2,
  Star,
  TrendingUp,
  Waves
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ReaderMarketTicker } from "@/components/reader/reader-market-ticker";
import { mergeReaderTickers, readerFallbackGlobalStats } from "@/features/reader/market-data";
import { publicApiUrl } from "@/lib/api";

type MarketCoin = {
  cap: string;
  change: number;
  color: string;
  dominance?: string;
  liquidity: string;
  name: string;
  pair: string;
  price: string;
  rank: number;
  sparkline: string;
  symbol: string;
  supply: number;
  volume: string;
};

type LiveMarketTicker = {
  pair: string;
  symbol: string;
  price: number;
  changePercent: number;
  volume24h: number;
  status: "verified" | "fallback";
  checkedAt: string;
};

type GlobalMarketStats = {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  ethDominance: number;
  stale: boolean;
  checkedAt: string;
};

type Signal = {
  detail: string;
  icon: "chart" | "wave" | "flame" | "coin" | "scale";
  time: string;
  title: string;
  value: string;
};

type IndexCard = {
  change: number;
  key: "marketCap" | "altcoinSeason" | "stablecoinSupply" | "btcDominance" | "ethDominance" | "defiTvl";
  label: string;
  line?: string;
  status?: string;
  value: string;
};

const coins: MarketCoin[] = [
  {
    cap: "$1.35T",
    change: 1.26,
    color: "#F59E0B",
    dominance: "53.1%",
    liquidity: "19.85M BTC",
    name: "Bitcoin",
    pair: "BTC/USDT",
    price: "$68,245.12",
    rank: 1,
    sparkline: "M0 56 C22 46 38 52 58 40 C82 24 104 38 126 28 C150 18 170 26 196 14 C218 6 236 14 260 8",
    symbol: "BTC",
    supply: 19_850_000,
    volume: "$32.71B"
  },
  {
    cap: "$455.62B",
    change: 0.85,
    color: "#6B7280",
    dominance: "17.8%",
    liquidity: "120.41M ETH",
    name: "Ethereum",
    pair: "ETH/USDT",
    price: "$3,782.45",
    rank: 2,
    sparkline: "M0 54 C18 48 36 50 54 42 C78 30 102 34 122 24 C146 14 166 34 186 26 C214 16 236 18 260 10",
    symbol: "ETH",
    supply: 120_410_000,
    volume: "$18.97B"
  },
  {
    cap: "$88.36B",
    change: -0.23,
    color: "#F3BA2F",
    liquidity: "145.93M BNB",
    name: "BNB",
    pair: "BNB/USDT",
    price: "$607.11",
    rank: 3,
    sparkline: "M0 26 C18 34 38 24 58 32 C78 42 98 28 116 36 C140 50 162 40 184 48 C210 56 236 44 260 52",
    symbol: "BNB",
    supply: 145_930_000,
    volume: "$1.68B"
  },
  {
    cap: "$82.21B",
    change: 2.11,
    color: "#111827",
    liquidity: "469.98M SOL",
    name: "Solana",
    pair: "SOL/USDT",
    price: "$175.34",
    rank: 4,
    sparkline: "M0 58 C20 48 42 54 62 42 C86 28 106 36 126 26 C148 14 168 28 190 18 C218 8 238 16 260 6",
    symbol: "SOL",
    supply: 469_980_000,
    volume: "$2.83B"
  }
];

const tableCoins: MarketCoin[] = [
  ...coins,
  {
    cap: "$27.36B",
    change: 0.61,
    color: "#111827",
    liquidity: "53.40B XRP",
    name: "XRP",
    pair: "XRP",
    price: "$0.5123",
    rank: 5,
    sparkline: "M0 56 C28 44 48 50 74 36 C98 24 124 34 150 22 C184 12 210 20 260 8",
    symbol: "XRP",
    supply: 53_400_000_000,
    volume: "$1.24B"
  },
  {
    cap: "$20.95B",
    change: 1.83,
    color: "#C2A633",
    liquidity: "148.10B DOGE",
    name: "Dogecoin",
    pair: "DOGE",
    price: "$0.1412",
    rank: 6,
    sparkline: "M0 52 C22 44 46 50 72 38 C96 28 118 36 142 26 C178 16 210 22 260 10",
    symbol: "DOGE",
    supply: 148_100_000_000,
    volume: "$1.08B"
  },
  {
    cap: "$10.02B",
    change: 3.24,
    color: "#E84142",
    liquidity: "414.63M AVAX",
    name: "Avalanche",
    pair: "AVAX",
    price: "$24.18",
    rank: 7,
    sparkline: "M0 60 C20 42 44 46 70 34 C96 18 118 32 144 20 C176 8 210 18 260 5",
    symbol: "AVAX",
    supply: 414_630_000,
    volume: "$558.67M"
  },
  {
    cap: "$9.41B",
    change: -0.18,
    color: "#2EA6E9",
    liquidity: "1.38B TON",
    name: "Toncoin",
    pair: "TON",
    price: "$6.82",
    rank: 8,
    sparkline: "M0 34 C22 40 44 28 68 36 C92 48 116 34 140 42 C172 54 210 40 260 48",
    symbol: "TON",
    supply: 1_380_000_000,
    volume: "$276.43M"
  }
];

const copy = {
  "vi-vn": {
    allocationAria: "Phân bổ vốn hóa",
    allCategory: "Tất cả",
    categories: ["Tất cả", "Top tăng", "Top giảm", "DeFi", "Layer 1", "Layer 2", "AI", "GameFi", "RWA", "Meme"],
    chartAria: "Biểu đồ vốn hóa thị trường",
    customize: "Tùy chỉnh hiển thị",
    explainerByline: "CoinRadar Research · 11/06/2026",
    explainerText:
      "Thị trường đang duy trì xu hướng phục hồi tích cực khi Bitcoin giữ vững vùng hỗ trợ và dòng tiền quay trở lại nhóm altcoin. Chỉ số Fear & Greed ở mức 72 cho thấy tâm lý nhà đầu tư lạc quan trở lại, nhưng nhà đầu tư nên quản trị rủi ro trong giai đoạn biến động tăng cao.",
    explainerTitle: "Giải thích thị trường",
    follow: "Theo dõi",
    greedy: "Tham lam",
    intro: "Cập nhật nhanh biến động thị trường, xu hướng và dòng tiền đáng chú ý.",
    indexesTitle: "Chỉ số thị trường",
    indexStatus: "Trung lập",
    marketCap: "Vốn hóa",
    marketCapChart: "Biểu đồ vốn hóa thị trường",
    newsletterButton: "Đăng ký ngay",
    newsletterPlaceholder: "Nhập email của bạn",
    newsletterText: "Nhận bản tin hằng ngày với tin tức nóng hổi, phân tích chuyên sâu và cơ hội đầu tư tiềm năng.",
    newsletterTitle: "Không bỏ lỡ cơ hội trong thị trường crypto",
    otherAltcoins: "Altcoin khác",
    pageTitle: "Thị trường crypto hôm nay",
    searchPeriod: "7 ngày qua",
    searchTrends: [
      ["bitcoin là gì", 100],
      ["giá bitcoin hôm nay", 72],
      ["altcoin tiềm năng", 61],
      ["defi là gì", 48],
      ["airdrop 2026", 41]
    ],
    searchTrendsTitle: "Xu hướng tìm kiếm",
    share: "Chia sẻ",
    signals: [
      { detail: "Dòng vốn ròng trong 5 ngày qua đạt", icon: "chart", time: "2 giờ trước", title: "Dòng vốn ETF Bitcoin tăng mạnh", value: "+ $1.24B" },
      { detail: "Địa chỉ nắm giữ > 10K ETH tăng", icon: "wave", time: "3 giờ trước", title: "Cá voi tích lũy ETH", value: "+ 2.8% trong 24h" },
      { detail: "Khối lượng giao dịch tăng 18%, OI futures tăng 9%", icon: "flame", time: "4 giờ trước", title: "Nhiệt thị trường tăng", value: "" },
      { detail: "SOL, AVAX, INJ tăng trên 5% trong 24h qua", icon: "coin", time: "5 giờ trước", title: "Top altcoin dẫn sóng", value: "" },
      { detail: "Nhiều hồ sơ ETF altcoin tiếp tục được gia hạn", icon: "scale", time: "6 giờ trước", title: "SEC hoãn quyết định ETF altcoin", value: "" }
    ] satisfies Signal[],
    signalsTitle: "Tín hiệu cần xem",
    tableHeads: ["#", "Tên", "Giá", "24h %", "7d %", "Vốn hóa", "Volume 24h", "Lưu hành", "7 ngày qua", ""],
    total: "Tổng",
    totalMarketCap: "Tổng vốn hóa thị trường",
    volume24h: "24h Volume",
    viewAll: "Xem tất cả",
    viewAllIndexes: "Xem tất cả chỉ số",
    viewMore: "Xem thêm",
    viewMoreCoins: "Xem thêm 100 đồng coin"
  },
  "en-us": {
    allocationAria: "Market cap allocation",
    allCategory: "All",
    categories: ["All", "Top gainers", "Top losers", "DeFi", "Layer 1", "Layer 2", "AI", "GameFi", "RWA", "Meme"],
    chartAria: "Market capitalization chart",
    customize: "Customize view",
    explainerByline: "CoinRadar Research · Jun 11, 2026",
    explainerText:
      "The market is holding a constructive recovery tone as Bitcoin defends key support and capital rotates back into altcoins. A Fear & Greed reading near 72 suggests investors are more optimistic again, but risk management still matters while volatility is elevated.",
    explainerTitle: "Market explainer",
    follow: "Watchlist",
    greedy: "Greed",
    intro: "Track market moves, trend shifts and notable capital flows in one view.",
    indexesTitle: "Market indexes",
    indexStatus: "Neutral",
    marketCap: "Market cap",
    marketCapChart: "Market capitalization chart",
    newsletterButton: "Subscribe",
    newsletterPlaceholder: "Your email address",
    newsletterText: "Get a daily brief with market-moving news, deeper analysis and signals worth watching.",
    newsletterTitle: "Do not miss key crypto market moves",
    otherAltcoins: "Other altcoins",
    pageTitle: "Crypto markets today",
    searchPeriod: "last 7 days",
    searchTrends: [
      ["what is bitcoin", 100],
      ["bitcoin price today", 72],
      ["best altcoins", 61],
      ["what is defi", 48],
      ["airdrop 2026", 41]
    ],
    searchTrendsTitle: "Search trends",
    share: "Share",
    signals: [
      { detail: "Net inflows over the last 5 days", icon: "chart", time: "2 hours ago", title: "Bitcoin ETF flows strengthen", value: "+ $1.24B" },
      { detail: "Addresses holding more than 10K ETH increased", icon: "wave", time: "3 hours ago", title: "ETH whales are accumulating", value: "+ 2.8% in 24h" },
      { detail: "Spot volume rose 18%, futures open interest rose 9%", icon: "flame", time: "4 hours ago", title: "Market heat is rising", value: "" },
      { detail: "SOL, AVAX and INJ gained more than 5% in 24h", icon: "coin", time: "5 hours ago", title: "Altcoins lead the session", value: "" },
      { detail: "Several altcoin ETF filings were delayed again", icon: "scale", time: "6 hours ago", title: "SEC delays altcoin ETF decisions", value: "" }
    ] satisfies Signal[],
    signalsTitle: "Signals to watch",
    tableHeads: ["#", "Name", "Price", "24h %", "7d %", "Market cap", "24h volume", "Circulating", "Last 7 days", ""],
    total: "Total",
    totalMarketCap: "Total crypto market cap",
    volume24h: "24h volume",
    viewAll: "View all",
    viewAllIndexes: "View all indexes",
    viewMore: "Read more",
    viewMoreCoins: "Load 100 more coins"
  }
} satisfies Record<Locale, {
  allocationAria: string;
  allCategory: string;
  categories: string[];
  chartAria: string;
  customize: string;
  explainerByline: string;
  explainerText: string;
  explainerTitle: string;
  follow: string;
  greedy: string;
  indexStatus: string;
  indexesTitle: string;
  intro: string;
  marketCap: string;
  marketCapChart: string;
  newsletterButton: string;
  newsletterPlaceholder: string;
  newsletterText: string;
  newsletterTitle: string;
  otherAltcoins: string;
  pageTitle: string;
  searchPeriod: string;
  searchTrends: Array<[string, number]>;
  searchTrendsTitle: string;
  share: string;
  signals: Signal[];
  signalsTitle: string;
  tableHeads: string[];
  total: string;
  totalMarketCap: string;
  volume24h: string;
  viewAll: string;
  viewAllIndexes: string;
  viewMore: string;
  viewMoreCoins: string;
}>;

const baseIndexCards: IndexCard[] = [
  { change: 1.32, key: "marketCap", label: "Market Cap", line: "M0 42 C16 36 30 44 48 30 C68 12 88 28 108 18 C130 10 148 22 170 8", value: "$2.56T" },
  { change: 0, key: "altcoinSeason", label: "Altcoin Season Index", status: "Neutral", value: "43" },
  { change: 0.92, key: "stablecoinSupply", label: "Stablecoin Supply", line: "M0 50 C24 46 42 40 60 42 C82 44 98 28 122 24 C146 20 160 16 170 10", value: "$162.3B" },
  { change: -0.42, key: "btcDominance", label: "BTC Dominance", line: "M0 42 C20 38 34 44 56 34 C80 22 104 28 128 18 C148 8 160 14 170 6", value: "53.1%" },
  { change: 0.31, key: "ethDominance", label: "ETH Dominance", line: "M0 48 C20 44 36 46 54 38 C78 28 96 34 118 24 C140 14 154 18 170 8", value: "17.8%" },
  { change: 1.12, key: "defiTvl", label: "DeFi TVL", line: "M0 56 C20 46 42 50 64 38 C88 24 112 30 134 20 C150 12 162 14 170 6", value: "$98.64B" }
];

const marketPairs = Array.from(new Set(tableCoins.map((coin) => `${coin.symbol}USDT`)));
const fallbackGlobalStats: GlobalMarketStats = readerFallbackGlobalStats;

function finiteNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeGlobalStats(payload: Partial<GlobalMarketStats>): GlobalMarketStats {
  return {
    btcDominance: finiteNumber(payload.btcDominance, fallbackGlobalStats.btcDominance),
    checkedAt: typeof payload.checkedAt === "string" ? payload.checkedAt : new Date().toISOString(),
    ethDominance: finiteNumber(payload.ethDominance, fallbackGlobalStats.ethDominance),
    stale: payload.stale ?? true,
    totalMarketCapUsd: finiteNumber(payload.totalMarketCapUsd, fallbackGlobalStats.totalMarketCapUsd),
    totalVolumeUsd: finiteNumber(payload.totalVolumeUsd, fallbackGlobalStats.totalVolumeUsd)
  };
}

function fallbackLiveTickers(pairs: string[]): LiveMarketTicker[] {
  return mergeReaderTickers(pairs).map((ticker) => ({
    checkedAt: ticker.checkedAt ?? new Date(0).toISOString(),
    changePercent: ticker.changePercent,
    pair: ticker.pair,
    price: ticker.price,
    status: ticker.status ?? "fallback",
    symbol: ticker.symbol,
    volume24h: ticker.volume24h ?? 0
  }));
}

function formatUsd(value: number) {
  const maximumFractionDigits = value >= 100 ? 2 : value >= 1 ? 2 : 4;
  return `$${value.toLocaleString("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: value >= 100 ? 2 : value >= 1 ? 2 : 4
  })}`;
}

function formatCompactUsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  const units = [
    { suffix: "T", value: 1_000_000_000_000 },
    { suffix: "B", value: 1_000_000_000 },
    { suffix: "M", value: 1_000_000 }
  ];
  const unit = units.find((item) => value >= item.value);
  if (!unit) return formatUsd(value);
  return `$${(value / unit.value).toLocaleString("en-US", { maximumFractionDigits: 2 })}${unit.suffix}`;
}

function formatPercentValue(value: number) {
  return `${finiteNumber(value, 0).toFixed(1)}%`;
}

function hydrateCoin(coin: MarketCoin, liveByPair: Map<string, LiveMarketTicker>): MarketCoin {
  const live = liveByPair.get(`${coin.symbol}USDT`);
  if (!live || !Number.isFinite(live.price) || live.price <= 0) return coin;

  const marketCap = live.price * coin.supply;
  return {
    ...coin,
    cap: formatCompactUsd(marketCap),
    change: live.changePercent,
    price: formatUsd(live.price),
    volume: live.volume24h > 0 ? formatCompactUsd(live.volume24h) : coin.volume
  };
}

function coinIconUrl(symbol: string) {
  return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
}

function CoinLogo({ coin, size = "md" }: { coin: Pick<MarketCoin, "color" | "name" | "symbol">; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "size-10" : size === "sm" ? "size-7" : "size-8";
  return (
    <span className={`${sizeClass} relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#E5E7EB]`}>
      <img
        alt={`${coin.name} logo`}
        className="h-full w-full object-contain"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
        src={coinIconUrl(coin.symbol)}
      />
      <span className="hidden h-full w-full items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: coin.color }}>
        {coin.symbol.slice(0, 1)}
      </span>
    </span>
  );
}

function Percent({ value, compact = false }: { value: number; compact?: boolean }) {
  const positive = value >= 0;
  return (
    <span className={`${positive ? "text-[#15803D]" : "text-[#DC2626]"} inline-flex items-center gap-1 font-semibold ${compact ? "text-xs" : "text-sm"}`}>
      <span>{positive ? "▲" : "▼"}</span>
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function Sparkline({ color = "#22A06B", path, negative = false }: { color?: string; negative?: boolean; path: string }) {
  const stroke = negative ? "#EF4444" : color;
  const fill = negative ? "#FEE2E2" : "#DCFCE7";
  return (
    <svg aria-hidden="true" className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 260 70">
      <path d={`${path} L260 70 L0 70 Z`} fill={fill} opacity="0.72" />
      <path d={path} fill="none" stroke={stroke} strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function SignalIcon({ type }: { type: Signal["icon"] }) {
  const icons = {
    chart: <TrendingUp size={21} />,
    coin: <BarChart3 size={21} />,
    flame: <Flame size={21} />,
    scale: <Scale size={21} />,
    wave: <Waves size={21} />
  };

  return <span className="flex size-12 items-center justify-center rounded-lg bg-[#FAFAF7] text-[#C8A227]">{icons[type]}</span>;
}

function MarketCapChart({ ariaLabel }: { ariaLabel: string }) {
  return (
    <svg aria-label={ariaLabel} className="h-[19rem] w-full" preserveAspectRatio="none" viewBox="0 0 820 320">
      <defs>
        <linearGradient id="market-cap-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#C8A227" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#C8A227" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <g stroke="#E5E7EB" strokeWidth="1">
        {[54, 108, 162, 216, 270].map((y) => (
          <line key={y} x1="0" x2="820" y1={y} y2={y} />
        ))}
      </g>
      <path
        d="M0 258 C28 218 46 178 78 158 C118 134 132 188 166 174 C196 164 206 212 242 196 C278 180 282 126 318 114 C358 98 372 84 414 104 C456 124 462 68 502 82 C542 96 548 164 588 150 C628 136 634 96 674 78 C710 62 722 86 754 42 C782 6 792 68 820 22 L820 320 L0 320 Z"
        fill="url(#market-cap-fill)"
      />
      <path
        d="M0 258 C28 218 46 178 78 158 C118 134 132 188 166 174 C196 164 206 212 242 196 C278 180 282 126 318 114 C358 98 372 84 414 104 C456 124 462 68 502 82 C542 96 548 164 588 150 C628 136 634 96 674 78 C710 62 722 86 754 42 C782 6 792 68 820 22"
        fill="none"
        stroke="#D6A300"
        strokeLinecap="round"
        strokeWidth="3"
      />
      {["5/6", "6/6", "7/6", "8/6", "9/6", "10/6", "11/6"].map((label, index) => (
        <text fill="#64748B" fontSize="13" key={label} x={64 + index * 112} y="310">
          {label}
        </text>
      ))}
      {["$2.60T", "$2.55T", "$2.50T", "$2.45T", "$2.40T", "$2.35T"].map((label, index) => (
        <text fill="#64748B" fontSize="13" key={label} textAnchor="end" x="812" y={58 + index * 52}>
          {label}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ btcDominance, copy: donutCopy, ethDominance }: { btcDominance: number; copy: { allocationAria: string; otherAltcoins: string; total: string }; ethDominance: number }) {
  const safeBtcDominance = finiteNumber(btcDominance, 0);
  const safeEthDominance = finiteNumber(ethDominance, 0);
  const otherDominance = Math.max(0, 100 - safeBtcDominance - safeEthDominance);
  return (
    <div className="flex items-center gap-6">
      <div
        aria-label={donutCopy.allocationAria}
        className="size-28 rounded-full"
        style={{ background: `conic-gradient(#C8A227 0 ${safeBtcDominance}%, #9CA3AF ${safeBtcDominance}% ${safeBtcDominance + safeEthDominance}%, #D1D5DB ${safeBtcDominance + safeEthDominance}% 100%)` }}
      >
        <div className="m-[1.1rem] flex h-[calc(100%-2.2rem)] items-center justify-center rounded-full bg-white text-xs font-semibold text-[#4B5563]">{donutCopy.total}</div>
      </div>
      <div className="grid gap-2 text-sm">
        {[
          ["Bitcoin", formatPercentValue(safeBtcDominance), "#C8A227"],
          ["Ethereum", formatPercentValue(safeEthDominance), "#9CA3AF"],
          [donutCopy.otherAltcoins, formatPercentValue(otherDominance), "#D1D5DB"]
        ].map(([label, value, color]) => (
          <div className="grid grid-cols-[0.75rem_1fr_auto] items-center gap-2" key={label}>
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[#4B5563]">{label}</span>
            <span className="font-semibold">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CryptoDashboard({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [liveTickers, setLiveTickers] = useState<LiveMarketTicker[]>(() => fallbackLiveTickers(marketPairs));
  const [globalStats, setGlobalStats] = useState<GlobalMarketStats>(fallbackGlobalStats);

  useEffect(() => {
    let cancelled = false;
    let priceRequestInFlight = false;
    let globalRequestInFlight = false;

    async function loadPriceData() {
      if (priceRequestInFlight) return;
      priceRequestInFlight = true;

      try {
        const tickerResponse = await fetch(publicApiUrl(`/public/markets/tickers?pairs=${encodeURIComponent(marketPairs.join(","))}`), {
          cache: "no-store"
        });
        if (tickerResponse.ok) {
          const payload = (await tickerResponse.json()) as { tickers: LiveMarketTicker[] };
          if (!cancelled) {
            setLiveTickers(payload.tickers.length ? fallbackLiveTickers(marketPairs).map((fallbackTicker) => payload.tickers.find((ticker) => ticker.pair === fallbackTicker.pair) ?? fallbackTicker) : fallbackLiveTickers(marketPairs));
          }
        }
      } catch {
        // Keep the current snapshot visible if Binance is temporarily unavailable.
      }

      priceRequestInFlight = false;
    }

    async function loadGlobalStats() {
      if (globalRequestInFlight) return;
      globalRequestInFlight = true;

      try {
        const globalResponse = await fetch(publicApiUrl("/public/markets/global"), { cache: "no-store" });
        if (globalResponse.ok) {
          const payload = (await globalResponse.json()) as GlobalMarketStats;
          if (!cancelled) {
            setGlobalStats(normalizeGlobalStats(payload));
          }
        }
      } catch {
        // Keep the current snapshot visible if CoinGecko is temporarily unavailable.
      }

      globalRequestInFlight = false;
    }

    void loadPriceData();
    void loadGlobalStats();
    const priceIntervalId = window.setInterval(loadPriceData, 30_000);
    const globalIntervalId = window.setInterval(loadGlobalStats, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(priceIntervalId);
      window.clearInterval(globalIntervalId);
    };
  }, []);

  const liveByPair = useMemo(() => new Map(liveTickers.map((ticker) => [ticker.pair, ticker])), [liveTickers]);
  const liveTableCoins = useMemo(() => tableCoins.map((coin) => hydrateCoin(coin, liveByPair)), [liveByPair]);
  const liveCoins = liveTableCoins.slice(0, 4);
  const btcDominance = formatPercentValue(globalStats.btcDominance);
  const ethDominance = formatPercentValue(globalStats.ethDominance);
  const totalMarketCap = formatCompactUsd(globalStats.totalMarketCapUsd);
  const totalVolume = formatCompactUsd(globalStats.totalVolumeUsd);
  const indexCards = baseIndexCards.map((item) => {
    if (item.key === "altcoinSeason") return { ...item, status: c.indexStatus };
    return item;
  });

  return (
    <main className="bg-[#F8F8F5] font-sans text-[#111827]">
      <ReaderMarketTicker locale={locale} />

      <div className="mx-auto max-w-7xl px-5 py-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-semibold leading-tight text-[#111827]">{c.pageTitle}</h1>
            <p className="mt-3 text-base text-[#64748B]">{c.intro}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-[#C8A227]" type="button">
              <Star size={17} /> {c.follow}
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-semibold shadow-sm transition hover:border-[#C8A227]" type="button">
              <Share2 size={17} /> {c.share}
            </button>
          </div>
        </section>

        <section className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {liveCoins.map((coin) => (
            <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]" key={coin.symbol}>
              <div className="flex items-center gap-3">
                <CoinLogo coin={coin} size="lg" />
                <div>
                  <h2 className="font-semibold">{coin.name}</h2>
                  <p className="text-sm text-[#64748B]">{coin.pair}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold">{coin.price}</p>
                <Percent value={coin.change} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#64748B]">{c.marketCap}</p>
                  <p className="mt-1 font-semibold">{coin.cap}</p>
                </div>
                <div>
                  <p className="text-[#64748B]">{c.volume24h}</p>
                  <p className="mt-1 font-semibold">{coin.volume}</p>
                </div>
              </div>
              <div className="mt-4 h-16">
                <Sparkline negative={coin.change < 0} path={coin.sparkline} />
              </div>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
                  {c.marketCapChart}
                  <CalendarClock className="text-[#94A3B8]" size={17} />
                </h2>
                <p className="mt-5 text-sm text-[#4B5563]">{c.totalMarketCap}</p>
                <div className="mt-2 flex items-center gap-4">
                  <p className="text-3xl font-semibold">{totalMarketCap}</p>
                  <Percent value={1.32} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {["1D", "7D", "1M", "3M", "1Y", "ALL"].map((item) => (
                  <button
                    className={`h-8 rounded-lg px-3 font-semibold transition ${item === "7D" ? "bg-[#E5E7EB] text-[#111827]" : "text-[#64748B] hover:bg-[#FAFAF7]"}`}
                    key={item}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#FAFAF7]" type="button">
                  <MoreVertical size={17} />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <MarketCapChart ariaLabel={c.chartAria} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              {[
                ["24h Volume", totalVolume, 6.21],
                ["BTC Dominance", btcDominance, -0.42],
                ["ETH Dominance", ethDominance, 0.31],
                ["Fear & Greed Index", "72", 0]
              ].map(([label, value, change]) => (
                <div className="rounded-lg border border-[#E5E7EB] bg-white p-4" key={label as string}>
                  <p className="text-sm text-[#64748B]">{label}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-xl font-semibold">{value}</p>
                    {typeof change === "number" && change !== 0 ? <Percent compact value={change} /> : <span className="text-sm font-semibold text-[#15803D]">{c.greedy}</span>}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{c.signalsTitle}</h2>
              <button className="text-sm font-semibold text-[#A88412]" type="button">{c.viewAll}</button>
            </div>
            <div className="mt-4 divide-y divide-[#E5E7EB]">
              {c.signals.map((signal) => (
                <article className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 py-4" key={signal.title}>
                  <SignalIcon type={signal.icon} />
                  <div>
                    <h3 className="font-semibold leading-5">{signal.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-[#64748B]">{signal.detail}</p>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[#15803D]">{signal.value}</span>
                      <span className="text-[#94A3B8]">{signal.time}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{c.indexesTitle}</h2>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#A88412]" type="button">
              {c.viewAllIndexes} <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {indexCards.map((item) => {
              const liveItem = item.key === "marketCap"
                ? { ...item, value: totalMarketCap }
                : item.key === "stablecoinSupply"
                  ? { ...item }
                  : item.key === "btcDominance"
                    ? { ...item, value: btcDominance }
                    : item.key === "ethDominance"
                      ? { ...item, value: ethDominance }
                      : item;

              return (
                <article className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_14px_34px_rgba(17,24,39,0.04)]" key={liveItem.label}>
                  <p className="text-sm text-[#64748B]">{liveItem.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{liveItem.value}</p>
                  {liveItem.status ? <p className="mt-2 text-sm font-semibold text-[#A88412]">{liveItem.status}</p> : <Percent compact value={liveItem.change} />}
                  <div className="mt-3 h-9">
                    {liveItem.line ? <Sparkline color="#D6A300" path={liveItem.line} negative={liveItem.change < 0} /> : <div className="mt-3 h-2 rounded-full bg-[#E5E7EB]"><div className="h-2 w-[43%] rounded-full bg-[#C8A227]" /></div>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5E7EB] px-4 py-3 text-sm">
            {c.categories.map((item) => (
              <button className={`h-8 shrink-0 rounded-lg px-4 font-semibold ${item === c.allCategory ? "bg-[#F5E7B3] text-[#A88412]" : "text-[#4B5563] hover:bg-[#FAFAF7]"}`} key={item} type="button">
                {item}
              </button>
            ))}
            <button className="ml-auto inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-[#4B5563] hover:bg-[#FAFAF7]" type="button">
              {c.customize} <Settings2 size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] text-left text-sm">
              <thead className="border-b border-[#E5E7EB] text-xs text-[#64748B]">
                <tr>
                  {c.tableHeads.map((head) => (
                    <th className="px-4 py-3 font-semibold" key={head}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {liveTableCoins.map((coin) => (
                  <tr className="transition hover:bg-[#FAFAF7]" key={coin.symbol}>
                    <td className="px-4 py-3 text-[#64748B]">{coin.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CoinLogo coin={coin} size="sm" />
                        <span className="font-semibold">{coin.name}</span>
                        <span className="text-[#64748B]">{coin.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{coin.price}</td>
                    <td className="px-4 py-3"><Percent compact value={coin.change} /></td>
                    <td className="px-4 py-3"><Percent compact value={coin.change > 0 ? coin.change * 2.7 : Math.abs(coin.change) * 5.5} /></td>
                    <td className="px-4 py-3">{coin.cap}</td>
                    <td className="px-4 py-3">{coin.volume}</td>
                    <td className="px-4 py-3">{coin.liquidity}</td>
                    <td className="px-4 py-3">
                      <div className="h-9 w-28">
                        <Sparkline negative={coin.change < 0} path={coin.sparkline} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]"><Star size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#E5E7EB] py-4 text-center">
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#A88412]" type="button">
              {c.viewMoreCoins} <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-3">
          <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <h2 className="text-lg font-semibold">{c.allocationAria}</h2>
            <div className="mt-5">
              <DonutChart btcDominance={globalStats.btcDominance} copy={c} ethDominance={globalStats.ethDominance} />
            </div>
            <p className="mt-5 text-center text-sm text-[#64748B]">{c.total} {totalMarketCap}</p>
          </article>

          <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <h2 className="text-lg font-semibold">{c.searchTrendsTitle} <span className="text-sm font-normal text-[#94A3B8]">({c.searchPeriod})</span></h2>
            <div className="mt-5 grid gap-3">
              {c.searchTrends.map(([label, value], index) => (
                <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_8rem_2rem] items-center gap-3 text-sm" key={label as string}>
                  <span>{index + 1}</span>
                  <span>{label}</span>
                  <span className="h-2 rounded-full bg-[#E5E7EB]">
                    <span className="block h-2 rounded-full bg-[#C8A227]" style={{ width: `${value}%` }} />
                  </span>
                  <span className="text-right">{value}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{c.explainerTitle}</h2>
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#A88412]" type="button">{c.viewMore} <ArrowRight size={15} /></button>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4B5563]">
              {c.explainerText}
            </p>
            <p className="mt-5 text-sm text-[#94A3B8]">{c.explainerByline}</p>
          </article>
        </section>

        <section className="mt-8 rounded-lg bg-[#0F1115] p-6 text-white shadow-[0_18px_44px_rgba(17,24,39,0.16)] md:p-8">
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_34rem] md:items-center">
            <div className="flex items-start gap-5">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-[#C8A227] text-[#C8A227]">
                <Bell size={27} />
              </span>
              <div>
                <h2 className="text-2xl font-semibold">{c.newsletterTitle}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">{c.newsletterText}</p>
              </div>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <label className="sr-only" htmlFor="market-newsletter-email">Email</label>
              <input className="h-12 rounded-lg border border-white/10 bg-white px-4 text-sm text-[#111827] outline-none placeholder:text-[#94A3B8]" id="market-newsletter-email" placeholder={c.newsletterPlaceholder} type="email" />
              <button className="h-12 rounded-lg bg-[#C8A227] px-5 text-sm font-bold text-[#0F1115] transition hover:bg-[#F5E7B3]" type="submit">{c.newsletterButton}</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
