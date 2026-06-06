import { beforeAll, describe, expect, it } from "vitest";

import { ensureAuthBootstrap } from "./auth-store.js";
import { queryFirst } from "./database.js";
import {
  createManualPublishedArticle,
  createManualScheduledArticle,
  createArticleSession,
  patchArticleSession,
  readPublishedArticleBySlug,
  readPublishedArticles,
  RevisionConflictError,
  reviewGateArticle,
  runDuePublishJobs
} from "./store.js";
import type { ArticleSessionSnapshot, AuthUser } from "./types.js";

const actor: Pick<AuthUser, "id" | "role"> = { id: "owner-1", role: "admin" };

function completeArticle(id: string): ArticleSessionSnapshot {
  const now = new Date().toISOString();
  const markdown = `# Bitcoin là gì?\n\n${"Bitcoin là tài sản số và blockchain là nền tảng giúp ghi nhận giao dịch minh bạch. ".repeat(45)}\n\nĐọc thêm về [blockchain](/vi-vn/blockchain-la-gi).`;
  return {
    id,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    inputs: { language: id.includes("-en") ? "en" : "vi", seedKeyword: "bitcoin" },
    activeStep: "ready",
    keywordIdeas: [
      { id: "primary", keyword: "bitcoin", intent: "informational", cluster: "seed", monthlyVolume: 100, provider: "test", checkedAt: now, status: "verified" },
      { id: "secondary", keyword: "blockchain", intent: "informational", cluster: "definition", monthlyVolume: 50, provider: "test", checkedAt: now, status: "verified" }
    ],
    primaryKeywordId: "primary",
    secondaryKeywordIds: ["secondary"],
    brief: { searchIntent: "Tìm hiểu bitcoin", angle: "Giải thích bitcoin", semanticTopics: ["bitcoin"], candidateFaqs: ["Bitcoin là gì?"] },
    outline: { title: "Bitcoin là gì?", introDirection: "Giới thiệu", sections: [{ heading: "Bitcoin", bullets: ["Khái niệm"] }] },
    draft: {
      title: "Bitcoin là gì? Hướng dẫn cơ bản",
      slug: id.includes("-en") ? "what-is-bitcoin" : "bitcoin-la-gi",
      excerpt: "Tìm hiểu bitcoin và blockchain theo cách rõ ràng.",
      metaTitle: "Bitcoin là gì? Hướng dẫn cơ bản",
      metaDescription: "Tìm hiểu bitcoin và blockchain theo cách rõ ràng cho người mới.",
      markdown
    },
    linkSuggestions: [{
      id: "link-1",
      sourceContext: "Đọc thêm về blockchain.",
      anchor: "blockchain",
      targetTitle: "Blockchain là gì?",
      targetUrl: "/vi-vn/blockchain-la-gi",
      matchedKeyword: "blockchain",
      matchStatus: "matched",
      reason: "Bổ sung kiến thức nền.",
      confidence: 95,
      status: "accepted"
    }],
    finalMarkdown: markdown
  };
}

beforeAll(async () => {
  await ensureAuthBootstrap();
});

describe("SQLite foundation", () => {
  it("bootstraps exactly one super admin", async () => {
    await ensureAuthBootstrap();
    const row = await queryFirst<{ count: number }>("SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin'");
    expect(Number(row?.count)).toBe(1);
  });

  it("rejects stale article revisions without deleting server history", async () => {
    const created = await createArticleSession(completeArticle("revision-article"), actor);
    const updated = await patchArticleSession(created.id, created.revision ?? 1, { finalMarkdown: `${created.finalMarkdown}\n\nUpdate.` }, actor);
    expect(updated.revision).toBe((created.revision ?? 1) + 1);
    expect(updated.versions?.length).toBeGreaterThan(0);
    await expect(patchArticleSession(created.id, created.revision ?? 1, { finalMarkdown: "stale" }, actor))
      .rejects.toBeInstanceOf(RevisionConflictError);
  });

  it("publishes locale-aware live paths for Vietnamese and English", async () => {
    const vi = await createArticleSession(completeArticle("publish-vi"), actor);
    const en = await createArticleSession(completeArticle("publish-en"), actor);
    await reviewGateArticle(vi.id, actor, new Date(Date.now() - 1000).toISOString());
    await reviewGateArticle(en.id, actor, new Date(Date.now() - 1000).toISOString());
    await runDuePublishJobs();
    expect((await readPublishedArticles("vi-vn")).find((item) => item.articleId === vi.id)?.livePath).toBe("/vi-vn/bitcoin-la-gi");
    expect((await readPublishedArticles("en-us")).find((item) => item.articleId === en.id)?.livePath).toBe("/en-us/what-is-bitcoin");
  });

  it("stores manual admin posts verbatim and publishes them immediately to reader", async () => {
    const title = `Bài thủ công ${crypto.randomUUID()}`;
    const content = "  Nội dung nhập tay từ admin.\n\nGiữ nguyên xuống dòng và khoảng trắng cuối.  ";
    const article = await createManualPublishedArticle({ title, content }, actor);

    expect(article.reviewStatus).toBe("published");
    expect(article.draft?.title).toBe(title);
    expect(article.draft?.markdown).toBe(content);
    expect(article.finalMarkdown).toBe(content);
    expect(article.livePath).toBeTruthy();

    const published = (await readPublishedArticles("vi-vn")).find((item) => item.articleId === article.id);
    expect(published?.title).toBe(title);
    expect(published?.markdown).toBe(content);
    expect(published?.livePath).toBe(article.livePath);

    const slug = article.livePath?.split("/").at(-1);
    expect(slug).toBeTruthy();
    expect((await readPublishedArticleBySlug("vi-vn", slug ?? ""))?.markdown).toBe(content);
  });

  it("stores manual scheduled posts without showing them to reader before the publish worker runs", async () => {
    const title = `Bài đặt lịch ${crypto.randomUUID()}`;
    const content = "Nội dung đặt lịch thủ công.";
    const publishAt = new Date(Date.now() - 1000).toISOString();
    const article = await createManualScheduledArticle({ title, content, publishAt }, actor);

    expect(article.reviewStatus).toBe("scheduled");
    expect(article.publishAt).toBe(publishAt);
    expect(article.publishedAt).toBeNull();
    expect(article.livePath).toBeNull();
    expect(article.draft?.title).toBe(title);
    expect(article.draft?.markdown).toBe(content);
    expect((await readPublishedArticles("vi-vn")).find((item) => item.articleId === article.id)).toBeUndefined();

    await runDuePublishJobs();
    const published = (await readPublishedArticles("vi-vn")).find((item) => item.articleId === article.id);
    expect(published?.title).toBe(title);
    expect(published?.markdown).toBe(content);
  });
});
