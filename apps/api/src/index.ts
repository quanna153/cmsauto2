import cors from "cors";
import express from "express";
import { z } from "zod";
import { articlePatchSchema } from "@cmsauto/contracts";
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
  buildInternalLinkSuggestionsFromAnchorCandidates,
  buildKeywordIdeas,
  buildOutline,
  findInternalLinkAnchorCandidates,
  mapAnchorCandidatesToInternalLinks,
  mapAnchorTextCandidatesToInternalLinkCandidates,
  selectInternalLinkCandidatesForAnchorCandidates,
  slugify
} from "./factory.js";
import type { AnchorTextCandidate } from "./factory.js";
import { generateStructuredJson, hasGeminiConfig } from "./gemini.js";
import { enrichKeywordIdeasWithVolumes, keywordVolumeHealth } from "./keyword-volume.js";
import {
  appendHistory,
  createArticleLibraryItem,
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
  startPublishWorker
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
app.use(express.json({ limit: "1mb" }));

type AuthenticatedRequest = express.Request & {
  auth: AuthSessionState;
};

const languageSchema = z.enum(["vi", "en"]);
const briefSchema = z.object({
  searchIntent: z.string(),
  angle: z.string(),
  semanticTopics: z.array(z.string()),
  candidateFaqs: z.array(z.string())
});
const outlineSectionSchema = z.object({
  heading: z.string(),
  bullets: z.array(z.string())
});
const outlineSchema = z.object({
  title: z.string(),
  introDirection: z.string(),
  sections: z.array(outlineSectionSchema)
});
const draftSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  markdown: z.string()
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
const geminiLinkAnchorsSchema = z.object({
  anchorCandidates: z.array(z.object({
    anchorText: z.string().min(1),
    startOffset: z.number().int().min(0),
    endOffset: z.number().int().min(1),
    confidence: z.number().min(0).max(1),
    reason: z.object({
      standaloneTopic: z.boolean(),
      informationGap: z.boolean(),
      learningValue: z.boolean(),
      semanticClarity: z.boolean()
    })
  })).max(8)
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
        }
      },
      required: ["searchIntent", "angle", "semanticTopics", "candidateFaqs"]
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
          maxItems: 7,
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
        }
      },
      required: ["title", "introDirection", "sections"]
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
const linkAnchorCandidatesResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    anchorCandidates: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          anchorText: { type: "string", description: "Exact phrase from articleContent that can become an anchor." },
          startOffset: { type: "integer", minimum: 0, description: "Start offset in articleContent." },
          endOffset: { type: "integer", minimum: 1, description: "End offset in articleContent." },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reason: {
            type: "object",
            additionalProperties: false,
            properties: {
              standaloneTopic: { type: "boolean" },
              informationGap: { type: "boolean" },
              learningValue: { type: "boolean" },
              semanticClarity: { type: "boolean" }
            },
            required: ["standaloneTopic", "informationGap", "learningValue", "semanticClarity"]
          }
        },
        required: ["anchorText", "startOffset", "endOffset", "confidence", "reason"]
      }
    }
  },
  required: ["anchorCandidates"]
} as const;
const keywordRequestSchema = z.object({
  seedKeyword: z.string().min(1),
  language: languageSchema,
  prompt: z.string().min(1)
});
const keywordIdeasRefreshSchema = z.object({
  language: languageSchema,
  keywordIdeas: z.array(z.object({
    id: z.string(),
    keyword: z.string().min(1),
    intent: z.enum(["informational", "commercial", "comparison", "transactional"]),
    cluster: z.string().min(1)
  })).min(1)
});
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
  brief: briefSchema
});
const draftRequestSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).min(1),
  language: languageSchema,
  prompt: z.string().min(1),
  outline: outlineSchema
});
const linksRequestSchema = z.object({
  primaryKeyword: z.string().min(1),
  secondaryKeywords: z.array(z.string()).min(1),
  language: languageSchema,
  prompt: z.string().min(1),
  draft: draftSchema
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
  temporaryPassword: z.string().min(8)
});
const updateUserRequestSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
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
  response.json({
    ok: true,
    service: "cms-auto-v3-backend",
    aiMode: hasGeminiConfig() ? "gemini" : "local",
    volumeProvider: volumeHealth.activeProvider,
    volumeProviderConfigured: volumeHealth.configured,
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
    let keywordIdeas = buildKeywordIdeas(payload.seedKeyword, payload.language);

    if (hasGeminiConfig()) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          keyword: payload.seedKeyword,
          language: payload.language
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
        temperature: 0.5
      });

      const seen = new Set<string>();
      keywordIdeas = aiResult.keywordIdeas
        .map((idea) => {
          return {
            id: slugify(idea.keyword),
            keyword: idea.keyword.trim(),
            intent: idea.intent as Intent,
            cluster: idea.cluster.trim(),
            monthlyVolume: null,
            provider: "Chưa xác thực volume",
            checkedAt: null,
            status: "missing" as const
          };
        })
        .filter((idea) => {
          const key = idea.keyword.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 8);
    }

    keywordIdeas = await enrichKeywordIdeasWithVolumes(keywordIdeas, {
      language: payload.language
    });

    const record = await appendHistory("keywords", payload, {
      mode: hasGeminiConfig() ? "gemini" : "local",
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

    response.json({ keywordIdeas: enriched });
  } catch (error) {
    next(error);
  }
});

app.post("/api/brief/generate", async (request, response, next) => {
  try {
    const payload = briefRequestSchema.parse(request.body);
    let brief = buildBrief(payload.primaryKeyword, payload.secondaryKeywords, payload.language);

    if (hasGeminiConfig()) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          keyword: payload.primaryKeyword,
          primary_keyword: payload.primaryKeyword,
          secondary_keywords: payload.secondaryKeywords.join(", "),
          language: payload.language
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
            candidateFaqs: ["string"]
          }
        }, null, 2),
        responseJsonSchema: briefResponseJsonSchema,
        validator: geminiBriefSchema,
        temperature: 0.4
      });

      brief = aiResult.brief;
    }

    const record = await appendHistory("brief", payload, {
      mode: hasGeminiConfig() ? "gemini" : "local",
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
    let outline = buildOutline(
      payload.primaryKeyword,
      payload.brief,
      payload.secondaryKeywords,
      payload.language
    );

    if (hasGeminiConfig()) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          keyword: payload.primaryKeyword,
          primary_keyword: payload.primaryKeyword,
          secondary_keywords: payload.secondaryKeywords.join(", "),
          language: payload.language,
          search_intent: payload.brief.searchIntent,
          angle: payload.brief.angle,
          semantic_topics: payload.brief.semanticTopics.join(", "),
          candidate_faqs: payload.brief.candidateFaqs.join(" | "),
          brief_json: JSON.stringify(payload.brief, null, 2)
        },
        contextLines: [
          `Từ khóa chính: ${payload.primaryKeyword}`,
          `Từ khóa phụ: ${payload.secondaryKeywords.join(", ")}`,
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
            ]
          }
        }, null, 2),
        responseJsonSchema: outlineResponseJsonSchema,
        validator: geminiOutlineSchema,
        temperature: 0.5
      });

      outline = aiResult.outline;
    }

    const record = await appendHistory("outline", payload, {
      mode: hasGeminiConfig() ? "gemini" : "local",
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
    let draft = buildDraft(
      payload.primaryKeyword,
      payload.outline,
      payload.secondaryKeywords,
      payload.language
    );

    if (hasGeminiConfig()) {
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
        temperature: 0.4
      });

      draft = aiResult.draft;
    }

    const record = await appendHistory("draft", payload, {
      mode: hasGeminiConfig() ? "gemini" : "local",
      draft
    }, getAuth(request).user.id);
    response.json({ draft, recordId: record.id });
  } catch (error) {
    next(error);
  }
});

app.post("/api/links/suggest", async (request, response, next) => {
  try {
    const payload = linksRequestSchema.parse(request.body);
    const articleLibrary = await readArticleLibrary(payload.language);

    if (articleLibrary.length === 0) {
      response.status(400).json({
        error: "Internal Link Library is empty. Cannot generate internal link suggestions yet."
      });
      return;
    }

    const localAnchorCandidates = findInternalLinkAnchorCandidates(payload.draft, payload.language, articleLibrary);
    let candidateLibraryCount = selectInternalLinkCandidatesForAnchorCandidates(
      payload.draft,
      payload.language,
      articleLibrary,
      localAnchorCandidates
    ).length;
    let suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(
      payload.draft,
      payload.primaryKeyword,
      payload.secondaryKeywords,
      payload.language,
      articleLibrary
    );

    if (hasGeminiConfig()) {
      const aiResult = await generateStructuredJson({
        prompt: payload.prompt,
        variables: {
          articleTitle: payload.draft.title,
          articleContent: payload.draft.markdown,
          language: payload.language
        },
        contextLines: [
          `articleTitle: ${payload.draft.title}`,
          `language: ${payload.language}`,
          `articleContent:\n${payload.draft.markdown}`
        ],
        jsonShapeHint: JSON.stringify({
          anchorCandidates: [
            {
              anchorText: "Proof of Stake",
              startOffset: 145,
              endOffset: 159,
              confidence: 0.95,
              reason: {
                standaloneTopic: true,
                informationGap: true,
                learningValue: true,
                semanticClarity: true
              }
            }
          ]
        }, null, 2),
        responseJsonSchema: linkAnchorCandidatesResponseJsonSchema,
        validator: geminiLinkAnchorsSchema,
        temperature: 0.3
      });

      const aiAnchorCandidates: AnchorTextCandidate[] = aiResult.anchorCandidates.filter((candidate) =>
        candidate.reason.standaloneTopic
        || candidate.reason.informationGap
        || candidate.reason.learningValue
        || candidate.reason.semanticClarity
      );
      const aiCandidateLibrary = selectInternalLinkCandidatesForAnchorCandidates(
        payload.draft,
        payload.language,
        articleLibrary,
        aiAnchorCandidates
      );
      candidateLibraryCount = aiCandidateLibrary.length;
      const aiMatchedSuggestions = mapAnchorCandidatesToInternalLinks(
        payload.draft,
        payload.language,
        aiCandidateLibrary,
        mapAnchorTextCandidatesToInternalLinkCandidates(payload.draft.markdown, payload.language, aiAnchorCandidates)
      );

      if (aiMatchedSuggestions.length > 0) {
        suggestions = aiMatchedSuggestions;
      }
    }

    const record = await appendHistory("links", payload, {
      mode: hasGeminiConfig() ? "anchor-ai + library-match" : "local-anchor + library-match",
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
