export type AboutCard = {
  title: string;
  description: string;
};

export type AboutMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AboutPillar = AboutCard & {
  eyebrow: string;
  tone: "blue" | "green" | "amber" | "violet";
  marker: string;
};

export type AboutPrinciple = {
  title: string;
  description: string;
  tag: string;
};

export type AboutWorkflowStep = {
  title: string;
  description: string;
};

export type AboutTeamNote = {
  title: string;
  description: string;
};

export type AboutPageContent = {
  eyebrow: string;
  heroBadge: string;
  title: string;
  lead: string;
  summary: string;
  meta: string[];
  metrics: AboutMetric[];
  pillarsHeading: string;
  pillarsDescription: string;
  pillars: AboutPillar[];
  principlesHeading: string;
  principlesLinkLabel: string;
  principles: AboutPrinciple[];
  workflowHeading: string;
  workflowLinkLabel: string;
  workflow: AboutWorkflowStep[];
  teamHeading: string;
  teamNotes: AboutTeamNote[];
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
};
