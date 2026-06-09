import type { Locale } from "@cmsauto/contracts";
import { marketCards, marketPages } from "./mock";

export async function getMarketsPage(locale: Locale) {
  return marketPages[locale];
}

export async function getMarketCards() {
  return marketCards;
}
