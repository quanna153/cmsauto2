export type Language = "vi" | "en";
export type Locale = "vi-vn" | "en-us";
export type ArticleSection = "knowledge" | "articles" | "markets" | "analysis";
export type Intent = "informational" | "commercial" | "comparison" | "transactional";
export type DataStatus = "verified" | "missing" | "failed";
export type PromptKey = "keywords" | "brief" | "outline" | "draft" | "links";
export type PromptTemplates = Record<PromptKey, string>;
export type FactoryStep = "keywords" | "brief" | "outline" | "draft" | "links" | "ready";
export type ReviewStatus =
  | "editor_ready"
  | "needs_fix"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";
export type LegacyReviewStatus = "in_review" | "approved";
export type PublishJobStatus = "queued" | "scheduled" | "processing" | "completed" | "failed" | "cancelled";
export type UserRole = "super_admin" | "admin";

export type KeywordIdea = {
  id: string;
  keyword: string;
  intent: Intent;
  cluster: string;
  monthlyVolume: number | null;
  provider: string;
  checkedAt: string | null;
  status: DataStatus;
};

export type Brief = {
  searchIntent: string;
  angle: string;
  semanticTopics: string[];
  candidateFaqs: string[];
};

export type OutlineSection = {
  heading: string;
  bullets: string[];
};

export type Outline = {
  title: string;
  introDirection: string;
  sections: OutlineSection[];
};

export type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  markdown: string;
};

export type ArticleLibraryItem = {
  id: string;
  revision?: number;
  title: string;
  url: string;
  language: Language;
  summary: string;
  keywords: string[];
};

export type InternalLinkSuggestion = {
  id: string;
  sourceContext: string;
  anchor: string;
  targetTitle: string;
  targetUrl: string;
  matchedKeyword: string | null;
  matchStatus: "matched" | "unmatched";
  reason: string;
  confidence: number;
  status: "pending" | "accepted" | "rejected";
};

export type HistoryStep =
  | "keywords"
  | "brief"
  | "outline"
  | "draft"
  | "links"
  | "apply-links";

export type HistoryRecord = {
  id: string;
  step: HistoryStep;
  createdAt: string;
  request: unknown;
  response: unknown;
};

export type VolumeCacheRecord = {
  provider: string;
  providerLabel: string;
  language: Language;
  keyword: string;
  monthlyVolume: number | null;
  status: DataStatus;
  checkedAt: string | null;
  cachedAt: string;
};

export type ArticleSessionSnapshot = {
  id: string;
  revision?: number;
  createdAt: string;
  updatedAt: string;
  articleSection?: ArticleSection;
  inputs: {
    language: Language;
    seedKeyword: string;
  };
  activeStep: FactoryStep;
  keywordIdeas: KeywordIdea[];
  primaryKeywordId: string | null;
  secondaryKeywordIds: string[];
  brief: Brief | null;
  outline: Outline | null;
  draft: Draft | null;
  linkSuggestions: InternalLinkSuggestion[];
  finalMarkdown: string;
  reviewStatus?: ReviewStatus;
  reviewNote?: string;
  publishAt?: string | null;
  publishedAt?: string | null;
  livePath?: string | null;
  remoteArticleId?: string | null;
  publishJobId?: string | null;
  lastPublishError?: string | null;
  versions?: Array<{
    id: string;
    createdAt: string;
    label: string;
    reviewStatus: ReviewStatus;
    title: string;
    slug: string;
    excerpt: string;
    metaTitle: string;
    metaDescription: string;
    markdown: string;
  }>;
  statusTransitions?: Array<{
    id: string;
    createdAt: string;
    fromStatus: ReviewStatus | null;
    toStatus: ReviewStatus;
    note: string;
  }>;
};

export type PublishJob = {
  id: string;
  articleId: string;
  status: PublishJobStatus;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  idempotencyKey: string;
  lockedAt: string | null;
};

export type PublishLog = {
  id: string;
  publishJobId: string;
  articleId: string;
  eventType: string;
  message: string;
  payload: unknown;
  createdAt: string;
};

export type PublishedArticle = {
  id: string;
  articleId: string;
  articleSection: ArticleSection;
  slug: string;
  locale: Locale;
  language: Language;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  markdown: string;
  publishedAt: string;
  livePath: string;
  internalLinks: InternalLinkSuggestion[];
  primaryKeyword: string;
  secondaryKeywords: string[];
};

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  id: string;
  userId: string;
  expiresAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
  createdIp: string | null;
  userAgent: string | null;
};

export type AuthSessionState = {
  user: AuthUser;
  session: AuthSession;
};

export type ActivityLog = {
  id: string;
  actorUserId: string | null;
  eventType: string;
  targetType: string;
  targetId: string | null;
  payload: unknown;
  createdAt: string;
};
