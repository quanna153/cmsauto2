"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type { Coin } from "./model";

export function CoinTabs({ coins, selectedCoin, onSelect }: { coins: Coin[]; selectedCoin: Coin; onSelect: (coin: Coin) => void }) {
  const [query, setQuery] = useState("");
  const filteredCoins = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return coins;
    return coins.filter((coin) => `${coin.name} ${coin.symbol}`.toLowerCase().includes(normalized));
  }, [coins, query]);

  return (
    <section className="rounded-xl border bg-white p-4">
      <label className="text-sm font-semibold" htmlFor="coin-search">
        Tìm coin
      </label>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#687386]" size={17} />
        <Input
          className="pl-9"
          id="coin-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo tên hoặc symbol"
          value={query}
        />
      </div>
      <Tabs className="mt-4 grid max-h-[23rem] grid-cols-2 content-start overflow-y-auto pr-1 sm:grid-cols-3 lg:flex lg:max-h-[34rem] lg:flex-col lg:flex-nowrap">
        {filteredCoins.map((coin) => {
          const active = selectedCoin.symbol === coin.symbol;
          return (
            <button
              className={cn(
                "flex min-h-14 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition hover:border-[#a88412] hover:bg-[#fbf5dc]",
                active ? "border-[#a88412] bg-[#fbf5dc] text-[#80640b]" : "bg-white text-[#273247]"
              )}
              key={coin.symbol}
              onClick={() => onSelect(coin)}
              type="button"
            >
              <span>
                <span className="block font-bold">{coin.symbol}</span>
                <span className="line-clamp-1 text-xs text-[#687386]">{coin.name}</span>
              </span>
            </button>
          );
        })}
      </Tabs>
      {filteredCoins.length === 0 ? <p className="mt-4 rounded-lg bg-[#f1f2ee] p-3 text-sm text-[#687386]">Không tìm thấy coin phù hợp.</p> : null}
    </section>
  );
}
