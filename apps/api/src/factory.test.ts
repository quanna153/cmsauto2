import { describe, expect, it } from "vitest";

import {
  applyInternalLinks,
  buildKeywordMatchedLibrarySuggestions,
  buildInternalLinkSuggestionsFromAnchorCandidates,
  buildInternalLinkMappingCsv,
  findAnchorTextCandidates,
  formatAnchorCandidatesForPrompt,
  selectInternalLinkCandidatesForAnchorCandidates,
  mapAnchorCandidatesToInternalLinks,
  mapSelectedInternalLinkTargetsToSuggestions,
  retrieveInternalLinkArticles,
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

function normalizeTestText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

describe("internal link matching", () => {
  it("lists library links whose keywords, titles, or URLs match the current article keywords", () => {
    const suggestions = buildKeywordMatchedLibrarySuggestions("bitcoin mining", ["blockchain"], "en", [
      libraryItem({
        id: "bitcoin",
        title: "Inside Bitcoin",
        url: "/en-us/inside-bitcoin",
        keywords: ["bitcoin"]
      }),
      libraryItem({
        id: "blockchain",
        title: "Technology guide",
        url: "/en-us/blockchain-guide",
        keywords: []
      }),
      libraryItem({
        id: "unmatched",
        title: "Risk management",
        url: "/en-us/risk-management",
        keywords: []
      })
    ]);

    expect(suggestions.map((suggestion) => suggestion.targetArticleId)).toEqual(["bitcoin", "blockchain"]);
    expect(suggestions.map((suggestion) => suggestion.matchedKeyword)).toEqual(["bitcoin mining", "blockchain"]);
    expect(suggestions.every((suggestion) => suggestion.status === "pending")).toBe(true);
  });

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
        informationGap: true,
        learningValue: true,
        semanticClarity: true
      })
    }));
  });

  it("does not create anchor candidates across sentence boundaries", () => {
    const suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(
      {
        ...draft,
        title: "Altcoin guide",
        markdown: "Cẩm nang Altcoin toàn diện. Năm 2026, quản trị rủi ro vẫn là ưu tiên."
      },
      "altcoin",
      [],
      "vi",
      [
        libraryItem({
          id: "altcoin-guide",
          title: "Cẩm nang Altcoin toàn diện và những Narrative tiềm năng nhất năm 2026",
          url: "/vi-vn/cam-nang-altcoin.html",
          language: "vi"
        })
      ]
    );

    expect(suggestions.some((suggestion) => suggestion.anchor.includes(". "))).toBe(false);
  });

  it("does not link the draft main topic identified from the title", () => {
    const tokenomicsDraft: Draft = {
      ...draft,
      title: "Tokenomics là gì? Hướng dẫn phân tích Tokenomics nhận biết dự án tiềm năng",
      markdown: "Tokenomics giúp nhà đầu tư đánh giá cung cầu token. Quản trị rủi ro vẫn là bước quan trọng."
    };
    const suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(tokenomicsDraft, "tokenomics", [], "vi", [
      libraryItem({
        id: "tokenomics",
        title: "Tokenomics là gì? Phân tích tiềm năng dự án tiền mã hóa",
        url: "/vi-vn/huong-dan-phan-tich-tokenomics.html",
        language: "vi"
      }),
      libraryItem({
        id: "risk",
        title: "Quản trị rủi ro khi đầu tư crypto",
        url: "/vi-vn/quan-tri-rui-ro.html",
        language: "vi"
      })
    ]);

    expect(suggestions.some((suggestion) => suggestion.anchor.toLowerCase() === "tokenomics")).toBe(false);
  });

  it("does not select broad overview articles for the draft main topic", () => {
    const avalancheDraft: Draft = {
      ...draft,
      title: "Avalanche Subnet là gì? Cách hoạt động và vai trò trong hệ sinh thái AVAX",
      markdown: "Avalanche Subnet giúp các dự án tạo blockchain riêng với bộ validator và logic vận hành riêng."
    };
    const suggestions = mapSelectedInternalLinkTargetsToSuggestions(
      avalancheDraft,
      "vi",
      [
        libraryItem({
          id: "avalanche-overview",
          title: "Tổng hợp kiến thức Avalanche AVAX nền tảng blockchain vượt trội",
          url: "/vi-vn/toan-tap-ve-avalanche-va-avax.html",
          language: "vi"
        })
      ],
      [{
        anchor: "Avalanche Subnet",
        targetUrl: "/vi-vn/toan-tap-ve-avalanche-va-avax.html",
        confidence: 0.85,
        reason: "Selected by AI."
      }]
    );

    expect(suggestions).toHaveLength(0);
  });

  it("does not promote awkward library title fragments into anchors", () => {
    const viDraft: Draft = {
      ...draft,
      title: "Hướng dẫn đầu tư crypto",
      markdown: "Phân tích phần rủi ro giúp nhà đầu tư hiểu rõ hơn trước khi xuống tiền."
    };
    const suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(viDraft, "crypto", [], "vi", [
      libraryItem({
        id: "market-analysis",
        title: "Phân Tích Thị Trường Crypto - Dữ Liệu và Chiến Lược Đầu Tư",
        url: "/vi-vn/phan-tich-thi-truong-crypto",
        language: "vi"
      })
    ]);

    expect(suggestions.some((suggestion) => normalizeTestText(suggestion.anchor) === "phan tich phan")).toBe(false);
  });

  it("does not accept weak AI-selected anchor fragments", () => {
    const viDraft: Draft = {
      ...draft,
      title: "Bảo mật dữ liệu trong crypto",
      markdown: "Việc bảo vệ dữ liệu người dùng là điều cần thiết khi xây dựng sản phẩm tài chính."
    };
    const suggestions = mapSelectedInternalLinkTargetsToSuggestions(
      viDraft,
      "vi",
      [
        libraryItem({
          id: "privacy",
          title: "Chính Sách Bảo Mật Dữ Liệu Người Dùng - CoinMinutes",
          url: "/vi-vn/chinh-sach-bao-mat",
          language: "vi"
        })
      ],
      [{
        anchor: "liệu người dùng",
        targetUrl: "/vi-vn/chinh-sach-bao-mat",
        confidence: 0.99,
        reason: "Selected by AI."
      }]
    );

    expect(suggestions).toHaveLength(0);
  });

  it("does not accept descriptive clauses as anchor candidates", () => {
    const viDraft: Draft = {
      ...draft,
      title: "DeFi là gì? Hướng dẫn cho người mới",
      markdown: "Blockchain là nền tảng cốt lõi của DeFi. Vai trò của Blockchain trong DeFi vẫn rất quan trọng."
    };
    const suggestions = mapSelectedInternalLinkTargetsToSuggestions(
      viDraft,
      "vi",
      [
        libraryItem({
          id: "avalanche-overview",
          title: "Tổng hợp kiến thức Avalanche AVAX nền tảng blockchain vượt trội",
          url: "/vi-vn/toan-tap-ve-avalanche-va-avax.html",
          language: "vi"
        })
      ],
      [{
        anchor: "Blockchain là nền tảng",
        targetUrl: "/vi-vn/toan-tap-ve-avalanche-va-avax.html",
        confidence: 0.99,
        reason: "Selected by AI."
      }]
    );

    expect(suggestions).toHaveLength(0);
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

  it("retrieves a small BM25 candidate set from title-only library records before ranking", () => {
    const library = Array.from({ length: 40 }, (_, index) =>
      libraryItem({
        id: `noise-${index}`,
        title: `General market update ${index}`,
        url: `/market-update-${index}`,
        keywords: []
      })
    );
    const target = libraryItem({
      id: "pos",
      title: "Proof of Stake",
      url: "/proof-of-stake",
      keywords: []
    });
    const retrieved = retrieveInternalLinkArticles(
      "proof-of-stake system",
      "The proof-of-stake system changes validator incentives.",
      "en",
      [...library, target],
      10
    );

    expect(retrieved.length).toBeLessThanOrEqual(10);
    expect(retrieved.length).toBeGreaterThan(0);
    expect(retrieved[0]).toMatchObject({
      id: "pos",
      url: "/proof-of-stake"
    });
  });

  it("keeps retrieval language-scoped and supports Vietnamese diacritic-insensitive matching", () => {
    const retrieved = retrieveInternalLinkArticles(
      "phi giao dich gas",
      "Phí giao dịch gas tăng khi mạng lưới đông người dùng.",
      "vi",
      [
        libraryItem({
          id: "en-gas",
          language: "en",
          title: "Gas Fees",
          url: "/gas-fees",
          keywords: ["gas fees"]
        }),
        libraryItem({
          id: "vi-gas",
          language: "vi",
          title: "Phí gas",
          url: "/vi-vn/phi-gas",
          keywords: []
        })
      ],
      10
    );

    expect(retrieved).toHaveLength(1);
    expect(retrieved[0]).toMatchObject({
      id: "vi-gas",
      url: "/vi-vn/phi-gas"
    });
  });

  it("widens retrieval with semantic context when the title is not a direct lexical anchor match", () => {
    const retrieved = retrieveInternalLinkArticles(
      "đầu cơ",
      "Nhà đầu tư cần đọc tín hiệu mùa altcoin, phân bổ vốn và quản lý rủi ro trước khi đầu cơ.",
      "vi",
      [
        libraryItem({
          id: "noise",
          language: "vi",
          title: "Lịch kinh tế tuần này",
          url: "/vi-vn/lich-kinh-te",
          keywords: []
        }),
        libraryItem({
          id: "altcoin-season",
          language: "vi",
          title: "Mùa Altcoin là gì? Dấu hiệu Altcoin Season và cơ hội đầu tư",
          url: "/vi-vn/mua-altcoin-la-gi-dau-hieu-va-co-hoi-dau-tu.html",
          keywords: []
        })
      ],
      10
    );

    expect(retrieved[0]).toMatchObject({
      id: "altcoin-season",
      url: "/vi-vn/mua-altcoin-la-gi-dau-hieu-va-co-hoi-dau-tu.html"
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

  it("does not select heading text as internal link anchors", () => {
    const headingOnlyDraft: Draft = {
      ...draft,
      title: "Consensus",
      markdown: [
        "## Proof of Stake",
        "",
        "This section explains how validators secure the chain."
      ].join("\n")
    };
    const candidates = findAnchorTextCandidates(headingOnlyDraft.title, headingOnlyDraft.markdown, "en");
    const suggestions = buildInternalLinkSuggestionsFromAnchorCandidates(
      headingOnlyDraft,
      "consensus",
      [],
      "en",
      [
        libraryItem({
          id: "pos",
          title: "Proof of Stake",
          url: "/proof-of-stake",
          keywords: ["proof of stake"]
        })
      ]
    );

    expect(candidates.map((candidate) => candidate.anchorText)).not.toContain("Proof of Stake");
    expect(suggestions).toHaveLength(0);
  });

  it("keeps a larger anchor candidate pool for matcher filtering", () => {
    const content = [
      "Proof of Stake creates validator incentives.",
      "Validator Rewards affect staking economics.",
      "Blockchain Scalability changes transaction throughput.",
      "Cross-chain Interoperability depends on bridges.",
      "Smart Contract Security lowers exploit risk.",
      "Tokenomics helps readers evaluate supply design.",
      "Governance lets communities change protocol rules.",
      "Rollups improve layer two scaling.",
      "Subnets support application-specific networks.",
      "Bridge Security protects transferred assets.",
      "Consensus Mechanisms explain finality tradeoffs.",
      "Validator Staking changes operator incentives."
    ].join("\n\n");
    const candidates = findAnchorTextCandidates("Crypto concepts", content, "en");

    expect(candidates.length).toBeGreaterThan(8);
    expect(candidates.length).toBeLessThanOrEqual(14);
  });

  it("formats compact anchor contexts for AI target selection", () => {
    const articleContent = [
      "Proof of Stake creates validator incentives.",
      "",
      "Unrelated background paragraph that should not be needed for target selection."
    ].join("\n");
    const [candidate] = findAnchorTextCandidates("Crypto concepts", articleContent, "en");
    const promptContext = formatAnchorCandidatesForPrompt(articleContent, "en", candidate ? [candidate] : []);

    expect(promptContext).toContain("anchorText: Proof of Stake");
    expect(promptContext).toContain("sourceContext: Proof of Stake creates validator incentives.");
    expect(promptContext).not.toContain("Unrelated background paragraph");
  });

  it("does not apply accepted internal links inside headings or append heading-only anchors", () => {
    const markdown = applyInternalLinks([
      "# Blockchain Scalability",
      "",
      "This paragraph discusses throughput and fees."
    ].join("\n"), [{
      id: "scale",
      sourceContext: "Blockchain Scalability",
      anchor: "Blockchain Scalability",
      targetTitle: "Blockchain Scalability",
      targetUrl: "/blockchain-scalability",
      matchedKeyword: "Blockchain Scalability",
      matchStatus: "matched",
      reason: "Relevant",
      confidence: 95,
      status: "accepted"
    }]);

    expect(markdown).toContain("# Blockchain Scalability");
    expect(markdown).not.toContain("](/blockchain-scalability)");
    expect(markdown).not.toContain("Xem");
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

  it("can return six suitable links for medium-length drafts after matcher filtering", () => {
    const mediumDraft: Draft = {
      ...draft,
      title: "Crypto education guide",
      markdown: [
        "Proof of Stake explains validator incentives.",
        "",
        "Blockchain scalability affects transaction throughput.",
        "",
        "Cross-chain interoperability depends on bridge design.",
        "",
        "Smart contract security reduces exploit risk.",
        "",
        "Tokenomics helps readers evaluate supply design.",
        "",
        "Governance lets communities change protocol rules.",
        "",
        Array.from({ length: 820 }, () => "context").join(" ")
      ].join("\n")
    };
    const suggestions = mapAnchorCandidatesToInternalLinks(
      mediumDraft,
      "en",
      [
        libraryItem({ id: "pos", title: "Proof of Stake", url: "/proof-of-stake", keywords: ["proof of stake"] }),
        libraryItem({ id: "scale", title: "Blockchain Scalability", url: "/blockchain-scalability", keywords: ["blockchain scalability"] }),
        libraryItem({ id: "bridge", title: "Cross-chain Interoperability", url: "/cross-chain-interoperability", keywords: ["cross-chain interoperability"] }),
        libraryItem({ id: "security", title: "Smart Contract Security", url: "/smart-contract-security", keywords: ["smart contract security"] }),
        libraryItem({ id: "tokenomics", title: "Tokenomics", url: "/tokenomics", keywords: ["tokenomics"] }),
        libraryItem({ id: "governance", title: "Governance", url: "/governance", keywords: ["governance"] })
      ],
      [
        { anchor: "Proof of Stake", sourceContext: "Proof of Stake explains validator incentives.", confidence: 95 },
        { anchor: "Blockchain scalability", sourceContext: "Blockchain scalability affects transaction throughput.", confidence: 94 },
        { anchor: "Cross-chain interoperability", sourceContext: "Cross-chain interoperability depends on bridge design.", confidence: 93 },
        { anchor: "Smart contract security", sourceContext: "Smart contract security reduces exploit risk.", confidence: 92 },
        { anchor: "Tokenomics", sourceContext: "Tokenomics helps readers evaluate supply design.", confidence: 91 },
        { anchor: "Governance", sourceContext: "Governance lets communities change protocol rules.", confidence: 90 }
      ]
    );

    expect(suggestions).toHaveLength(6);
    expect(new Set(suggestions.map((suggestion) => suggestion.targetUrl)).size).toBe(6);
  });

  it("avoids previously rejected URLs for the same anchor when regenerating links", () => {
    const suggestions = mapAnchorCandidatesToInternalLinks(
      {
        ...draft,
        title: "Blockchain guide",
        markdown: "Blockchain helps readers understand verifiable transactions."
      },
      "en",
      [
        libraryItem({
          id: "rejected",
          title: "Blockchain Basics",
          url: "/blockchain-basics",
          keywords: ["blockchain"]
        }),
        libraryItem({
          id: "alternative",
          title: "Verifiable Blockchain Transactions",
          url: "/verifiable-blockchain-transactions",
          keywords: ["blockchain transactions"]
        })
      ],
      [{
        anchor: "Blockchain",
        sourceContext: "Blockchain helps readers understand verifiable transactions.",
        confidence: 95
      }],
      [{
        id: "rejected-blockchain",
        sourceContext: "Blockchain helps readers understand verifiable transactions.",
        anchor: "Blockchain",
        targetArticleId: "rejected",
        targetTitle: "Blockchain Basics",
        targetUrl: "/blockchain-basics",
        matchedKeyword: "Blockchain",
        matchStatus: "matched",
        reason: "Rejected by editor.",
        confidence: 95,
        matchScore: 0.95,
        relevanceScore: 0.95,
        intentScore: 0.95,
        expectationScore: 0.95,
        status: "rejected"
      }]
    );

    expect(suggestions[0]).toMatchObject({
      anchor: "Blockchain",
      targetArticleId: "alternative",
      targetUrl: "/verifiable-blockchain-transactions"
    });
  });

  it("maps AI-selected internal link targets only when target URL is in the prefiltered candidate set", () => {
    const suggestions = mapSelectedInternalLinkTargetsToSuggestions(
      {
        ...draft,
        title: "Consensus guide",
        markdown: "Proof of Stake helps readers understand validator incentives."
      },
      "en",
      [
        libraryItem({
          id: "pos",
          title: "Proof of Stake",
          url: "/proof-of-stake",
          keywords: ["proof of stake"]
        })
      ],
      [
        {
          anchor: "Proof of Stake",
          targetUrl: "/proof-of-stake",
          confidence: 0.95,
          reason: "Best candidate for the concept."
        },
        {
          anchor: "validator incentives",
          targetUrl: "/not-in-candidate-list",
          confidence: 0.9,
          reason: "Invalid target should be ignored."
        }
      ]
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      anchor: "Proof of Stake",
      targetArticleId: "pos",
      targetUrl: "/proof-of-stake"
    });
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

  it("applies a link at the selected source context when an anchor appears more than once", () => {
    const markdown = applyInternalLinks([
      "Proof of Stake appears in the introduction.",
      "",
      "This selected paragraph explains how Proof of Stake works."
    ].join("\n"), [{
      id: "proof-of-stake-selected-position",
      sourceContext: "This selected paragraph explains how Proof of Stake works.",
      anchor: "Proof of Stake",
      targetTitle: "Proof of Stake guide",
      targetUrl: "/en-us/proof-of-stake-guide",
      matchedKeyword: "Proof of Stake",
      matchStatus: "matched",
      reason: "Selected position",
      confidence: 99,
      status: "accepted"
    }]);

    expect(markdown).toContain("Proof of Stake appears in the introduction.");
    expect(markdown).toContain("This selected paragraph explains how [Proof of Stake](/en-us/proof-of-stake-guide) works.");
    expect(markdown).not.toContain("[Proof of Stake](/en-us/proof-of-stake-guide) appears in the introduction.");
  });

  it("does not insert internal links inside another word", () => {
    const markdown = applyInternalLinks([
      "Việc nắm bắt giá coin hôm nay rất quan trọng.",
      "",
      "Biến động 24h cho thấy sức khỏe thị trường."
    ].join("\n"), [
      {
        id: "coin-h",
        sourceContext: "giá coin hôm nay",
        anchor: "Coin H",
        targetTitle: "Entry trong coin",
        targetUrl: "/vi-vn/entry-trong-coin.html",
        matchedKeyword: "Coin H",
        matchStatus: "matched",
        reason: "Bad partial anchor.",
        confidence: 99,
        status: "accepted"
      },
      {
        id: "bi",
        sourceContext: "Biến động 24h",
        anchor: "Bi",
        targetTitle: "Bí kíp",
        targetUrl: "/vi-vn/bi-kip.html",
        matchedKeyword: "Bi",
        matchStatus: "matched",
        reason: "Bad partial anchor.",
        confidence: 99,
        status: "accepted"
      }
    ]);

    expect(markdown).toBe([
      "Việc nắm bắt giá coin hôm nay rất quan trọng.",
      "",
      "Biến động 24h cho thấy sức khỏe thị trường."
    ].join("\n"));
  });
});
