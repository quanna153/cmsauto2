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

function extractSourceContext(markdown: string, anchor: string) {
  const blocks = markdown.split(/\n\s*\n/);
  const match = blocks.find((block) => !isMarkdownHeadingLine(block) && block.toLowerCase().includes(anchor.toLowerCase()));
  return match?.trim().slice(0, 220) ?? "";
}

function isMarkdownHeadingLine(line: string) {
  return /^\s{0,3}#{1,6}\s+\S/.test(line);
}

function lineRangeAtOffset(value: string, offset: number) {
  const startOffset = value.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const endOffset = value.indexOf("\n", offset);
  return {
    startOffset,
    endOffset: endOffset >= 0 ? endOffset : value.length,
    text: value.slice(startOffset, endOffset >= 0 ? endOffset : value.length)
  };
}

function isOffsetInsideMarkdownHeading(value: string, offset: number) {
  if (offset < 0) {
    return false;
  }
  return isMarkdownHeadingLine(lineRangeAtOffset(value, offset).text);
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

const matchStopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "for",
  "how",
  "in",
  "is",
  "of",
  "on",
  "the",
  "to",
  "what",
  "why",
  "with",
  "la",
  "gi",
  "va",
  "ve",
  "cho",
  "cua",
  "mot",
  "nhung",
  "cac",
  "khi",
  "truoc",
  "sau",
  "tu",
  "den",
  "trong"
]);

const semanticTokenAliases = new Map([
  ["pos", "proof stake"],
  ["proofstake", "proof stake"],
  ["staking", "stake"],
  ["staked", "stake"],
  ["validators", "validator"],
  ["bridges", "bridge"],
  ["crosschain", "bridge"],
  ["cross chain", "bridge"],
  ["cau noi", "bridge"],
  ["cau noi blockchain", "bridge blockchain"],
  ["blockchain bridge", "bridge blockchain"],
  ["layer two", "layer 2"],
  ["layertwo", "layer 2"]
]);

const retrievalSemanticExpansions: Array<{ patterns: RegExp[]; terms: string }> = [
  {
    patterns: [/\bpos\b/, /\bproof\s+stake\b/, /\bstak\w*\b/, /\bvalidator\w*\b/],
    terms: "proof stake staking validator consensus rewards"
  },
  {
    patterns: [/\bbridge\b/, /\bcross\s+chain\b/, /\bcau\s+noi\b/, /\bchuyen\s+tai\s+san\b/],
    terms: "bridge cross chain cau noi blockchain interoperability"
  },
  {
    patterns: [/\blayer\s+2\b/, /\blayer\s+two\b/, /\brollup\w*\b/],
    terms: "layer 2 scaling scalability rollup"
  },
  {
    patterns: [/\bsmart\s+contract\b/, /\bhop\s+dong\s+thong\s+minh\b/],
    terms: "smart contract hop dong thong minh security"
  },
  {
    patterns: [/\bgas\b/, /\bphi\s+gas\b/, /\bphi\s+giao\s+dich\b/],
    terms: "gas fees phi gas phi giao dich transaction cost"
  },
  {
    patterns: [/\baltcoin\b/, /\bmua\s+altcoin\b/, /\baltcoin\s+season\b/, /\baltcoin\s+tang\s+gia\b/],
    terms: "altcoin season mua altcoin altcoin tang gia dau hieu co hoi dau tu dau co"
  },
  {
    patterns: [/\bphan\s+bo\b/, /\brui\s+ro\b/, /\bquan\s+ly\s+rui\s+ro\b/, /\bphan\s+bo\s+von\b/],
    terms: "phan bo von quan ly rui ro risk management allocation portfolio"
  }
];

function normalizeFuzzyComparable(value: string) {
  const normalized = normalizeComparable(value)
    .replace(/-/g, " ")
    .replace(/\blayer\s+two\b/g, "layer 2")
    .replace(/\bcross\s+chain\b/g, "cross chain")
    .replace(/\bproof\s+of\s+stake\b/g, "proof stake");

  return Array.from(semanticTokenAliases.entries()).reduce(
    (current, [alias, canonical]) => current.replace(new RegExp(`\\b${escapeRegExp(alias)}\\b`, "g"), canonical),
    normalized
  );
}

function stemEnglishToken(token: string) {
  if (token.length <= 3) {
    return token;
  }
  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.endsWith("ing") && token.length > 5) {
    return token.slice(0, -3);
  }
  if (token.endsWith("ed") && token.length > 4) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && token.length > 4) {
    return token.slice(0, -1);
  }
  return token;
}

function normalizeTokenForLanguage(token: string, language: Language) {
  if (language === "en") {
    return stemEnglishToken(token);
  }
  return token;
}

function uniqueTokens(value: string, language: Language = "en") {
  return Array.from(new Set(
    normalizeFuzzyComparable(value)
      .split(" ")
      .map((token) => normalizeTokenForLanguage(token, language))
      .filter((token) => token.length > 1 && !matchStopWords.has(token))
  ));
}

function expandRetrievalText(value: string) {
  const normalized = normalizeFuzzyComparable(value);
  const expansions = retrievalSemanticExpansions
    .filter((entry) => entry.patterns.some((pattern) => pattern.test(normalized)))
    .map((entry) => entry.terms);
  return [value, ...expansions].join(" ");
}

function tokenOverlap(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const rightSet = new Set(right);
  const matches = left.filter((token) => rightSet.has(token)).length;
  return matches / Math.max(left.length, right.length);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

function articleSearchText(article: ArticleLibraryItem) {
  return [
    article.title,
    article.summary,
    ...article.keywords
  ].filter(Boolean).join(" ");
}

function articleRetrievalText(article: ArticleLibraryItem) {
  return [
    article.title,
    ...article.keywords
  ].filter(Boolean).join(" ");
}

function articleExpandedRetrievalText(article: ArticleLibraryItem) {
  return expandRetrievalText(articleRetrievalText(article));
}

function termFrequencies(tokens: string[]) {
  return tokens.reduce<Record<string, number>>((frequencies, token) => {
    frequencies[token] = (frequencies[token] ?? 0) + 1;
    return frequencies;
  }, {});
}

function bm25Score(
  queryTokens: string[],
  documentTokens: string[],
  documentFrequencies: Map<string, number>,
  documentCount: number,
  averageDocumentLength: number
) {
  if (queryTokens.length === 0 || documentTokens.length === 0) {
    return 0;
  }

  const frequencies = termFrequencies(documentTokens);
  const uniqueQueryTokens = Array.from(new Set(queryTokens));
  const k1 = 1.4;
  const b = 0.75;

  return uniqueQueryTokens.reduce((score, token) => {
    const frequency = frequencies[token] ?? 0;
    if (frequency === 0) {
      return score;
    }

    const documentFrequency = documentFrequencies.get(token) ?? 0;
    const inverseDocumentFrequency = Math.log(1 + (documentCount - documentFrequency + 0.5) / (documentFrequency + 0.5));
    const lengthNormalization = frequency + k1 * (1 - b + b * (documentTokens.length / Math.max(1, averageDocumentLength)));
    return score + inverseDocumentFrequency * ((frequency * (k1 + 1)) / lengthNormalization);
  }, 0);
}

function retrievalExactBoost(anchorText: string, article: ArticleLibraryItem, language: Language) {
  const anchorComparable = normalizeFuzzyComparable(anchorText);
  const articleComparable = normalizeFuzzyComparable(articleExpandedRetrievalText(article));
  const titleComparable = normalizeFuzzyComparable(article.title);
  const anchorTokens = uniqueTokens(anchorText, language);
  const titleTokens = uniqueTokens(article.title, language);
  const retrievalTokens = uniqueTokens(articleExpandedRetrievalText(article), language);

  if (!anchorComparable) {
    return 0;
  }

  return [
    articleComparable === anchorComparable ? 6 : 0,
    titleComparable === anchorComparable ? 5 : 0,
    articleComparable.includes(anchorComparable) ? 4 : 0,
    titleComparable.includes(anchorComparable) ? 3 : 0,
    fuzzyTokenCoverage(anchorTokens, titleTokens) >= 0.8 ? 2.5 : 0,
    fuzzyTokenCoverage(anchorTokens, retrievalTokens) >= 0.66 ? 1.5 : 0
  ].reduce((sum, value) => sum + value, 0);
}

export function retrieveInternalLinkArticles(
  anchorText: string,
  sourceContext: string,
  language: Language,
  articleLibrary: ArticleLibraryItem[],
  limit = 20
) {
  const languageLibrary = articleLibrary.filter((article) => article.language === language);
  if (languageLibrary.length === 0) {
    return [];
  }

  const anchorTokens = uniqueTokens(expandRetrievalText(anchorText), language);
  const contextTokens = uniqueTokens(expandRetrievalText(sourceContext), language);
  const queryTokens = [
    ...anchorTokens,
    ...contextTokens.slice(0, 12)
  ];
  const documents = languageLibrary.map((article, index) => ({
    article,
    index,
    tokens: uniqueTokens(articleExpandedRetrievalText(article), language),
    titleTokens: uniqueTokens(expandRetrievalText(article.title), language)
  }));
  const documentFrequencies = documents.reduce<Map<string, number>>((frequencies, document) => {
    for (const token of new Set(document.tokens)) {
      frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    }
    return frequencies;
  }, new Map());
  const averageDocumentLength = documents.reduce((sum, document) => sum + document.tokens.length, 0) / documents.length;

  const scored = documents
    .map((document) => {
      const lexicalScore = bm25Score(
        queryTokens,
        document.tokens,
        documentFrequencies,
        documents.length,
        averageDocumentLength
      );
      const boost = retrievalExactBoost(anchorText, document.article, language);
      const titleContextCoverage = Math.max(
        fuzzyTokenCoverage(document.titleTokens, queryTokens),
        fuzzyTokenCoverage(anchorTokens, document.titleTokens),
        fuzzyTokenCoverage(contextTokens.slice(0, 12), document.titleTokens)
      );
      return {
        ...document,
        score: lexicalScore + boost + titleContextCoverage * 2
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) =>
      right.score - left.score
      || specificityScore(right.article) - specificityScore(left.article)
      || left.index - right.index
    )
    .slice(0, limit)
    .map((entry) => entry.article);

  if (scored.length >= Math.min(5, limit)) {
    return scored;
  }

  const seen = new Set(scored.map((article) => article.id));
  const widened = documents
    .filter((document) => !seen.has(document.article.id))
    .map((document) => ({
      ...document,
      score: Math.max(
        fuzzyTokenCoverage(document.titleTokens, queryTokens),
        fuzzyTokenCoverage(queryTokens, document.titleTokens),
        fuzzyTokenOverlap(document.titleTokens, queryTokens)
      )
    }))
    .filter((entry) => entry.score >= 0.25)
    .sort((left, right) =>
      right.score - left.score
      || specificityScore(right.article) - specificityScore(left.article)
      || left.index - right.index
    )
    .slice(0, limit - scored.length)
    .map((entry) => entry.article);

  return [...scored, ...widened].slice(0, limit);
}

function fuzzyTokenOverlap(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const rightSet = new Set(right);
  const matches = left.filter((leftToken) =>
    rightSet.has(leftToken)
    || right.some((rightToken) =>
      leftToken.length > 4
      && rightToken.length > 4
      && (leftToken.includes(rightToken) || rightToken.includes(leftToken))
    )
  ).length;
  return matches / Math.max(left.length, right.length);
}

function fuzzyTokenCoverage(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }
  const rightSet = new Set(right);
  const matches = left.filter((leftToken) =>
    rightSet.has(leftToken)
    || right.some((rightToken) =>
      leftToken.length > 4
      && rightToken.length > 4
      && (leftToken.includes(rightToken) || rightToken.includes(leftToken))
    )
  ).length;
  return matches / left.length;
}

function specificityScore(article: ArticleLibraryItem) {
  const titleTokens = uniqueTokens(article.title, article.language).length;
  const keywordTokens = article.keywords.flatMap((keyword) => uniqueTokens(keyword, article.language)).length;
  return clampScore((titleTokens + Math.min(keywordTokens, 4)) / 8);
}

export type InternalLinkArticleMatch = {
  anchorText: string;
  targetArticleId: string;
  targetTitle: string;
  targetUrl: string;
  matchScore: number;
  relevanceScore: number;
  intentScore: number;
  expectationScore: number;
  reason: string;
};

export function scoreInternalLinkArticleMatch(
  anchorText: string,
  sourceContext: string,
  article: ArticleLibraryItem,
  language: Language = article.language
): InternalLinkArticleMatch {
  const anchorComparable = normalizeFuzzyComparable(anchorText);
  const articleComparable = normalizeFuzzyComparable(articleSearchText(article));
  const articleTitleComparable = normalizeFuzzyComparable(article.title);
  const anchorTokens = uniqueTokens(anchorText, language);
  const articleTokens = uniqueTokens(articleSearchText(article), language);
  const contextTokens = uniqueTokens(sourceContext, language);

  const anchorArticleOverlap = Math.max(
    tokenOverlap(anchorTokens, articleTokens),
    fuzzyTokenOverlap(anchorTokens, articleTokens),
    fuzzyTokenCoverage(anchorTokens, articleTokens)
  );
  const contextArticleOverlap = Math.max(
    tokenOverlap([...anchorTokens, ...contextTokens], articleTokens),
    fuzzyTokenOverlap([...anchorTokens, ...contextTokens], articleTokens),
    fuzzyTokenCoverage(anchorTokens, articleTokens)
  );
  const titleCoverage = fuzzyTokenCoverage(anchorTokens, uniqueTokens(article.title, language));
  const exactTopicBoost = articleComparable.includes(anchorComparable) || anchorArticleOverlap >= 0.66 ? 0.45 : 0;
  const titlePromiseBoost = articleTitleComparable.includes(anchorComparable) || titleCoverage >= 0.6 ? 0.25 : 0;
  const relevanceScore = clampScore(
    anchorArticleOverlap * 0.55
    + exactTopicBoost
    + specificityScore(article) * 0.1
  );
  const intentScore = clampScore(
    contextArticleOverlap * 0.65
    + titlePromiseBoost
    + (article.summary.trim() ? 0.1 : 0)
  );
  const expectationScore = clampScore(
    titlePromiseBoost * 1.6
    + exactTopicBoost * 0.6
    + titleCoverage * 0.35
  );
  const matchScore = clampScore(
    relevanceScore * 0.4
    + intentScore * 0.35
    + expectationScore * 0.25
  );

  return {
    anchorText,
    targetArticleId: article.id,
    targetTitle: article.title,
    targetUrl: article.url,
    matchScore,
    relevanceScore,
    intentScore,
    expectationScore,
    reason: `"${article.title}" satisfies the relevance, intent, and expectation implied by "${anchorText}".`
  };
}

export function rankInternalLinkMatches(
  anchorText: string,
  sourceContext: string,
  articleLibrary: ArticleLibraryItem[],
  threshold = 0.75,
  language?: Language
) {
  return articleLibrary
    .map((article) => ({
      article,
      match: scoreInternalLinkArticleMatch(anchorText, sourceContext, article, language ?? article.language)
    }))
    .filter((entry) => entry.match.matchScore >= threshold)
    .sort((left, right) =>
      right.match.matchScore - left.match.matchScore
      || specificityScore(right.article) - specificityScore(left.article)
      || right.match.intentScore - left.match.intentScore
      || right.match.expectationScore - left.match.expectationScore
    );
}

const weakAnchorPhrases = new Set([
  "this network",
  "many users",
  "important feature",
  "this mechanism",
  "these features",
  "it",
  "they",
  "this",
  "that",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026"
]);

const genericAnchorPhrases = new Set([
  "bi",
  "coin",
  "coin h",
  "gia",
  "gia coin",
  "dau hieu",
  "hieu qua",
  "bien dong",
  "bitcoin",
  "btc",
  "crypto",
  "cryptocurrency",
  "ethereum",
  "eth",
  "thi truong",
  "thi truong va su",
  "nha dau tu",
  "hom nay",
  "cap nhat"
]);

const topicSignalWords = new Set([
  "airdrop",
  "altcoin",
  "bitcoin",
  "blockchain",
  "bridge",
  "bridges",
  "btc",
  "consensus",
  "crypto",
  "cryptocurrency",
  "cross-chain",
  "ethereum",
  "eth",
  "interoperability",
  "marketcap",
  "pos",
  "proof",
  "scalability",
  "solana",
  "stake",
  "staking",
  "staked",
  "security",
  "rewards",
  "validators",
  "validator",
  "subnets",
  "subnet",
  "protocol",
  "contracts",
  "contract",
  "governance",
  "rollups",
  "rollup",
  "tokenomics"
]);

export type AnchorCandidateReason = {
  standaloneTopic: boolean;
  informationGap: boolean;
  learningValue: boolean;
  semanticClarity: boolean;
};

export type AnchorTextCandidate = {
  anchorText: string;
  startOffset: number;
  endOffset: number;
  confidence: number;
  reason: AnchorCandidateReason;
};

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isWeakAnchor(value: string) {
  const normalized = normalizeComparable(value);
  return !normalized
    || weakAnchorPhrases.has(normalized)
    || genericAnchorPhrases.has(normalized)
    || /^(changes|helps|affects|uses|lets|keeps|matters|explains|means|includes|requires)\b/.test(normalized)
    || /^(this|that|these|those|it|they|we|you|he|she)\b/.test(normalized)
    || /^\d{4}$/.test(normalized)
    || normalized.length < 4;
}

function hasTopicSignal(value: string) {
  const normalized = normalizeFuzzyComparable(value);
  return normalized.split(" ").some((word) => topicSignalWords.has(word));
}

function evaluateAnchorCandidate(anchorText: string): AnchorCandidateReason {
  const count = wordCount(anchorText);
  const hasSignal = hasTopicSignal(anchorText);
  const standaloneTopic = count > 1 || hasSignal || /^[A-Z][A-Za-z0-9]{1,5}$/.test(anchorText.trim());
  const semanticClarity = !isWeakAnchor(anchorText) && (count > 1 || hasSignal);
  const informationGap = semanticClarity && standaloneTopic;
  const learningValue = semanticClarity && standaloneTopic;

  return {
    standaloneTopic,
    informationGap,
    learningValue,
    semanticClarity
  };
}

function candidatePasses(reason: AnchorCandidateReason) {
  return reason.standaloneTopic || reason.informationGap || reason.learningValue || reason.semanticClarity;
}

function isTokenBoundary(value: string, offset: number) {
  const char = value[offset];
  return !char || !/[\p{L}\p{N}]/u.test(char);
}

function anchorBoundaryMatcher(anchor: string) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(anchor)}(?![\\p{L}\\p{N}])`, "iu");
}

function anchorAppearsWithBoundaries(markdown: string, anchor: string) {
  return anchorBoundaryMatcher(anchor).test(markdown);
}

function isLinkableAnchorText(anchorText: string, language: Language) {
  const trimmed = anchorText.trim();
  const normalized = normalizeComparable(trimmed);
  const tokens = normalized.split(" ").filter(Boolean);
  const contentTokens = tokens.filter((token) => !matchStopWords.has(token));
  const singleEntity = /^[\p{Lu}][\p{L}\p{N}-]{2,}$/u.test(trimmed) || /^[A-Z0-9]{2,6}$/.test(trimmed);

  if (
    isWeakAnchor(trimmed)
    || tokens.length === 0
    || contentTokens.length === 0
    || tokens.some((token) => token.length <= 1)
    || matchStopWords.has(tokens[0])
    || matchStopWords.has(tokens[tokens.length - 1])
  ) {
    return false;
  }

  if (tokens.length === 1) {
    return hasTopicSignal(trimmed) || singleEntity;
  }

  if (hasTopicSignal(trimmed)) {
    return true;
  }

  return language === "vi"
    ? contentTokens.length >= 3 && normalized.length >= 12
    : contentTokens.length >= 2 && normalized.length >= 10;
}

function anchorConfidence(reason: AnchorCandidateReason, anchorText: string) {
  const score = Object.values(reason).filter(Boolean).length;
  const lengthBonus = Math.min(0.15, Math.max(0, wordCount(anchorText) - 1) * 0.05);
  return Math.min(0.98, Math.max(0.55, score / 4 * 0.8 + lengthBonus));
}

function collectCandidateMatches(articleContent: string) {
  const matches: Array<{ anchorText: string; startOffset: number; endOffset: number }> = [];
  const titleCasePattern = /\b[A-Z][A-Za-z0-9-]*(?:\s+(?:of|and|for|the|to|in|[A-Z][A-Za-z0-9-]*)){0,4}\b/g;
  const topicPhrasePattern = /\b[a-z][a-z0-9-]*(?:\s+[a-z][a-z0-9-]*){0,3}\b/g;
  const topicWordPattern = /\b[a-z][a-z0-9-]*\b/g;

  for (const match of articleContent.matchAll(titleCasePattern)) {
    const anchorText = match[0].trim();
    const startOffset = match.index ?? -1;
    if (startOffset >= 0) {
      matches.push({ anchorText, startOffset, endOffset: startOffset + anchorText.length });
    }
  }

  for (const match of articleContent.matchAll(topicPhrasePattern)) {
    const anchorText = match[0].trim();
    const startOffset = match.index ?? -1;
    if (startOffset >= 0 && hasTopicSignal(anchorText) && wordCount(anchorText) <= 4) {
      matches.push({ anchorText, startOffset, endOffset: startOffset + anchorText.length });
    }
  }

  for (const match of articleContent.matchAll(topicWordPattern)) {
    const anchorText = match[0].trim();
    const startOffset = match.index ?? -1;
    if (startOffset >= 0 && topicSignalWords.has(normalizeComparable(anchorText))) {
      matches.push({ anchorText, startOffset, endOffset: startOffset + anchorText.length });
    }
  }

  return matches;
}

export function findAnchorTextCandidates(articleTitle: string, articleContent: string, language: Language): AnchorTextCandidate[] {
  const titleComparable = normalizeComparable(articleTitle);
  const seen = new Set<string>();

  return collectCandidateMatches(articleContent)
    .map((candidate) => {
      const anchorText = candidate.anchorText.replace(/[.,:;!?)]$/, "").trim();
      const comparable = normalizeComparable(anchorText);
      if (
        !anchorText
        || seen.has(comparable)
        || comparable === titleComparable
        || isOffsetInsideMarkdownHeading(articleContent, candidate.startOffset)
      ) {
        return null;
      }
      if (!isLinkableAnchorText(anchorText, language) || !anchorAppearsWithBoundaries(articleContent, anchorText)) {
        return null;
      }
      seen.add(comparable);

      const reason = evaluateAnchorCandidate(anchorText);
      if (!candidatePasses(reason)) {
        return null;
      }

      return {
        anchorText,
        startOffset: candidate.startOffset,
        endOffset: candidate.startOffset + anchorText.length,
        confidence: anchorConfidence(reason, anchorText),
        reason
      };
    })
    .filter((candidate): candidate is AnchorTextCandidate => Boolean(candidate))
    .sort((left, right) => right.confidence - left.confidence || left.startOffset - right.startOffset)
    .slice(0, 14);
}

function anchorCandidateReasonText(language: Language, candidate: AnchorTextCandidate) {
  void language;
  const passedCriteria = Object.entries(candidate.reason)
    .filter(([, passed]) => passed)
    .map(([criterion]) => criterion)
    .join(", ");
  return `"${candidate.anchorText}" qualifies as an anchor candidate by: ${passedCriteria}.`;
}

function contentTokenSpans(value: string) {
  return Array.from(value.matchAll(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu)).map((match) => ({
    text: match[0],
    startOffset: match.index ?? 0,
    endOffset: (match.index ?? 0) + match[0].length
  }));
}

function candidateTitleTokens(article: ArticleLibraryItem, language: Language) {
  return uniqueTokens(article.title, language).filter((token) => !/^\d+$/.test(token));
}

function findLibraryTitleAnchorCandidates(
  articleContent: string,
  language: Language,
  articleLibrary: ArticleLibraryItem[]
): AnchorTextCandidate[] {
  const tokenSpans = contentTokenSpans(articleContent);
  const seen = new Set<string>();
  const candidates: AnchorTextCandidate[] = [];

  for (const article of articleLibrary) {
    const titleTokens = candidateTitleTokens(article, language);
    if (titleTokens.length === 0) {
      continue;
    }

    let bestCandidate: AnchorTextCandidate | null = null;
    for (let index = 0; index < tokenSpans.length; index += 1) {
      for (let size = 1; size <= 5 && index + size <= tokenSpans.length; size += 1) {
        const slice = tokenSpans.slice(index, index + size);
        const anchorText = articleContent.slice(slice[0].startOffset, slice[slice.length - 1].endOffset).trim();
        const normalizedAnchor = normalizeComparable(anchorText);
        if (
          seen.has(normalizedAnchor)
          || !isLinkableAnchorText(anchorText, language)
          || isOffsetInsideMarkdownHeading(articleContent, slice[0].startOffset)
        ) {
          continue;
        }

        const anchorTokens = uniqueTokens(anchorText, language);
        if (anchorTokens.length === 0 || (anchorTokens.length === 1 && !hasTopicSignal(anchorText))) {
          continue;
        }

        const titleCoverage = fuzzyTokenCoverage(anchorTokens, titleTokens);
        const articleCoverage = fuzzyTokenCoverage(anchorTokens, uniqueTokens(articleSearchText(article), language));
        const coverage = Math.max(titleCoverage, articleCoverage);
        const titleMatchedShare = fuzzyTokenCoverage(titleTokens, anchorTokens);
        if (coverage < 0.9) {
          continue;
        }

        const reason = evaluateAnchorCandidate(anchorText);
        if (!candidatePasses(reason)) {
          continue;
        }

        const candidate: AnchorTextCandidate = {
          anchorText,
          startOffset: slice[0].startOffset,
          endOffset: slice[slice.length - 1].endOffset,
          confidence: Math.min(0.96, Math.max(0.72, coverage * 0.78 + titleMatchedShare * 0.18)),
          reason
        };
        if (!bestCandidate || candidate.confidence > bestCandidate.confidence || (
          candidate.confidence === bestCandidate.confidence && anchorText.length < bestCandidate.anchorText.length
        )) {
          bestCandidate = candidate;
        }
      }
    }

    if (bestCandidate) {
      seen.add(normalizeComparable(bestCandidate.anchorText));
      candidates.push(bestCandidate);
    }
  }

  return candidates;
}

export function mapAnchorTextCandidatesToInternalLinkCandidates(
  articleContent: string,
  language: Language,
  candidates: AnchorTextCandidate[]
): InternalLinkAnchorCandidate[] {
  return candidates
    .filter((candidate) => candidatePasses(candidate.reason))
    .map((candidate) => ({
      anchor: candidate.anchorText,
      sourceContext: extractSourceContext(articleContent, candidate.anchorText),
      reason: anchorCandidateReasonText(language, candidate),
      confidence: Math.round(candidate.confidence * 100)
    }));
}

function phraseMatchScore(haystack: string, needle: string, language: Language) {
  const normalizedHaystack = normalizeFuzzyComparable(haystack);
  const normalizedNeedle = normalizeFuzzyComparable(needle);
  if (!normalizedNeedle) {
    return 0;
  }
  if (normalizedHaystack.includes(normalizedNeedle)) {
    return Math.min(12, Math.max(3, normalizedNeedle.length));
  }
  const overlap = fuzzyTokenOverlap(uniqueTokens(needle, language), uniqueTokens(haystack, language));
  return overlap >= 0.5 ? overlap * 8 : 0;
}

function keywordScore(markdown: string, article: ArticleLibraryItem, focusKeywords: string[]) {
  const articleLabels = [article.title, article.summary, ...article.keywords].filter(Boolean);
  const normalizedFocusKeywords = focusKeywords.map(normalizeComparable).filter(Boolean);

  return articleLabels.reduce((score, label) => {
    if (!label) {
      return score;
    }
    const markdownScore = phraseMatchScore(markdown, label, article.language);
    if (markdownScore > 0) {
      return score + markdownScore;
    }
    if (normalizedFocusKeywords.some((keyword) => anchorMatchesKeyword(label, keyword))) {
      return score + 2;
    }
    return score;
  }, 0);
}

export function selectInternalLinkCandidates(
  draft: Draft,
  primaryKeyword: string,
  secondaryKeywords: string[],
  articleLibrary: ArticleLibraryItem[],
  limit = 50
) {
  const focusKeywords = [primaryKeyword, ...secondaryKeywords].filter(Boolean);
  const scored = articleLibrary
    .map((article, index) => ({
      article,
      index,
      score: keywordScore(draft.markdown, article, focusKeywords)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map((entry) => entry.article);

  return scored.length > 0 ? scored : articleLibrary.slice(0, limit);
}

export function selectInternalLinkCandidatesForAnchorCandidates(
  draft: Draft,
  language: Language,
  articleLibrary: ArticleLibraryItem[],
  anchorCandidates: AnchorTextCandidate[],
  limit = 20
) {
  if (articleLibrary.length === 0 || anchorCandidates.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const retrieved = anchorCandidates.flatMap((candidate) => {
    const sourceContext = extractSourceContext(draft.markdown, candidate.anchorText);
    return retrieveInternalLinkArticles(candidate.anchorText, sourceContext, language, articleLibrary, limit);
  });
  const scored = retrieved
    .filter((article) => {
      if (seen.has(article.id)) {
        return false;
      }
      seen.add(article.id);
      return true;
    })
    .map((article, index) => {
      const score = anchorCandidates.reduce((bestScore, candidate) => {
        const sourceContext = extractSourceContext(draft.markdown, candidate.anchorText);
        const match = scoreInternalLinkArticleMatch(candidate.anchorText, sourceContext, article, language);
        const phraseScore = phraseMatchScore(articleExpandedRetrievalText(article), candidate.anchorText, language) / 12;
        return Math.max(bestScore, match.matchScore, phraseScore);
      }, 0);
      return { article, index, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map((entry) => entry.article);

  return scored.length > 0 ? scored : retrieved.slice(0, limit);
}

function maxInternalLinksForWordCount(count: number) {
  if (count < 800) {
    return 3;
  }
  if (count < 1500) {
    return 6;
  }
  if (count < 2500) {
    return 8;
  }
  return 10;
}

function paragraphIndexForSuggestion(markdown: string, suggestion: InternalLinkSuggestion) {
  const blocks = markdown.split(/\n\s*\n/);
  const anchor = normalizeComparable(suggestion.anchor);
  const context = normalizeComparable(suggestion.sourceContext);
  const index = blocks.findIndex((block) => {
    const normalizedBlock = normalizeComparable(block);
    return normalizedBlock.includes(anchor) || (context.length > 0 && normalizedBlock.includes(context.slice(0, 80)));
  });
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function distributeInternalLinkSuggestions(markdown: string, suggestions: InternalLinkSuggestion[]) {
  const maxLinks = maxInternalLinksForWordCount(wordCount(markdown));
  const seenUrls = new Set<string>();
  const paragraphCounts = new Map<number, number>();
  const ranked = suggestions
    .filter((suggestion) => suggestion.matchStatus === "matched" && suggestion.targetUrl.trim())
    .filter((suggestion) => {
      const normalizedUrl = suggestion.targetUrl.trim().toLowerCase();
      if (seenUrls.has(normalizedUrl)) {
        return false;
      }
      seenUrls.add(normalizedUrl);
      return true;
    })
    .map((suggestion, index) => ({
      suggestion,
      index,
      paragraphIndex: paragraphIndexForSuggestion(markdown, suggestion)
    }))
    .sort((left, right) =>
      left.paragraphIndex - right.paragraphIndex
      || (right.suggestion.matchScore ?? 0) - (left.suggestion.matchScore ?? 0)
      || left.index - right.index
    );

  const distributed: typeof ranked = [];
  for (const entry of ranked) {
    if (distributed.length >= maxLinks) {
      break;
    }
    const paragraphLimit = entry.paragraphIndex !== Number.MAX_SAFE_INTEGER
      && wordCount(markdown.split(/\n\s*\n/)[entry.paragraphIndex] ?? "") >= 80
      ? 2
      : 1;
    const paragraphCount = paragraphCounts.get(entry.paragraphIndex) ?? 0;
    if (entry.paragraphIndex !== Number.MAX_SAFE_INTEGER && paragraphCount >= paragraphLimit) {
      continue;
    }
    distributed.push(entry);
    paragraphCounts.set(entry.paragraphIndex, paragraphCount + 1);
  }

  for (const entry of ranked) {
    if (distributed.length >= maxLinks) {
      break;
    }
    if (!distributed.includes(entry)) {
      distributed.push(entry);
    }
  }

  return distributed
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.suggestion);
}

export type InternalLinkAnchorCandidate = {
  anchor: string;
  sourceContext?: string;
  reason?: string;
  confidence?: number;
};

export type InternalLinkTargetSelection = {
  anchor: string;
  targetArticleId?: string;
  targetUrl?: string;
  sourceContext?: string;
  reason?: string;
  confidence?: number;
};

function rejectedUrlsForAnchor(
  anchor: string,
  rejectedSuggestions: InternalLinkSuggestion[]
) {
  const normalizedAnchor = normalizeComparable(anchor);
  return new Set(
    rejectedSuggestions
      .filter((suggestion) =>
        suggestion.status === "rejected"
        && normalizeComparable(suggestion.anchor) === normalizedAnchor
        && suggestion.targetUrl.trim()
      )
      .map((suggestion) => suggestion.targetUrl.trim().toLowerCase())
  );
}

function isStrongSecondaryInternalLinkMatch(
  anchor: string,
  article: ArticleLibraryItem,
  match: InternalLinkArticleMatch,
  language: Language
) {
  const titleCoverage = fuzzyTokenCoverage(uniqueTokens(anchor, language), uniqueTokens(article.title, language));
  return titleCoverage >= 0.8 || match.expectationScore >= 0.72;
}

function findBestInternalLinkMatch(
  anchor: string,
  sourceContext: string,
  language: Language,
  articleLibrary: ArticleLibraryItem[],
  rejectedUrls: Set<string>
) {
  const eligibleLibrary = articleLibrary.filter((article) => !rejectedUrls.has(article.url.trim().toLowerCase()));
  const primaryCandidates = retrieveInternalLinkArticles(anchor, sourceContext, language, eligibleLibrary, 20);
  const primaryMatch = rankInternalLinkMatches(anchor, sourceContext, primaryCandidates, 0.75, language)[0];
  if (primaryMatch) {
    return primaryMatch;
  }

  const expandedCandidates = retrieveInternalLinkArticles(anchor, sourceContext, language, eligibleLibrary, 40);
  return rankInternalLinkMatches(anchor, sourceContext, expandedCandidates, 0.68, language)
    .find((entry) => isStrongSecondaryInternalLinkMatch(anchor, entry.article, entry.match, language));
}

export function mapAnchorCandidatesToInternalLinks(
  draft: Draft,
  language: Language,
  articleLibrary: ArticleLibraryItem[],
  candidates: InternalLinkAnchorCandidate[],
  rejectedSuggestions: InternalLinkSuggestion[] = []
) {
  const mapped = candidates
    .map((candidate) => {
      const anchor = candidate.anchor.trim();
      if (!anchor || !isLinkableAnchorText(anchor, language) || !anchorAppearsWithBoundaries(draft.markdown, anchor)) {
        return null;
      }

      const sourceContext = candidate.sourceContext?.trim() || extractSourceContext(draft.markdown, anchor);
      const bestMatch = findBestInternalLinkMatch(
        anchor,
        sourceContext,
        language,
        articleLibrary,
        rejectedUrlsForAnchor(anchor, rejectedSuggestions)
      );
      if (!bestMatch) {
        return null;
      }

      return {
        id: `${bestMatch.article.id}-${slugify(anchor)}`,
        sourceContext,
        anchor,
        targetArticleId: bestMatch.article.id,
        targetTitle: bestMatch.article.title,
        targetUrl: bestMatch.article.url,
        matchedKeyword: bestMatch.match.anchorText,
        matchStatus: "matched" as const,
        reason: bestMatch.match.reason,
        confidence: Math.max(70, Math.min(99, Math.round((candidate.confidence ?? bestMatch.match.matchScore) * 100))),
        matchScore: bestMatch.match.matchScore,
        relevanceScore: bestMatch.match.relevanceScore,
        intentScore: bestMatch.match.intentScore,
        expectationScore: bestMatch.match.expectationScore,
        status: "accepted" as const
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((suggestion, index, collection) =>
      collection.findIndex((item) => item.anchor.toLowerCase() === suggestion.anchor.toLowerCase()) === index
    )
    .filter((suggestion, index, collection) => {
      const normalizedAnchor = normalizeComparable(suggestion.anchor);
      return !collection.some((other, otherIndex) => {
        if (otherIndex === index || other.targetUrl !== suggestion.targetUrl) {
          return false;
        }
        const normalizedOther = normalizeComparable(other.anchor);
        return normalizedOther !== normalizedAnchor
          && normalizedOther.includes(normalizedAnchor)
          && wordCount(other.anchor) > wordCount(suggestion.anchor);
      });
    });

  return distributeInternalLinkSuggestions(draft.markdown, mapped);
}

export function mapSelectedInternalLinkTargetsToSuggestions(
  draft: Draft,
  language: Language,
  articleLibrary: ArticleLibraryItem[],
  selections: InternalLinkTargetSelection[],
  rejectedSuggestions: InternalLinkSuggestion[] = []
) {
  const byUrl = new Map(articleLibrary.map((article) => [article.url.trim().toLowerCase(), article]));
  const byId = new Map(articleLibrary.map((article) => [article.id, article]));
  const mapped = selections
    .map((selection) => {
      const anchor = selection.anchor.trim();
      if (!anchor || !isLinkableAnchorText(anchor, language) || !anchorAppearsWithBoundaries(draft.markdown, anchor)) {
        return null;
      }

      const targetUrl = selection.targetUrl?.trim().toLowerCase();
      const targetArticle = selection.targetArticleId
        ? byId.get(selection.targetArticleId)
        : targetUrl
          ? byUrl.get(targetUrl)
          : undefined;
      if (!targetArticle || rejectedUrlsForAnchor(anchor, rejectedSuggestions).has(targetArticle.url.trim().toLowerCase())) {
        return null;
      }

      const sourceContext = selection.sourceContext?.trim() || extractSourceContext(draft.markdown, anchor);
      const match = scoreInternalLinkArticleMatch(anchor, sourceContext, targetArticle, language);

      return {
        id: `${targetArticle.id}-${slugify(anchor)}`,
        sourceContext,
        anchor,
        targetArticleId: targetArticle.id,
        targetTitle: targetArticle.title,
        targetUrl: targetArticle.url,
        matchedKeyword: match.anchorText,
        matchStatus: "matched" as const,
        reason: selection.reason?.trim() || match.reason,
        confidence: Math.max(70, Math.min(99, Math.round((selection.confidence ?? match.matchScore) * 100))),
        matchScore: match.matchScore,
        relevanceScore: match.relevanceScore,
        intentScore: match.intentScore,
        expectationScore: match.expectationScore,
        status: "accepted" as const
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .filter((suggestion, index, collection) =>
      collection.findIndex((item) =>
        item.anchor.toLowerCase() === suggestion.anchor.toLowerCase()
        || item.targetUrl.toLowerCase() === suggestion.targetUrl.toLowerCase()
      ) === index
    );

  return distributeInternalLinkSuggestions(draft.markdown, mapped);
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
  const candidateLibrary = selectInternalLinkCandidates(draft, primaryKeyword, secondaryKeywords, articleLibrary);
  return buildInternalLinkSuggestionsFromAnchorCandidates(
    draft,
    primaryKeyword,
    secondaryKeywords,
    language,
    candidateLibrary
  );
}

export function buildInternalLinkSuggestionsFromAnchorCandidates(
  draft: Draft,
  primaryKeyword: string,
  secondaryKeywords: string[],
  language: Language,
  articleLibrary: ArticleLibraryItem[] = [],
  rejectedSuggestions: InternalLinkSuggestion[] = []
): InternalLinkSuggestion[] {
  void primaryKeyword;
  void secondaryKeywords;

  if (articleLibrary.length === 0) {
    return [];
  }

  const anchorCandidates = findInternalLinkAnchorCandidates(draft, language, articleLibrary);
  const candidateLibrary = selectInternalLinkCandidatesForAnchorCandidates(
    draft,
    language,
    articleLibrary,
    anchorCandidates
  );

  return mapAnchorCandidatesToInternalLinks(
    draft,
    language,
    candidateLibrary,
    mapAnchorTextCandidatesToInternalLinkCandidates(draft.markdown, language, anchorCandidates),
    rejectedSuggestions
  );
}

export function findInternalLinkAnchorCandidates(
  draft: Draft,
  language: Language,
  articleLibrary: ArticleLibraryItem[]
) {
  return [
    ...findAnchorTextCandidates(draft.title, draft.markdown, language),
    ...findLibraryTitleAnchorCandidates(draft.markdown, language, articleLibrary)
  ].filter((candidate, index, collection) =>
    collection.findIndex((item) => normalizeComparable(item.anchorText) === normalizeComparable(candidate.anchorText)) === index
  );
}

function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

export function buildInternalLinkMappingCsv(articleTitle: string, suggestions: InternalLinkSuggestion[]) {
  const rows = suggestions
    .filter((suggestion) => suggestion.matchStatus === "matched" && suggestion.targetUrl.trim())
    .map((suggestion) => [
      articleTitle,
      suggestion.anchor,
      suggestion.targetTitle,
      suggestion.targetUrl,
      (suggestion.matchScore ?? 0).toFixed(2)
    ]);

  return [
    "article_title,anchor_text,target_title,target_url,match_score",
    ...rows.map((row) => row.map(csvCell).join(","))
  ].join("\n");
}
export function applyInternalLinks(markdown: string, suggestions: InternalLinkSuggestion[]) {
  const lines = markdown.split("\n");
  const appliedAnchors = new Set<string>();

  return suggestions.reduce((currentLines, suggestion) => {
    if (suggestion.status !== "accepted") {
      return currentLines;
    }

    const anchor = suggestion.anchor.trim();
    const normalizedAnchor = normalizeComparable(anchor);
    if (appliedAnchors.has(normalizedAnchor)) {
      return currentLines;
    }

    if (!isLinkableAnchorText(anchor, "vi") && !isLinkableAnchorText(anchor, "en")) {
      return currentLines;
    }

    const matcher = anchorBoundaryMatcher(anchor);
    let inserted = false;

    for (let index = 0; index < currentLines.length; index += 1) {
      const line = currentLines[index];
      const trimmed = line.trim();

      if (!trimmed || isMarkdownHeadingLine(line) || line.includes("](")) {
        continue;
      }

      if (!matcher.test(line)) {
        continue;
      }

      currentLines[index] = line.replace(matcher, (matched) => `[${matched}](${suggestion.targetUrl})`);
      inserted = true;
      break;
    }

    if (inserted) {
      appliedAnchors.add(normalizedAnchor);
    }
    return currentLines;
  }, lines).join("\n");
}
