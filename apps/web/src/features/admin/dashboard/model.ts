import type { ArticleSession, ReviewStatus } from "@/features/admin/types";

export type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export type DashboardStatusCount = {
  status: ReviewStatus;
  label: string;
  count: number;
};

export type DashboardArticleRow = {
  id: string;
  title: string;
  status: ReviewStatus;
  activeStep: ArticleSession["activeStep"];
  updatedAt: string;
  href: string;
};

export type DashboardSnapshot = {
  generatedAt: string;
  metrics: DashboardMetric[];
  statusCounts: DashboardStatusCount[];
  recentArticles: DashboardArticleRow[];
  actionItems: DashboardArticleRow[];
};
