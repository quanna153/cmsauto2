export type AnalysisCard = {
  title: string;
  description: string;
};

export type AnalysisThesis = AnalysisCard & {
  label: string;
  confidence: string;
  tone: "blue" | "green" | "amber" | "violet";
};

export type AnalysisReport = AnalysisCard & {
  tag: string;
  readTime: string;
  author: string;
};

export type AnalysisIndicator = {
  label: string;
  value: string;
  description: string;
  trend: "up" | "down" | "neutral";
};

export type AnalysisRisk = AnalysisCard & {
  marker: string;
};

export type AnalysisMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AnalysisPageContent = {
  eyebrow: string;
  heroBadge: string;
  title: string;
  lead: string;
  summary: string;
  meta: string[];
  thesisHeading: string;
  thesisDescription: string;
  theses: AnalysisThesis[];
  reportsHeading: string;
  reportsLinkLabel: string;
  reports: AnalysisReport[];
  indicatorsHeading: string;
  indicatorsLinkLabel: string;
  indicators: AnalysisIndicator[];
  risksHeading: string;
  risksLinkLabel: string;
  risks: AnalysisRisk[];
  metricsHeading: string;
  metrics: AnalysisMetric[];
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
};
