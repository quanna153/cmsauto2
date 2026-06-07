export type UserRole = "super_admin" | "admin";

export type AdminUser = {
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
  canManageUsers?: boolean;
};

export type ReviewStatus = "editor_ready" | "needs_fix" | "scheduled" | "publishing" | "published" | "failed";

export type ArticleSession = {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  inputs: { language: "vi" | "en"; seedKeyword: string };
  activeStep: "keywords" | "brief" | "outline" | "draft" | "links" | "ready";
  keywordIdeas: Array<{
    id: string;
    keyword: string;
    intent: string;
    cluster: string;
    monthlyVolume: number | null;
    provider: string;
    checkedAt: string | null;
    status: string;
  }>;
  primaryKeywordId: string | null;
  secondaryKeywordIds: string[];
  brief: { searchIntent: string; angle: string; semanticTopics: string[]; candidateFaqs: string[]; competitorPages?: Array<{ keyword: string; url: string; title: string; snippet: string; }> } | null;
  outline: { title: string; introDirection: string; sections: Array<{ heading: string; bullets: string[] }> } | null;
  draft: { title: string; slug: string; excerpt: string; metaTitle: string; metaDescription: string; markdown: string } | null;
  linkSuggestions: InternalLinkSuggestion[];
  finalMarkdown: string;
  reviewStatus: ReviewStatus;
  reviewNote: string;
  publishAt: string | null;
  publishedAt: string | null;
  livePath: string | null;
  lastPublishError: string | null;
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

export type ArticleLibraryItem = {
  id: string;
  revision: number;
  title: string;
  url: string;
  language: "vi" | "en";
  summary: string;
  keywords: string[];
};

