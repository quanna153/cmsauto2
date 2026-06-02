import type { ArticleLibraryItem, Brief, Draft, InternalLinkSuggestion, KeywordIdea, Language, Outline } from "./types.js";

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findFirstMatchingAnchor(markdown: string, candidates: string[]) {
  const lower = markdown.toLowerCase();
  return candidates.find((candidate) => lower.includes(candidate.toLowerCase())) ?? null;
}

function extractSourceContext(markdown: string, anchor: string) {
  const blocks = markdown.split(/\n\s*\n/);
  const match = blocks.find((block) => block.toLowerCase().includes(anchor.toLowerCase()));
  return match?.trim().slice(0, 220) ?? "";
}

function normalizeComparable(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function anchorMatchesKeyword(anchor: string, keyword: string) {
  const normalizedAnchor = normalizeComparable(anchor);
  const normalizedKeyword = normalizeComparable(keyword);

  if (!normalizedAnchor || !normalizedKeyword) {
    return false;
  }

  return normalizedAnchor === normalizedKeyword
    || normalizedAnchor.includes(normalizedKeyword)
    || normalizedKeyword.includes(normalizedAnchor);
}

export type InternalLinkAnchorCandidate = {
  anchor: string;
  sourceContext?: string;
  reason?: string;
  confidence?: number;
};

export function mapAnchorCandidatesToInternalLinks(
  draft: Draft,
  language: Language,
  articleLibrary: ArticleLibraryItem[],
  candidates: InternalLinkAnchorCandidate[]
) {
  const mapped = candidates
    .map((candidate) => {
      const anchor = candidate.anchor.trim();
      if (!anchor) {
        return null;
      }

      const bestMatch = articleLibrary
        .map((article) => {
          const matchedKeyword = article.keywords
            .filter((keyword) => anchorMatchesKeyword(anchor, keyword))
            .sort((left, right) => right.length - left.length)[0];

          if (!matchedKeyword) {
            return null;
          }

          return {
            article,
            matchedKeyword
          };
        })
        .filter((entry): entry is { article: ArticleLibraryItem; matchedKeyword: string } => Boolean(entry))
        .sort((left, right) => right.matchedKeyword.length - left.matchedKeyword.length)[0];

      const sourceContext = candidate.sourceContext?.trim() || extractSourceContext(draft.markdown, anchor);

      if (!bestMatch) {
        return {
          id: `unmatched-${slugify(anchor)}`,
          sourceContext: sourceContext || (
            language === "en"
              ? `The draft mentions "${anchor}", but no internal article label matches it yet.`
              : `Bản nháp có nhắc tới "${anchor}", nhưng chưa có nhãn bài nào trong kho khớp với cụm này.`
          ),
          anchor,
          targetTitle: "",
          targetUrl: "",
          matchedKeyword: null,
          matchStatus: "unmatched" as const,
          reason: candidate.reason?.trim() || (
            language === "en"
              ? `No matching keyword label was found in the current internal link library.`
              : `Chưa tìm thấy nhãn từ khóa nào khớp trong kho link nội bộ hiện tại.`
          ),
          confidence: Math.max(50, Math.min(99, Math.round(candidate.confidence ?? 78))),
          status: "pending" as const
        };
      }

      return {
        id: `${bestMatch.article.id}-${slugify(anchor)}`,
        sourceContext: sourceContext || (
          language === "en"
            ? `The draft already mentions "${anchor}", which matches an internal article label.`
            : `Bản nháp đã nhắc tới "${anchor}", và cụm này khớp với nhãn của một bài trong kho.`
        ),
        anchor,
        targetTitle: bestMatch.article.title,
        targetUrl: bestMatch.article.url,
        matchedKeyword: bestMatch.matchedKeyword,
        matchStatus: "matched" as const,
        reason: candidate.reason?.trim() || (
          language === "en"
            ? `Anchor matched the saved label "${bestMatch.matchedKeyword}" in the internal library.`
            : `Anchor khớp với nhãn đã lưu "${bestMatch.matchedKeyword}" trong kho nội bộ.`
        ),
        confidence: Math.max(70, Math.min(99, Math.round(candidate.confidence ?? 88))),
        status: "accepted" as const
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((suggestion, index, collection) =>
      collection.findIndex((item) => item.anchor.toLowerCase() === suggestion.anchor.toLowerCase()) === index
    )
    .slice(0, 5);

  return mapped;
}

export function buildKeywordIdeas(seedKeyword: string, language: Language): KeywordIdea[] {
  const seed = seedKeyword.trim().toLowerCase();
  const ideas = language === "vi"
    ? [
        { keyword: seed, intent: "informational" as const, cluster: "seed" },
        { keyword: `${seed} là gì`, intent: "informational" as const, cluster: "definition" },
        { keyword: `cách dùng ${seed}`, intent: "informational" as const, cluster: "how-to" },
        { keyword: `${seed} cho người mới`, intent: "informational" as const, cluster: "beginner" },
        { keyword: `so sánh ${seed}`, intent: "comparison" as const, cluster: "comparison" },
        { keyword: `${seed} tốt nhất 2026`, intent: "commercial" as const, cluster: "commercial" },
        { keyword: `chiến lược ${seed}`, intent: "commercial" as const, cluster: "strategy" },
        { keyword: `${seed} có an toàn không`, intent: "transactional" as const, cluster: "risk" }
      ]
    : [
        { keyword: seed, intent: "informational" as const, cluster: "seed" },
        { keyword: `what is ${seed}`, intent: "informational" as const, cluster: "definition" },
        { keyword: `how to use ${seed}`, intent: "informational" as const, cluster: "how-to" },
        { keyword: `${seed} for beginners`, intent: "informational" as const, cluster: "beginner" },
        { keyword: `${seed} comparison`, intent: "comparison" as const, cluster: "comparison" },
        { keyword: `best ${seed} 2026`, intent: "commercial" as const, cluster: "commercial" },
        { keyword: `${seed} strategy`, intent: "commercial" as const, cluster: "strategy" },
        { keyword: `is ${seed} safe`, intent: "transactional" as const, cluster: "risk" }
      ];

  return ideas.map((idea) => ({
    id: slugify(idea.keyword),
    keyword: idea.keyword,
    intent: idea.intent,
    cluster: idea.cluster,
    monthlyVolume: null,
    provider: "Chưa xác thực volume",
    checkedAt: null,
    status: "missing"
  }));
}

export function buildBrief(primaryKeyword: string, secondaryKeywords: string[], language: Language): Brief {
  if (language === "en") {
    return {
      searchIntent: `People searching "${primaryKeyword}" want a direct explanation they can use immediately.`,
      angle: "Keep the article practical, clean, and easy to scan for a first-time reader.",
      semanticTopics: [
        primaryKeyword,
        ...secondaryKeywords.slice(0, 4),
        "core concept",
        "practical use",
        "common mistakes"
      ],
      candidateFaqs: [
        `What is ${primaryKeyword}?`,
        `Why does ${primaryKeyword} matter?`,
        `How should beginners approach ${primaryKeyword}?`
      ]
    };
  }

  return {
    searchIntent: `Người tìm "${primaryKeyword}" muốn hiểu nhanh cách áp dụng vào quyết định thực tế thay vì chỉ đọc định nghĩa.`,
    angle: "Giữ bài đi thẳng vào vấn đề, dễ đọc và dễ triển khai thành bài hoàn chỉnh.",
    semanticTopics: [
      primaryKeyword,
      ...secondaryKeywords.slice(0, 4),
      "khái niệm cốt lõi",
      "cách áp dụng thực tế",
      "lỗi thường gặp"
    ],
    candidateFaqs: [
      `${primaryKeyword} là gì?`,
      `Vì sao ${primaryKeyword} quan trọng?`,
      `Người mới nên bắt đầu với ${primaryKeyword} như thế nào?`
    ]
  };
}

export function buildOutline(
  primaryKeyword: string,
  brief: Brief,
  secondaryKeywords: string[],
  language: Language
): Outline {
  if (language === "en") {
    return {
      title: `${primaryKeyword}: a practical guide for readers`,
      introDirection: brief.angle,
      sections: [
        {
          heading: `What ${primaryKeyword} actually means`,
          bullets: [
            "Open with the reader problem first",
            "Explain the concept without sounding academic",
            `Work in ${secondaryKeywords[0] ?? "core context"} naturally`
          ]
        },
        {
          heading: `How to evaluate ${primaryKeyword} in practice`,
          bullets: [
            `Use ${secondaryKeywords[1] ?? primaryKeyword} as a practical angle`,
            "Show tradeoffs, not just one-sided claims",
            "Keep sections short and skimmable"
          ]
        },
        {
          heading: "Common mistakes to avoid",
          bullets: [
            "Close with the mistakes readers make most often",
            `Reconnect ${secondaryKeywords[2] ?? primaryKeyword} to the correct context`,
            "End with one clear next step"
          ]
        }
      ]
    };
  }

  return {
    title: `Hướng dẫn ${primaryKeyword}: góc nhìn rõ ràng cho team content`,
    introDirection: brief.angle,
    sections: [
      {
        heading: `${primaryKeyword} thực sự giải quyết điều gì`,
        bullets: [
          "Mở bài bằng pain point cụ thể của người đọc",
          "Định nghĩa khái niệm nhưng tránh giáo trình",
          `Cài sẵn semantic topic: ${secondaryKeywords[0] ?? "bối cảnh cốt lõi"}`
        ]
      },
      {
        heading: "Cách đánh giá và áp dụng vào quyết định thực tế",
        bullets: [
          `Dùng ${secondaryKeywords[1] ?? primaryKeyword} để đưa ra checklist`,
          "Nêu tradeoff thay vì khẳng định một chiều",
          "Giữ nhịp paragraph ngắn, dễ scan"
        ]
      },
      {
        heading: "Sai lầm phổ biến và cách tránh",
        bullets: [
          "Chốt bằng 3 lỗi phổ biến",
          `Neo lại ${secondaryKeywords[2] ?? primaryKeyword} ở bối cảnh đúng`,
          "Đóng bài bằng next step rõ ràng"
        ]
      }
    ]
  };
}

export function buildDraft(
  primaryKeyword: string,
  outline: Outline,
  secondaryKeywords: string[],
  language: Language
): Draft {
  const slug = slugify(outline.title);
  const excerpt = language === "en"
    ? `This draft focuses on ${primaryKeyword} and is structured for quick editing before publication.`
    : `Bản nháp tập trung vào ${primaryKeyword}, có cấu trúc rõ và đủ chỗ để gắn internal links trước khi biên tập cuối.`;
  const lines = language === "en"
    ? [
        `# ${outline.title}`,
        "",
        excerpt,
        "",
        `This draft keeps ${secondaryKeywords[0] ?? primaryKeyword} in the semantic field naturally instead of forcing keyword repetition.`,
        ""
      ]
    : [
        `# ${outline.title}`,
        "",
        excerpt,
        "",
        `Đây là bản nháp ưu tiên khả năng đọc nhanh, dùng ${secondaryKeywords[0] ?? primaryKeyword} như tín hiệu semantic thay vì nhồi từ khóa.`,
        ""
      ];

  outline.sections.forEach((section) => {
    lines.push(`## ${section.heading}`);
    lines.push("");
    lines.push(language === "en"
      ? `When discussing ${primaryKeyword}, this section should connect to ${secondaryKeywords[1] ?? "market context"} so the reader understands why the topic matters now.`
      : `Khi nói về ${primaryKeyword}, phần này nên liên hệ tới ${secondaryKeywords[1] ?? "bối cảnh thị trường"} để người đọc hiểu vì sao chủ đề này quan trọng ngay bây giờ.`);
    lines.push("");
    section.bullets.forEach((bullet) => {
      lines.push(`- ${bullet}`);
    });
    lines.push("");
  });

  lines.push(language === "en" ? "## Conclusion" : "## Kết luận");
  lines.push("");
  lines.push(language === "en"
    ? `If needed, the editor can add a case study, fresher proof points, and review the internal links attached to ${secondaryKeywords[2] ?? primaryKeyword}.`
    : `Nếu cần mở rộng thêm, editor có thể bổ sung case study, dữ kiện mới và kiểm tra lại các internal links gắn với ${secondaryKeywords[2] ?? primaryKeyword}.`);

  return {
    title: outline.title,
    slug,
    excerpt,
    metaTitle: language === "en" ? `${primaryKeyword} guide | draft ready` : `${primaryKeyword} guide | bản nháp sẵn biên tập`,
    metaDescription: language === "en"
      ? `Draft about ${primaryKeyword}, ready for internal link review and final editing.`
      : `Bản nháp về ${primaryKeyword}, đã sẵn cho bước review internal link và biên tập cuối.`,
    markdown: lines.join("\n")
  };
}

export function buildInternalLinkSuggestions(
  draft: Draft,
  primaryKeyword: string,
  secondaryKeywords: string[],
  language: Language,
  articleLibrary: ArticleLibraryItem[] = []
): InternalLinkSuggestion[] {
  void primaryKeyword;
  void secondaryKeywords;

  if (articleLibrary.length === 0) {
    return [];
  }

  const directCandidates = articleLibrary
    .flatMap((article) => article.keywords)
    .filter((keyword, index, collection) => collection.indexOf(keyword) === index)
    .filter((keyword) => Boolean(findFirstMatchingAnchor(draft.markdown, [keyword])))
    .sort((left, right) => right.length - left.length)
    .map((keyword, index) => ({
      anchor: keyword,
      sourceContext: extractSourceContext(draft.markdown, keyword),
      reason: language === "en"
        ? "Anchor found directly in the draft and matched an internal article label."
        : "Anchor xuất hiện trực tiếp trong bản nháp và khớp với nhãn bài trong kho.",
      confidence: 94 - index * 4
    }));

  return mapAnchorCandidatesToInternalLinks(draft, language, articleLibrary, directCandidates);
}

export function applyInternalLinks(markdown: string, suggestions: InternalLinkSuggestion[]) {
  const lines = markdown.split("\n");

  return suggestions.reduce((currentLines, suggestion) => {
    if (suggestion.status !== "accepted") {
      return currentLines;
    }

    const anchor = suggestion.anchor.trim();
    const matcher = new RegExp(escapeRegExp(anchor), "i");
    let inserted = false;

    for (let index = 0; index < currentLines.length; index += 1) {
      const line = currentLines[index];
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || line.includes("](")) {
        continue;
      }

      if (!matcher.test(line)) {
        continue;
      }

      currentLines[index] = line.replace(matcher, (matched) => `[${matched}](${suggestion.targetUrl})`);
      inserted = true;
      break;
    }

    if (!inserted) {
      currentLines.push("", `Xem thêm: [${anchor}](${suggestion.targetUrl})`);
    }

    return currentLines;
  }, lines).join("\n");
}
