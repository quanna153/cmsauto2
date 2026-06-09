export type KnowledgeCard = {
  title: string;
  description: string;
};

export type KnowledgeTaxonomy = KnowledgeCard & {
  label: string;
  count: string;
  tone: "blue" | "green" | "amber" | "violet";
};

export type KnowledgeLesson = KnowledgeCard & {
  level: string;
  duration: string;
  tag: string;
};

export type KnowledgePathStep = KnowledgeCard & {
  marker: string;
};

export type KnowledgeGlossaryItem = {
  term: string;
  definition: string;
};

export type KnowledgeMetric = {
  label: string;
  value: string;
  detail: string;
};

export type KnowledgePageContent = {
  eyebrow: string;
  heroBadge: string;
  title: string;
  lead: string;
  summary: string;
  meta: string[];
  taxonomyHeading: string;
  taxonomyDescription: string;
  taxonomy: KnowledgeTaxonomy[];
  lessonsHeading: string;
  lessonsLinkLabel: string;
  lessons: KnowledgeLesson[];
  pathHeading: string;
  pathLinkLabel: string;
  path: KnowledgePathStep[];
  glossaryHeading: string;
  glossaryLinkLabel: string;
  glossary: KnowledgeGlossaryItem[];
  metricsHeading: string;
  metrics: KnowledgeMetric[];
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
};
