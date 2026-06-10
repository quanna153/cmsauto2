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
    <main className="bg-[#F5F5F2] px-5 py-8 text-[#111827]">
      <section className="mx-auto max-w-7xl rounded-lg bg-[#0F1115] p-5 text-white shadow-[0_18px_44px_rgba(17,24,39,0.16)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-white/10 text-[#F5E7B3]">CoinRadar Markets</Badge>
            <h1 className="mt-4 text-4xl font-bold leading-tight">Thị trường Crypto</h1>
            <p className="mt-3 max-w-3xl leading-7 text-white/70">
              Theo dõi biểu đồ giá của 100 đồng coin phổ biến bằng TradingView.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <Activity className="text-[#F5E7B3]" size={20} />
              <p className="mt-3 text-white/60">Đang chọn</p>
              <p className="text-lg font-bold">{selectedCoin.symbol}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <BarChart3 className="text-[#F5E7B3]" size={20} />
              <p className="mt-3 text-white/60">Nguồn</p>
              <p className="text-lg font-bold">TradingView</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-5 lg:grid-cols-[20rem_1fr]">
        <CoinTabs coins={popularCoins} onSelect={setSelectedCoin} selectedCoin={selectedCoin} />
        <div className="grid gap-5">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-[0_14px_34px_rgba(17,24,39,0.05)]">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A88412]">{selectedCoin.tradingViewSymbol}</p>
                <h2 className="mt-1 text-2xl font-bold">{selectedCoin.name}</h2>
              </div>
              <Badge className="bg-[#F5E7B3] text-[#0F1115]">{selectedCoin.symbol}/USDT</Badge>
            </div>
            <TradingViewChart symbol={selectedCoin.tradingViewSymbol} />
          </div>
          <InfoCards coin={selectedCoin} />
        </div>
      </section>
    </main>
  );
}
