import { describe, expect, it } from "vitest";

import {
  applyInternalLinks,
  buildInternalLinkSuggestionsFromAnchorCandidates,
  buildInternalLinkMappingCsv,
  findAnchorTextCandidates,
  selectInternalLinkCandidatesForAnchorCandidates,
  mapAnchorCandidatesToInternalLinks,
  selectInternalLinkCandidates
} from "./factory.js";
import type { ArticleLibraryItem, Draft } from "./types.js";

const draft: Draft = {
  title: "Bitcoin basics",
  slug: "bitcoin-basics",
  excerpt: "Bitcoin and blockchain overview.",
  metaTitle: "Bitcoin basics",
  metaDescription: "Bitcoin and blockchain overview.",
  markdown: [
    "# Bitcoin basics",
    "",
    "Bitcoin uses blockchain to keep transactions verifiable.",
    "",
    "Risk management matters before using any exchange."
  ].join("\n")
};

function libraryItem(overrides: Partial<ArticleLibraryItem>): ArticleLibraryItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    revision: 1,
    createdAt: new Date().toISOString(),
    title: "Blockchain guide",
    url: "/en-us/blockchain-guide",
    language: "en",
    summary: "",
    keywords: [],
    ...overrides
  };
}

describe("internal link matching", () => {
  it("matches title-only library records without inventing URLs", () => {
    const suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(draft, "bitcoin", [], "en", [
      libraryItem({ title: "blockchain", url: "/en-us/blockchain" })
    ]);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.targetUrl).toBe("/en-us/blockchain");
    expect(suggestions[0]?.matchedKeyword).toBe("blockchain");
  });

  it("finds anchor candidates before reading the internal link library", () => {
    const content = "Proof of Stake changes how validators secure the network. Validator Rewards affect operator incentives.";
    const candidates = findAnchorTextCandidates("Ethereum staking guide", content, "en");

    expect(candidates[0]).toMatchObject({
      anchorText: "Proof of Stake",
      startOffset: 0,
      endOffset: 14,
      reason: {
        standaloneTopic: true,
        informationGap: true,
        learningValue: true,
        semanticClarity: true
      }
    });
    expect(candidates.some((candidate) => candidate.anchorText === "Validator Rewards")).toBe(true);
  });

  it("keeps anchor candidates when at least one anchor quality criterion passes", () => {
    const candidates = findAnchorTextCandidates("Layer 2 overview", "Solana launched a new scaling roadmap.", "en");

    expect(candidates).toContainEqual(expect.objectContaining({
      anchorText: "Solana",
      reason: expect.objectContaining({
        standaloneTopic: true,
        informationGap: false,
        learningValue: false,
        semanticClarity: false
      })
    }));
  });

  it("does not select a library URL when the anchor step did not qualify the term", () => {
    const marketCapDraft: Draft = {
      ...draft,
      title: "Market cap update",
      markdown: "Bitcoin has a market cap above many public companies."
    };
    const suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(marketCapDraft, "market cap", [], "en", [
      libraryItem({ title: "Bitcoin", url: "/en-us/bitcoin" })
    ]);

    expect(suggestions).toEqual([]);
  });

  it("ranks article matches by relevance, intent, and expectation", () => {
    const suggestions = mapAnchorCandidatesToInternalLinks(
      {
        ...draft,
        title: "Avalanche staking guide",
        markdown: "Proof of Stake lets validators secure the chain. Validator Rewards affect operator incentives."
      },
      "en",
      [
        libraryItem({
          id: "pos",
          title: "What Is Proof of Stake",
          url: "/what-is-proof-of-stake",
          summary: "Explains how Proof of Stake consensus works and why it matters.",
          keywords: ["proof of stake", "consensus"]
        }),
        libraryItem({
          id: "rewards",
          title: "How Validators Earn Rewards",
          url: "/validator-rewards",
          summary: "Explains validator rewards and staking incentives.",
          keywords: ["validator rewards", "staking incentives"]
        }),
        libraryItem({
          id: "staking",
          title: "What Is Staking",
          url: "/what-is-staking",
          summary: "Broad introduction to staking crypto assets.",
          keywords: ["staking"]
        })
      ],
      [{
        anchor: "Proof of Stake",
        sourceContext: "Proof of Stake lets validators secure the chain.",
        confidence: 95,
        reason: "Can stand alone as a topic and creates a useful information gap."
      }]
    );

    expect(suggestions[0]).toMatchObject({
      anchor: "Proof of Stake",
      targetArticleId: "pos",
      targetUrl: "/what-is-proof-of-stake",
      matchStatus: "matched"
    });
    expect(suggestions[0]?.matchScore).toBeGreaterThanOrEqual(0.75);
    expect(suggestions[0]?.relevanceScore).toBeGreaterThan(0);
    expect(suggestions[0]?.intentScore).toBeGreaterThan(0);
    expect(suggestions[0]?.expectationScore).toBeGreaterThan(0);
  });

  it("matches English anchors with stemming, fuzzy normalization, and semantic aliases", () => {
    const suggestions = mapAnchorCandidatesToInternalLinks(
      {
        ...draft,
        title: "Consensus guide",
        markdown: "PoS mechanism helps a staking-based consensus model avoid waste."
      },
      "en",
      [
        libraryItem({
          id: "pos",
          title: "Proof of Stake",
          url: "/proof-of-stake",
          summary: "Explains proof of stake, staking, and validator-based consensus.",
          keywords: ["proof-of-stake", "staking consensus"]
        })
      ],
      [{
        anchor: "PoS mechanism",
        sourceContext: "PoS mechanism helps a staking-based consensus model avoid waste.",
        confidence: 92,
        reason: "PoS is a standalone consensus topic."
      }]
    );

    expect(suggestions[0]).toMatchObject({
      targetArticleId: "pos",
      targetUrl: "/proof-of-stake"
    });
    expect(suggestions[0]?.matchScore).toBeGreaterThanOrEqual(0.75);
  });

  it("matches Vietnamese bridge anchors with Vietnamese normalization instead of English stemming", () => {
    const viDraft: Draft = {
      ...draft,
      title: "Hướng dẫn cross-chain",
      markdown: "Giải pháp cross-chain bridge giúp chuyển tài sản giữa các blockchain."
    };
    const suggestions = mapAnchorCandidatesToInternalLinks(
      viDraft,
      "vi",
      [
        libraryItem({
          id: "bridge",
          language: "vi",
          title: "Cầu nối blockchain",
          url: "/cau-noi-blockchain",
          summary: "Giải thích bridge giữa các blockchain và rủi ro khi chuyển tài sản cross-chain.",
          keywords: ["cầu nối blockchain", "blockchain bridge", "cross-chain bridge"]
        })
      ],
      [{
        anchor: "cross-chain bridge",
        sourceContext: "Giải pháp cross-chain bridge giúp chuyển tài sản giữa các blockchain.",
        confidence: 91,
        reason: "Bridge is a standalone cross-chain topic."
      }]
    );

    expect(suggestions[0]).toMatchObject({
      targetArticleId: "bridge",
      targetUrl: "/cau-noi-blockchain"
    });
  });

  it("uses article titles as optional link knowledge when keywords are empty", () => {
    const viDraft: Draft = {
      ...draft,
      title: "Altcoin season",
      markdown: "Nhà đầu tư thường theo dõi altcoin tăng giá để nhận biết dòng tiền đang quay lại thị trường."
    };
    const suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(
      viDraft,
      "altcoin season",
      [],
      "vi",
      [
        libraryItem({
          id: "altcoin-signs",
          language: "vi",
          title: "5 dấu hiệu trước khi altcoin tăng giá",
          url: "https://coinminutes.com/vi-vn/dau-hieu-altcoin-tang-gia.html",
          summary: "",
          keywords: []
        })
      ]
    );

    expect(suggestions[0]).toMatchObject({
      anchor: "altcoin tăng giá",
      targetArticleId: "altcoin-signs",
      targetUrl: "https://coinminutes.com/vi-vn/dau-hieu-altcoin-tang-gia.html",
      matchStatus: "matched"
    });
  });

  it("caps and distributes internal links across paragraphs without repeating destination URLs", () => {
    const shortDraft: Draft = {
      ...draft,
      title: "Crypto concepts",
      markdown: [
        "Proof of Stake explains validator incentives.",
        "",
        "Blockchain scalability affects transaction throughput.",
        "",
        "Cross-chain interoperability depends on bridge design.",
        "",
        "Smart contract security reduces exploit risk."
      ].join("\n")
    };
    const suggestions = mapAnchorCandidatesToInternalLinks(
      shortDraft,
      "en",
      [
        libraryItem({ id: "pos", title: "Proof of Stake", url: "/proof-of-stake", summary: "Proof of Stake consensus.", keywords: ["proof of stake"] }),
        libraryItem({ id: "scale", title: "Blockchain Scalability", url: "/blockchain-scalability", summary: "Blockchain scalability and throughput.", keywords: ["blockchain scalability"] }),
        libraryItem({ id: "bridge", title: "Cross-chain Interoperability", url: "/cross-chain-interoperability", summary: "Cross-chain interoperability and bridge design.", keywords: ["cross-chain interoperability", "bridge"] }),
        libraryItem({ id: "security", title: "Smart Contract Security", url: "/smart-contract-security", summary: "Smart contract security risk.", keywords: ["smart contract security"] }),
        libraryItem({ id: "duplicate", title: "Proof of Stake Guide", url: "/proof-of-stake", summary: "Duplicate Proof of Stake destination.", keywords: ["proof of stake guide"] })
      ],
      [
        { anchor: "Proof of Stake", sourceContext: "Proof of Stake explains validator incentives.", confidence: 95 },
        { anchor: "Blockchain scalability", sourceContext: "Blockchain scalability affects transaction throughput.", confidence: 94 },
        { anchor: "Cross-chain interoperability", sourceContext: "Cross-chain interoperability depends on bridge design.", confidence: 93 },
        { anchor: "Smart contract security", sourceContext: "Smart contract security reduces exploit risk.", confidence: 92 },
        { anchor: "Proof of Stake Guide", sourceContext: "Proof of Stake explains validator incentives.", confidence: 91 }
      ]
    );

    expect(suggestions).toHaveLength(3);
    expect(new Set(suggestions.map((suggestion) => suggestion.targetUrl)).size).toBe(suggestions.length);
    expect(suggestions.map((suggestion) => suggestion.anchor)).toEqual([
      "Proof of Stake",
      "Blockchain scalability",
      "Cross-chain interoperability"
    ]);
  });

  it("exports a CSV audit mapping for matched suggestions", () => {
    const csv = buildInternalLinkMappingCsv("Avalanche (AVAX)", [{
      id: "pos-proof-of-stake",
      sourceContext: "Proof of Stake lets validators secure the chain.",
      anchor: "Proof of Stake",
      targetArticleId: "pos",
      targetTitle: "What Is Proof of Stake",
      targetUrl: "/what-is-proof-of-stake",
      matchedKeyword: "Proof of Stake",
      matchStatus: "matched",
      reason: "Relevant next step.",
      confidence: 95,
      matchScore: 0.93,
      relevanceScore: 0.95,
      intentScore: 0.88,
      expectationScore: 0.9,
      status: "accepted"
    }]);

    expect(csv).toContain("article_title,anchor_text,target_title,target_url,match_score");
    expect(csv).toContain("\"Avalanche (AVAX)\",\"Proof of Stake\",\"What Is Proof of Stake\",\"/what-is-proof-of-stake\",\"0.93\"");
  });

  it("filters large libraries to relevant candidates first", () => {
    const candidates = selectInternalLinkCandidates(draft, "bitcoin", [], [
      libraryItem({ id: "unrelated", title: "Content calendar", url: "/en-us/content-calendar" }),
      libraryItem({ id: "relevant", title: "blockchain", url: "/en-us/blockchain" })
    ], 1);

    expect(candidates.map((candidate) => candidate.id)).toEqual(["relevant"]);
  });

  it("retrieves candidate articles from detected anchors instead of only focus keywords", () => {
    const candidates = selectInternalLinkCandidatesForAnchorCandidates(
      {
        ...draft,
        title: "Bitcoin article",
        markdown: "Proof of Stake lets validators earn rewards without mining."
      },
      "en",
      [
        libraryItem({ id: "bitcoin", title: "Bitcoin market update", url: "/bitcoin-market" }),
        libraryItem({
          id: "validator-rewards",
          title: "How Validators Earn Rewards",
          url: "/validator-rewards",
          summary: "Explains validator rewards and staking incentives.",
          keywords: []
        })
      ],
      [{
        anchorText: "Validator Rewards",
        startOffset: 31,
        endOffset: 48,
        confidence: 0.9,
        reason: {
          standaloneTopic: true,
          informationGap: true,
          learningValue: true,
          semanticClarity: true
        }
      }],
      1
    );

    expect(candidates.map((candidate) => candidate.id)).toEqual(["validator-rewards"]);
  });

  it("applies only accepted links once", () => {
    const markdown = applyInternalLinks(draft.markdown, [
      {
        id: "accepted",
        sourceContext: "Bitcoin uses blockchain.",
        anchor: "blockchain",
        targetTitle: "Blockchain",
        targetUrl: "/en-us/blockchain",
        matchedKeyword: "blockchain",
        matchStatus: "matched",
        reason: "Relevant",
        confidence: 95,
        status: "accepted"
      },
      {
        id: "duplicate",
        sourceContext: "Bitcoin uses blockchain.",
        anchor: "blockchain",
        targetTitle: "Blockchain",
        targetUrl: "/en-us/blockchain",
        matchedKeyword: "blockchain",
        matchStatus: "matched",
        reason: "Duplicate",
        confidence: 80,
        status: "accepted"
      },
      {
        id: "rejected",
        sourceContext: "Risk management matters.",
        anchor: "Risk management",
        targetTitle: "Risk",
        targetUrl: "/en-us/risk",
        matchedKeyword: "Risk management",
        matchStatus: "matched",
        reason: "Rejected",
        confidence: 80,
        status: "rejected"
      }
    ]);

    expect(markdown.match(/\]\(\/en-us\/blockchain\)/g)).toHaveLength(1);
    expect(markdown).not.toContain("/en-us/risk");
  });
});
