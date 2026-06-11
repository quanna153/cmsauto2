import type { ArticleSession, ReviewStatus } from "@/features/admin/types";
import { getJson } from "@/lib/api";
import type { DashboardArticleRow, DashboardSnapshot, DashboardStatusCount } from "./model";

export async function getDashboardSnapshot() {
  const { articles } = await getJson<{ articles: ArticleSession[] }>("/articles");
  return buildDashboardSnapshot(articles);
}

export function buildDashboardSnapshot(articles: ArticleSession[]): DashboardSnapshot {
  const statusCounts = buildStatusCounts(articles);
  const published = statusCounts.find((item) => item.status === "published")?.count ?? 0;
  const scheduled = statusCounts.find((item) => item.status === "scheduled")?.count ?? 0;
  const failed = statusCounts.find((item) => item.status === "failed")?.count ?? 0;
  const needsFix = statusCounts.find((item) => item.status === "needs_fix")?.count ?? 0;
  const inProgress = articles.filter((article) => article.activeStep !== "ready").length;
  const editorReady = statusCounts.find((item) => item.status === "editor_ready")?.count ?? 0;
  const actionItems = articles
    .filter((article) => article.reviewStatus === "failed" || article.reviewStatus === "needs_fix" || article.activeStep !== "ready")
    .sort(compareUpdatedDesc)
    .slice(0, 5)
    .map(toDashboardArticleRow);

  return {
    generatedAt: new Date().toISOString(),
    metrics: [
      { label: "Tổng bài viết", value: String(articles.length), hint: "Tất cả bài trong CMS" },
      { label: "Đang làm dở", value: String(inProgress), hint: "Có thể tiếp tục tạo trong Article Factory", tone: inProgress > 0 ? "warning" : "neutral" },
      { label: "Sẵn sàng duyệt", value: String(editorReady), hint: "Có thể mở editor để kiểm tra và lên lịch", tone: editorReady > 0 ? "warning" : "neutral" },
      { label: "Đã lên lịch", value: String(scheduled), hint: "Đang chờ publish worker xử lý", tone: scheduled > 0 ? "success" : "neutral" },
      { label: "Đã publish", value: String(published), hint: "Đã có bản public trong reader", tone: "success" },
      { label: "Cần xử lý", value: String(needsFix + failed), hint: failed > 0 ? "Có bài lỗi publish hoặc cần sửa" : "Bài cần editor kiểm tra", tone: needsFix + failed > 0 ? "danger" : "neutral" }
    ],
    statusCounts,
    recentArticles: [...articles].sort(compareUpdatedDesc).slice(0, 6).map(toDashboardArticleRow),
    actionItems
  };
}

const statusLabels: Record<ReviewStatus, string> = {
  editor_ready: "Sẵn sàng duyệt",
  needs_fix: "Cần xử lý",
  scheduled: "Đã lên lịch",
  publishing: "Đang publish",
  published: "Đã publish",
  failed: "Lỗi publish"
};

const orderedStatuses: ReviewStatus[] = ["editor_ready", "needs_fix", "scheduled", "publishing", "published", "failed"];

function buildStatusCounts(articles: ArticleSession[]): DashboardStatusCount[] {
  return orderedStatuses.map((status) => ({
    status,
    label: statusLabels[status],
    count: articles.filter((article) => article.reviewStatus === status).length
  }));
}

function toDashboardArticleRow(article: ArticleSession): DashboardArticleRow {
  const title = article.draft?.title || article.inputs.seedKeyword || "Bài chưa đặt tiêu đề";
  return {
    id: article.id,
    title,
    status: article.reviewStatus,
    activeStep: article.activeStep,
    updatedAt: article.updatedAt,
    href: article.activeStep !== "ready" ? `/admin/factory?articleId=${article.id}` : `/admin/articles/${article.id}`
  };
}

function compareUpdatedDesc(left: ArticleSession, right: ArticleSession) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}
