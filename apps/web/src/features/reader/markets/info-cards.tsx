import type { Coin } from "./model";

export function InfoCards({ coin }: { coin: Coin }) {
  const [exchange = "TradingView", rawPair] = coin.tradingViewSymbol.split(":");
  const pair = rawPair?.replace("USDT", "/USDT") ?? `${coin.symbol}/USDT`;
  const items = [
    { label: "Đồng coin", value: coin.name },
    { label: "Cặp giao dịch", value: pair },
    { label: "Nguồn dữ liệu", value: "TradingView" },
    { label: "Sàn giao dịch", value: exchange },
    { label: "Khung thời gian", value: "Interactive chart" },
    { label: "Trạng thái", value: "Live widget" }
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm" key={item.label}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A88412]">{item.label}</p>
          <p className="mt-2 font-semibold text-[#111827]">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
