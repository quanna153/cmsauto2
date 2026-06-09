"use client";

import { Activity, BarChart3 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";

import { CoinTabs } from "./coin-tabs";
import { popularCoins } from "./coins";
import { InfoCards } from "./info-cards";
import type { Coin } from "./model";
import { TradingViewChart } from "./trading-view-chart";

export function CryptoDashboard() {
  const [selectedCoin, setSelectedCoin] = useState<Coin>(popularCoins[0]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <section className="rounded-2xl bg-[#172033] p-5 text-white md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-white/10 text-[#e4c865]">CoinRadar Markets</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-tight">Thị trường Crypto</h1>
            <p className="mt-3 max-w-3xl leading-7 text-white/70">
              Theo dõi biểu đồ giá của 100 đồng coin phổ biến bằng TradingView.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <Activity className="text-[#e4c865]" size={20} />
              <p className="mt-3 text-white/60">Đang chọn</p>
              <p className="text-lg font-bold">{selectedCoin.symbol}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <BarChart3 className="text-[#e4c865]" size={20} />
              <p className="mt-3 text-white/60">Nguồn</p>
              <p className="text-lg font-bold">TradingView</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[20rem_1fr]">
        <CoinTabs coins={popularCoins} onSelect={setSelectedCoin} selectedCoin={selectedCoin} />
        <div className="grid gap-5">
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a88412]">{selectedCoin.tradingViewSymbol}</p>
                <h2 className="mt-1 text-2xl font-bold">{selectedCoin.name}</h2>
              </div>
              <Badge>{selectedCoin.symbol}/USDT</Badge>
            </div>
            <TradingViewChart symbol={selectedCoin.tradingViewSymbol} />
          </div>
          <InfoCards coin={selectedCoin} />
        </div>
      </section>
    </main>
  );
}
