import type { Locale } from "@cmsauto/contracts";
import { aboutCards, aboutPages } from "./mock";

export async function getAboutPage(locale: Locale) {
  return aboutPages[locale];
}

export async function getAboutCards() {
  return aboutCards;
}
