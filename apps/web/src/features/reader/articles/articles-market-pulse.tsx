"use client";

import type { Locale } from "@cmsauto/contracts";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatReaderCompactUsd, readerFallbackGlobalStats } from "@/features/reader/market-data";
import { publicApiUrl } from "@/lib/api";

type GlobalMarketStats = {
  totalMarketCapUsd: number;
  totalVolumeUsd: number;
  btcDominance: number;
  ethDominance: number;
  stale: boolean;
  checkedAt: string;
};

const copy = {
  "vi-vn": {
    viewAll: "Xem thị trường",
    marketCap: "Tổng vốn hóa",
    volume: "Khối lượng 24h",
    btcDominance: "BTC dominance",
    ethDominance: "ETH dominance",
    fallback: "Dữ liệu mẫu"
  },
  "en-us": {
    viewAll: "View markets",
    marketCap: "Total market cap",
    volume: "24h volume",
    btcDominance: "BTC dominance",
    ethDominance: "ETH dominance",
    fallback: "Sample data"
  }
} satisfies Record<Locale, Record<string, string>>;

export function ArticlesMarketPulse({ locale }: { locale: Locale }) {
  const [stats, setStats] = useState<GlobalMarketStats>(readerFallbackGlobalStats);
  const labels = copy[locale];

  useEffect(() => {
    let cancelled = false;
    let requestInFlight = false;

    async function loadStats() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch(publicApiUrl("/public/markets/global"), { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as GlobalMarketStats;
        if (!cancelled) setStats(payload);
      } catch {
        // Keep the article index usable while live market data is unavailable.
      } finally {
        requestInFlight = false;
      }
    }

    void loadStats();
    const intervalId = window.setInterval(loadStats, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const items = stats
    ? [
        [labels.marketCap, formatCompactUsd(stats.totalMarketCapUsd)],
        [labels.volume, formatCompactUsd(stats.totalVolumeUsd)],
        [labels.btcDominance, formatPercent(stats.btcDominance)],
        [labels.ethDominance, formatPercent(stats.ethDominance)]
      ]
    : [];

  return (
    <section className="rounded-xl border border-[#E3E5E8] bg-white p-5 shadow-[0_16px_42px_rgba(17,24,39,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-[#080B11]">Market pulse</h2>
        <Link className="text-xs font-bold text-[#A36F00]" href={`/${locale}/markets`}>{labels.viewAll} →</Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-[#E6E9EE]">
        {items.map(([label, value]) => (
          <div className="bg-white p-4" key={label}>
            <p className="text-xs font-semibold text-[#667085]">{label}</p>
            <p className="mt-2 text-xl font-bold text-[#080B11]">{value}</p>
          </div>
        ))}
      </div>
      {stats.stale ? <p className="mt-3 text-xs font-semibold text-[#A36F00]">{labels.fallback}</p> : null}
    </section>
  );
}

function formatCompactUsd(value: number) {
  return formatReaderCompactUsd(value);
}

function formatPercent(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : "-";
}
