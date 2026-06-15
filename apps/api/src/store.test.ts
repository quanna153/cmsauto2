import { beforeAll, describe, expect, it } from "vitest";

import { ensureAuthBootstrap } from "./auth-store.js";
import { queryFirst } from "./database.js";
import {
  createArticleSession,
  importArticleLibraryItems,
  patchArticleSession,
  readArticleLibrary,
  readArticleSessions,
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

  it("keeps the requested publish time when review gate needs fixes", async () => {
    const article = completeArticle(`needs-fix-schedule-${crypto.randomUUID()}`);
    const shortMarkdown = "Nội dung quá ngắn để pass review gate.";
    article.finalMarkdown = shortMarkdown;
    article.draft = article.draft ? { ...article.draft, markdown: shortMarkdown } : article.draft;
    const created = await createArticleSession(article, actor);
    const requestedPublishAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();

    const reviewed = await reviewGateArticle(created.id, actor, requestedPublishAt);
    const persisted = (await readArticleSessions(actor)).find((item) => item.id === created.id);

    expect(reviewed.article.reviewStatus).toBe("needs_fix");
    expect(reviewed.publishJob).toBeNull();
    expect(reviewed.article.publishAt).toBe(requestedPublishAt);
    expect(persisted?.publishAt).toBe(requestedPublishAt);
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

  it("accepts primary keyword wording when AI inserts an acronym inside the phrase", async () => {
    const now = new Date().toISOString();
    const id = `publish-keyword-normalized-en-${crypto.randomUUID()}`;
    const markdown = [
      "# Proof of Stake (PoS) Explained: A Practical Guide",
      "",
      "Proof of Stake (PoS) Explained gives readers a clear view of blockchain consensus, staking, validator incentives, and network security.",
      "Validators lock collateral, propose blocks, and earn rewards when they follow the protocol rules.",
      "This guide compares proof of stake with proof of work and explains where smart contract platforms use staking today.",
      "",
      "Read more about [blockchain consensus](/en-us/blockchain-consensus).",
      "",
      "Proof of Stake (PoS) Explained helps teams evaluate energy use, finality, slashing, governance, and decentralization tradeoffs. ".repeat(35)
    ].join("\n");
    const article: ArticleSessionSnapshot = {
      id,
      revision: 1,
      createdAt: now,
      updatedAt: now,
      inputs: { language: "en", seedKeyword: "proof of stake explained" },
      activeStep: "ready",
      keywordIdeas: [
        { id: "primary", keyword: "proof of stake explained", intent: "informational", cluster: "seed", monthlyVolume: 100, provider: "test", checkedAt: now, status: "verified" },
        { id: "secondary", keyword: "blockchain consensus", intent: "informational", cluster: "definition", monthlyVolume: 50, provider: "test", checkedAt: now, status: "verified" }
      ],
      primaryKeywordId: "primary",
      secondaryKeywordIds: ["secondary"],
      brief: { searchIntent: "Learn proof of stake", angle: "Explain PoS clearly", semanticTopics: ["staking"], candidateFaqs: ["How does proof of stake work?"] },
      outline: { title: "Proof of Stake Explained", introDirection: "Practical intro", sections: [{ heading: "What is PoS", bullets: ["Definition"] }] },
      draft: {
        title: "Proof of Stake (PoS) Explained: A Practical Guide",
        slug: `proof-of-stake-pos-explained-${id}`,
        excerpt: "Proof of Stake (PoS) Explained for readers comparing consensus mechanisms.",
        metaTitle: "Proof of Stake (PoS) Explained",
        metaDescription: "Proof of Stake (PoS) Explained with validator incentives, risks, and blockchain consensus context.",
        markdown
      },
      linkSuggestions: [{
        id: "link-1",
        sourceContext: "Read more about blockchain consensus.",
        anchor: "blockchain consensus",
        targetTitle: "Blockchain Consensus",
        targetUrl: "/en-us/blockchain-consensus",
        matchedKeyword: "blockchain consensus",
        matchStatus: "matched",
        reason: "Adds context for consensus mechanisms.",
        confidence: 94,
        status: "accepted"
      }],
      finalMarkdown: markdown
    };

    await createArticleSession(article, actor);
    const reviewed = await reviewGateArticle(id, actor, new Date(Date.now() - 1000).toISOString());
    expect(reviewed.article.reviewStatus).toBe("scheduled");
    await runDuePublishJobs();
    expect((await readPublishedArticles("en-us")).find((item) => item.articleId === id)?.livePath).toBe(`/en-us/proof-of-stake-pos-explained-${id}`);
  });

  it("imports default English article library URLs without an /en-us/ prefix", async () => {
    const url = `/what-is-proof-of-stake-${crypto.randomUUID()}`;
    const result = await importArticleLibraryItems([{
      title: "What Is Proof of Stake",
      url,
      keywords: []
    }]);

    expect(result.skipped).toBe(0);
    expect(result.created).toBe(1);
    const imported = (await readArticleLibrary("en")).find((item) => item.url === url);
    expect(imported).toMatchObject({
      title: "What Is Proof of Stake",
      language: "en",
      url
    });
  });
});
