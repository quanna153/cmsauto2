import { readFile } from "node:fs/promises";
import { defaultPromptTemplates } from "./prompt-defaults.js";
import { dataFilePaths, getDatabase, persistDatabase, queryAll, queryFirst, tableCount, withTransaction } from "./database.js";
import type {
  ArticleLibraryItem,
  ArticleSessionSnapshot,
  AuthUser,
  Draft,
  HistoryRecord,
  HistoryStep,
  ArticleLibraryImportItem,
  ArticleLibraryImportResult,
  InternalLinkSuggestion,
  KeywordIdea,
  Language,
  LegacyReviewStatus,
  Locale,
  PromptKey,
  PromptTemplates,
  PublishJob,
  PublishJobStatus,
  PublishLog,
  PublishedArticle,
  ReviewStatus,
  VolumeCacheRecord
} from "./types.js";
type ArticleLibraryDb = { articles: ArticleLibraryItem[] };
type VolumeCacheDb = { records: VolumeCacheRecord[] };
type PromptDb = { prompts: PromptTemplates };
type HistoryDb = { records: HistoryRecord[] };
type ArticleSessionDb = { articles: ArticleSessionSnapshot[] };

type QueryParams = Record<string, string | number | null> | (string | number | null)[];
type SqlDatabase = Awaited<ReturnType<typeof getDatabase>>;

type ArticleRow = {
  id: string;
  revision: number;
  created_at: string;
  updated_at: string;
  language: Language;
  seed_keyword: string;
  active_step: ArticleSessionSnapshot["activeStep"];
  primary_keyword_id: string | null;
  review_status: string;
  review_note: string;
  publish_at: string | null;
  published_at: string | null;
  live_path: string | null;
  remote_article_id: string | null;
  publish_job_id: string | null;
  last_publish_error: string | null;
  keyword_ideas_json: string;
  secondary_keyword_ids_json: string;
  brief_json: string | null;
  outline_json: string | null;
  draft_json: string | null;
  link_suggestions_json: string;
  final_markdown: string;
  owner_user_id: string | null;
};

type HistoryRecordRow = {
  id: string;
  step: HistoryStep;
  created_at: string;
  request_json: string;
  response_json: string;
  owner_user_id: string | null;
};

type OwnerContext = Pick<AuthUser, "id" | "role">;

let bootstrapPromise: Promise<void> | null = null;
let publishWorkerTimer: NodeJS.Timeout | null = null;
let publishWorkerRunning = false;

function nowIso() {
  return new Date().toISOString();
}

function parseKeywordLabels(labels: string[] | undefined) {
  const seen = new Set<string>();
  return (labels ?? [])
    .flatMap((label) => label.split(/[,;\n]+/))
    .map((label) => label.trim().replace(/^#+/, "").trim())
    .filter((label) => {
      const key = label.toLocaleLowerCase();
      if (!label || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function inferLanguageFromUrl(url: string): Language | null {
  const normalized = url.toLowerCase();
  if (normalized.includes("/vi-vn/")) {
    return "vi";
  }
  if (normalized.includes("/en-us/") || isValidInternalLinkUrl(url)) {
    return "en";
  }
  return null;
}

function isValidInternalLinkUrl(url: string) {
  return url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://");
}

function normalizeReviewText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/y/g, "i")
    .replace(/Y/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSuperAdmin(actor: OwnerContext) {
  return actor.role === "super_admin";
}

function canAccessOwnerScopedRecord(ownerUserId: string | null, actor: OwnerContext) {
  return isSuperAdmin(actor) || ownerUserId === actor.id;
}

function assertOwnerAccess(ownerUserId: string | null, actor: OwnerContext, message = "Bạn không có quyền truy cập dữ liệu này.") {
  if (!canAccessOwnerScopedRecord(ownerUserId, actor)) {
    throw new Error(message);
  }
}

function normalizeReviewStatus(status?: ReviewStatus | LegacyReviewStatus | null): ReviewStatus {
  if (status === "in_review") {
    return "needs_fix";
  }

  if (status === "approved") {
    return "scheduled";
  }

  if (
    status === "editor_ready"
    || status === "needs_fix"
    || status === "scheduled"
    || status === "publishing"
    || status === "published"
    || status === "failed"
  ) {
    return status;
  }

  return "editor_ready";
}

function reviewStatusFromString(status?: string | null): ReviewStatus {
  return normalizeReviewStatus(status as ReviewStatus | LegacyReviewStatus | null | undefined);
}

function parseJson<T>(value: string | null | undefined, fallback: T) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeKeywordIdeaProvider(keywordIdea: KeywordIdea): KeywordIdea {
  const provider = (keywordIdea.provider ?? "").trim();
  const normalized = provider.toLowerCase();

  if (
    !provider
    || normalized.startsWith("lỗi volume provider")
    || normalized.includes("thiếu credit")
    || normalized.includes("sai xác thực")
    || normalized.includes("quá giới hạn")
    || normalized.includes("lỗi kết nối")
    || normalized.includes("chưa có volume xác thực")
    || normalized.includes("đang chờ volume provider")
    || normalized.includes("chưa cấu hình volume provider")
  ) {
    return { ...keywordIdea, provider: "Chưa có nguồn dữ liệu" };
  }

  if (normalized.includes("dataforseo")) {
    return { ...keywordIdea, provider: "DataForSEO" };
  }

  if (normalized.includes("ahrefs")) {
    return { ...keywordIdea, provider: "Ahrefs" };
  }

  if (normalized.includes("keywordtool") || normalized.includes("keyword tool")) {
    return { ...keywordIdea, provider: "KeywordTool" };
  }

  return keywordIdea;
}

async function readJsonBootstrap<T>(filePath: string, fallback: T) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

function dbAll<T extends Record<string, unknown>>(db: SqlDatabase, sql: string, params?: QueryParams) {
  const statement = db.prepare(sql, params as never);
  const rows: T[] = [];

  try {
    while (statement.step()) {
      rows.push(statement.getAsObject() as T);
    }
  } finally {
    statement.free();
  }

  return rows;
}

function dbFirst<T extends Record<string, unknown>>(db: SqlDatabase, sql: string, params?: QueryParams) {
  return dbAll<T>(db, sql, params)[0] ?? null;
}

function createArticleVersion(
  draft: Draft | null,
  finalMarkdown: string,
  reviewStatus: ReviewStatus,
  label: string,
  createdAt: string
) {
  const markdown = finalMarkdown || draft?.markdown || "";

  return {
    id: crypto.randomUUID(),
    createdAt,
    label,
    reviewStatus,
    title: draft?.title ?? "",
    slug: draft?.slug ?? "",
    excerpt: draft?.excerpt ?? "",
    metaTitle: draft?.metaTitle ?? "",
    metaDescription: draft?.metaDescription ?? "",
    markdown
  };
}

function normalizeArticleSession(article: ArticleSessionSnapshot): ArticleSessionSnapshot {
  const reviewStatus = normalizeReviewStatus(article.reviewStatus);
  const reviewNote = article.reviewNote ?? "";
  const publishAt = article.publishAt ?? null;
  const publishedAt = article.publishedAt ?? null;
  const livePath = article.livePath ?? null;
  const remoteArticleId = article.remoteArticleId ?? null;
  const publishJobId = article.publishJobId ?? null;
  const lastPublishError = article.lastPublishError ?? null;
  const versions = Array.isArray(article.versions) ? article.versions.map((version) => ({
    ...version,
    reviewStatus: normalizeReviewStatus(version.reviewStatus)
  })) : [];
  const statusTransitions = Array.isArray(article.statusTransitions) ? article.statusTransitions.map((transition) => ({
    ...transition,
    fromStatus: transition.fromStatus ? normalizeReviewStatus(transition.fromStatus) : null,
    toStatus: normalizeReviewStatus(transition.toStatus)
  })) : [];

  return {
    ...article,
    revision: article.revision ?? 1,
    reviewStatus,
    reviewNote,
    publishAt,
    publishedAt,
    livePath,
    remoteArticleId,
    publishJobId,
    lastPublishError,
    versions: versions.length > 0
      ? versions
      : [createArticleVersion(article.draft, article.finalMarkdown, reviewStatus, "Bản từ Article Factory", article.createdAt)],
    statusTransitions: statusTransitions.length > 0
      ? statusTransitions
      : [{
        id: crypto.randomUUID(),
        createdAt: article.createdAt,
        fromStatus: null,
        toStatus: reviewStatus,
        note: "Tạo từ flow Article Factory"
      }]
  };
}

function serializeArticle(db: SqlDatabase, row: ArticleRow): ArticleSessionSnapshot {
  const versions = dbAll<{
    id: string;
    created_at: string;
    label: string;
    review_status: string;
    title: string;
    slug: string;
    excerpt: string;
    meta_title: string;
    meta_description: string;
    markdown: string;
  }>(db, `
    SELECT id, created_at, label, review_status, title, slug, excerpt, meta_title, meta_description, markdown
    FROM article_versions
    WHERE article_id = $articleId
    ORDER BY created_at DESC
  `, { $articleId: row.id }).map((version) => ({
    id: version.id,
    createdAt: version.created_at,
    label: version.label,
    reviewStatus: reviewStatusFromString(version.review_status),
    title: version.title,
    slug: version.slug,
    excerpt: version.excerpt,
    metaTitle: version.meta_title,
    metaDescription: version.meta_description,
    markdown: version.markdown
  }));

  const statusTransitions = dbAll<{
    id: string;
    created_at: string;
    from_status: string | null;
    to_status: string;
    note: string;
  }>(db, `
    SELECT id, created_at, from_status, to_status, note
    FROM article_status_transitions
    WHERE article_id = $articleId
    ORDER BY created_at DESC
  `, { $articleId: row.id }).map((transition) => ({
    id: transition.id,
    createdAt: transition.created_at,
    fromStatus: transition.from_status ? reviewStatusFromString(transition.from_status) : null,
    toStatus: reviewStatusFromString(transition.to_status),
    note: transition.note
  }));

  return normalizeArticleSession({
    id: row.id,
    revision: Number(row.revision),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    inputs: {
      language: row.language,
      seedKeyword: row.seed_keyword
    },
    activeStep: row.active_step,
    keywordIdeas: parseJson<KeywordIdea[]>(row.keyword_ideas_json, []).map(normalizeKeywordIdeaProvider),
    primaryKeywordId: row.primary_keyword_id,
    secondaryKeywordIds: parseJson(row.secondary_keyword_ids_json, []),
    brief: parseJson(row.brief_json, null),
    outline: parseJson(row.outline_json, null),
    draft: parseJson(row.draft_json, null),
    linkSuggestions: parseJson(row.link_suggestions_json, []),
    finalMarkdown: row.final_markdown,
    reviewStatus: reviewStatusFromString(row.review_status),
    reviewNote: row.review_note,
    publishAt: row.publish_at,
    publishedAt: row.published_at,
    livePath: row.live_path,
    remoteArticleId: row.remote_article_id,
    publishJobId: row.publish_job_id,
    lastPublishError: row.last_publish_error,
    versions,
    statusTransitions
  });
}

function writeArticleChildren(db: SqlDatabase, article: ArticleSessionSnapshot) {
  db.run("DELETE FROM article_versions WHERE article_id = $articleId", { $articleId: article.id } as never);
  for (const version of article.versions ?? []) {
    db.run(`
      INSERT INTO article_versions (
        id, article_id, created_at, label, review_status, title, slug, excerpt, meta_title, meta_description, markdown
      ) VALUES (
        $id, $articleId, $createdAt, $label, $reviewStatus, $title, $slug, $excerpt, $metaTitle, $metaDescription, $markdown
      )
    `, {
      $id: version.id,
      $articleId: article.id,
      $createdAt: version.createdAt,
      $label: version.label,
      $reviewStatus: normalizeReviewStatus(version.reviewStatus),
      $title: version.title,
      $slug: version.slug,
      $excerpt: version.excerpt,
      $metaTitle: version.metaTitle,
      $metaDescription: version.metaDescription,
      $markdown: version.markdown
    } as never);
  }

  db.run("DELETE FROM article_status_transitions WHERE article_id = $articleId", { $articleId: article.id } as never);
  for (const transition of article.statusTransitions ?? []) {
    db.run(`
      INSERT INTO article_status_transitions (
        id, article_id, created_at, from_status, to_status, note
      ) VALUES (
        $id, $articleId, $createdAt, $fromStatus, $toStatus, $note
      )
    `, {
      $id: transition.id,
      $articleId: article.id,
      $createdAt: transition.createdAt,
      $fromStatus: transition.fromStatus ? normalizeReviewStatus(transition.fromStatus) : null,
      $toStatus: normalizeReviewStatus(transition.toStatus),
      $note: transition.note
    } as never);
  }
}

function writeArticleBase(db: SqlDatabase, article: ArticleSessionSnapshot, ownerUserId: string | null) {
  db.run(`
    INSERT INTO articles (
      id, revision, created_at, updated_at, language, seed_keyword, active_step, primary_keyword_id,
      review_status, review_note, publish_at, published_at, live_path, remote_article_id,
      publish_job_id, last_publish_error, keyword_ideas_json, secondary_keyword_ids_json,
      brief_json, outline_json, draft_json, link_suggestions_json, final_markdown, owner_user_id
    ) VALUES (
      $id, $revision, $createdAt, $updatedAt, $language, $seedKeyword, $activeStep, $primaryKeywordId,
      $reviewStatus, $reviewNote, $publishAt, $publishedAt, $livePath, $remoteArticleId,
      $publishJobId, $lastPublishError, $keywordIdeasJson, $secondaryKeywordIdsJson,
      $briefJson, $outlineJson, $draftJson, $linkSuggestionsJson, $finalMarkdown, $ownerUserId
    )
    ON CONFLICT(id) DO UPDATE SET
      revision = articles.revision + 1,
      updated_at = excluded.updated_at,
      language = excluded.language,
      seed_keyword = excluded.seed_keyword,
      active_step = excluded.active_step,
      primary_keyword_id = excluded.primary_keyword_id,
      review_status = excluded.review_status,
      review_note = excluded.review_note,
      publish_at = excluded.publish_at,
      published_at = excluded.published_at,
      live_path = excluded.live_path,
      remote_article_id = excluded.remote_article_id,
      publish_job_id = excluded.publish_job_id,
      last_publish_error = excluded.last_publish_error,
      keyword_ideas_json = excluded.keyword_ideas_json,
      secondary_keyword_ids_json = excluded.secondary_keyword_ids_json,
      brief_json = excluded.brief_json,
      outline_json = excluded.outline_json,
      draft_json = excluded.draft_json,
      link_suggestions_json = excluded.link_suggestions_json,
      final_markdown = excluded.final_markdown,
      owner_user_id = COALESCE(articles.owner_user_id, excluded.owner_user_id)
  `, {
    $id: article.id,
    $revision: article.revision ?? 1,
    $createdAt: article.createdAt,
    $updatedAt: article.updatedAt,
    $language: article.inputs.language,
    $seedKeyword: article.inputs.seedKeyword,
    $activeStep: article.activeStep,
    $primaryKeywordId: article.primaryKeywordId,
    $reviewStatus: normalizeReviewStatus(article.reviewStatus),
    $reviewNote: article.reviewNote ?? "",
    $publishAt: article.publishAt ?? null,
    $publishedAt: article.publishedAt ?? null,
    $livePath: article.livePath ?? null,
    $remoteArticleId: article.remoteArticleId ?? null,
    $publishJobId: article.publishJobId ?? null,
    $lastPublishError: article.lastPublishError ?? null,
    $keywordIdeasJson: JSON.stringify(article.keywordIdeas),
    $secondaryKeywordIdsJson: JSON.stringify(article.secondaryKeywordIds),
    $briefJson: article.brief ? JSON.stringify(article.brief) : null,
    $outlineJson: article.outline ? JSON.stringify(article.outline) : null,
    $draftJson: article.draft ? JSON.stringify(article.draft) : null,
    $linkSuggestionsJson: JSON.stringify(article.linkSuggestions),
    $finalMarkdown: article.finalMarkdown,
    $ownerUserId: ownerUserId
  } as never);

  writeArticleChildren(db, article);
}

function validateArticleForReview(article: ArticleSessionSnapshot) {
  const issues: string[] = [];
  const draft = article.draft;
  const markdown = article.finalMarkdown || article.draft?.markdown || "";
  const isManualArticle = article.activeStep === "ready"
    && article.keywordIdeas.length === 0
    && article.primaryKeywordId === null
    && article.secondaryKeywordIds.length === 0
    && article.linkSuggestions.length === 0;
  const keywordScope = [
    draft?.title ?? "",
    draft?.metaTitle ?? "",
    draft?.excerpt ?? "",
    draft?.metaDescription ?? "",
    markdown
  ]
    .filter(Boolean)
    .join("\n");
  const primaryKeyword = article.keywordIdeas.find((idea) => idea.id === article.primaryKeywordId) ?? null;
  const acceptedLinksReady = article.linkSuggestions.filter(
    (suggestion) => suggestion.status === "accepted" && suggestion.targetUrl.trim().length > 0
  );

  if (!draft) {
    issues.push("Chưa có bản nháp hoàn chỉnh.");
  }
  if (!isManualArticle && !primaryKeyword) {
    issues.push("Chưa chốt từ khóa chính.");
  }
  if (!draft?.title.trim()) {
    issues.push("Thiếu tiêu đề bài viết.");
  }
  if (!draft?.slug.trim()) {
    issues.push("Thiếu slug.");
  }
  if (!draft?.metaTitle.trim()) {
    issues.push("Thiếu meta title.");
  }
  if (!draft?.metaDescription.trim()) {
    issues.push("Thiếu meta description.");
  }
  if (!isManualArticle && markdown.trim().length < 2400) {
    issues.push("Nội dung bài còn quá ngắn để giao tự động.");
  }
  if (!isManualArticle && primaryKeyword && !normalizeReviewText(keywordScope).includes(normalizeReviewText(primaryKeyword.keyword))) {
    issues.push("Nội dung chưa chứa rõ từ khóa chính.");
  }
  if (!isManualArticle && acceptedLinksReady.length === 0) {
    issues.push("Chưa có internal link nào được chốt.");
  }

  return {
    passed: issues.length === 0,
    issues,
    draft,
    markdown,
    primaryKeyword,
    acceptedLinksReady
  };
}

function buildReviewNote(passed: boolean, issues: string[], acceptedLinksCount: number, publishAt: string | null) {
  if (passed) {
    return [
      "Auto review pass.",
      `Đã lên lịch publish nội bộ lúc ${publishAt}.`,
      `Đã chốt ${acceptedLinksCount} internal link.`
    ].join("\n");
  }

  return [
    "Auto review chưa pass.",
    ...issues.map((issue, index) => `${index + 1}. ${issue}`)
  ].join("\n");
}

function localeForLanguage(language: Language): Locale {
  return language === "vi" ? "vi-vn" : "en-us";
}

function slugifyManualTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "bai-viet";
}

function uniquePublishedSlug(db: SqlDatabase, locale: Locale, title: string) {
  const baseSlug = slugifyManualTitle(title);
  let slug = baseSlug;
  let suffix = 2;

  while (dbFirst<{ id: string }>(db, `
    SELECT id
    FROM published_articles
    WHERE locale = $locale AND slug = $slug
    LIMIT 1
  `, { $locale: locale, $slug: slug })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function buildPublishProjection(article: ArticleSessionSnapshot, publishedAt: string): PublishedArticle {
  const draft = article.draft;
  if (!draft) {
    throw new Error("Không thể publish vì bài chưa có draft.");
  }

  const markdown = article.finalMarkdown || draft.markdown;
  const acceptedLinks = article.linkSuggestions.filter(
    (suggestion) => suggestion.status === "accepted" && suggestion.targetUrl.trim().length > 0
  );
  const primaryKeyword = article.keywordIdeas.find((idea) => idea.id === article.primaryKeywordId)?.keyword ?? "";
  const secondaryKeywords = article.keywordIdeas
    .filter((idea) => article.secondaryKeywordIds.includes(idea.id))
    .map((idea) => idea.keyword);

  return {
    id: crypto.randomUUID(),
    articleId: article.id,
    articleSection: article.articleSection ?? "articles",
    slug: draft.slug,
    locale: localeForLanguage(article.inputs.language),
    language: article.inputs.language,
    title: draft.title,
    excerpt: draft.excerpt,
    metaTitle: draft.metaTitle,
    metaDescription: draft.metaDescription,
    markdown,
    publishedAt,
    livePath: `/${localeForLanguage(article.inputs.language)}/${draft.slug}`,
    internalLinks: acceptedLinks,
    primaryKeyword,
    secondaryKeywords
  };
}

function writePublishLog(db: SqlDatabase, log: PublishLog) {
  db.run(`
    INSERT INTO publish_logs (
      id, publish_job_id, article_id, event_type, message, payload_json, created_at
    ) VALUES (
      $id, $publishJobId, $articleId, $eventType, $message, $payloadJson, $createdAt
    )
  `, {
    $id: log.id,
    $publishJobId: log.publishJobId,
    $articleId: log.articleId,
    $eventType: log.eventType,
    $message: log.message,
    $payloadJson: JSON.stringify(log.payload ?? null),
    $createdAt: log.createdAt
  } as never);
}

function insertOrUpdatePublishedArticle(db: SqlDatabase, article: PublishedArticle) {
  db.run(`
    INSERT INTO published_articles (
      id, article_id, slug, locale, language, title, excerpt, meta_title, meta_description, markdown,
      published_at, live_path, internal_links_json, primary_keyword, secondary_keywords_json
    ) VALUES (
      $id, $articleId, $slug, $locale, $language, $title, $excerpt, $metaTitle, $metaDescription, $markdown,
      $publishedAt, $livePath, $internalLinksJson, $primaryKeyword, $secondaryKeywordsJson
    )
    ON CONFLICT(article_id) DO UPDATE SET
      slug = excluded.slug,
      locale = excluded.locale,
      language = excluded.language,
      title = excluded.title,
      excerpt = excluded.excerpt,
      meta_title = excluded.meta_title,
      meta_description = excluded.meta_description,
      markdown = excluded.markdown,
      published_at = excluded.published_at,
      live_path = excluded.live_path,
      internal_links_json = excluded.internal_links_json,
      primary_keyword = excluded.primary_keyword,
      secondary_keywords_json = excluded.secondary_keywords_json
  `, {
    $id: article.id,
    $articleId: article.articleId,
    $slug: article.slug,
    $locale: article.locale,
    $language: article.language,
    $title: article.title,
    $excerpt: article.excerpt,
    $metaTitle: article.metaTitle,
    $metaDescription: article.metaDescription,
    $markdown: article.markdown,
    $publishedAt: article.publishedAt,
    $livePath: article.livePath,
    $internalLinksJson: JSON.stringify(article.internalLinks),
    $primaryKeyword: article.primaryKeyword,
    $secondaryKeywordsJson: JSON.stringify(article.secondaryKeywords)
  } as never);
}

function deletePublishedArticleProjection(db: SqlDatabase, articleId: string) {
  db.run(`
    DELETE FROM published_articles
    WHERE article_id = $articleId
  `, {
    $articleId: articleId
  } as never);
}

function getLatestPublishJob(db: SqlDatabase, articleId: string) {
  return dbFirst<{
    id: string;
    article_id: string;
    status: PublishJobStatus;
    scheduled_at: string;
    started_at: string | null;
    completed_at: string | null;
    retry_count: number;
    max_retries: number;
    last_error: string | null;
    idempotency_key: string;
    locked_at: string | null;
  }>(db, `
    SELECT *
    FROM publish_jobs
    WHERE article_id = $articleId
    ORDER BY COALESCE(completed_at, started_at, scheduled_at) DESC
    LIMIT 1
  `, { $articleId: articleId });
}

function alignArticleWithPublishState(db: SqlDatabase, article: ArticleSessionSnapshot) {
  const latestJob = getLatestPublishJob(db, article.id);

  if (!latestJob) {
    if (article.reviewStatus === "published" && article.publishedAt && article.draft) {
      const projection = buildPublishProjection(article, article.publishedAt);
      insertOrUpdatePublishedArticle(db, projection);
      return normalizeArticleSession({
        ...article,
        livePath: projection.livePath,
        remoteArticleId: projection.id
      });
    }

    deletePublishedArticleProjection(db, article.id);
    return article;
  }

  if (latestJob.status === "completed") {
    const publishedAt = latestJob.completed_at ?? article.publishedAt ?? article.publishAt ?? nowIso();
    const publishedArticle = normalizeArticleSession({
      ...article,
      reviewStatus: "published",
      publishJobId: latestJob.id,
      publishedAt,
      lastPublishError: null
    });
    const projection = buildPublishProjection(publishedArticle, publishedAt);
    insertOrUpdatePublishedArticle(db, projection);
    return normalizeArticleSession({
      ...publishedArticle,
      livePath: projection.livePath,
      remoteArticleId: projection.id
    });
  }

  if (latestJob.status === "processing") {
    deletePublishedArticleProjection(db, article.id);
    return normalizeArticleSession({
      ...article,
      reviewStatus: "publishing",
      publishJobId: latestJob.id,
      lastPublishError: null
    });
  }

  if (latestJob.status === "failed") {
    deletePublishedArticleProjection(db, article.id);
    return normalizeArticleSession({
      ...article,
      reviewStatus: "failed",
      publishJobId: latestJob.id,
      lastPublishError: latestJob.last_error ?? article.lastPublishError
    });
  }

  if (latestJob.status === "queued" || latestJob.status === "scheduled") {
    deletePublishedArticleProjection(db, article.id);
    return normalizeArticleSession({
      ...article,
      reviewStatus: "scheduled",
      publishAt: latestJob.scheduled_at ?? article.publishAt,
      publishedAt: null,
      livePath: null,
      remoteArticleId: null,
      publishJobId: latestJob.id,
      lastPublishError: null
    });
  }

  deletePublishedArticleProjection(db, article.id);
  return article;
}

async function bootstrapArticleLibraryIfNeeded(db: SqlDatabase) {
  const count = Number(dbFirst<{ count: number }>(db, "SELECT COUNT(*) AS count FROM article_library")?.count ?? 0);
  if (count > 0) {
    return;
  }

  const bootstrap = await readJsonBootstrap<ArticleLibraryDb>(dataFilePaths.articleLibraryFile, {
    articles: []
  });

  for (const article of bootstrap.articles) {
    db.run(`
      INSERT INTO article_library (id, created_at, title, url, language, summary, keywords_json)
      VALUES ($id, $createdAt, $title, $url, $language, $summary, $keywordsJson)
    `, {
      $id: article.id,
      $createdAt: article.createdAt ?? nowIso(),
      $title: article.title,
      $url: article.url,
      $language: article.language,
      $summary: article.summary,
      $keywordsJson: JSON.stringify(article.keywords)
    } as never);
  }
}

async function bootstrapPromptsIfNeeded(db: SqlDatabase) {
  const count = Number(dbFirst<{ count: number }>(db, "SELECT COUNT(*) AS count FROM prompt_templates")?.count ?? 0);
  if (count > 0) {
    return;
  }

  const bootstrap = await readJsonBootstrap<PromptDb>(dataFilePaths.promptsFile, {
    prompts: defaultPromptTemplates
  });
  const now = nowIso();

  for (const [key, value] of Object.entries({ ...defaultPromptTemplates, ...bootstrap.prompts })) {
    db.run(`
      INSERT INTO prompt_templates (key, value, updated_at)
      VALUES ($key, $value, $updatedAt)
    `, {
      $key: key,
      $value: value,
      $updatedAt: now
    } as never);
  }
}

async function bootstrapHistoryIfNeeded(db: SqlDatabase) {
  const count = Number(dbFirst<{ count: number }>(db, "SELECT COUNT(*) AS count FROM history_records")?.count ?? 0);
  if (count > 0) {
    return;
  }

  const bootstrap = await readJsonBootstrap<HistoryDb>(dataFilePaths.historyFile, {
    records: []
  });

  for (const record of bootstrap.records) {
    db.run(`
      INSERT INTO history_records (id, step, created_at, request_json, response_json, owner_user_id)
      VALUES ($id, $step, $createdAt, $requestJson, $responseJson, NULL)
    `, {
      $id: record.id,
      $step: record.step,
      $createdAt: record.createdAt,
      $requestJson: JSON.stringify(record.request ?? null),
      $responseJson: JSON.stringify(record.response ?? null)
    } as never);
  }
}

async function bootstrapVolumeCacheIfNeeded(db: SqlDatabase) {
  const count = Number(dbFirst<{ count: number }>(db, "SELECT COUNT(*) AS count FROM keyword_volume_cache")?.count ?? 0);
  if (count > 0) {
    return;
  }

  const bootstrap = await readJsonBootstrap<VolumeCacheDb>(dataFilePaths.volumeCacheFile, {
    records: []
  });

  for (const record of bootstrap.records) {
    db.run(`
      INSERT INTO keyword_volume_cache (
        id, keyword, language, provider, provider_label, monthly_volume, status, checked_at, cached_at
      ) VALUES (
        $id, $keyword, $language, $provider, $providerLabel, $monthlyVolume, $status, $checkedAt, $cachedAt
      )
    `, {
      $id: crypto.randomUUID(),
      $keyword: record.keyword,
      $language: record.language,
      $provider: record.provider,
      $providerLabel: record.providerLabel,
      $monthlyVolume: record.monthlyVolume,
      $status: record.status,
      $checkedAt: record.checkedAt,
      $cachedAt: record.cachedAt
    } as never);
  }
}

async function bootstrapArticlesIfNeeded(db: SqlDatabase) {
  const count = Number(dbFirst<{ count: number }>(db, "SELECT COUNT(*) AS count FROM articles")?.count ?? 0);
  if (count > 0) {
    return;
  }

  const bootstrap = await readJsonBootstrap<ArticleSessionDb>(dataFilePaths.articlesFile, {
    articles: []
  });

  for (const rawArticle of bootstrap.articles) {
    const normalized = normalizeArticleSession(rawArticle);
    writeArticleBase(db, normalized, null);
  }
}

function reconcilePublishArtifacts(db: SqlDatabase) {
  db.run(`
    DELETE FROM published_articles
    WHERE article_id NOT IN (
      SELECT id
      FROM articles
      WHERE review_status = 'published'
    )
  `);

  const articleRows = dbAll<ArticleRow>(db, `
    SELECT *
    FROM articles
  `);

  for (const row of articleRows) {
    const article = serializeArticle(db, row);

    if (article.reviewStatus === "scheduled" && article.publishAt) {
      const idempotencyKey = `${article.id}::${article.publishAt}`;
      const existingJob = article.publishJobId
        ? dbFirst<{ id: string }>(db, `
          SELECT id
          FROM publish_jobs
          WHERE id = $jobId
        `, { $jobId: article.publishJobId })
        : dbFirst<{ id: string }>(db, `
          SELECT id
          FROM publish_jobs
          WHERE idempotency_key = $idempotencyKey
          LIMIT 1
        `, { $idempotencyKey: idempotencyKey }) ?? dbFirst<{ id: string }>(db, `
          SELECT id
          FROM publish_jobs
          WHERE article_id = $articleId AND status IN ('queued', 'scheduled', 'processing', 'failed', 'completed')
          ORDER BY scheduled_at DESC
          LIMIT 1
        `, { $articleId: article.id });

      if (!existingJob) {
        const jobId = crypto.randomUUID();
        db.run(`
          INSERT INTO publish_jobs (
            id, article_id, status, scheduled_at, started_at, completed_at,
            retry_count, max_retries, last_error, idempotency_key, locked_at
          ) VALUES (
            $id, $articleId, 'scheduled', $scheduledAt, NULL, NULL,
            0, $maxRetries, NULL, $idempotencyKey, NULL
          )
        `, {
          $id: jobId,
          $articleId: article.id,
          $scheduledAt: article.publishAt,
          $maxRetries: Number(process.env.PUBLISH_MAX_RETRIES ?? "3"),
          $idempotencyKey: idempotencyKey
        } as never);

        const reconciledArticle = normalizeArticleSession({
          ...article,
          publishJobId: jobId
        });
        writeArticleBase(db, reconciledArticle, row.owner_user_id);
      } else if (article.publishJobId !== existingJob.id) {
        const reconciledArticle = normalizeArticleSession({
          ...article,
          publishJobId: existingJob.id
        });
        writeArticleBase(db, reconciledArticle, row.owner_user_id);
      }
    }

    const latestRow = dbFirst<ArticleRow>(db, `
      SELECT *
      FROM articles
      WHERE id = $articleId
    `, { $articleId: article.id });

    if (!latestRow) {
      continue;
    }

    const alignedArticle = alignArticleWithPublishState(db, serializeArticle(db, latestRow));
    if (
      alignedArticle.reviewStatus !== latestRow.review_status
      || alignedArticle.publishJobId !== latestRow.publish_job_id
      || alignedArticle.publishAt !== latestRow.publish_at
      || alignedArticle.publishedAt !== latestRow.published_at
      || alignedArticle.livePath !== latestRow.live_path
      || alignedArticle.remoteArticleId !== latestRow.remote_article_id
      || alignedArticle.lastPublishError !== latestRow.last_publish_error
    ) {
      writeArticleBase(db, alignedArticle, latestRow.owner_user_id);
    }
  }
}

async function ensureBootstrapData() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const db = await getDatabase();
      await withTransaction(async (database) => {
        await bootstrapArticleLibraryIfNeeded(database);
        await bootstrapPromptsIfNeeded(database);
        await bootstrapHistoryIfNeeded(database);
        await bootstrapVolumeCacheIfNeeded(database);
        await bootstrapArticlesIfNeeded(database);
        reconcilePublishArtifacts(database);
      });
      await persistDatabase(db);
    })();
  }

  return bootstrapPromise;
}

async function readArticleById(articleId: string) {
  await ensureBootstrapData();
  const db = await getDatabase();
  const row = dbFirst<ArticleRow>(db, `
    SELECT *
    FROM articles
    WHERE id = $articleId
  `, { $articleId: articleId });

  return row ? serializeArticle(db, row) : null;
}

export async function appendHistory(step: HistoryStep, request: unknown, response: unknown, ownerUserId: string | null) {
  await ensureBootstrapData();
  const record: HistoryRecord = {
    id: crypto.randomUUID(),
    step,
    createdAt: nowIso(),
    request,
    response
  };

  await withTransaction((db) => {
    db.run(`
      INSERT INTO history_records (id, step, created_at, request_json, response_json, owner_user_id)
      VALUES ($id, $step, $createdAt, $requestJson, $responseJson, $ownerUserId)
    `, {
      $id: record.id,
      $step: record.step,
      $createdAt: record.createdAt,
      $requestJson: JSON.stringify(record.request ?? null),
      $responseJson: JSON.stringify(record.response ?? null),
      $ownerUserId: ownerUserId
    } as never);

    db.run(`
      DELETE FROM history_records
      WHERE id NOT IN (
        SELECT id
        FROM history_records
        ORDER BY created_at DESC
        LIMIT 200
      )
    `);
  });

  return record;
}

export async function readRecentHistory(actor: OwnerContext, limit = 20) {
  await ensureBootstrapData();
  const rows = await queryAll<HistoryRecordRow>(
    isSuperAdmin(actor)
      ? `
        SELECT *
        FROM history_records
        ORDER BY created_at DESC
        LIMIT $limit
      `
      : `
        SELECT *
        FROM history_records
        WHERE owner_user_id = $ownerUserId
        ORDER BY created_at DESC
        LIMIT $limit
      `,
    isSuperAdmin(actor)
      ? { $limit: limit }
      : { $limit: limit, $ownerUserId: actor.id }
  );

  return rows.map((row) => ({
    id: row.id,
    step: row.step,
    createdAt: row.created_at,
    request: parseJson(row.request_json, null),
    response: parseJson(row.response_json, null)
  }));
}

export async function readArticleLibrary(language?: Language) {
  await ensureBootstrapData();
  const rows = language
    ? await queryAll<{
      id: string;
      revision: number;
      created_at: string | null;
      title: string;
      url: string;
      language: Language;
      summary: string;
      keywords_json: string;
    }>(`
      SELECT *
      FROM article_library
      WHERE language = $language
      ORDER BY title COLLATE NOCASE ASC
    `, { $language: language })
    : await queryAll<{
      id: string;
      revision: number;
      created_at: string | null;
      title: string;
      url: string;
      language: Language;
      summary: string;
      keywords_json: string;
    }>(`
      SELECT *
      FROM article_library
      ORDER BY title COLLATE NOCASE ASC
    `);

  return rows.map((row) => ({
    id: row.id,
    revision: Number(row.revision),
    createdAt: row.created_at ?? nowIso(),
    title: row.title,
    url: row.url,
    language: row.language,
    summary: row.summary,
    keywords: parseJson<string[]>(row.keywords_json, [])
  }));
}

export class ResourceRevisionConflictError extends Error {
  constructor(public readonly resource: unknown) {
    super("Dữ liệu dùng chung đã thay đổi ở nơi khác. Hãy tải lại trước khi tiếp tục.");
  }
}

export async function createArticleLibraryItem(article: Omit<ArticleLibraryItem, "revision" | "createdAt"> & { revision?: number; createdAt?: string }) {
  await ensureBootstrapData();
  const createdAt = article.createdAt ?? nowIso();
  await withTransaction((db) => {
    db.run(`
      INSERT INTO article_library (id, revision, created_at, title, url, language, summary, keywords_json)
      VALUES ($id, 1, $createdAt, $title, $url, $language, $summary, $keywordsJson)
    `, {
      $id: article.id,
      $createdAt: createdAt,
      $title: article.title,
      $url: article.url,
      $language: article.language,
      $summary: article.summary,
      $keywordsJson: JSON.stringify(article.keywords)
    } as never);
  });

  return (await readArticleLibrary()).find((item) => item.id === article.id) ?? { ...article, revision: article.revision ?? 1, createdAt };
}

export async function importArticleLibraryItems(items: ArticleLibraryImportItem[]): Promise<ArticleLibraryImportResult> {
  await ensureBootstrapData();
  const errors: ArticleLibraryImportResult["errors"] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  await withTransaction((db) => {
    items.forEach((item, index) => {
      const row = index + 2;
      const title = item.title.trim();
      const url = item.url.trim();
      const language = item.language ?? inferLanguageFromUrl(url);
      const keywords = parseKeywordLabels(item.keywords);

      if (!title || !url) {
        skipped += 1;
        errors.push({ row, message: "Thiếu title hoặc url." });
        return;
      }
      if (!isValidInternalLinkUrl(url)) {
        skipped += 1;
        errors.push({ row, message: "URL phải bắt đầu bằng /, http:// hoặc https://." });
        return;
      }
      if (language !== "vi" && language !== "en") {
        skipped += 1;
        errors.push({ row, message: "Thiếu language và không thể suy ra từ URL hợp lệ." });
        return;
      }

      const existing = dbFirst<{ id: string; keywords_json: string }>(db, `
        SELECT id, keywords_json
        FROM article_library
        WHERE lower(url) = lower($url)
        LIMIT 1
      `, { $url: url });

      if (existing) {
        const nextKeywords = keywords.length > 0 ? keywords : parseJson<string[]>(existing.keywords_json, []);
        db.run(`
          UPDATE article_library
          SET revision = revision + 1,
              title = $title,
              url = $url,
              language = $language,
              summary = $summary,
              keywords_json = $keywordsJson
          WHERE id = $id
        `, {
          $id: existing.id,
          $title: title,
          $url: url,
          $language: language,
          $summary: "",
          $keywordsJson: JSON.stringify(nextKeywords)
        } as never);
        updated += 1;
        return;
      }

      db.run(`
        INSERT INTO article_library (id, revision, created_at, title, url, language, summary, keywords_json)
        VALUES ($id, 1, $createdAt, $title, $url, $language, $summary, $keywordsJson)
      `, {
        $id: crypto.randomUUID(),
        $createdAt: nowIso(),
        $title: title,
        $url: url,
        $language: language,
        $summary: "",
        $keywordsJson: JSON.stringify(keywords)
      } as never);
      created += 1;
    });
  });

  return {
    created,
    updated,
    skipped,
    errors,
    articles: await readArticleLibrary()
  };
}

export async function patchArticleLibraryItem(
  id: string,
  expectedRevision: number,
  changes: Partial<Pick<ArticleLibraryItem, "title" | "url" | "language" | "summary" | "keywords">>
) {
  await ensureBootstrapData();
  await withTransaction((db) => {
    const current = dbFirst<{
      id: string;
      revision: number;
      title: string;
      url: string;
      language: Language;
      summary: string;
      keywords_json: string;
    }>(db, "SELECT * FROM article_library WHERE id = $id", { $id: id });
    if (!current) {
      throw new Error("Không tìm thấy article library item.");
    }
    if (Number(current.revision) !== expectedRevision) {
      throw new ResourceRevisionConflictError(current);
    }

    db.run(`
      UPDATE article_library
      SET
        revision = revision + 1,
        title = $title,
        url = $url,
        language = $language,
        summary = $summary,
        keywords_json = $keywordsJson
      WHERE id = $id
    `, {
      $id: id,
      $title: changes.title ?? current.title,
      $url: changes.url ?? current.url,
      $language: changes.language ?? current.language,
      $summary: changes.summary ?? current.summary,
      $keywordsJson: JSON.stringify(changes.keywords ?? parseJson<string[]>(current.keywords_json, []))
    } as never);
  });

  return (await readArticleLibrary()).find((item) => item.id === id) ?? null;
}

export async function deleteArticleLibraryItem(id: string) {
  await ensureBootstrapData();
  await withTransaction((db) => {
    db.run("DELETE FROM article_library WHERE id = $id", { $id: id } as never);
  });
  return true;
}

export async function readVolumeCache(provider: string, language: Language) {
  await ensureBootstrapData();
  const rows = await queryAll<{
    keyword: string;
    language: Language;
    provider: string;
    provider_label: string;
    monthly_volume: number | null;
    status: VolumeCacheRecord["status"];
    checked_at: string | null;
    cached_at: string;
  }>(`
    SELECT keyword, language, provider, provider_label, monthly_volume, status, checked_at, cached_at
    FROM keyword_volume_cache
    WHERE provider = $provider AND language = $language
    ORDER BY cached_at DESC
  `, { $provider: provider, $language: language });

  return rows.map((row) => ({
    keyword: row.keyword,
    language: row.language,
    provider: row.provider,
    providerLabel: row.provider_label,
    monthlyVolume: row.monthly_volume === null ? null : Number(row.monthly_volume),
    status: row.status,
    checkedAt: row.checked_at,
    cachedAt: row.cached_at
  }));
}

export async function upsertVolumeCache(records: VolumeCacheRecord[]) {
  if (records.length === 0) {
    return [];
  }

  await ensureBootstrapData();
  await withTransaction((db) => {
    for (const record of records) {
      db.run(`
        INSERT INTO keyword_volume_cache (
          id, keyword, language, provider, provider_label, monthly_volume, status, checked_at, cached_at
        ) VALUES (
          $id, $keyword, $language, $provider, $providerLabel, $monthlyVolume, $status, $checkedAt, $cachedAt
        )
        ON CONFLICT(provider, language, keyword) DO UPDATE SET
          provider_label = excluded.provider_label,
          monthly_volume = excluded.monthly_volume,
          status = excluded.status,
          checked_at = excluded.checked_at,
          cached_at = excluded.cached_at
      `, {
        $id: crypto.randomUUID(),
        $keyword: record.keyword,
        $language: record.language,
        $provider: record.provider,
        $providerLabel: record.providerLabel,
        $monthlyVolume: record.monthlyVolume,
        $status: record.status,
        $checkedAt: record.checkedAt,
        $cachedAt: record.cachedAt
      } as never);
    }

    db.run(`
      DELETE FROM keyword_volume_cache
      WHERE id NOT IN (
        SELECT id
        FROM keyword_volume_cache
        ORDER BY cached_at DESC
        LIMIT 5000
      )
    `);
  });

  return records;
}

export async function readPromptTemplates() {
  await ensureBootstrapData();
  const rows = await queryAll<{ key: string; value: string }>(`
    SELECT key, value
    FROM prompt_templates
  `);

  const prompts = { ...defaultPromptTemplates };
  for (const row of rows) {
    if (row.key in prompts) {
      prompts[row.key as keyof PromptTemplates] = row.value;
    }
  }

  return prompts;
}

export async function readPromptTemplateRecords() {
  await ensureBootstrapData();
  const rows = await queryAll<{ key: PromptKey; value: string; revision: number; updated_at: string }>(`
    SELECT key, value, revision, updated_at
    FROM prompt_templates
    ORDER BY key ASC
  `);

  return rows.map((row) => ({
    key: row.key,
    value: row.value,
    revision: Number(row.revision),
    updatedAt: row.updated_at
  }));
}

export async function patchPromptTemplate(key: PromptKey, expectedRevision: number, value: string) {
  await ensureBootstrapData();
  await withTransaction((db) => {
    const current = dbFirst<{ key: PromptKey; value: string; revision: number; updated_at: string }>(
      db,
      "SELECT key, value, revision, updated_at FROM prompt_templates WHERE key = $key",
      { $key: key }
    );
    if (!current) {
      throw new Error("Không tìm thấy prompt template.");
    }
    if (Number(current.revision) !== expectedRevision) {
      throw new ResourceRevisionConflictError(current);
    }
    db.run(`
      UPDATE prompt_templates
      SET revision = revision + 1, value = $value, updated_at = $updatedAt
      WHERE key = $key
    `, {
      $key: key,
      $value: value,
      $updatedAt: nowIso()
    } as never);
  });

  return (await readPromptTemplateRecords()).find((record) => record.key === key) ?? null;
}

export async function readArticleSessions(actor: OwnerContext) {
  await ensureBootstrapData();
  const db = await getDatabase();
  await withTransaction((database) => {
    reconcilePublishArtifacts(database);
  });
  const rows = dbAll<ArticleRow>(
    db,
    isSuperAdmin(actor)
      ? `
        SELECT *
        FROM articles
        ORDER BY updated_at DESC
      `
      : `
        SELECT *
        FROM articles
        WHERE owner_user_id = $ownerUserId
        ORDER BY updated_at DESC
      `,
    isSuperAdmin(actor) ? undefined : { $ownerUserId: actor.id }
  );
  return rows.map((row) => serializeArticle(db, row));
}

type EditableArticleChanges = Partial<Pick<
  ArticleSessionSnapshot,
  | "inputs"
  | "activeStep"
  | "keywordIdeas"
  | "primaryKeywordId"
  | "secondaryKeywordIds"
  | "brief"
  | "outline"
  | "draft"
  | "linkSuggestions"
  | "finalMarkdown"
  | "reviewNote"
>>;

export class RevisionConflictError extends Error {
  constructor(public readonly article: ArticleSessionSnapshot) {
    super("Bài viết đã thay đổi ở nơi khác. Hãy tải lại trước khi tiếp tục.");
  }
}

export async function createArticleSession(article: ArticleSessionSnapshot, actor: OwnerContext) {
  await ensureBootstrapData();
  const normalized = normalizeArticleSession({
    ...article,
    revision: 1,
    reviewStatus: "editor_ready",
    reviewNote: "",
    publishAt: null,
    publishedAt: null,
    livePath: null,
    remoteArticleId: null,
    publishJobId: null,
    lastPublishError: null,
    versions: undefined,
    statusTransitions: undefined
  });

  await withTransaction((db) => {
    if (dbFirst<ArticleRow>(db, "SELECT * FROM articles WHERE id = $id", { $id: normalized.id })) {
      throw new Error("ID bài viết đã tồn tại.");
    }
    writeArticleBase(db, normalized, actor.id);
  });

  return await readArticleById(normalized.id) ?? normalized;
}

export async function createManualPublishedArticle(
  input: { title: string; content: string },
  actor: OwnerContext
) {
  await ensureBootstrapData();

  const articleId = crypto.randomUUID();
  const remoteArticleId = crypto.randomUUID();
  const publishedAt = nowIso();
  const language: Language = "vi";
  const locale = localeForLanguage(language);

  await withTransaction((db) => {
    const slug = uniquePublishedSlug(db, locale, input.title);
    const livePath = `/${locale}/${slug}`;
    const draft = {
      title: input.title,
      slug,
      excerpt: "",
      metaTitle: input.title,
      metaDescription: "",
      markdown: input.content
    };
    const article = normalizeArticleSession({
      id: articleId,
      revision: 1,
      createdAt: publishedAt,
      updatedAt: publishedAt,
      inputs: {
        language,
        seedKeyword: input.title
      },
      activeStep: "ready",
      keywordIdeas: [],
      primaryKeywordId: null,
      secondaryKeywordIds: [],
      brief: null,
      outline: null,
      draft,
      linkSuggestions: [],
      finalMarkdown: input.content,
      reviewStatus: "published",
      reviewNote: "Đăng thủ công và publish ngay.",
      publishAt: publishedAt,
      publishedAt,
      livePath,
      remoteArticleId,
      publishJobId: null,
      lastPublishError: null,
      versions: [{
        id: crypto.randomUUID(),
        createdAt: publishedAt,
        label: "Đăng thủ công",
        reviewStatus: "published",
        title: input.title,
        slug,
        excerpt: "",
        metaTitle: input.title,
        metaDescription: "",
        markdown: input.content
      }],
      statusTransitions: [{
        id: crypto.randomUUID(),
        createdAt: publishedAt,
        fromStatus: null,
        toStatus: "published",
        note: "Đăng thủ công và publish ngay."
      }]
    });

    writeArticleBase(db, article, actor.id);
    insertOrUpdatePublishedArticle(db, {
      id: remoteArticleId,
      articleId,
      articleSection: "articles",
      slug,
      locale,
      language,
      title: input.title,
      excerpt: "",
      metaTitle: input.title,
      metaDescription: "",
      markdown: input.content,
      publishedAt,
      livePath,
      internalLinks: [],
      primaryKeyword: "",
      secondaryKeywords: []
    });
  });

  const article = await readArticleById(articleId);
  if (!article) {
    throw new Error("Không đọc lại được bài viết thủ công vừa lưu.");
  }

  return article;
}

export async function createManualScheduledArticle(
  input: { title: string; content: string; publishAt: string },
  actor: OwnerContext
) {
  await ensureBootstrapData();

  const articleId = crypto.randomUUID();
  const publishJobId = crypto.randomUUID();
  const createdAt = nowIso();
  const language: Language = "vi";
  const locale = localeForLanguage(language);
  const scheduledAt = input.publishAt;

  await withTransaction((db) => {
    const slug = uniquePublishedSlug(db, locale, input.title);
    const draft = {
      title: input.title,
      slug,
      excerpt: "",
      metaTitle: input.title,
      metaDescription: "",
      markdown: input.content
    };
    const article = normalizeArticleSession({
      id: articleId,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      inputs: {
        language,
        seedKeyword: input.title
      },
      activeStep: "ready",
      keywordIdeas: [],
      primaryKeywordId: null,
      secondaryKeywordIds: [],
      brief: null,
      outline: null,
      draft,
      linkSuggestions: [],
      finalMarkdown: input.content,
      reviewStatus: "scheduled",
      reviewNote: `Đặt lịch đăng thủ công lúc ${scheduledAt}.`,
      publishAt: scheduledAt,
      publishedAt: null,
      livePath: null,
      remoteArticleId: null,
      publishJobId,
      lastPublishError: null,
      versions: [{
        id: crypto.randomUUID(),
        createdAt,
        label: "Đặt lịch đăng thủ công",
        reviewStatus: "scheduled",
        title: input.title,
        slug,
        excerpt: "",
        metaTitle: input.title,
        metaDescription: "",
        markdown: input.content
      }],
      statusTransitions: [{
        id: crypto.randomUUID(),
        createdAt,
        fromStatus: null,
        toStatus: "scheduled",
        note: "Đặt lịch đăng thủ công."
      }]
    });

    writeArticleBase(db, article, actor.id);
    db.run(`
      INSERT INTO publish_jobs (
        id, article_id, status, scheduled_at, started_at, completed_at,
        retry_count, max_retries, last_error, idempotency_key, locked_at
      ) VALUES (
        $id, $articleId, 'scheduled', $scheduledAt, NULL, NULL,
        0, $maxRetries, NULL, $idempotencyKey, NULL
      )
    `, {
      $id: publishJobId,
      $articleId: articleId,
      $scheduledAt: scheduledAt,
      $maxRetries: Number(process.env.PUBLISH_MAX_RETRIES ?? "3"),
      $idempotencyKey: `${articleId}::${scheduledAt}`
    } as never);
    writePublishLog(db, {
      id: crypto.randomUUID(),
      publishJobId,
      articleId,
      eventType: "scheduled",
      message: "Bài thủ công đã được đặt lịch publish.",
      payload: { publishAt: scheduledAt },
      createdAt
    });
  });

  const article = await readArticleById(articleId);
  if (!article) {
    throw new Error("Không đọc lại được bài viết thủ công vừa đặt lịch.");
  }

  return article;
}

export async function patchArticleSession(
  articleId: string,
  expectedRevision: number,
  changes: EditableArticleChanges,
  actor: OwnerContext
) {
  await ensureBootstrapData();

  await withTransaction((db) => {
    const row = dbFirst<ArticleRow>(db, "SELECT * FROM articles WHERE id = $id", { $id: articleId });
    if (!row) {
      throw new Error("Không tìm thấy bài viết.");
    }
    assertOwnerAccess(row.owner_user_id, actor, "Bạn không có quyền sửa bài viết này.");

    const current = serializeArticle(db, row);
    if (Number(row.revision) !== expectedRevision) {
      throw new RevisionConflictError(current);
    }

    const next = normalizeArticleSession({
      ...current,
      ...changes,
      id: current.id,
      revision: current.revision,
      createdAt: current.createdAt,
      updatedAt: nowIso(),
      reviewStatus: current.reviewStatus,
      publishAt: current.publishAt,
      publishedAt: current.publishedAt,
      livePath: current.livePath,
      remoteArticleId: current.remoteArticleId,
      publishJobId: current.publishJobId,
      lastPublishError: current.lastPublishError,
      versions: current.versions,
      statusTransitions: current.statusTransitions
    });

    writeArticleBase(db, next, row.owner_user_id);
  });

  const article = await readArticleById(articleId);
  if (!article) {
    throw new Error("Không đọc lại được bài viết vừa lưu.");
  }
  return article;
}

export async function deleteArticleSession(id: string, actor: OwnerContext) {
  await ensureBootstrapData();
  const existing = await queryFirst<{ owner_user_id: string | null }>(`
    SELECT owner_user_id
    FROM articles
    WHERE id = $id
  `, { $id: id });

  if (existing) {
    assertOwnerAccess(existing.owner_user_id, actor, "Bạn không có quyền xóa bài viết này.");
  }

  const before = await tableCount("articles");

  await withTransaction((db) => {
    db.run("DELETE FROM publish_logs WHERE article_id = $id", { $id: id } as never);
    db.run("DELETE FROM publish_jobs WHERE article_id = $id", { $id: id } as never);
    db.run("DELETE FROM published_articles WHERE article_id = $id", { $id: id } as never);
    db.run("DELETE FROM articles WHERE id = $id", { $id: id } as never);
  });

  const after = await tableCount("articles");
  return before !== after;
}

export async function reviewGateArticle(
  articleId: string,
  actor: OwnerContext,
  publishAtOverride?: string | null
) {
  await ensureBootstrapData();

  const result = await withTransaction((db) => {
    const articleRow = dbFirst<ArticleRow>(db, `
      SELECT *
      FROM articles
      WHERE id = $articleId
    `, { $articleId: articleId });

    if (!articleRow) {
      throw new Error("Không tìm thấy bài viết để đưa vào review gate.");
    }

    assertOwnerAccess(articleRow.owner_user_id, actor, "Bạn không có quyền duyệt bài viết này.");

    const article = serializeArticle(db, articleRow);
    const now = nowIso();
    const review = validateArticleForReview(article);
    const nextStatus: ReviewStatus = review.passed ? "scheduled" : "needs_fix";
    const nextPublishAt = review.passed
      ? (publishAtOverride ?? article.publishAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString())
      : null;
    const scheduledAt = nextPublishAt ?? now;
    const nextReviewNote = buildReviewNote(
      review.passed,
      review.issues,
      review.acceptedLinksReady.length,
      nextPublishAt
    );
    const version = createArticleVersion(
      review.draft,
      review.markdown,
      nextStatus,
      review.passed ? "Duyệt & lên lịch tự động" : "Auto review cần xử lý",
      now
    );

    let publishJob: PublishJob | null = null;
    let publishJobId = article.publishJobId ?? null;

    if (review.passed) {
      const idempotencyKey = `${article.id}::${nextPublishAt}`;
      const existingJob = dbFirst<{
        id: string;
        status: PublishJobStatus;
        retry_count: number;
        max_retries: number;
        last_error: string | null;
        started_at: string | null;
        completed_at: string | null;
        idempotency_key: string;
        locked_at: string | null;
        scheduled_at: string;
      }>(db, `
        SELECT *
        FROM publish_jobs
        WHERE idempotency_key = $idempotencyKey
        LIMIT 1
      `, { $idempotencyKey: idempotencyKey })
        ?? (publishJobId
          ? dbFirst<{
            id: string;
            status: PublishJobStatus;
            retry_count: number;
            max_retries: number;
            last_error: string | null;
            started_at: string | null;
            completed_at: string | null;
            idempotency_key: string;
            locked_at: string | null;
            scheduled_at: string;
          }>(db, `
            SELECT *
            FROM publish_jobs
            WHERE id = $jobId
          `, { $jobId: publishJobId })
          : null)
        ?? dbFirst<{
          id: string;
          status: PublishJobStatus;
          retry_count: number;
          max_retries: number;
          last_error: string | null;
          started_at: string | null;
          completed_at: string | null;
          idempotency_key: string;
          locked_at: string | null;
          scheduled_at: string;
        }>(db, `
          SELECT *
          FROM publish_jobs
          WHERE article_id = $articleId
          ORDER BY scheduled_at DESC
          LIMIT 1
        `, { $articleId: article.id });

      if (existingJob) {
        publishJobId = existingJob.id;
        db.run(`
          UPDATE publish_jobs
          SET status = $status,
              scheduled_at = $scheduledAt,
              started_at = NULL,
              completed_at = NULL,
              last_error = NULL,
              locked_at = NULL,
              retry_count = CASE WHEN status = 'completed' THEN 0 ELSE retry_count END,
              idempotency_key = $idempotencyKey
          WHERE id = $jobId
        `, {
          $status: "scheduled",
          $scheduledAt: scheduledAt,
          $idempotencyKey: idempotencyKey,
          $jobId: existingJob.id
        } as never);

        publishJob = {
          id: existingJob.id,
          articleId: article.id,
          status: "scheduled",
          scheduledAt,
          startedAt: null,
          completedAt: null,
          retryCount: Number(existingJob.retry_count),
          maxRetries: Number(existingJob.max_retries),
          lastError: null,
          idempotencyKey,
          lockedAt: null
        };
      } else {
        publishJobId = crypto.randomUUID();
        publishJob = {
          id: publishJobId,
          articleId: article.id,
          status: "scheduled",
          scheduledAt,
          startedAt: null,
          completedAt: null,
          retryCount: 0,
          maxRetries: Number(process.env.PUBLISH_MAX_RETRIES ?? "3"),
          lastError: null,
          idempotencyKey,
          lockedAt: null
        };

        db.run(`
          INSERT INTO publish_jobs (
            id, article_id, status, scheduled_at, started_at, completed_at,
            retry_count, max_retries, last_error, idempotency_key, locked_at
          ) VALUES (
            $id, $articleId, $status, $scheduledAt, NULL, NULL,
            $retryCount, $maxRetries, NULL, $idempotencyKey, NULL
          )
        `, {
          $id: publishJob.id,
          $articleId: publishJob.articleId,
          $status: publishJob.status,
          $scheduledAt: publishJob.scheduledAt,
          $retryCount: publishJob.retryCount,
          $maxRetries: publishJob.maxRetries,
          $idempotencyKey: publishJob.idempotencyKey
        } as never);
      }

      if (!publishJob) {
        throw new Error("Không tạo được publish job.");
      }

      writePublishLog(db, {
        id: crypto.randomUUID(),
        publishJobId: publishJob.id,
        articleId: article.id,
        eventType: "scheduled",
        message: "Bài đã pass review gate và được lên lịch publish.",
        payload: {
          publishAt: nextPublishAt,
          acceptedLinks: review.acceptedLinksReady.length
        },
        createdAt: now
      });
    } else if (publishJobId) {
      db.run(`
        UPDATE publish_jobs
        SET status = 'cancelled',
            completed_at = $completedAt,
            last_error = $lastError
        WHERE id = $jobId AND status IN ('queued', 'scheduled')
      `, {
        $completedAt: now,
        $lastError: "Review gate fail, chờ xử lý tay.",
        $jobId: publishJobId
      } as never);
    }

    const updatedArticle = normalizeArticleSession({
      ...article,
      updatedAt: now,
      reviewStatus: nextStatus,
      reviewNote: nextReviewNote,
      publishAt: nextPublishAt,
      publishJobId: review.passed ? publishJobId : null,
      lastPublishError: review.passed ? null : article.lastPublishError,
      publishedAt: null,
      livePath: null,
      remoteArticleId: null,
      versions: [version, ...(article.versions ?? [])],
      statusTransitions: [
        {
          id: crypto.randomUUID(),
          createdAt: now,
          fromStatus: article.reviewStatus ?? null,
          toStatus: nextStatus,
          note: nextReviewNote
        },
        ...(article.statusTransitions ?? [])
      ]
    });

    deletePublishedArticleProjection(db, article.id);
    writeArticleBase(db, updatedArticle, articleRow.owner_user_id);
    return { article: updatedArticle, publishJob };
  });

  return result;
}

export async function readPublishJobs(actor: OwnerContext) {
  await ensureBootstrapData();
  const rows = await queryAll<{
    id: string;
    article_id: string;
    status: PublishJobStatus;
    scheduled_at: string;
    started_at: string | null;
    completed_at: string | null;
    retry_count: number;
    max_retries: number;
    last_error: string | null;
    idempotency_key: string;
    locked_at: string | null;
  }>(
    isSuperAdmin(actor)
      ? `
        SELECT *
        FROM publish_jobs
        ORDER BY scheduled_at DESC
      `
      : `
        SELECT pj.*
        FROM publish_jobs pj
        INNER JOIN articles a ON a.id = pj.article_id
        WHERE a.owner_user_id = $ownerUserId
        ORDER BY pj.scheduled_at DESC
      `,
    isSuperAdmin(actor) ? undefined : { $ownerUserId: actor.id }
  );

  return rows.map((row) => ({
    id: row.id,
    articleId: row.article_id,
    status: row.status,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    retryCount: Number(row.retry_count),
    maxRetries: Number(row.max_retries),
    lastError: row.last_error,
    idempotencyKey: row.idempotency_key,
    lockedAt: row.locked_at
  }));
}

export async function readPublishLogs(jobId: string, actor: OwnerContext) {
  await ensureBootstrapData();
  if (!isSuperAdmin(actor)) {
    const ownedJob = await queryFirst<{ id: string }>(`
      SELECT pj.id
      FROM publish_jobs pj
      INNER JOIN articles a ON a.id = pj.article_id
      WHERE pj.id = $jobId AND a.owner_user_id = $ownerUserId
      LIMIT 1
    `, {
      $jobId: jobId,
      $ownerUserId: actor.id
    });

    if (!ownedJob) {
      throw new Error("Bạn không có quyền xem log publish của bài viết này.");
    }
  }

  const rows = await queryAll<{
    id: string;
    publish_job_id: string;
    article_id: string;
    event_type: string;
    message: string;
    payload_json: string | null;
    created_at: string;
  }>(`
    SELECT *
    FROM publish_logs
    WHERE publish_job_id = $jobId
    ORDER BY created_at DESC
  `, { $jobId: jobId });

  return rows.map((row) => ({
    id: row.id,
    publishJobId: row.publish_job_id,
    articleId: row.article_id,
    eventType: row.event_type,
    message: row.message,
    payload: parseJson(row.payload_json, null),
    createdAt: row.created_at
  } satisfies PublishLog));
}

export async function readPublishedArticles(locale?: Locale) {
  await ensureBootstrapData();
  await withTransaction((db) => {
    reconcilePublishArtifacts(db);
  });
  const rows = await queryAll<{
    id: string;
    article_id: string;
    slug: string;
    locale: Locale;
    language: Language;
    title: string;
    excerpt: string;
    meta_title: string;
    meta_description: string;
    markdown: string;
    published_at: string;
    live_path: string;
    internal_links_json: string;
    primary_keyword: string;
    secondary_keywords_json: string;
  }>(`
    SELECT pa.*
    FROM published_articles pa
    INNER JOIN articles a ON a.id = pa.article_id
    WHERE a.review_status = 'published'
      AND ($locale IS NULL OR pa.locale = $locale)
    ORDER BY pa.published_at DESC
  `, { $locale: locale ?? null });

  return rows.map((row) => ({
    id: row.id,
    articleId: row.article_id,
    articleSection: "articles",
    slug: row.slug,
    locale: row.locale,
    language: row.language,
    title: row.title,
    excerpt: row.excerpt,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    markdown: row.markdown,
    publishedAt: row.published_at,
    livePath: row.live_path,
    internalLinks: parseJson<InternalLinkSuggestion[]>(row.internal_links_json, []),
    primaryKeyword: row.primary_keyword,
    secondaryKeywords: parseJson<string[]>(row.secondary_keywords_json, [])
  } satisfies PublishedArticle));
}

export async function readPublishedArticleBySlug(locale: Locale, slug: string) {
  const articles = await readPublishedArticles(locale);
  return articles.find((article) => article.slug === slug) ?? null;
}

export async function retryPublishJob(jobId: string, actor: OwnerContext) {
  await ensureBootstrapData();

  const result = await withTransaction((db) => {
    const job = dbFirst<{
      id: string;
      article_id: string;
      status: PublishJobStatus;
      scheduled_at: string;
      retry_count: number;
      max_retries: number;
      idempotency_key: string;
    }>(db, `
      SELECT *
      FROM publish_jobs
      WHERE id = $jobId
    `, { $jobId: jobId });

    if (!job) {
      throw new Error("Không tìm thấy publish job để retry.");
    }

    const article = dbFirst<ArticleRow>(db, `
      SELECT *
      FROM articles
      WHERE id = $articleId
    `, { $articleId: job.article_id });

    if (!article) {
      throw new Error("Không tìm thấy bài viết của publish job.");
    }

    assertOwnerAccess(article.owner_user_id, actor, "Bạn không có quyền retry publish job này.");

    const hydrated = serializeArticle(db, article);
    const scheduledAt = hydrated.publishAt ?? nowIso();
    const transitionAt = nowIso();

    db.run(`
      UPDATE publish_jobs
      SET status = 'scheduled',
          scheduled_at = $scheduledAt,
          started_at = NULL,
          completed_at = NULL,
          last_error = NULL,
          locked_at = NULL
      WHERE id = $jobId
    `, {
      $scheduledAt: scheduledAt,
      $jobId: job.id
    } as never);

    const updatedArticle = normalizeArticleSession({
      ...hydrated,
      updatedAt: transitionAt,
      reviewStatus: "scheduled",
      publishedAt: null,
      livePath: null,
      remoteArticleId: null,
      lastPublishError: null,
      publishJobId: job.id,
      statusTransitions: [
        {
          id: crypto.randomUUID(),
          createdAt: transitionAt,
          fromStatus: hydrated.reviewStatus ?? null,
          toStatus: "scheduled",
          note: "Retry publish job"
        },
        ...(hydrated.statusTransitions ?? [])
      ]
    });

    deletePublishedArticleProjection(db, hydrated.id);
    writeArticleBase(db, updatedArticle, article.owner_user_id);
    writePublishLog(db, {
      id: crypto.randomUUID(),
      publishJobId: job.id,
      articleId: hydrated.id,
      eventType: "retry",
      message: "Publish job được đưa về hàng đợi để chạy lại.",
      payload: { scheduledAt },
      createdAt: transitionAt
    });

    return {
      job: {
        id: job.id,
        articleId: job.article_id,
        status: "scheduled" as const,
        scheduledAt,
        startedAt: null,
        completedAt: null,
        retryCount: Number(job.retry_count),
        maxRetries: Number(job.max_retries),
        lastError: null,
        idempotencyKey: job.idempotency_key,
        lockedAt: null
      },
      article: updatedArticle
    };
  });

  return result;
}

export async function runDuePublishJobs() {
  await ensureBootstrapData();
  const now = nowIso();
  const dueJobs = await queryAll<{
    id: string;
    article_id: string;
    status: PublishJobStatus;
    scheduled_at: string;
    retry_count: number;
    max_retries: number;
    idempotency_key: string;
    last_error: string | null;
  }>(`
    SELECT id, article_id, status, scheduled_at, retry_count, max_retries, idempotency_key, last_error
    FROM publish_jobs
    WHERE status IN ('queued', 'scheduled')
      AND scheduled_at <= $now
    ORDER BY scheduled_at ASC
  `, { $now: now });

  const result = {
    picked: dueJobs.length,
    published: 0,
    failed: 0,
    retried: 0
  };

  for (const job of dueJobs) {
    try {
      await withTransaction((db) => {
        const articleRow = dbFirst<ArticleRow>(db, `
          SELECT *
          FROM articles
          WHERE id = $articleId
        `, { $articleId: job.article_id });

        if (!articleRow) {
          throw new Error("Không tìm thấy bài viết để publish.");
        }

        const article = serializeArticle(db, articleRow);
        const startedAt = nowIso();

        db.run(`
          UPDATE publish_jobs
          SET status = 'processing',
              started_at = $startedAt,
              locked_at = $startedAt
          WHERE id = $jobId
        `, {
          $startedAt: startedAt,
          $jobId: job.id
        } as never);

        writePublishLog(db, {
          id: crypto.randomUUID(),
          publishJobId: job.id,
          articleId: article.id,
          eventType: "processing",
          message: "Worker bắt đầu publish bài viết.",
          payload: { scheduledAt: job.scheduled_at },
          createdAt: startedAt
        });

        const publishingArticle = normalizeArticleSession({
          ...article,
          updatedAt: startedAt,
          reviewStatus: "publishing",
          publishJobId: job.id,
          statusTransitions: [
            {
              id: crypto.randomUUID(),
              createdAt: startedAt,
              fromStatus: article.reviewStatus ?? null,
              toStatus: "publishing",
              note: "Worker bắt đầu publish"
            },
            ...(article.statusTransitions ?? [])
          ]
        });
        writeArticleBase(db, publishingArticle, articleRow.owner_user_id);

        const publishedAt = nowIso();
        const projection = buildPublishProjection(publishingArticle, publishedAt);
        insertOrUpdatePublishedArticle(db, projection);

        db.run(`
          UPDATE publish_jobs
          SET status = 'completed',
              completed_at = $completedAt,
              last_error = NULL,
              locked_at = NULL
          WHERE id = $jobId
        `, {
          $completedAt: publishedAt,
          $jobId: job.id
        } as never);

        const publishedArticle = normalizeArticleSession({
          ...publishingArticle,
          updatedAt: publishedAt,
          reviewStatus: "published",
          publishedAt,
          livePath: projection.livePath,
          remoteArticleId: projection.id,
          lastPublishError: null,
          statusTransitions: [
            {
              id: crypto.randomUUID(),
              createdAt: publishedAt,
              fromStatus: "publishing",
              toStatus: "published",
              note: "Publish job hoàn tất"
            },
            ...(publishingArticle.statusTransitions ?? [])
          ]
        });
        writeArticleBase(db, publishedArticle, articleRow.owner_user_id);

        writePublishLog(db, {
          id: crypto.randomUUID(),
          publishJobId: job.id,
          articleId: article.id,
          eventType: "published",
          message: "Bài viết đã được ghi vào published_articles.",
          payload: {
            livePath: projection.livePath,
            publishedAt
          },
          createdAt: publishedAt
        });
      });

      result.published += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi publish không xác định.";
      const transitionAt = nowIso();

      await withTransaction((db) => {
        const articleRow = dbFirst<ArticleRow>(db, `
          SELECT *
          FROM articles
          WHERE id = $articleId
        `, { $articleId: job.article_id });

        const article = articleRow ? serializeArticle(db, articleRow) : null;
        const nextRetryCount = Number(job.retry_count) + 1;
        const maxRetries = Number(job.max_retries);
        const canRetry = nextRetryCount <= maxRetries;

        if (canRetry) {
          const delayMs = Number(process.env.PUBLISH_RETRY_DELAY_MS ?? "60000");
          const nextSchedule = new Date(Date.now() + delayMs).toISOString();
          db.run(`
            UPDATE publish_jobs
            SET status = 'queued',
                retry_count = $retryCount,
                scheduled_at = $scheduledAt,
                last_error = $lastError,
                locked_at = NULL
            WHERE id = $jobId
          `, {
            $retryCount: nextRetryCount,
            $scheduledAt: nextSchedule,
            $lastError: message,
            $jobId: job.id
          } as never);

          if (article) {
            writePublishLog(db, {
              id: crypto.randomUUID(),
              publishJobId: job.id,
              articleId: article.id,
              eventType: "retry_scheduled",
              message: "Publish lỗi, worker đã đưa job vào hàng retry.",
              payload: {
                error: message,
                retryCount: nextRetryCount,
                nextSchedule
              },
              createdAt: transitionAt
            });
          }
        } else {
          db.run(`
            UPDATE publish_jobs
            SET status = 'failed',
                retry_count = $retryCount,
                completed_at = $completedAt,
                last_error = $lastError,
                locked_at = NULL
            WHERE id = $jobId
          `, {
            $retryCount: nextRetryCount,
            $completedAt: transitionAt,
            $lastError: message,
            $jobId: job.id
          } as never);

          if (article) {
            const failedArticle = normalizeArticleSession({
              ...article,
              updatedAt: transitionAt,
              reviewStatus: "failed",
              lastPublishError: message,
              statusTransitions: [
                {
                  id: crypto.randomUUID(),
                  createdAt: transitionAt,
                  fromStatus: article.reviewStatus ?? null,
                  toStatus: "failed",
                  note: message
                },
                ...(article.statusTransitions ?? [])
              ]
            });
            writeArticleBase(db, failedArticle, articleRow.owner_user_id);

            writePublishLog(db, {
              id: crypto.randomUUID(),
              publishJobId: job.id,
              articleId: article.id,
              eventType: "failed",
              message: "Publish job thất bại sau khi hết retry.",
              payload: {
                error: message,
                retryCount: nextRetryCount
              },
              createdAt: transitionAt
            });
          }
        }

        result[canRetry ? "retried" : "failed"] += 1;
      });
    }
  }

  return result;
}

export function startPublishWorker() {
  if (publishWorkerTimer) {
    return;
  }

  const pollMs = Number(process.env.PUBLISH_WORKER_POLL_MS ?? "15000");

  publishWorkerTimer = setInterval(() => {
    if (publishWorkerRunning) {
      return;
    }

    publishWorkerRunning = true;
    void runDuePublishJobs()
      .catch((error) => {
        console.error("Publish worker error:", error);
      })
      .finally(() => {
        publishWorkerRunning = false;
      });
  }, pollMs);
}
