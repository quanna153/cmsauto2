"use client";

import type { Locale } from "@cmsauto/contracts";
import { useEffect, useId, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

let tradingViewScriptPromise: Promise<void> | null = null;
const tradingViewScriptSrc = "https://s3.tradingview.com/tv.js";
const chartStatusTtlMs = 2 * 60 * 1000;

type ChartStatus = {
  status: "ready" | "fallback";
  savedAt: number;
};

function getChartStatusKey(symbol: string) {
  return `coinview:tradingview-chart:${symbol}`;
}

function readChartStatus(symbol: string) {
  try {
    const rawStatus = window.localStorage.getItem(getChartStatusKey(symbol));
    if (!rawStatus) return null;
    const status = JSON.parse(rawStatus) as ChartStatus;
    if (Date.now() - status.savedAt > chartStatusTtlMs) return null;
    return status;
  } catch {
    return null;
  }
}

function writeChartStatus(symbol: string, status: ChartStatus["status"]) {
  try {
    window.localStorage.setItem(getChartStatusKey(symbol), JSON.stringify({ status, savedAt: Date.now() }));
  } catch {
    // Local storage can be unavailable in private browsing or strict browser modes.
  }
}

function loadTradingViewScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("TradingView only runs in the browser."));
  }

  if (window.TradingView) {
    return Promise.resolve();
  }

  if (!tradingViewScriptPromise) {
    tradingViewScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${tradingViewScriptSrc}"]`);
      if (existingScript) {
        if (window.TradingView || existingScript.dataset.status === "ready") {
          resolve();
          return;
        }

        if (existingScript.dataset.status === "error") {
          existingScript.remove();
        } else {
          existingScript.addEventListener("load", () => resolve(), { once: true });
          existingScript.addEventListener(
            "error",
            () => {
              existingScript.dataset.status = "error";
              tradingViewScriptPromise = null;
              reject(new Error("TradingView widget failed to load."));
            },
            { once: true }
          );
          return;
        }
      }

      const script = document.createElement("script");
      script.src = tradingViewScriptSrc;
      script.async = true;
      script.onload = () => {
        script.dataset.status = "ready";
        resolve();
      };
      script.onerror = () => {
        script.dataset.status = "error";
        tradingViewScriptPromise = null;
        reject(new Error("TradingView widget failed to load."));
      };
      document.head.appendChild(script);
    });
  }

  return tradingViewScriptPromise;
}

function getFallbackChartUrl(symbol: string, theme: "dark" | "light", locale: Locale) {
  const params = new URLSearchParams({
    symbol,
    interval: "D",
    timezone: "Asia/Ho_Chi_Minh",
    theme,
    style: "1",
    locale: locale === "vi-vn" ? "vi" : "en",
    hide_side_toolbar: "0",
    allow_symbol_change: "1",
    save_image: "0"
  });

  return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
}

export function TradingViewChart({
  symbol,
  heightClass = "h-[420px] md:h-[520px] lg:h-[600px]",
  theme = "dark",
  locale = "vi-vn"
}: {
  symbol: string;
  heightClass?: string;
  theme?: "dark" | "light";
  locale?: Locale;
}) {
  const reactId = useId();
  const containerId = useMemo(() => `tradingview-${reactId.replace(/:/g, "")}`, [reactId]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    let renderTimeout: number | undefined;
    let observer: MutationObserver | undefined;
    setUseFallback(false);

    if (!container) return;
    container.innerHTML = "";

    const cachedStatus = readChartStatus(symbol);
    if (cachedStatus?.status === "fallback") {
      setUseFallback(true);
      return;
    }

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !window.TradingView || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        const activeContainer = containerRef.current;

        observer = new MutationObserver(() => {
          if (activeContainer.querySelector("iframe")) {
            writeChartStatus(symbol, "ready");
            if (renderTimeout) window.clearTimeout(renderTimeout);
          }
        });
        observer.observe(activeContainer, { childList: true, subtree: true });

        new window.TradingView.widget({
          autosize: true,
          symbol,
          interval: "D",
          timezone: "Asia/Ho_Chi_Minh",
          theme,
          style: "1",
          locale: locale === "vi-vn" ? "vi_VN" : "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerId
        });

        renderTimeout = window.setTimeout(() => {
          if (!cancelled && !activeContainer.querySelector("iframe")) {
            writeChartStatus(symbol, "fallback");
            setUseFallback(true);
          }
        }, 8000);
      })
      .catch(() => {
        if (!cancelled) {
          writeChartStatus(symbol, "fallback");
          setUseFallback(true);
        }
      });

    return () => {
      cancelled = true;
      if (renderTimeout) window.clearTimeout(renderTimeout);
      observer?.disconnect();
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [containerId, locale, symbol, theme]);

  return (
    <div className={`relative overflow-hidden rounded-lg border ${theme === "light" ? "border-[#E9DDBF] bg-white" : "border-[#2B313D] bg-[#0F1115]"}`}>
      <div className={heightClass} id={containerId} ref={containerRef} />
      {useFallback ? (
        <iframe
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          src={getFallbackChartUrl(symbol, theme, locale)}
          title={`${symbol} fallback chart`}
        />
      ) : null}
    </div>
  );
}
