"use client";

import { useEffect, useRef, useState } from "react";

import { popularCoins } from "@/features/reader/markets/coins";

const tickerScriptSrc = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
const tickerStatusKey = "coinview:ticker-tape";
const tickerStatusTtlMs = 2 * 60 * 1000;

type TickerStatus = {
  status: "ready" | "fallback";
  savedAt: number;
};

const tickerSymbols = popularCoins.slice(0, 100).map((coin) => ({
  proName: coin.tradingViewSymbol,
  title: coin.name
}));

const fallbackItems = popularCoins.slice(0, 100).map((coin) => ({
  label: coin.name,
  symbol: coin.symbol
}));

function readTickerStatus() {
  try {
    const rawStatus = window.localStorage.getItem(tickerStatusKey);
    if (!rawStatus) return null;
    const status = JSON.parse(rawStatus) as TickerStatus;
    if (Date.now() - status.savedAt > tickerStatusTtlMs) return null;
    return status;
  } catch {
    return null;
  }
}

function writeTickerStatus(status: TickerStatus["status"]) {
  try {
    window.localStorage.setItem(tickerStatusKey, JSON.stringify({ status, savedAt: Date.now() }));
  } catch {
    // Local storage can be unavailable in private browsing or strict browser modes.
  }
}

function FallbackMarquee({ variant }: { variant: "header" | "hero" }) {
  return (
    <div className={`flex h-full animate-[coin-marquee_80s_linear_infinite] items-center whitespace-nowrap ${variant === "hero" ? "gap-10 text-base" : "gap-8 text-sm"} font-semibold`}>
      {[...fallbackItems, ...fallbackItems].map((item, index) => (
        <span className="inline-flex items-center gap-2 text-[#111827]" key={`${item.symbol}-${index}`}>
          <span className="font-black text-[#A88412]">{item.symbol}</span>
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export function CoinTickerTape({ variant = "header" }: { variant?: "header" | "hero" }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    setFailed(false);
    setReady(false);

    const cachedStatus = readTickerStatus();
    if (cachedStatus?.status === "fallback") {
      setFailed(true);
      return;
    }

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    const copyright = document.createElement("div");
    copyright.className = "tradingview-widget-copyright sr-only";
    const script = document.createElement("script");
    script.src = tickerScriptSrc;
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbols: tickerSymbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "light",
      locale: "vi"
    });

    const widgetObserver = new MutationObserver(() => {
      if (container.querySelector("iframe")) {
        writeTickerStatus("ready");
        setReady(true);
        if (widgetRenderTimeout) window.clearTimeout(widgetRenderTimeout);
      }
    });
    widgetObserver.observe(container, { childList: true, subtree: true });

    const widgetRenderTimeout = window.setTimeout(() => {
      if (!container.querySelector("iframe")) {
        writeTickerStatus("fallback");
        setFailed(true);
      }
    }, 5000);

    script.onerror = () => {
      writeTickerStatus("fallback");
      setFailed(true);
    };

    container.append(widget, copyright, script);

    return () => {
      window.clearTimeout(widgetRenderTimeout);
      widgetObserver.disconnect();
      container.innerHTML = "";
    };
  }, []);

  const frameClass =
    variant === "hero"
      ? "relative h-12 overflow-hidden bg-transparent"
      : "relative h-10 overflow-hidden border-b border-[#E5E7EB] bg-white";
  const widgetClass = variant === "hero" ? "tradingview-widget-container h-12" : "tradingview-widget-container h-10";

  return (
    <div className={frameClass}>
      <style>{`@keyframes coin-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      {failed || !ready ? <FallbackMarquee variant={variant} /> : null}
      {!failed ? (
        <div
          className={
            ready
              ? widgetClass
              : `${widgetClass} pointer-events-none absolute inset-0 opacity-0`
          }
          ref={containerRef}
        />
      ) : null}
    </div>
  );
}
