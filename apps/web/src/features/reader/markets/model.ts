export type MarketCard = { title: string; description: string };

export type MarketAsset = {
  name: string;
  symbol: string;
  price: string;
  change: string;
  trend: "up" | "down";
  bars: number[];
};

export type MarketSignal = {
  title: string;
  description: string;
  label: string;
  tone: "blue" | "green" | "amber" | "violet";
};

export type MarketBrief = {
  title: string;
  description: string;
  tag: string;
};

export type MarketWatchItem = {
  title: string;
  description: string;
  value: string;
};

export type MarketPageContent = {
  eyebrow: string;
  heroBadge: string;
  title: string;
  lead: string;
  summary: string;
  meta: string[];
  assetsHeading: string;
  assetsLinkLabel: string;
  assets: MarketAsset[];
  signalsHeading: string;
  signalsDescription: string;
  signals: MarketSignal[];
  briefsHeading: string;
  briefsLinkLabel: string;
  briefs: MarketBrief[];
  watchHeading: string;
  watchLinkLabel: string;
  watchItems: MarketWatchItem[];
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
};

export type Coin = {
  name: string;
  symbol: string;
  tradingViewSymbol: string;
};
