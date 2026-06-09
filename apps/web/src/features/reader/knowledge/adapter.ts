import type { Locale } from "@cmsauto/contracts";
import { knowledgeCards, knowledgePages } from "./mock";

export async function getKnowledgePage(locale: Locale) {
  return knowledgePages[locale];
}

export async function getKnowledgeCards() {
  return knowledgeCards;
}
