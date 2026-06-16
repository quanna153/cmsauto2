import fs from "node:fs/promises";
import path from "node:path";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { searchTavily } from "./tavily.js";
import { articlePatchSchema } from "@cmsauto/contracts";
import {
  ArticleImageProviderError,
  ArticleImageProviderNotConfiguredError,
  articleImageHealth,
  generateArticleImage
} from "./article-images.js";
import { buildClearSessionCookie, buildSessionCookie, parseCookies, sessionCookieName } from "./auth.js";
import {
  authenticateUser,
  changeOwnPassword,
  ensureAuthBootstrap,
  logoutSession,
  readAuthSessionState,
  readUsers,
  createAdminUser,
  deleteManagedUser,
  updateManagedUser,
  resetManagedUserPassword,
  revokeManagedUserSessions,
  touchSession
} from "./auth-store.js";
import {
  applyInternalLinks,
  buildBrief,
  buildDraft,
  buildInternalLinkMappingCsv,
  buildKeywordMatchedLibrarySuggestions,
  buildInternalLinkSuggestionsFromAnchorCandidates,
  buildOutline,
  findInternalLinkAnchorCandidates,
  type InternalLinkAnchorCandidate,
  mapAnchorCandidatesToInternalLinks,
  mapAnchorTextCandidatesToInternalLinkCandidates,
  retrieveInternalLinkArticles,
  selectInternalLinkCandidatesForAnchorCandidates,
  slugify
} from "./factory.js";
import { generateStructuredJson, hasGeminiConfig } from "./gemini.js";
import {
  enrichKeywordIdeasWithVolumes,
  isSemrushSessionExpiredError,
  keywordVolumeHealth,
  parseSemrushJsonText,
  semrushResponseErrorMessage
} from "./keyword-volume.js";
import {
  appendHistory,
  createArticleLibraryItem,
  createManualPublishedArticle,
  createManualScheduledArticle,
  createArticleSession,
  deleteArticleLibraryItem,
  deleteArticleSession,
  importArticleLibraryItems,
  patchArticleLibraryItem,
  patchArticleSession,
  patchPromptTemplate,
  readArticleLibrary,
  readArticleSessions,
  readPublishJobs,
  readPublishLogs,
  readPromptTemplateRecords,
  readPromptTemplates,
  readRecentHistory,
  reviewGateArticle,
  retryPublishJob,
  runDuePublishJobs,
  startPublishWorker,
  readImageLibrary,
  readImageLibraryItem,
  createImageLibraryItem,
  deleteImageLibraryItem
} from "./store.js";
import { ResourceRevisionConflictError, RevisionConflictError } from "./store.js";
import { defaultPromptTemplates } from "./prompt-defaults.js";
import type { ArticleLibraryItem, ArticleSessionSnapshot, AuthSessionState, AuthUser, Intent, InternalLinkSuggestion, KeywordIdea, ReviewStatus } from "./types.js";
import { publicReaderRouter } from "./routes/public-reader.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use("/api/public/images", express.static(path.join(process.cwd(), "data", "images")));

function getApiConfigFromHeaders(request: express.Request) {
  return {
    customConfig: {
      model: request.headers["x-gemini-model"] as string | undefined,
      apiKey: request.headers["x-gemini-api-key"] as string | undefined
    },
    tavilyApiKey: request.headers["x-tavily-api-key"] as string | undefined,
    semrushToken: (request.headers["x-semrush-proxy-token"] as string | undefined) ?? process.env.SEMRUSH_PROXY_TOKEN,
    imageConfig: {
      provider: request.headers["x-image-generation-provider"] as string | undefined,
      model: request.headers["x-image-generation-model"] as string | undefined,
      apiKey: request.headers["x-image-generation-api-key"] as string | undefined,
      proxyToken: request.headers["x-image-generation-proxy-token"] as string | undefined
    }
  };
}

type AuthenticatedRequest = express.Request & {
  auth: AuthSessionState;
};

const languageSchema = z.enum(["vi", "en"]);
const competitorPageSchema = z.object({
  keyword: z.string(),
  url: z.string(),
  title: z.string(),
  snippet: z.string(),
  rawContent: z.string().optional()
});
const competitorInsightSchema = z.object({
  rank: z.number().int().positive(),
  keyword: z.string(),
  url: z.string(),
  title: z.string(),
  contentSummary: z.string(),
  seoIntent: z.string(),
  outlinePattern: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendedTakeaway: z.string()
});
const briefSchema = z.object({
  searchIntent: z.string(),
  angle: z.string(),
  semanticTopics: z.array(z.string()),
  candidateFaqs: z.array(z.string()),
  competitorPages: z.array(competitorPageSchema).optional(),
  competitorInsights: z.array(competitorInsightSchema).optional()
});
const outlineSectionSchema = z.object({
  heading: z.string(),
  bullets: z.array(z.string())
});
const keywordCoverageSchema = z.object({
  keyword: z.string(),
  monthlyVolume: z.number().nullable(),
  intent: z.enum(["informational", "commercial", "comparison", "transactional"]),
  placement: z.string()
});
const outlineSchema = z.object({
  title: z.string(),
  introDirection: z.string(),
  sections: z.array(outlineSectionSchema),
  keywordCoverage: z.array(keywordCoverageSchema).optional()
});
const articleImageKindSchema = z.enum(["hero", "inline", "thumbnail"]);
const articleImageAspectRatioSchema = z.enum(["16:9", "4:3", "1:1", "3:4"]);
const generatedArticleImageSchema = z.object({
  id: z.string(),
  kind: articleImageKindSchema,
  provider: z.string(),
  model: z.string(),
  status: z.enum(["planned", "generated", "failed"]),
  prompt: z.string(),
  revisedPrompt: z.string().optional(),
  url: z.string().optional(),
  base64: z.string().optional(),
  mimeType: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  aspectRatio: articleImageAspectRatioSchema,
  altText: z.string(),
  caption: z.string().optional(),
  createdAt: z.string()
});
const draftSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  markdown: z.string(),
  generatedImages: z.array(generatedArticleImageSchema).optional()
});
const suggestionSchema: z.ZodType<InternalLinkSuggestion> = z.object({
  id: z.string(),
  sourceContext: z.string(),
  anchor: z.string(),
  targetArticleId: z.string().optional(),
  targetTitle: z.string(),
  targetUrl: z.string(),
  matchedKeyword: z.string().nullable(),
  matchStatus: z.enum(["matched", "unmatched"]),
  reason: z.string(),
  confidence: z.number(),
  matchScore: z.number().optional(),
  relevanceScore: z.number().optional(),
  intentScore: z.number().optional(),
  expectationScore: z.number().optional(),
  status: z.enum(["pending", "accepted", "rejected"])
});
const articleLibraryItemSchema = z.object({
  id: z.string(),
  revision: z.number().int().positive().optional(),
  createdAt: z.string(),
  title: z.string(),
  url: z.string(),
  language: languageSchema,
  summary: z.string(),
  keywords: z.array(z.string())
}) satisfies z.ZodType<ArticleLibraryItem>;
const articleLibraryCreateSchema = articleLibraryItemSchema.omit({
  revision: true,
  createdAt: true
});
const articleLibraryImportSchema = z.object({
  items: z.array(z.object({
    title: z.string().min(1),
    url: z.string().min(1),
    keywords: z.array(z.string()).optional(),
    language: languageSchema.nullable().optional()
  })).min(1)
});
const articleLibraryPatchSchema = z.object({
  expectedRevision: z.number().int().positive(),
  changes: articleLibraryCreateSchema.partial()
});
const promptTemplatesSchema = z.object({
  keywords: z.string().min(1),
  brief: z.string().min(1),
  outline: z.string().min(1),
  draft: z.string().min(1),
  links: z.string().min(1)
});
const promptKeySchema = z.enum(["keywords", "brief", "outline", "draft", "links"]);
const promptTemplatePatchSchema = z.object({
  expectedRevision: z.number().int().positive(),
  value: z.string().min(1)
});
const geminiKeywordResultSchema = z.object({
  keywordIdeas: z.array(z.object({
    keyword: z.string().min(1),
    intent: z.enum(["informational", "commercial", "comparison", "transactional"]),
    cluster: z.string().min(1)
  })).min(4)
});
const geminiBriefSchema = z.object({ brief: briefSchema });
const geminiOutlineSchema = z.object({ outline: outlineSchema });
const geminiDraftSchema = z.object({ draft: draftSchema });
const geminiInternalLinkAnchorSelectionSchema = z.object({
  anchorCandidates: z.array(z.object({
    anchorText: z.string().min(2),
    sourceContext: z.string().min(1),
    confidence: z.number().min(0).max(1),
    reason: z.string().min(1)
  })).max(12)
});
const keywordIdeaResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    keywordIdeas: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          keyword: { type: "string", description: "Từ khóa đề xuất." },
          intent: {
            type: "string",
            enum: ["informational", "commercial", "comparison", "transactional"],
            description: "Ý định tìm kiếm."
          },
          cluster: { type: "string", description: "Nhãn cụm chủ đề ngắn gọn." }
        },
        required: ["keyword", "intent", "cluster"]
      }
    }
  },
  required: ["keywordIdeas"]
} as const;
const briefResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    brief: {
      type: "object",
      additionalProperties: false,
      properties: {
        searchIntent: { type: "string", description: "Một câu mô tả ý định tìm kiếm chính." },
        angle: { type: "string", description: "Một câu mô tả góc triển khai bài viết." },
        semanticTopics: {
          type: "array",
          minItems: 4,
          maxItems: 8,
          items: { type: "string" },
          description: "Danh sách chủ đề semantic cần phủ."
        },
        candidateFaqs: {
          type: "array",
          minItems: 3,
          maxItems: 8,
          items: { type: "string" },
          description: "Danh sách câu hỏi FAQ ngắn gọn."
        },
        competitorInsights: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          description: "Một insight SEO cho từng bài trong Top 10 đối thủ của từ khóa chính.",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              rank: { type: "integer", minimum: 1, maximum: 10 },
              keyword: { type: "string" },
              url: { type: "string" },
              title: { type: "string" },
              contentSummary: { type: "string", description: "Tóm tắt nội dung/cách triển khai của bài đối thủ." },
              seoIntent: { type: "string", description: "Intent SEO mà bài đối thủ đang phục vụ." },
              outlinePattern: { type: "string", description: "Cách bài đối thủ tổ chức heading/luồng trình bày." },
              strengths: {
                type: "array",
                minItems: 1,
                maxItems: 4,
                items: { type: "string" }
              },
              gaps: {
                type: "array",
                minItems: 1,
                maxItems: 4,
                items: { type: "string" }
              },
              recommendedTakeaway: { type: "string", description: "Điểm nên kế thừa hoặc cải thiện khi viết bài mới." }
            },
            required: ["rank", "keyword", "url", "title", "contentSummary", "seoIntent", "outlinePattern", "strengths", "gaps", "recommendedTakeaway"]
          }
        }
      },
      required: ["searchIntent", "angle", "semanticTopics", "candidateFaqs", "competitorInsights"]
    }
  },
  required: ["brief"]
} as const;
const outlineResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    outline: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", description: "Tiêu đề bài viết hoàn chỉnh." },
        introDirection: { type: "string", description: "Một đoạn ngắn hướng dẫn mở bài." },
        sections: {
          type: "array",
          minItems: 4,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              heading: { type: "string", description: "Tiêu đề section." },
              bullets: {
                type: "array",
                minItems: 2,
                maxItems: 5,
                items: { type: "string" },
                description: "Các ý chính của section."
              }
            },
            required: ["heading", "bullets"]
          }
        },
        keywordCoverage: {
          type: "array",
          minItems: 1,
          maxItems: 8,
          description: "Danh sách từ khóa chính/phụ và vị trí nên phủ trong outline.",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              keyword: { type: "string" },
              monthlyVolume: { type: ["number", "null"] },
              intent: {
                type: "string",
                enum: ["informational", "commercial", "comparison", "transactional"]
              },
              placement: { type: "string", description: "Section/heading/bullet nơi từ khóa này được xử lý." }
            },
            required: ["keyword", "monthlyVolume", "intent", "placement"]
          }
        }
      },
      required: ["title", "introDirection", "sections", "keywordCoverage"]
    }
  },
  required: ["outline"]
} as const;
const draftResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    draft: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", description: "Tiêu đề bài viết hiển thị cho người đọc." },
        slug: { type: "string", description: "Slug URL dạng lowercase-hyphen-only." },
        excerpt: { type: "string", description: "Đoạn tóm tắt ngắn 1-2 câu." },
        metaTitle: { type: "string", description: "Meta title SEO." },
        metaDescription: { type: "string", description: "Meta description SEO." },
        markdown: {
          type: "string",
          description: "Toàn bộ bài viết markdown nằm trong một string JSON hợp lệ, dùng \\n cho xuống dòng."
        }
      },
      required: ["title", "slug", "excerpt", "metaTitle", "metaDescription", "markdown"]
    }
  },
  required: ["draft"]
} as const;
const internalLinkAnchorSelectionResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    anchorCandidates: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          anchorText: { type: "string", description: "Exact meaningful phrase from draft_markdown that should become an internal link anchor." },
          sourceContext: { type: "string", description: "Short sentence or paragraph fragment from draft_markdown where anchorText appears." },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reason: { type: "string", description: "Short reason why this anchor should be linked." }
        },
        required: ["anchorText", "sourceContext", "confidence", "reason"]
      }
    }
  },
  required: ["anchorCandidates"]
} as const;
const keywordRequestSchema = z.object({
  seedKeyword: z.string().min(1),
  language: languageSchema,
  prompt: z.string().min(1),
  semrushToken: z.string().optional()
});
const keywordIdeaInputSchema = z.object({
  id: z.string(),
  keyword: z.string().min(1),
  intent: z.enum(["informational", "commercial", "comparison", "transactional"]),
  cluster: z.string().min(1),
  monthlyVolume: z.number().nullable().optional(),
  provider: z.string().optional(),
  checkedAt: z.string().nullable().optional(),
  status: z.enum(["verified", "missing", "failed"]).optional()
});
const keywordIdeasRefreshSchema = z.object({
  language: languageSchema,
  keywordIdeas: z.array(keywordIdeaInputSchema).min(1)
});

function trimForPrompt(value: string | undefined, maxLength = 4000) {
  const text = value?.trim() ?? "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function formatDraftMarkdownForAnchorPrompt(markdown: string) {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter((block) => block && !/^#{1,6}\s/u.test(block))
    .slice(0, 24);

  const formatted = blocks
    .map((block, index) => `Đoạn ${index + 1}: ${trimForPrompt(block, 900)}`)
    .join("\n\n");

  return formatted || trimForPrompt(markdown.replace(/\s+/g, " "), 6000);
}

function normalizeDraftPhrase(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function mapAiAnchorSelectionsToInternalLinkCandidates(
  selections: z.infer<typeof geminiInternalLinkAnchorSelectionSchema>["anchorCandidates"],
  draftMarkdown: string,
  existingAnchors: Set<string>
): InternalLinkAnchorCandidate[] {
  const normalizedDraft = normalizeDraftPhrase(draftMarkdown);
  const seen = new Set<string>();

  return selections.flatMap((selection) => {
    const anchor = selection.anchorText.trim().replace(/\s+/g, " ");
    const normalizedAnchor = normalizeDraftPhrase(anchor);
    if (
      !anchor
      || seen.has(normalizedAnchor)
      || existingAnchors.has(normalizedAnchor)
      || !normalizedDraft.includes(normalizedAnchor)
    ) {
      return [];
    }

    seen.add(normalizedAnchor);
    const sourceContext = selection.sourceContext.trim().replace(/\s+/g, " ");
    return [{
      anchor,
      sourceContext: normalizeDraftPhrase(sourceContext).includes(normalizedAnchor) ? sourceContext : undefined,
      reason: selection.reason.trim(),
      confidence: Math.round(selection.confidence * 100)
    }];
  });
}

function normalizeSuggestionAnchor(anchor: string) {
  return anchor.trim().toLowerCase();
}

function normalizeSuggestionUrl(url: string) {
  return url.trim().toLowerCase();
}

function isExistingInternalLinkSuggestion(
  suggestion: InternalLinkSuggestion,
  existingAnchors: Set<string>,
  existingUrls: Set<string>
) {
  return existingAnchors.has(normalizeSuggestionAnchor(suggestion.anchor))
    || (suggestion.targetUrl.trim() && existingUrls.has(normalizeSuggestionUrl(suggestion.targetUrl)));
}

function mergeAdditionalInternalLinks(
  existingSuggestions: InternalLinkSuggestion[],
  additionalSuggestions: InternalLinkSuggestion[],
  maxLinks = 10
) {
  if (existingSuggestions.length === 0) {
    return additionalSuggestions.slice(0, maxLinks);
  }

  const existingAnchors = new Set(existingSuggestions.map((suggestion) => normalizeSuggestionAnchor(suggestion.anchor)));
  const existingUrls = new Set(existingSuggestions.map((suggestion) => normalizeSuggestionUrl(suggestion.targetUrl)).filter(Boolean));
  const room = Math.max(0, maxLinks - existingSuggestions.length);
  const additions = additionalSuggestions
    .filter((suggestion) => !isExistingInternalLinkSuggestion(suggestion, existingAnchors, existingUrls))
    .slice(0, room);

  return [...existingSuggestions, ...additions];
}

function mergeRegeneratedInternalLinks(
  existingSuggestions: InternalLinkSuggestion[],
  regeneratedSuggestions: InternalLinkSuggestion[]
) {
  if (existingSuggestions.length === 0) {
    return regeneratedSuggestions;
  }

  const replacements = new Map(regeneratedSuggestions.map((suggestion) => [
    normalizeSuggestionAnchor(suggestion.anchor),
    suggestion
  ]));
  const used = new Set<string>();
  const merged = existingSuggestions.flatMap((suggestion) => {
    if (suggestion.status !== "rejected") {
      return [suggestion];
    }

    const replacement = replacements.get(normalizeSuggestionAnchor(suggestion.anchor));
    if (!replacement) {
      return [];
    }
    used.add(normalizeSuggestionAnchor(replacement.anchor));
    return [replacement];
  });

  return merged;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function canFallbackToLocalInternalLinks(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("fetch failed") || normalized.includes("timed out");
}

function formatCompetitorPagesForPrompt(pages: Array<z.infer<typeof competitorPageSchema>>) {
  return pages
    .map((page, index) => [
      `${index + 1}. [Từ khóa: ${page.keyword}] Title: ${page.title}`,
      `   URL: ${page.url}`,
      `   Snippet: ${trimForPrompt(page.snippet, 900)}`,
      page.rawContent ? `   Content: ${trimForPrompt(page.rawContent, 2500)}` : null
    ].filter(Boolean).join("\n"))
    .join("\n\n");
}

function normalizeKeywordIdeaInput(
  idea: z.infer<typeof keywordIdeaInputSchema>
): KeywordIdea {
  return {
    id: idea.id,
    keyword: idea.keyword,
    intent: idea.intent,
    cluster: idea.cluster,
    monthlyVolume: idea.monthlyVolume ?? null,
    provider: idea.provider ?? "Semrush",
    checkedAt: idea.checkedAt ?? null,
    status: idea.status ?? "missing"
  };
}

function buildKeywordPlanForOutline(
  primaryKeyword: string,
  secondaryKeywords: string[],
  keywordIdeas?: Array<z.infer<typeof keywordIdeaInputSchema>>
) {
  const normalizedIdeas = (keywordIdeas ?? []).map(normalizeKeywordIdeaInput);
  const fallbackKeywords = [primaryKeyword, ...secondaryKeywords].map((keyword, index) => ({
    id: keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    keyword,
    intent: "informational" as const,
    cluster: index === 0 ? "primary" : "secondary",
    monthlyVolume: null,
    provider: "unknown",
    checkedAt: null,
    status: "missing" as const
  }));

  const ideas = normalizedIdeas.length > 0 ? normalizedIdeas : fallbackKeywords;
  const uniqueIdeas = new Map<string, KeywordIdea>();
  for (const idea of ideas) {
    const key = idea.keyword.toLowerCase();
    if (!uniqueIdeas.has(key)) {
      uniqueIdeas.set(key, idea);
    }
  }

  return Array.from(uniqueIdeas.values()).map((idea, index) => ({
    ...idea,
    role: index === 0 || idea.keyword.toLowerCase() === primaryKeyword.toLowerCase() ? "primary" : "secondary"
  }));
}

function formatKeywordPlanForPrompt(keywordPlan: ReturnType<typeof buildKeywordPlanForOutline>) {
  return keywordPlan
    .map((idea, index) => [
      `${index + 1}. ${idea.role.toUpperCase()}: ${idea.keyword}`,
      `   intent: ${idea.intent}`,
      `   cluster: ${idea.cluster}`,
      `   volume: ${idea.monthlyVolume ?? "missing"}`,
      `   provider: ${idea.provider}`,
      `   status: ${idea.status}`
    ].join("\n"))
    .join("\n\n");
}

function formatCompetitorInsightsForPrompt(insights: NonNullable<z.infer<typeof briefSchema>["competitorInsights"]>) {
  return insights
    .map((insight) => [
      `${insight.rank}. ${insight.title}`,
      `   keyword: ${insight.keyword}`,
      `   url: ${insight.url}`,
      `   summary: ${insight.contentSummary}`,
      `   seoIntent: ${insight.seoIntent}`,
      `   outlinePattern: ${insight.outlinePattern}`,
      `   strengths: ${insight.strengths.join(" | ")}`,
      `   gaps: ${insight.gaps.join(" | ")}`,
      `   takeaway: ${insight.recommendedTakeaway}`
    ].join("\n"))
    .join("\n\n");
}

function ensureCompetitorInsights(
  pages: Array<z.infer<typeof competitorPageSchema>>,
  insights: NonNullable<z.infer<typeof briefSchema>["competitorInsights"]> | undefined,
  primaryKeyword: string
) {
  const byUrl = new Map((insights ?? []).map((insight) => [insight.url, insight]));
  const byRank = new Map((insights ?? []).map((insight) => [insight.rank, insight]));

  return pages.slice(0, 10).map((page, index) => {
    const rank = index + 1;
    const existing = byUrl.get(page.url) ?? byRank.get(rank);
    if (existing) {
      return { ...existing, rank, keyword: existing.keyword || primaryKeyword };
    }

    const sourceText = trimForPrompt(page.rawContent || page.snippet, 650);
    return {
      rank,
      keyword: primaryKeyword,
      url: page.url,
      title: page.title,
      contentSummary: sourceText || `Competitor page covering ${primaryKeyword}.`,
      seoIntent: `Informational page targeting ${primaryKeyword}.`,
      outlinePattern: "Use the title and available content summary to infer the page's explanation flow, then compare it with other top results.",
      strengths: ["Covers a top-ranking angle for the primary keyword."],
      gaps: ["Requires synthesis with the other top results to find a stronger original angle."],
      recommendedTakeaway: "Use this result as one SERP reference point when shaping the final outline."
    };
  });
}

function cleanGeneratedOutlineText(value: string) {
  const hasSelfCorrection = /self-correction|the schema|schema says|i will|no, the/i.test(value);
  if (!hasSelfCorrection) {
    return value.trim();
  }

  return value
    .split(/\s+(?:The schema|schema says|I will|No, the|\(Self-correction)/i)[0]
    ?.trim()
    .replace(/\s+\($/, "")
    || value.trim();
}

function sanitizeOutline(outline: z.infer<typeof outlineSchema>) {
  return {
    ...outline,
    title: cleanGeneratedOutlineText(outline.title),
    introDirection: cleanGeneratedOutlineText(outline.introDirection),
    sections: outline.sections.map((section) => ({
      heading: cleanGeneratedOutlineText(section.heading),
      bullets: section.bullets
        .map(cleanGeneratedOutlineText)
        .filter((bullet) => bullet.length > 0)
    })),
    keywordCoverage: outline.keywordCoverage?.map((item) => ({
      ...item,
      placement: cleanGeneratedOutlineText(item.placement)
    }))
  };
}

const briefRequestSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).min(1),
  language: languageSchema,
  prompt: z.string().min(1)
});
const outlineRequestSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).min(1),
  language: languageSchema,
  prompt: z.string().min(1),
  brief: briefSchema,
  keywordIdeas: z.array(keywordIdeaInputSchema).optional()
});
const draftRequestSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).min(1),
  language: languageSchema,
  prompt: z.string().min(1),
  outline: outlineSchema
});
const articleImageRequestSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).default([]),
  language: languageSchema,
  title: z.string().optional(),
  excerpt: z.string().optional(),
  prompt: z.string().optional(),
  kind: articleImageKindSchema.default("hero"),
  aspectRatio: articleImageAspectRatioSchema.default("16:9"),
  stylePreset: z.string().optional(),
  outline: outlineSchema.optional(),
  draft: draftSchema.optional()
});
const linksRequestSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).default([]),
  language: languageSchema,
  prompt: z.string().min(1),
  draft: draftSchema.optional(),
  existingSuggestions: z.array(suggestionSchema).optional(),
  preservedSuggestions: z.array(suggestionSchema).optional(),
  rejectedSuggestions: z.array(suggestionSchema).optional(),
  expandSuggestions: z.boolean().optional(),
  matchLibraryOnly: z.boolean().optional()
});
const applyLinksRequestSchema = z.object({
  markdown: z.string().min(1),
  suggestions: z.array(suggestionSchema)
});
const reviewStatusSchema = z.enum(["editor_ready", "needs_fix", "scheduled", "publishing", "published", "failed"]);
const legacyReviewStatusSchema = z.enum(["in_review", "approved"]);
const reviewStatusInputSchema = z.union([reviewStatusSchema, legacyReviewStatusSchema]);
const publishJobStatusSchema = z.enum(["queued", "scheduled", "processing", "completed", "failed", "cancelled"]);
const articleVersionSchema = z.object({
  id: z.string(),
  createdAt: z.string().min(1),
  label: z.string().min(1),
  reviewStatus: reviewStatusInputSchema,
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  markdown: z.string()
});
const articleStatusTransitionSchema = z.object({
  id: z.string(),
  createdAt: z.string().min(1),
  fromStatus: reviewStatusInputSchema.nullable(),
  toStatus: reviewStatusInputSchema,
  note: z.string()
});
const articleSessionSchema = z.object({
  id: z.string().min(1),
  revision: z.number().int().positive().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  inputs: z.object({
    language: languageSchema,
    seedKeyword: z.string()
  }),
  activeStep: z.enum(["keywords", "brief", "outline", "draft", "links", "ready"]),
  keywordIdeas: z.array(z.object({
    id: z.string(),
    keyword: z.string().min(1),
    intent: z.enum(["informational", "commercial", "comparison", "transactional"]),
    cluster: z.string().min(1),
    monthlyVolume: z.number().nullable(),
    provider: z.string(),
    checkedAt: z.string().nullable(),
    status: z.enum(["verified", "missing", "failed"])
  })),
  primaryKeywordId: z.string().nullable(),
  secondaryKeywordIds: z.array(z.string()),
  brief: briefSchema.nullable(),
  outline: outlineSchema.nullable(),
  draft: draftSchema.nullable(),
  linkSuggestions: z.array(suggestionSchema),
  finalMarkdown: z.string(),
  reviewStatus: reviewStatusInputSchema.optional(),
  reviewNote: z.string().optional(),
  publishAt: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  livePath: z.string().nullable().optional(),
  remoteArticleId: z.string().nullable().optional(),
  publishJobId: z.string().nullable().optional(),
  lastPublishError: z.string().nullable().optional(),
  versions: z.array(articleVersionSchema).optional(),
  statusTransitions: z.array(articleStatusTransitionSchema).optional()
});
const articleSessionRequestSchema = z.object({
  article: articleSessionSchema
});
const manualArticleRequestSchema = z.object({
  title: z.string().refine((value) => value.trim().length > 0, "Tiêu đề là bắt buộc."),
  content: z.string().refine((value) => value.trim().length > 0, "Nội dung bài viết là bắt buộc.")
}).strict();
const manualScheduledArticleRequestSchema = manualArticleRequestSchema.extend({
  publishAt: z.string().datetime()
}).strict();
const reviewGateRequestSchema = z.object({
  publishAt: z.string().datetime().nullable().optional()
});
const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});
const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});
const createUserRequestSchema = z.object({
  username: z.string().min(1),
  fullName: z.string().min(1),
  email: z.string().email().nullable().optional(),
  authorTitle: z.string().optional(),
  authorBio: z.string().optional(),
  temporaryPassword: z.string().min(8)
});
const updateUserRequestSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  authorTitle: z.string().optional(),
  authorBio: z.string().optional(),
  isActive: z.boolean().optional()
});
const resetPasswordRequestSchema = z.object({
  temporaryPassword: z.string().min(8)
});

function normalizeReviewStatusInput(status?: ReviewStatus | "in_review" | "approved" | null): ReviewStatus | undefined {
  if (status === undefined || status === null) {
    return undefined;
  }
  if (status === "in_review") {
    return "needs_fix";
  }
  if (status === "approved") {
    return "scheduled";
  }
  return status;
}

function normalizeArticleSessionInput(article: z.infer<typeof articleSessionSchema>): ArticleSessionSnapshot {
  return {
    ...article,
    reviewStatus: normalizeReviewStatusInput(article.reviewStatus),
    versions: article.versions?.map((version) => ({
      ...version,
      reviewStatus: normalizeReviewStatusInput(version.reviewStatus) ?? "editor_ready"
    })),
    statusTransitions: article.statusTransitions?.map((transition) => ({
      ...transition,
      fromStatus: normalizeReviewStatusInput(transition.fromStatus) ?? null,
      toStatus: normalizeReviewStatusInput(transition.toStatus) ?? "editor_ready"
    }))
  };
}

function authUserResponse(user: AuthUser) {
  return {
    user: {
      ...user,
      canManageUsers: user.role === "super_admin"
    }
  };
}

function readRequestIp(request: express.Request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }
  return request.socket.remoteAddress ?? null;
}

function requireSuperAdmin(request: AuthenticatedRequest, response: express.Response) {
  if (request.auth.user.role !== "super_admin") {
    response.status(403).json({ error: "Chỉ super admin mới được thao tác phần quản lý tài khoản." });
    return false;
  }
  return true;
}

function getAuth(request: express.Request) {
  return (request as unknown as AuthenticatedRequest).auth;
}

app.post("/api/session/login", async (request, response, next) => {
  try {
    const payload = loginRequestSchema.parse(request.body);
    const result = await authenticateUser({
      username: payload.username,
      password: payload.password,
      ipAddress: readRequestIp(request),
      userAgent: request.headers["user-agent"] ?? null
    });

    response.setHeader("Set-Cookie", buildSessionCookie(result.sessionToken));
    response.json(authUserResponse(result.user));
  } catch (error) {
    if (error instanceof Error) {
      response.status(401).json({ error: error.message });
      return;
    }
    next(error);
  }
});

app.get("/api/health", (_request, response) => {
  const volumeHealth = keywordVolumeHealth();
  const imageHealth = articleImageHealth();
  response.json({
    ok: true,
    service: "cms-auto-v3-backend",
    aiMode: hasGeminiConfig() ? "gemini" : "local",
    volumeProvider: volumeHealth.activeProvider,
    volumeProviderConfigured: volumeHealth.configured,
    imageProvider: imageHealth.provider,
    imageProviderConfigured: imageHealth.configured,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/public", publicReaderRouter);

app.use("/api", async (request, response, next) => {
  if (request.method === "OPTIONS") {
    next();
    return;
  }

  if (
    request.path === "/session/login"
    || request.path === "/health"
    || request.path.startsWith("/public/articles")
  ) {
    next();
    return;
  }

  try {
    await ensureAuthBootstrap();
    const cookies = parseCookies(request.headers.cookie);
    const token = cookies[sessionCookieName];

    if (!token) {
      response.status(401).json({ error: "Bạn cần đăng nhập để dùng admin." });
      return;
    }

    const authState = await readAuthSessionState(token);
    if (!authState) {
      response.setHeader("Set-Cookie", buildClearSessionCookie());
      response.status(401).json({ error: "Phiên đăng nhập đã hết hạn hoặc không còn hợp lệ." });
      return;
    }

    await touchSession(authState.session.id);
    (request as AuthenticatedRequest).auth = authState;
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/session/me", async (request, response) => {
  response.json(authUserResponse(getAuth(request).user));
});

app.post("/api/session/logout", async (request, response, next) => {
  try {
    const cookies = parseCookies(request.headers.cookie);
    const token = cookies[sessionCookieName];
    if (token) {
      await logoutSession(token);
    }
    response.setHeader("Set-Cookie", buildClearSessionCookie());
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/session/change-password", async (request, response, next) => {
  try {
    const payload = changePasswordRequestSchema.parse(request.body);
    const auth = getAuth(request);
    await changeOwnPassword({
      userId: auth.user.id,
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword
    });
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (request, response, next) => {
  try {
    if (!requireSuperAdmin(request as unknown as AuthenticatedRequest, response)) {
      return;
    }
    const users = await readUsers();
    response.json({ users });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", async (request, response, next) => {
  try {
    if (!requireSuperAdmin(request as unknown as AuthenticatedRequest, response)) {
      return;
    }
    const payload = createUserRequestSchema.parse(request.body);
    const user = await createAdminUser({
      actorUserId: getAuth(request).user.id,
      username: payload.username,
      fullName: payload.fullName,
      email: payload.email,
      authorTitle: payload.authorTitle,
      authorBio: payload.authorBio,
      temporaryPassword: payload.temporaryPassword
    });
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/users/:id", async (request, response, next) => {
  try {
    if (!requireSuperAdmin(request as unknown as AuthenticatedRequest, response)) {
      return;
    }
    const payload = updateUserRequestSchema.parse(request.body);
    const user = await updateManagedUser({
      actorUserId: getAuth(request).user.id,
      userId: request.params.id,
      fullName: payload.fullName,
      email: payload.email,
      authorTitle: payload.authorTitle,
      authorBio: payload.authorBio,
      isActive: payload.isActive
    });
    response.json({ user });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:id", async (request, response, next) => {
  try {
    if (!requireSuperAdmin(request as unknown as AuthenticatedRequest, response)) {
      return;
    }
    await deleteManagedUser({
      actorUserId: getAuth(request).user.id,
      userId: request.params.id
    });
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/reset-password", async (request, response, next) => {
  try {
    if (!requireSuperAdmin(request as unknown as AuthenticatedRequest, response)) {
      return;
    }
    const payload = resetPasswordRequestSchema.parse(request.body);
    await resetManagedUserPassword({
      actorUserId: getAuth(request).user.id,
      userId: request.params.id,
      temporaryPassword: payload.temporaryPassword
    });
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:id/revoke-sessions", async (request, response, next) => {
  try {
    if (!requireSuperAdmin(request as unknown as AuthenticatedRequest, response)) {
      return;
    }
    await revokeManagedUserSessions({
      actorUserId: getAuth(request).user.id,
      userId: request.params.id
    });
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/history", async (request, response, next) => {
  try {
    const records = await readRecentHistory(getAuth(request).user);
    response.json({ records });
  } catch (error) {
    next(error);
  }
});

app.get("/api/articles", async (request, response, next) => {
  try {
    const articles = await readArticleSessions(getAuth(request).user);
    response.json({
      articles: z.array(articleSessionSchema).parse(articles)
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/article-library", async (request, response, next) => {
  try {
    const language = request.query.language === "vi" || request.query.language === "en"
      ? request.query.language
      : undefined;
    const articles = await readArticleLibrary(language);
    response.json({
      articles: z.array(articleLibraryItemSchema).parse(articles)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/article-library", async (request, response, next) => {
  try {
    const article = articleLibraryCreateSchema.parse(request.body);
    response.status(201).json({ article: await createArticleLibraryItem(article) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/article-library/import", async (request, response, next) => {
  try {
    const payload = articleLibraryImportSchema.parse(request.body);
    response.status(201).json(await importArticleLibraryItems(payload.items));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/article-library/:id", async (request, response, next) => {
  try {
    const payload = articleLibraryPatchSchema.parse(request.body);
    response.json({
      article: await patchArticleLibraryItem(request.params.id, payload.expectedRevision, payload.changes)
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/article-library/:id", async (request, response, next) => {
  try {
    response.json({ ok: await deleteArticleLibraryItem(request.params.id) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/articles", async (request, response, next) => {
  try {
    const payload = articleSessionRequestSchema.parse(request.body);
    const article = await createArticleSession(normalizeArticleSessionInput(payload.article), getAuth(request).user);
    response.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

app.post("/api/articles/manual", async (request, response, next) => {
  try {
    const payload = manualArticleRequestSchema.parse(request.body);
    const article = await createManualPublishedArticle(payload, getAuth(request).user);
    response.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

app.post("/api/articles/manual/schedule", async (request, response, next) => {
  try {
    const payload = manualScheduledArticleRequestSchema.parse(request.body);
    const article = await createManualScheduledArticle(payload, getAuth(request).user);
    response.status(201).json({ article });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/articles/:id", async (request, response, next) => {
  try {
    const payload = articlePatchSchema.parse(request.body);
    const article = await patchArticleSession(
      request.params.id,
      payload.expectedRevision,
      payload.changes as Parameters<typeof patchArticleSession>[2],
      getAuth(request).user
    );
    response.json({ article });
  } catch (error) {
    next(error);
  }
});

app.post("/api/articles/:id/review-gate", async (request, response, next) => {
  try {
    const payload = reviewGateRequestSchema.parse(request.body);
    const result = await reviewGateArticle(
      request.params.id,
      getAuth(request).user,
      payload.publishAt === undefined ? undefined : payload.publishAt
    );
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/articles/:id", async (request, response, next) => {
  try {
    const removed = await deleteArticleSession(request.params.id, getAuth(request).user);
    response.json({ ok: removed });
  } catch (error) {
    next(error);
  }
});

app.get("/api/publish/jobs", async (request, response, next) => {
  try {
    const jobs = await readPublishJobs(getAuth(request).user);
    response.json({
      jobs: jobs.map((job) => ({
        ...job,
        status: publishJobStatusSchema.parse(job.status)
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/publish/logs/:jobId", async (request, response, next) => {
  try {
    const logs = await readPublishLogs(request.params.jobId, getAuth(request).user);
    response.json({ logs });
  } catch (error) {
    next(error);
  }
});

app.post("/api/publish/jobs/:id/retry", async (request, response, next) => {
  try {
    const result = await retryPublishJob(request.params.id, getAuth(request).user);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/publish/jobs/run-due", async (_request, response, next) => {
  try {
    const result = await runDuePublishJobs();
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/prompts", async (_request, response, next) => {
  try {
    const prompts = promptTemplatesSchema.parse(await readPromptTemplates());
    response.json({
      prompts,
      defaults: promptTemplatesSchema.parse(defaultPromptTemplates),
      records: await readPromptTemplateRecords()
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/prompts/:key", async (request, response, next) => {
  try {
    const key = promptKeySchema.parse(request.params.key);
    const payload = promptTemplatePatchSchema.parse(request.body);
    response.json({
      prompt: await patchPromptTemplate(key, payload.expectedRevision, payload.value)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/keywords/suggest", async (request, response, next) => {
  try {
    const payload = keywordRequestSchema.parse(request.body);
    const { customConfig, semrushToken: headerSemrushToken } = getApiConfigFromHeaders(request);
    let keywordIdeas: KeywordIdea[] = [];
    const modeLabel = "semrush";

    const semrushPayload = {
      id: 16,
      jsonrpc: "2.0",
      method: "ideas.GetKeywords",
      params: {
        mode: 0,
        currency: "USD",
        database: "vn",
        filter: {
          phrase: [],
          competition_level: [],
          cpc: [],
          difficulty: [],
          results: [],
          serp_features: [{ inverted: false, value: [] }],
          volume: [],
          words_count: [],
          phrase_include_logic: 0
        },
        groups: [],
        order: { direction: 1, field: "volume" },
        groups_order: { direction: 1, field: "count" },
        phrase: payload.seedKeyword,
        questions_only: false,
        page: { number: 1, size: 100 }
      }
    };

    const finalSemrushToken = payload.semrushToken?.trim() || headerSemrushToken?.trim() || process.env.SEMRUSH_PROXY_TOKEN?.trim();

    let availableServers = [6];
    if (finalSemrushToken) {
      availableServers = [1, 2, 3, 4, 5, 6];
    }
    // Trộn ngẫu nhiên danh sách server
    availableServers.sort(() => Math.random() - 0.5);

    let lastError: Error | null = null;
    let sessionExpiredError: Error | null = null;
    let dataResult: any = null;

    for (const serverId of availableServers) {
      const semrushDomain = `https://${serverId}.semrush.com.in`;
      const headers: Record<string, string> = {
        "accept": "*/*",
        "Content-Type": "application/json"
      };

      if (serverId !== 6 && finalSemrushToken) {
        headers["Cookie"] = `proxy_token=${finalSemrushToken}`;
      }

      try {
        const semrushResponse = await fetch(`${semrushDomain}/kmtgw/v2/webapi`, {
          method: "POST",
          headers,
          body: JSON.stringify(semrushPayload)
        });

        const semrushResponseText = await semrushResponse.text();
        if (!semrushResponse.ok) {
          throw new Error(semrushResponseErrorMessage(serverId, semrushResponseText, semrushResponse.status));
        }

        const data = parseSemrushJsonText<any>(semrushResponseText, serverId);
        if (data.error) {
          throw new Error(`Semrush error (server ${serverId}): ${JSON.stringify(data.error)}`);
        }

        dataResult = data.result;
        break; // Thành công, thoát vòng lặp
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (!sessionExpiredError && isSemrushSessionExpiredError(lastError)) {
          sessionExpiredError = lastError;
        }
        console.warn(`[Semrush Suggest] Failed on server ${serverId}`, lastError.message);
      }
    }

    if (!dataResult) {
      throw sessionExpiredError || lastError || new Error("All Semrush servers failed.");
    }

    const keywords = dataResult.keywords || [];
    const semrushDataString = keywords
      .slice(0, 100)
      .map((k: any) => {
        let intentValue = "informational";
        if (Array.isArray(k.intents)) {
          if (k.intents.includes(2)) intentValue = "commercial";
          else if (k.intents.includes(3)) intentValue = "transactional";
          else if (k.intents.includes(1)) intentValue = "comparison";
        }
        return `- ${k.phrase} (volume: ${typeof k.volume === "number" ? k.volume : 0}, intent: ${intentValue})`;
      })
      .join("\n");

    let aiSelectedKeywords: { keyword: string, intent: Intent, cluster: string }[] = [];

    if (hasGeminiConfig(customConfig)) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          keyword: payload.seedKeyword,
          language: payload.language,
          semrush_data: semrushDataString
        },
        contextLines: [
          `Từ khóa gốc: ${payload.seedKeyword}`,
          `Ngôn ngữ: ${payload.language}`
        ],
        jsonShapeHint: JSON.stringify({
          keywordIdeas: [
            {
              keyword: "string",
              intent: "informational | commercial | comparison | transactional",
              cluster: "string"
            }
          ]
        }, null, 2),
        responseJsonSchema: keywordIdeaResponseJsonSchema,
        validator: geminiKeywordResultSchema,
        temperature: 0.5,
        customConfig
      });
      aiSelectedKeywords = aiResult.keywordIdeas as { keyword: string, intent: Intent, cluster: string }[];
    } else {
      aiSelectedKeywords = keywords.slice(0, 8).map((k: any) => {
        let intentValue: Intent = "informational";
        if (Array.isArray(k.intents)) {
          if (k.intents.includes(2)) intentValue = "commercial";
          else if (k.intents.includes(3)) intentValue = "transactional";
          else if (k.intents.includes(1)) intentValue = "comparison";
        }
        return {
          keyword: k.phrase,
          intent: intentValue,
          cluster: payload.seedKeyword
        };
      });
    }

    const seen = new Set<string>();

    keywordIdeas = aiSelectedKeywords
      .map((aiItem) => {
        const match = keywords.find((k: any) => k.phrase.toLowerCase() === aiItem.keyword.toLowerCase());
        return {
          id: slugify(aiItem.keyword),
          keyword: aiItem.keyword,
          intent: aiItem.intent,
          cluster: aiItem.cluster,
          monthlyVolume: match && typeof match.volume === "number" ? match.volume : null,
          provider: "Semrush",
          checkedAt: new Date().toISOString(),
          status: "verified" as const
        };
      })
      .filter((idea: KeywordIdea) => {
        const key = idea.keyword.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    const record = await appendHistory("keywords", payload, {
      mode: hasGeminiConfig(customConfig) ? "gemini" : modeLabel,
      keywordIdeas
    }, getAuth(request).user.id);
    response.json({ keywordIdeas, recordId: record.id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/keywords/refresh-volume", async (request, response, next) => {
  try {
    const payload = keywordIdeasRefreshSchema.parse(request.body);
    const keywordIdeas: KeywordIdea[] = payload.keywordIdeas.map((idea) => ({
      ...idea,
      monthlyVolume: null,
      provider: "Chưa xác thực volume",
      checkedAt: null,
      status: "missing"
    }));

    const enriched = await enrichKeywordIdeasWithVolumes(keywordIdeas, {
      language: payload.language
    });

    const record = await appendHistory("keywords", payload, {
      mode: "refresh-volume",
      keywordIdeas: enriched
    }, getAuth(request).user.id);
    response.json({ keywordIdeas: enriched, recordId: record.id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/brief/generate", async (request, response, next) => {
  try {
    const payload = briefRequestSchema.parse(request.body);
    const { customConfig, tavilyApiKey } = getApiConfigFromHeaders(request);
    
    const primaryResults = await searchTavily(payload.primaryKeyword, 10, tavilyApiKey);
    const competitorPages = primaryResults;
    const topPrimaryCompetitors = primaryResults.slice(0, 10);
    const competitorDataString = formatCompetitorPagesForPrompt(topPrimaryCompetitors);

    let brief = buildBrief(payload.primaryKeyword, payload.secondaryKeywords, payload.language);
    brief.competitorPages = competitorPages;

    if (hasGeminiConfig(customConfig)) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          keyword: payload.primaryKeyword,
          primary_keyword: payload.primaryKeyword,
          secondary_keywords: payload.secondaryKeywords.join(", "),
          language: payload.language,
          competitor_data: competitorDataString
        },
        contextLines: [
          `Từ khóa chính: ${payload.primaryKeyword}`,
          `Từ khóa phụ: ${payload.secondaryKeywords.join(", ")}`,
          `Ngôn ngữ: ${payload.language}`
        ],
        jsonShapeHint: JSON.stringify({
          brief: {
            searchIntent: "string",
            angle: "string",
            semanticTopics: ["string"],
            candidateFaqs: ["string"],
            competitorInsights: [
              {
                rank: 1,
                keyword: "string",
                url: "string",
                title: "string",
                contentSummary: "string",
                seoIntent: "string",
                outlinePattern: "string",
                strengths: ["string"],
                gaps: ["string"],
                recommendedTakeaway: "string"
              }
            ]
          }
        }, null, 2),
        responseJsonSchema: briefResponseJsonSchema,
        validator: geminiBriefSchema,
        temperature: 0.4,
        customConfig
      });

      brief = {
        ...aiResult.brief,
        competitorPages
      };
    }

    brief = {
      ...brief,
      competitorPages,
      competitorInsights: ensureCompetitorInsights(
        topPrimaryCompetitors,
        brief.competitorInsights,
        payload.primaryKeyword
      )
    };

    const record = await appendHistory("brief", payload, {
      mode: hasGeminiConfig(customConfig) ? "gemini" : "local",
      brief
    }, getAuth(request).user.id);
    response.json({ brief, recordId: record.id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/outline/generate", async (request, response, next) => {
  try {
    const payload = outlineRequestSchema.parse(request.body);
    const { customConfig } = getApiConfigFromHeaders(request);
    let outline = buildOutline(
      payload.primaryKeyword,
      payload.brief,
      payload.secondaryKeywords,
      payload.language
    );

    const competitorPages = payload.brief.competitorPages || [];
    const competitorInsights = payload.brief.competitorInsights || [];
    const keywordPlan = buildKeywordPlanForOutline(
      payload.primaryKeyword,
      payload.secondaryKeywords,
      payload.keywordIdeas
    );
    const competitorDataString = formatCompetitorPagesForPrompt(competitorPages.filter((page) => page.keyword === payload.primaryKeyword).slice(0, 10));
    const keywordPlanString = formatKeywordPlanForPrompt(keywordPlan);
    const competitorInsightsString = formatCompetitorInsightsForPrompt(competitorInsights);

    if (hasGeminiConfig(customConfig)) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          keyword: payload.primaryKeyword,
          primary_keyword: payload.primaryKeyword,
          secondary_keywords: payload.secondaryKeywords.join(", "),
          language: payload.language,
          competitor_data: competitorDataString,
          keyword_plan: keywordPlanString,
          competitor_insights: competitorInsightsString,
          search_intent: payload.brief.searchIntent,
          angle: payload.brief.angle,
          semantic_topics: payload.brief.semanticTopics.join(", "),
          candidate_faqs: payload.brief.candidateFaqs.join(" | "),
          brief_json: JSON.stringify(payload.brief, null, 2)
        },
        contextLines: [
          `Từ khóa chính: ${payload.primaryKeyword}`,
          `Từ khóa phụ: ${payload.secondaryKeywords.join(", ")}`,
          `Keyword plan có volume:\n${keywordPlanString}`,
          `10 insight đối thủ:\n${competitorInsightsString}`,
          `Ngôn ngữ: ${payload.language}`,
          `Search intent: ${payload.brief.searchIntent}`,
          `Góc bài: ${payload.brief.angle}`,
          `Semantic topics: ${payload.brief.semanticTopics.join(", ")}`,
          `FAQ: ${payload.brief.candidateFaqs.join(", ")}`
        ],
        jsonShapeHint: JSON.stringify({
          outline: {
            title: "string",
            introDirection: "string",
            sections: [
              {
                heading: "string",
                bullets: ["string"]
              }
            ],
            keywordCoverage: [
              {
                keyword: "string",
                monthlyVolume: 100,
                intent: "informational | commercial | comparison | transactional",
                placement: "string"
              }
            ]
          }
        }, null, 2),
        responseJsonSchema: outlineResponseJsonSchema,
        validator: geminiOutlineSchema,
        temperature: 0.5,
        customConfig
      });

      outline = sanitizeOutline(aiResult.outline);
    }

    const record = await appendHistory("outline", payload, {
      mode: hasGeminiConfig(customConfig) ? "gemini" : "local",
      outline
    }, getAuth(request).user.id);
    response.json({ outline, recordId: record.id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/draft/generate", async (request, response, next) => {
  try {
    const payload = draftRequestSchema.parse(request.body);
    const { customConfig } = getApiConfigFromHeaders(request);
    let draft = buildDraft(
      payload.primaryKeyword,
      payload.outline,
      payload.secondaryKeywords,
      payload.language
    );

    if (hasGeminiConfig(customConfig)) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          keyword: payload.primaryKeyword,
          primary_keyword: payload.primaryKeyword,
          secondary_keywords: payload.secondaryKeywords.join(", "),
          language: payload.language,
          outline_title: payload.outline.title,
          outline_intro_direction: payload.outline.introDirection,
          outline_sections: payload.outline.sections
            .map((section, index) => `${index + 1}. ${section.heading}: ${section.bullets.join("; ")}`)
            .join("\n"),
          outline_json: JSON.stringify(payload.outline, null, 2)
        },
        contextLines: [
          `Từ khóa chính: ${payload.primaryKeyword}`,
          `Từ khóa phụ: ${payload.secondaryKeywords.join(", ")}`,
          `Ngôn ngữ: ${payload.language}`,
          `Dàn ý title: ${payload.outline.title}`,
          `Hướng mở bài: ${payload.outline.introDirection}`,
          `Các phần: ${payload.outline.sections.map((section) => section.heading).join(" | ")}`
        ],
        jsonShapeHint: JSON.stringify({
          draft: {
            title: "string",
            slug: "string",
            excerpt: "string",
            metaTitle: "string",
            metaDescription: "string",
            markdown: "string"
          }
        }, null, 2),
        responseJsonSchema: draftResponseJsonSchema,
        validator: geminiDraftSchema,
        temperature: 0.4,
        customConfig
      });

      draft = aiResult.draft;
    }

    const record = await appendHistory("draft", payload, {
      mode: hasGeminiConfig(customConfig) ? "gemini" : "local",
      draft
    }, getAuth(request).user.id);
    response.json({ draft, recordId: record.id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/article-images/generate", async (request, response, next) => {
  try {
    const payload = articleImageRequestSchema.parse(request.body);
    const { imageConfig } = getApiConfigFromHeaders(request);
    const image = await generateArticleImage(payload, imageConfig);
    const record = await appendHistory("image", payload, {
      mode: image.provider,
      image
    }, getAuth(request).user.id);

    response.json({ image, recordId: record.id });
  } catch (error) {
    if (error instanceof ArticleImageProviderNotConfiguredError || error instanceof ArticleImageProviderError) {
      response.status(error.statusCode).json({ error: error.message });
      return;
    }
    next(error);
  }
});

app.post("/api/links/suggest", async (request, response, next) => {
  try {
    const payload = linksRequestSchema.parse(request.body);
    const { customConfig } = getApiConfigFromHeaders(request);
    const articleLibrary = await readArticleLibrary(payload.language);

    if (articleLibrary.length === 0) {
      response.status(400).json({
        error: "Internal Link Library is empty. Cannot generate internal link suggestions yet."
      });
      return;
    }

    if (payload.matchLibraryOnly) {
      const suggestions = buildKeywordMatchedLibrarySuggestions(
        payload.primaryKeyword,
        payload.secondaryKeywords,
        payload.language,
        articleLibrary,
        payload.draft
      );
      const record = await appendHistory("links", payload, {
        mode: "keyword-matched-library",
        articleLibraryCount: articleLibrary.length,
        candidateLibraryCount: suggestions.length,
        suggestions
      }, getAuth(request).user.id);
      response.json({
        suggestions,
        mappingCsv: buildInternalLinkMappingCsv(payload.draft?.title ?? payload.primaryKeyword, suggestions),
        recordId: record.id
      });
      return;
    }

    if (!payload.draft) {
      response.status(400).json({ error: "Draft is required for anchor-based internal link suggestions." });
      return;
    }

    const existingSuggestions = payload.existingSuggestions ?? [];
    const existingRejectedSuggestions = existingSuggestions.filter((suggestion) => suggestion.status === "rejected");
    const rejectedSuggestions = payload.rejectedSuggestions ?? existingRejectedSuggestions;
    const currentRejectedSuggestions = existingRejectedSuggestions.length > 0
      ? existingRejectedSuggestions
      : rejectedSuggestions;
    const preservedSuggestions = payload.preservedSuggestions ?? existingSuggestions.filter((suggestion) => suggestion.status !== "rejected");
    const shouldRegenerateRejectedOnly = currentRejectedSuggestions.length > 0;
    const shouldExpandSuggestions = Boolean(payload.expandSuggestions && existingSuggestions.length > 0 && !shouldRegenerateRejectedOnly);
    const existingAnchors = new Set(existingSuggestions.map((suggestion) => normalizeSuggestionAnchor(suggestion.anchor)));
    const existingUrls = new Set(existingSuggestions.map((suggestion) => normalizeSuggestionUrl(suggestion.targetUrl)).filter(Boolean));
    const unavailableUrls = new Set(
      (shouldExpandSuggestions ? existingSuggestions : [...preservedSuggestions, ...rejectedSuggestions])
        .map((suggestion) => suggestion.targetUrl.trim().toLowerCase())
        .filter(Boolean)
    );
    const eligibleArticleLibrary = shouldRegenerateRejectedOnly || shouldExpandSuggestions
      ? articleLibrary.filter((article) => !unavailableUrls.has(article.url.trim().toLowerCase()))
      : articleLibrary;
    const shouldUseAiAnchorSelection = hasGeminiConfig(customConfig)
      && !shouldRegenerateRejectedOnly
      && !shouldExpandSuggestions;

    if (shouldUseAiAnchorSelection) {
      let aiSelectionError: string | undefined;
      const draftMarkdownForPrompt = formatDraftMarkdownForAnchorPrompt(payload.draft.markdown);
      const aiResult = await withTimeout(generateStructuredJson({
        prompt: [
          payload.prompt,
          "",
          "QUY TẮC HỆ THỐNG GHI ĐÈ:",
          "- Chỉ chọn anchor/cụm từ cần gắn internal link từ chính bản nháp.",
          "- KHÔNG chọn URL, KHÔNG trả targetUrl. Backend sẽ tự tìm URL phù hợp trong Kho links.",
          "- Output bắt buộc là JSON object duy nhất có key anchorCandidates.",
          "- Mỗi anchorCandidates item chỉ được có: anchorText, sourceContext, confidence, reason.",
          "- anchorText phải copy nguyên văn từ draft_markdown, giữ đúng dấu/cách viết trong bài.",
          "- sourceContext phải là câu hoặc đoạn ngắn trong draft_markdown và phải chứa anchorText nguyên văn.",
          "- anchorText phải là cụm có nghĩa, thường 2-8 từ; không chọn một từ đơn lẻ như Trump, Musk, Kinh.",
          "- Không chọn cụm đứt đoạn, không chọn cụm bắt đầu hoặc kết thúc bằng hư từ.",
          "- Ưu tiên thuật ngữ/chủ đề có thể giải thích sâu hơn: crypto, thị trường, nhân vật/sự kiện, rủi ro, sản phẩm, công nghệ.",
          "- Ví dụ sai: \"Trump\", \"Musk\", \"lại có xu hướng\", \"nhất cho một altcoin\", \"tích thị trường crypto\".",
          "- Ví dụ đúng: \"thị trường tiền điện tử\", \"Bitcoin Dominance\", \"mối quan hệ giữa Elon Musk và Donald Trump\", \"chính sách tiền mã hóa\"."
        ].join("\n"),
        variables: {
          keyword: payload.primaryKeyword,
          primary_keyword: payload.primaryKeyword,
          secondary_keywords: payload.secondaryKeywords.join(", "),
          language: payload.language,
          draft_title: payload.draft.title,
          draft_markdown: draftMarkdownForPrompt,
          anchor_candidates: "",
          candidate_articles: "",
          articleTitle: payload.draft.title,
          articleContent: draftMarkdownForPrompt
        },
        contextLines: [
          `Từ khóa chính: ${payload.primaryKeyword}`,
          `Từ khóa phụ: ${payload.secondaryKeywords.join(", ")}`,
          `Ngôn ngữ: ${payload.language}`,
          `Tiêu đề bản nháp: ${payload.draft.title}`,
          `Draft markdown để chọn anchor:\n${draftMarkdownForPrompt}`
        ],
        jsonShapeHint: JSON.stringify({
          anchorCandidates: [
            {
              anchorText: "cụm từ có nghĩa xuất hiện nguyên văn trong bài",
              sourceContext: "Câu hoặc đoạn ngắn chứa cụm từ đó.",
              confidence: 0.95,
              reason: "Cụm này là khái niệm/chủ đề nên có link giải thích thêm."
            }
          ]
        }, null, 2),
        responseJsonSchema: internalLinkAnchorSelectionResponseJsonSchema,
        validator: geminiInternalLinkAnchorSelectionSchema,
        temperature: 0.25,
        customConfig
      }), 12000, "Gemini internal link anchor selection").catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown Gemini error.";
        if (!canFallbackToLocalInternalLinks(message)) {
          throw error;
        }
        aiSelectionError = message;
        console.warn("Gemini internal link anchor selection failed; falling back to local suggestions.", message);
        return null;
      });

      if (aiResult) {
        const aiAnchorCandidates = mapAiAnchorSelectionsToInternalLinkCandidates(
          aiResult.anchorCandidates,
          payload.draft.markdown,
          existingAnchors
        );
        const retrievedLibrary = Array.from(new Map(aiAnchorCandidates.flatMap((candidate) =>
          retrieveInternalLinkArticles(
            candidate.anchor,
            candidate.sourceContext ?? "",
            payload.language,
            eligibleArticleLibrary,
            40
          )
        ).map((article) => [article.id, article])).values());
        const candidateLibrary = retrievedLibrary.length > 0 ? retrievedLibrary : eligibleArticleLibrary;
        const suggestions = mapAnchorCandidatesToInternalLinks(
          payload.draft,
          payload.language,
          candidateLibrary,
          aiAnchorCandidates,
          rejectedSuggestions
        );

        const record = await appendHistory("links", payload, {
          mode: "ai-anchor-selection + backend-link-match",
          articleLibraryCount: articleLibrary.length,
          aiAnchorCount: aiAnchorCandidates.length,
          candidateLibraryCount: candidateLibrary.length,
          aiSelectionError,
          suggestions
        }, getAuth(request).user.id);
        response.json({
          suggestions,
          mappingCsv: buildInternalLinkMappingCsv(payload.draft.title, suggestions),
          recordId: record.id
        });
        return;
      }
    }

    const localAnchorCandidates = shouldRegenerateRejectedOnly
      ? []
      : findInternalLinkAnchorCandidates(
        payload.draft,
        payload.language,
        articleLibrary,
        shouldExpandSuggestions ? 26 : 14
      ).filter((candidate) => !existingAnchors.has(normalizeSuggestionAnchor(candidate.anchorText)));
    const rejectedAnchorCandidates = currentRejectedSuggestions.map((suggestion) => ({
      anchor: suggestion.anchor,
      sourceContext: suggestion.sourceContext,
      reason: suggestion.reason,
      confidence: suggestion.confidence
    }));
    let candidateLibrary = shouldRegenerateRejectedOnly
      ? Array.from(new Map(rejectedAnchorCandidates.flatMap((candidate) =>
        retrieveInternalLinkArticles(
          candidate.anchor,
          candidate.sourceContext ?? "",
          payload.language,
          eligibleArticleLibrary,
          40
        )
      ).map((article) => [article.id, article])).values())
      : selectInternalLinkCandidatesForAnchorCandidates(
        payload.draft,
        payload.language,
        eligibleArticleLibrary,
        localAnchorCandidates,
        20
      );
    if (candidateLibrary.length === 0 && (!shouldExpandSuggestions || localAnchorCandidates.length > 0)) {
      candidateLibrary = retrieveInternalLinkArticles(
        payload.draft.title,
        [
          payload.draft.excerpt,
          payload.primaryKeyword,
          payload.secondaryKeywords.join(", "),
          payload.draft.markdown.slice(0, 1600)
        ].filter(Boolean).join("\n"),
        payload.language,
        eligibleArticleLibrary,
        20
      );
    }
    if (candidateLibrary.length === 0 && !shouldExpandSuggestions) {
      candidateLibrary = eligibleArticleLibrary.slice(0, shouldRegenerateRejectedOnly ? 40 : 20);
    }
    const candidateLibraryCount = candidateLibrary.length;
    let regeneratedSuggestions = shouldRegenerateRejectedOnly
      ? mapAnchorCandidatesToInternalLinks(
        payload.draft,
        payload.language,
        candidateLibrary,
        rejectedAnchorCandidates,
        rejectedSuggestions
      )
      : shouldExpandSuggestions
        ? mapAnchorCandidatesToInternalLinks(
          payload.draft,
          payload.language,
          candidateLibrary,
          mapAnchorTextCandidatesToInternalLinkCandidates(payload.draft.markdown, payload.language, localAnchorCandidates),
          existingSuggestions
        )
      : buildInternalLinkSuggestionsFromAnchorCandidates(
        payload.draft,
        payload.primaryKeyword,
        payload.secondaryKeywords,
        payload.language,
        candidateLibrary,
        rejectedSuggestions
      );

    let suggestionMode = "local-anchor + prefiltered-library-match";
    if (shouldExpandSuggestions) {
      suggestionMode = "local-anchor + prefiltered-library-match + append-more";
    }
    const suggestions = shouldRegenerateRejectedOnly
      ? mergeRegeneratedInternalLinks(existingSuggestions, regeneratedSuggestions)
      : shouldExpandSuggestions
        ? mergeAdditionalInternalLinks(
          existingSuggestions,
          regeneratedSuggestions.filter((suggestion) =>
            !isExistingInternalLinkSuggestion(suggestion, existingAnchors, existingUrls)
          )
        )
      : regeneratedSuggestions;

    const record = await appendHistory("links", payload, {
      mode: suggestionMode,
      articleLibraryCount: articleLibrary.length,
      candidateLibraryCount,
      suggestions
    }, getAuth(request).user.id);
    response.json({
      suggestions,
      mappingCsv: buildInternalLinkMappingCsv(payload.draft.title, suggestions),
      recordId: record.id
    });
  } catch (error) {
    next(error);
  }
});
app.post("/api/links/apply", async (request, response, next) => {
  try {
    const payload = applyLinksRequestSchema.parse(request.body);
    const allowedUrls = new Set((await readArticleLibrary()).map((article) => article.url));
    const invalidSuggestion = payload.suggestions.find((suggestion) =>
      suggestion.status === "accepted" && (!suggestion.targetUrl.trim() || !allowedUrls.has(suggestion.targetUrl))
    );
    if (invalidSuggestion) {
      response.status(400).json({
        error: "Internal link URL must exist in Internal Link Library before apply."
      });
      return;
    }

    const markdown = applyInternalLinks(payload.markdown, payload.suggestions);
    const record = await appendHistory("apply-links", payload, { markdown }, getAuth(request).user.id);
    response.json({ markdown, recordId: record.id });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/images", async (request, response, next) => {
  try {
    const images = await readImageLibrary();
    response.json(images);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/images/:id", async (request, response, next) => {
  try {
    const id = request.params.id as string;
    const item = await readImageLibraryItem(id);
    if (item && item.url.startsWith("/public/images/")) {
      const publicImagesDir = path.join(process.cwd(), "data", "images");
      const filename = item.url.replace("/public/images/", "");
      const filePath = path.join(publicImagesDir, filename);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error(`Failed to delete physical file: ${filePath}`, err);
      }
    }
    await deleteImageLibraryItem(id);
    response.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/article-images/suggest-prompts", async (request, response, next) => {
  try {
    const { draft, keyword } = request.body;
    
    const systemPrompt = `Suggest short image prompts for a crypto article.
Each prompt must be one sentence only, in English, starting with: "Create a simple abstract image related to:".
Use symbolic crypto/finance visuals only: symbol-free circular tokens, blockchain node dots, glowing connection lines, wallet cubes, abstract market line shapes without labels, clean 3D icons.
Never include people, humanoids, faces, hands, characters, avatars, statues, text, numbers, labels, logos, watermarks, or UI screens.`;

    const contextLines = [
      `Keyword: ${keyword}`,
      `Title: ${draft.title}`,
      `Excerpt: ${draft.excerpt}`,
      `Content: ${draft.markdown?.substring(0, 3000)}...`
    ];

    const jsonShapeHint = JSON.stringify({
      suggestedImages: [
        {
          kind: "hero | inline",
          prompt: "string (English description)",
          altText: "string (Vietnamese or English alt text)"
        }
      ]
    }, null, 2);

    const schema = z.object({
      suggestedImages: z.array(z.object({
        kind: z.enum(["hero", "inline"]),
        prompt: z.string(),
        altText: z.string()
      }))
    });

    const aiResult = await generateStructuredJson({
      prompt: systemPrompt,
      variables: {},
      contextLines,
      jsonShapeHint,
      responseJsonSchema: {
        type: "object",
        properties: {
          suggestedImages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                kind: { type: "string" },
                prompt: { type: "string" },
                altText: { type: "string" }
              },
              required: ["kind", "prompt", "altText"]
            }
          }
        },
        required: ["suggestedImages"]
      },
      validator: schema,
      temperature: 0.7
    });

    const generatedImages = aiResult.suggestedImages.map((img) => ({
      id: crypto.randomUUID(),
      kind: img.kind,
      provider: "modelslab",
      model: "default",
      status: "planned",
      prompt: img.prompt,
      aspectRatio: img.kind === "hero" ? "16:9" : "4:3",
      altText: img.altText,
      createdAt: new Date().toISOString()
    }));

    response.json({ images: generatedImages });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/images/generate", async (request, response, next) => {
  try {
    const { provider, prompt, negativePrompt, width = 1024, height = 1024, filename, base64Data } = request.body;
    const imageId = crypto.randomUUID();
    let targetFilename: string = imageId;
    const baseTextForSlug = (filename && typeof filename === "string" && filename.trim()) 
      ? filename 
      : prompt.slice(0, 60);
      
    if (baseTextForSlug) {
      const slug = baseTextForSlug
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (slug) targetFilename = `${slug}-${imageId.slice(0, 8)}`;
    }
    let imageUrl = "";
    let metadataJson = "{}";
    let imageBuffer: ArrayBuffer | Buffer | null = null;

    if (provider === "modelslab") {
      const apiKey = process.env.MODELSLAB_API_KEY || "tlszdqhzwfn1mg";
      const res = await fetch("https://modelslab.com/api/v1/enterprise/realtime/text2img", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-requested-with": "com.waiimagemaker"
        },
        body: JSON.stringify({
          key: apiKey,
          prompt,
          negative_prompt: negativePrompt || "",
          width: width.toString(),
          height: height.toString(),
          samples: 1,
          safety_checker: true,
          seed: null,
          base64: false,
          webhook: null,
          track_id: null
        })
      });
      const data = await res.json();
      if (data.status !== "success" || !data.output || data.output.length === 0) {
        throw new Error(data.warning || "Failed to generate image via ModelsLab");
      }
      const remoteUrl = data.output[0];
      const dlRes = await fetch(remoteUrl);
      if (!dlRes.ok) throw new Error("Failed to download image from ModelsLab");
      imageBuffer = await dlRes.arrayBuffer();
      metadataJson = JSON.stringify(data.meta || {});
    } else if (provider === "cloud_run") {
      const res = await fetch("https://generateimagev2-gfacqcws4a-uc.a.run.app/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: prompt,
          selectForApiFilter: "enhance",
          size: [1024, 1024]
        })
      });
      if (!res.ok) {
        throw new Error(`Cloud Run API failed: ${res.statusText}`);
      }
      imageBuffer = await res.arrayBuffer();
      metadataJson = JSON.stringify({ size: [width, height] });
    } else if (provider === "magiceraser") {
      const targetSize = `${width}x${height}`;
      const url = new URL("https://apiimagen.magiceraser.fyi/imagen_v1");
      url.searchParams.append("prompt", prompt);
      url.searchParams.append("negative_prompt", negativePrompt || "");
      url.searchParams.append("size", targetSize);
      url.searchParams.append("style", "");
      url.searchParams.append("custom_style", "");
      url.searchParams.append("version", "flux");
      
      const res = await fetch(url.toString(), { method: "POST" });
      if (!res.ok) {
        throw new Error(`MagicEraser API failed: ${res.statusText}`);
      }
      imageBuffer = await res.arrayBuffer();
      metadataJson = JSON.stringify({ size: targetSize, version: "flux" });
    } else if (provider === "upload" && base64Data) {
      const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Content, "base64");
      metadataJson = JSON.stringify({ type: "upload", originalName: filename });
    } else if (provider.startsWith("imagen-4")) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing GEMINI_API_KEY in environment variables");

      let modelId = "imagen-4.0-generate-001";
      if (provider === "imagen-4-ultra") modelId = "imagen-4.0-ultra-generate-001";
      else if (provider === "imagen-4-fast") modelId = "imagen-4.0-fast-generate-001";

      const ratio = Number(width) / Number(height);
      const presets = [
        { name: "1:1", val: 1 },
        { name: "16:9", val: 16/9 },
        { name: "9:16", val: 9/16 },
        { name: "4:3", val: 4/3 },
        { name: "3:4", val: 3/4 },
      ];
      let aspectRatio = "1:1";
      let minDiff = Infinity;
      for (const p of presets) {
        const diff = Math.abs(ratio - p.val);
        if (diff < minDiff) { minDiff = diff; aspectRatio = p.name; }
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio, outputMimeType: "image/png" }
        })
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API failed: ${res.statusText} - ${errBody}`);
      }

      const data = await res.json();
      if (!data.predictions || data.predictions.length === 0) {
        throw new Error("No predictions returned from Gemini API");
      }

      const base64Content = data.predictions[0].bytesBase64Encoded;
      imageBuffer = Buffer.from(base64Content, "base64");
      metadataJson = JSON.stringify({ model: modelId, aspectRatio });
    } else {
      throw new Error("Unsupported image provider");
    }

    if (imageBuffer) {
      const publicImagesDir = path.join(process.cwd(), "data", "images");
      await fs.mkdir(publicImagesDir, { recursive: true });
      const filePath = path.join(publicImagesDir, `${targetFilename}.png`);
      await fs.writeFile(filePath, Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer));
      imageUrl = `/public/images/${targetFilename}.png`;
    } else {
      throw new Error("Failed to get image buffer");
    }

    const item = await createImageLibraryItem({
      id: imageId,
      createdAt: new Date().toISOString(),
      provider,
      prompt,
      url: imageUrl,
      metadataJson
    });

    response.json(item);
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof RevisionConflictError) {
    response.status(409).json({
      code: "REVISION_CONFLICT",
      error: error.message,
      article: error.article
    });
    return;
  }

  if (error instanceof ResourceRevisionConflictError) {
    response.status(409).json({
      code: "REVISION_CONFLICT",
      error: error.message,
      resource: error.resource
    });
    return;
  }

  if (error instanceof z.ZodError) {
    response.status(400).json({
      error: "Dữ liệu gửi lên không hợp lệ.",
      issues: error.issues
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Đã có lỗi backend xảy ra.";
  response.status(500).json({ error: message });
});

void ensureAuthBootstrap().catch((error) => {
  console.error("Auth bootstrap error:", error);
});
startPublishWorker();

app.listen(port, () => {
  console.log(`cms_auto_v3 backend listening on http://localhost:${port}`);
});
