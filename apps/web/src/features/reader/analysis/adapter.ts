import type { Locale } from "@cmsauto/contracts";
import { analysisCards, analysisPages } from "./mock";

export async function getAnalysisPage(locale: Locale) {
  return analysisPages[locale];
}

export async function getAnalysisCards() {
  return analysisCards;
}
