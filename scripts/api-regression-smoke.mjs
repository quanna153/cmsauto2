#!/usr/bin/env node

const apiBase = (process.env.API_BASE_URL ?? "http://localhost:8787/api").replace(/\/$/, "");
const username = process.env.TEST_ADMIN_USERNAME ?? "admin";
const password = process.env.TEST_ADMIN_PASSWORD ?? "1";
const liveProviders = process.env.LIVE_PROVIDER_SMOKE === "1" || process.argv.includes("--live");

let cookie = "";
const results = [];

function summarize(payload) {
  if (!payload || typeof payload !== "object") return String(payload ?? "");
  if (Array.isArray(payload)) return `array(${payload.length})`;
  return Object.entries(payload)
    .filter(([key]) => ["ok", "code", "error", "service", "aiMode", "volumeProvider", "volumeProviderConfigured"].includes(key) || Array.isArray(payload[key]))
    .map(([key, value]) => Array.isArray(value) ? `${key}:${value.length}` : `${key}:${String(value).slice(0, 80)}`)
    .join(", ");
}

async function request(name, path, init = {}, expected = (response) => response.ok, timeoutMs = 25_000) {
  const startedAt = Date.now();
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (cookie) headers.set("cookie", cookie);

  try {
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0] ?? cookie;
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }

    const passed = expected(response, json);
    results.push({ name, passed, status: response.status, ms: Date.now() - startedAt, detail: summarize(json) });
    return { response, json, passed };
  } catch (error) {
    results.push({ name, passed: false, status: "ERR", ms: Date.now() - startedAt, detail: error instanceof Error ? error.message : String(error) });
    return { passed: false, error };
  }
}

function body(value) {
  return JSON.stringify(value);
}

function keywordIdea(keyword) {
  return {
    id: keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    keyword,
    intent: "informational",
    cluster: "smoke"
  };
}

const now = Date.now();
const articleTitle = `Smoke Manual ${now}`;
const libraryUrl = `/what-is-proof-of-stake-smoke-${now}`;
const createdAt = new Date().toISOString();
const smokeDraft = {
  title: `Smoke Factory Draft ${now}`,
  slug: `smoke-factory-draft-${now}`,
  excerpt: "Factory session smoke excerpt.",
  metaTitle: `Smoke Factory Draft ${now}`,
  metaDescription: "Factory session smoke meta description.",
  markdown: "# Smoke Factory Draft\n\nProof of Stake lets validators secure blockchain networks."
};
const sessionArticle = {
  id: `smoke-session-${now}`,
  revision: 1,
  createdAt,
  updatedAt: createdAt,
  inputs: { language: "en", seedKeyword: "proof of stake" },
  activeStep: "ready",
  keywordIdeas: [{
    id: "proof-of-stake",
    keyword: "proof of stake",
    intent: "informational",
    cluster: "staking",
    monthlyVolume: 100,
    provider: "smoke",
    checkedAt: createdAt,
    status: "verified"
  }],
  primaryKeywordId: "proof-of-stake",
  secondaryKeywordIds: [],
  brief: {
    searchIntent: "Learn proof of stake basics",
    angle: "Beginner guide",
    semanticTopics: ["staking", "validators", "consensus", "finality"],
    candidateFaqs: ["What is proof of stake?", "How do validators work?", "What are staking rewards?"]
  },
  outline: {
    title: smokeDraft.title,
    introDirection: "Explain the topic simply.",
    sections: [{ heading: "Proof of Stake", bullets: ["Definition", "Validator role"] }]
  },
  draft: smokeDraft,
  linkSuggestions: [],
  finalMarkdown: smokeDraft.markdown
};

await request("health", "/health");
await request("auth:missing-cookie", "/session/me", {}, (response) => response.status === 401);
await request("auth:invalid-password", "/session/login", {
  method: "POST",
  body: body({ username, password: `${password}-wrong` })
}, (response) => response.status === 401);
await request("auth:login", "/session/login", {
  method: "POST",
  body: body({ username, password })
});
await request("auth:me", "/session/me");

const createdUser = await request("users:create", "/users", {
  method: "POST",
  body: body({
    username: `smoke_${now}`,
    fullName: "Smoke Test User",
    email: null,
    temporaryPassword: "TempPassword123"
  })
});
const userId = createdUser.json?.user?.id;
if (userId) {
  await request("users:update", `/users/${userId}`, {
    method: "PATCH",
    body: body({ fullName: "Smoke Test User Updated", email: null, isActive: true })
  });
  await request("users:reset-password", `/users/${userId}/reset-password`, {
    method: "POST",
    body: body({ temporaryPassword: "TempPassword456" })
  });
  await request("users:revoke-sessions", `/users/${userId}/revoke-sessions`, { method: "POST" });
  await request("users:delete", `/users/${userId}`, { method: "DELETE" });
}

const manual = await request("articles:manual-publish", "/articles/manual", {
  method: "POST",
  body: body({
    title: articleTitle,
    content: [
      "# Smoke article",
      "",
      "Proof of Stake lets validators secure blockchain networks.",
      "",
      "This article exists for API regression smoke."
    ].join("\n")
  })
});
const slug = manual.json?.article?.draft?.slug;
await request("articles:manual-schedule", "/articles/manual/schedule", {
  method: "POST",
  body: body({
    title: `Smoke Scheduled ${now}`,
    content: "Scheduled smoke content.",
    publishAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  })
});
await request("articles:list", "/articles");
const session = await request("articles:create-session", "/articles", {
  method: "POST",
  body: body({ article: sessionArticle })
});
if (session.json?.article?.id && session.json?.article?.revision) {
  await request("articles:autosave", `/articles/${session.json.article.id}`, {
    method: "PATCH",
    body: body({
      expectedRevision: session.json.article.revision,
      changes: { finalMarkdown: `${session.json.article.finalMarkdown}\n\nAutosave smoke.` }
    })
  });
  await request("articles:autosave-conflict", `/articles/${session.json.article.id}`, {
    method: "PATCH",
    body: body({
      expectedRevision: session.json.article.revision,
      changes: { finalMarkdown: "stale" }
    })
  }, (response) => response.status === 409);
}

await request("public:articles-list", "/public/articles?locale=vi-vn&page=1&pageSize=5");
await request("public:articles-search", `/public/articles/search?locale=vi-vn&q=${encodeURIComponent("Smoke")}&page=1&pageSize=5`);
if (slug) {
  await request("public:article-detail", `/public/articles/vi-vn/${slug}`);
}
await request("public:market-tickers", "/public/markets/tickers?pairs=BTCUSDT,ETHUSDT,SOLUSDT", {}, (response, json) =>
  response.ok && Array.isArray(json?.tickers) && json.tickers.length === 3
);

await request("library:import", "/article-library/import", {
  method: "POST",
  body: body({
    items: [{
      title: `What Is Proof of Stake Smoke ${now}`,
      url: libraryUrl,
      keywords: ["proof of stake", "validators"],
      language: "en"
    }]
  })
});
await request("library:list-en", "/article-library?language=en");
await request("links:apply-valid", "/links/apply", {
  method: "POST",
  body: body({
    markdown: "Proof of Stake secures the network.",
    suggestions: [{
      id: `suggestion-${now}`,
      sourceContext: "Proof of Stake secures the network.",
      anchor: "Proof of Stake",
      targetTitle: `What Is Proof of Stake Smoke ${now}`,
      targetUrl: libraryUrl,
      matchedKeyword: "proof of stake",
      matchStatus: "matched",
      reason: "Smoke valid internal link.",
      confidence: 95,
      status: "accepted"
    }]
  })
});
await request("links:apply-rejects-unknown-url", "/links/apply", {
  method: "POST",
  body: body({
    markdown: "Unknown Link target.",
    suggestions: [{
      id: `bad-suggestion-${now}`,
      sourceContext: "Unknown Link target.",
      anchor: "Unknown Link",
      targetTitle: "Unknown",
      targetUrl: "/missing-url",
      matchedKeyword: "unknown",
      matchStatus: "matched",
      reason: "Smoke invalid internal link.",
      confidence: 95,
      status: "accepted"
    }]
  })
}, (response) => response.status === 400);

await request("keywords:refresh-volume", "/keywords/refresh-volume", {
  method: "POST",
  body: body({ language: "en", keywordIdeas: [keywordIdea("bitcoin")] })
}, undefined, 45_000);

if (liveProviders) {
  const keywordResult = await request("keywords:suggest-live", "/keywords/suggest", {
    method: "POST",
    body: body({
      seedKeyword: "bitcoin",
      language: "en",
      prompt: "Select 4 to 8 useful SEO keyword ideas. Return strict JSON only."
    })
  }, undefined, 60_000);
  const brief = await request("brief:generate-live", "/brief/generate", {
    method: "POST",
    body: body({
      primaryKeyword: keywordResult.json?.keywordIdeas?.[0]?.keyword ?? "proof of stake",
      secondaryKeywords: ["validators"],
      language: "en",
      prompt: "Create a concise SEO brief. Return strict JSON only."
    })
  }, undefined, 60_000);
  const briefPayload = brief.json?.brief ?? {
    searchIntent: "Learn proof of stake basics",
    angle: "Beginner guide",
    semanticTopics: ["staking", "validators", "consensus", "finality"],
    candidateFaqs: ["What is proof of stake?", "How do validators work?", "What are staking rewards?"]
  };
  const outline = await request("outline:generate-live", "/outline/generate", {
    method: "POST",
    body: body({
      primaryKeyword: "proof of stake",
      secondaryKeywords: ["validators"],
      language: "en",
      prompt: "Create a concise SEO outline. Return strict JSON only.",
      brief: briefPayload
    })
  }, undefined, 60_000);
  await request("draft:generate-live", "/draft/generate", {
    method: "POST",
    body: body({
      primaryKeyword: "proof of stake",
      secondaryKeywords: ["validators"],
      language: "en",
      prompt: "Create a concise markdown article draft. Return strict JSON only.",
      outline: outline.json?.outline
    })
  }, (response) => response.ok || response.status === 400, 60_000);
} else {
  results.push({ name: "live-provider-smoke", passed: true, status: "SKIP", ms: 0, detail: "Set LIVE_PROVIDER_SMOKE=1 to call Semrush/Tavily/Gemini live." });
}

await request("auth:logout", "/session/logout", { method: "POST" });

for (const result of results) {
  const status = result.passed ? "PASS" : "FAIL";
  console.log(`${status}\t${result.name}\t${result.status}\t${result.ms}ms\t${result.detail}`);
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  console.error(`api-regression-smoke failed: ${failed.length} failing checks.`);
  process.exit(1);
}
