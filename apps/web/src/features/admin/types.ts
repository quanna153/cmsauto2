export type UserRole = "super_admin" | "admin";

export type AdminUser = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  authorTitle: string;
  authorBio: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  canManageUsers?: boolean;
};

export type ReviewStatus = "editor_ready" | "needs_fix" | "scheduled" | "publishing" | "published" | "failed";
export type ArticleSection = "knowledge" | "articles" | "markets" | "analysis";
export type ArticleImageKind = "hero" | "inline" | "thumbnail";
export type ArticleImageAspectRatio = "16:9" | "4:3" | "1:1" | "3:4";

export type GeneratedArticleImage = {
  id: string;
  kind: ArticleImageKind;
  provider: string;
  model: string;
  status: "planned" | "generated" | "failed";
  prompt: string;
  revisedPrompt?: string;
  url?: string;
  base64?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  aspectRatio: ArticleImageAspectRatio;
  altText: string;
  caption?: string;
  createdAt: string;
};

export type ArticleSession = {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  articleSection?: ArticleSection;
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
  brief: {
    searchIntent: string;
    angle: string;
    semanticTopics: string[];
    candidateFaqs: string[];
    competitorPages?: Array<{ keyword: string; url: string; title: string; snippet: string; rawContent?: string; }>;
    competitorInsights?: Array<{
      rank: number;
      keyword: string;
      url: string;
      title: string;
      contentSummary: string;
      seoIntent: string;
      outlinePattern: string;
      strengths: string[];
      gaps: string[];
      recommendedTakeaway: string;
    }>;
  } | null;
  outline: {
    title: string;
    introDirection: string;
    sections: Array<{ heading: string; bullets: string[] }>;
    keywordCoverage?: Array<{ keyword: string; monthlyVolume: number | null; intent: string; placement: string; }>;
  } | null;
  draft: {
    title: string;
    slug: string;
    excerpt: string;
    metaTitle: string;
    metaDescription: string;
    markdown: string;
    generatedImages?: GeneratedArticleImage[];
  } | null;
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
  targetArticleId?: string;
  targetTitle: string;
  targetUrl: string;
  matchedKeyword: string | null;
  matchStatus: "matched" | "unmatched";
  reason: string;
  confidence: number;
  matchScore?: number;
  relevanceScore?: number;
  intentScore?: number;
  expectationScore?: number;
  status: "pending" | "accepted" | "rejected";
};

export type HistoryRecord = {
  id: string;
  step: "keywords" | "brief" | "outline" | "draft" | "image" | "links" | "apply-links";
  createdAt: string;
  request: unknown;
  response: unknown;
};

export type ArticleLibraryItem = {
  id: string;
  revision: number;
  createdAt: string;
  title: string;
  url: string;
  language: "vi" | "en";
  summary: string;
  keywords: string[];
};

export type ArticleLibraryImportItem = {
  title: string;
  url: string;
  keywords?: string[];
  language?: "vi" | "en" | null;
};

export type ArticleLibraryImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  articles: ArticleLibraryItem[];
};
