import type { ArticleSession } from "@/features/admin/types";

type FactoryStep = ArticleSession["activeStep"];

export function buildFactoryRetryHref(article: ArticleSession) {
  const step = getFactoryRetryStep(article);
  return `/admin/factory?articleId=${encodeURIComponent(article.id)}&step=${step}&mode=regenerate`;
}

export function shouldShowFactoryRetry(article: ArticleSession) {
  return article.reviewStatus === "needs_fix" || article.reviewStatus === "failed";
}

function getFactoryRetryStep(article: ArticleSession): FactoryStep {
  if (article.outline && article.primaryKeywordId) return "draft";
  if (article.brief && article.primaryKeywordId) return "outline";
  if (article.keywordIdeas.length > 0) return "brief";
  return "keywords";
}
