import { beforeAll, describe, expect, it } from "vitest";

import { ensureAuthBootstrap } from "./auth-store.js";
import { queryFirst } from "./database.js";
import {
  createArticleSession,
  patchArticleSession,
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
    const row = await queryFirst<{ count: number; must_change_password: number }>(`
      SELECT COUNT(*) AS count, must_change_password
      FROM users
      WHERE role = 'super_admin'
    `);
    expect(Number(row?.count)).toBe(1);
    expect(Number(row?.must_change_password)).toBe(0);
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
});
