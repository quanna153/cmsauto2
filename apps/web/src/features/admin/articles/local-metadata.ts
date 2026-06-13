import type { ArticleSession, ReviewStatus } from "@/features/admin/types";

const articleReviewStatusStorageKey = "cmsauto.admin.article-review-status.v1";

function readArticleReviewStatusOverrides() {
  if (typeof window === "undefined") return {};
  const stored = window.localStorage.getItem(articleReviewStatusStorageKey);
  try {
    const overrides = stored ? JSON.parse(stored) as Record<string, ReviewStatus> : {};
    return overrides && typeof overrides === "object" ? overrides : {};
  } catch {
    return {};
  }
}

export async function listArticleReviewStatusOverrides() {
  return readArticleReviewStatusOverrides();
}

export async function saveArticleReviewStatusOverride(articleId: string, reviewStatus: ReviewStatus) {
  const overrides = readArticleReviewStatusOverrides();
  window.localStorage.setItem(articleReviewStatusStorageKey, JSON.stringify({ ...overrides, [articleId]: reviewStatus }));
}

export function applyArticleReviewStatusOverrides(articles: ArticleSession[], overrides: Record<string, ReviewStatus>) {
  return articles.map((article) => ({
    ...article,
    reviewStatus: overrides[article.id] ?? article.reviewStatus
  }));
}
