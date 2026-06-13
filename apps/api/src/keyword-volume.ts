import { z } from "zod";
import "./config.js";
import { readVolumeCache, upsertVolumeCache } from "./store.js";
import type { DataStatus, KeywordIdea, Language } from "./types.js";


type VolumeProviderName = "semrush" | "ahrefs" | "keywordtool";

type VolumeLookupResult = {
  monthlyVolume: number | null;
  provider: string;
  checkedAt: string | null;
  status: DataStatus;
};

type VolumeProviderContext = {
  language: Language;
};

function summarizeProviderError(provider: VolumeProviderName, error: Error) {
  void error;
  return "Chưa có nguồn dữ liệu";
}

const ahrefsOverviewSchema = z.object({
  keywords: z.array(z.object({
    keyword: z.string(),
    volume: z.number().nullable().optional()
  }))
});

const semrushKeywordSchema = z.object({
  phrase: z.string(),
  volume: z.number().nullable().optional()
});

function compactProviderText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export function isSemrushSessionExpiredText(value: string) {
  return /session\s+ex/i.test(value) || /session.*expir/i.test(value);
}

export function isSemrushSessionExpiredError(error: Error) {
  return isSemrushSessionExpiredText(error.message);
}

export function semrushResponseErrorMessage(serverId: number, text: string, status?: number) {
  if (isSemrushSessionExpiredText(text)) {
    return `Semrush proxy token/session đã hết hạn ở server ${serverId}. Cập nhật lại Semrush Proxy Token trong Cài đặt API rồi thử lại.`;
  }

  const prefix = status ? `Semrush API lỗi ${status}` : "Semrush API trả về dữ liệu không hợp lệ";
  const detail = compactProviderText(text);
  return detail ? `${prefix} (server ${serverId}): ${detail}` : `${prefix} (server ${serverId}).`;
}

export function parseSemrushJsonText<T>(text: string, serverId: number) {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(semrushResponseErrorMessage(serverId, text));
  }
}

function nowStamp() {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date());
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function volumeCacheTtlMs() {
  const ttlDays = Number(process.env.KEYWORD_VOLUME_CACHE_TTL_DAYS ?? "30");
  if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
    return 30 * 24 * 60 * 60 * 1000;
  }

  return ttlDays * 24 * 60 * 60 * 1000;
}

function isFreshCache(cachedAt: string) {
  const cachedTime = new Date(cachedAt).getTime();
  if (Number.isNaN(cachedTime)) {
    return false;
  }

  return Date.now() - cachedTime <= volumeCacheTtlMs();
}

function configuredProviders() {
  const requestedOrder = (process.env.KEYWORD_VOLUME_PROVIDER_ORDER ?? "semrush,ahrefs,keywordtool")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(isVolumeProviderName);

  const providers = requestedOrder.length > 0
    ? requestedOrder
    : process.env.SEMRUSH_PROXY_TOKEN?.trim()
      ? ["semrush" as const]
      : [];

  return providers.filter((provider, index, collection) => {
    if (collection.indexOf(provider) !== index) {
      return false;
    }

    if (provider === "semrush") {
      return Boolean(process.env.SEMRUSH_PROXY_TOKEN?.trim());
    }

    if (provider === "ahrefs") {
      return Boolean(process.env.AHREFS_API_KEY?.trim());
    }

    if (provider === "keywordtool") {
      return Boolean(process.env.KEYWORDTOOL_API_KEY?.trim());
    }

    return false;
  });
}

function isVolumeProviderName(value: string): value is VolumeProviderName {
  return value === "semrush" || value === "ahrefs" || value === "keywordtool";
}

function countryForLanguage(language: Language) {
  return (process.env.KEYWORD_VOLUME_COUNTRY?.trim() || (language === "vi" ? "VN" : "US")).toUpperCase();
}

function keywordToolMetricsLanguage(language: Language) {
  return (process.env.KEYWORD_VOLUME_METRICS_LANGUAGE?.trim() || language).toLowerCase();
}

async function fetchSemrushVolumes(
  keywords: string[],
  context: VolumeProviderContext
) {
  const token = process.env.SEMRUSH_PROXY_TOKEN?.trim();
  if (!token) {
    throw new Error("Thiếu SEMRUSH_PROXY_TOKEN.");
  }

  const stamp = nowStamp();
  const results = new Map<string, VolumeLookupResult>();

  for (const keyword of keywords) {
    const rows = await fetchSemrushKeywordRows(keyword, context, token);
    const normalizedKeyword = normalizeKeyword(keyword);
    const match = rows.find((row) => normalizeKeyword(row.phrase) === normalizedKeyword);
    results.set(normalizedKeyword, {
      monthlyVolume: typeof match?.volume === "number" ? match.volume : null,
      provider: "Semrush",
      checkedAt: stamp,
      status: typeof match?.volume === "number" ? "verified" : "missing"
    });
  }

  return results;
}

async function fetchSemrushKeywordRows(keyword: string, context: VolumeProviderContext, token: string) {
  const payload = {
    id: 16,
    jsonrpc: "2.0",
    method: "ideas.GetKeywords",
    params: {
      mode: 0,
      currency: "USD",
      database: context.language === "vi" ? "vn" : "us",
      filter: {
        phrase: [],
        competition_level: [],
        cpc: [],
        difficulty: [],
        results: [],
        serp_features: [{ inverted: false, value: [] }],
        volume: [],
        words_count: [],
        phrase_include_logic: 0
      },
      groups: [],
      order: { direction: 1, field: "volume" },
      groups_order: { direction: 1, field: "count" },
      phrase: keyword,
      questions_only: false,
      page: { number: 1, size: 20 }
    }
  };

  const servers = [1, 2, 3, 4, 5, 6];
  let lastError: Error | null = null;
  let sessionExpiredError: Error | null = null;

  for (const serverId of servers) {
    try {
      const headers: Record<string, string> = {
        Accept: "*/*",
        "Content-Type": "application/json"
      };
      if (serverId !== 6) {
        headers.Cookie = `proxy_token=${token}`;
      }

      const response = await fetch(`https://${serverId}.semrush.com.in/kmtgw/v2/webapi`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(semrushResponseErrorMessage(serverId, responseText, response.status));
      }

      const data = parseSemrushJsonText<{ error?: unknown; result?: { keywords?: unknown[] } }>(responseText, serverId);
      if (data.error) {
        throw new Error(`Semrush error (server ${serverId}): ${JSON.stringify(data.error)}`);
      }

      return z.array(semrushKeywordSchema).parse(data.result?.keywords ?? []);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!sessionExpiredError && isSemrushSessionExpiredError(lastError)) {
        sessionExpiredError = lastError;
      }
    }
  }

  throw sessionExpiredError ?? lastError ?? new Error("Không lấy được volume từ Semrush.");
}

async function fetchAhrefsVolumes(
  keywords: string[],
  context: VolumeProviderContext
) {
  const apiKey = process.env.AHREFS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Thiếu AHREFS_API_KEY.");
  }

  const url = new URL("https://api.ahrefs.com/v3/keywords-explorer/overview");
  url.searchParams.set("country", countryForLanguage(context.language).toLowerCase());
  url.searchParams.set("select", "keyword,volume");
  url.searchParams.set("keywords", keywords.join(","));
  url.searchParams.set("output", "json");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Ahrefs API lỗi ${response.status}: ${await response.text()}`);
  }

  const payload = ahrefsOverviewSchema.parse(await response.json());
  const stamp = nowStamp();

  return new Map(
    payload.keywords.map((item) => [
      normalizeKeyword(item.keyword),
      {
        monthlyVolume: item.volume ?? null,
        provider: "Ahrefs",
        checkedAt: stamp,
        status: item.volume === null || item.volume === undefined ? "missing" : "verified"
      } satisfies VolumeLookupResult
    ])
  );
}

async function fetchKeywordToolVolumes(
  keywords: string[],
  context: VolumeProviderContext
) {
  const apiKey = process.env.KEYWORDTOOL_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Thiếu KEYWORDTOOL_API_KEY.");
  }

  const engine = (process.env.KEYWORDTOOL_ENGINE?.trim() || "google").toLowerCase();
  const body = new URLSearchParams({
    apikey: apiKey,
    keyword: JSON.stringify(keywords),
    country: countryForLanguage(context.language),
    metrics_language: keywordToolMetricsLanguage(context.language),
    output: "json"
  });

  const response = await fetch(`https://api.keywordtool.io/v2/search/volume/${engine}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body
  });

  if (!response.ok) {
    throw new Error(`KeywordTool API lỗi ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json() as {
    results?: Record<string, { string?: string; volume?: number | null }>;
  };

  const stamp = nowStamp();
  const entries = Object.values(payload.results ?? {}).filter((item) => typeof item.string === "string");

  return new Map(
    entries.map((item) => [
      normalizeKeyword(item.string as string),
      {
        monthlyVolume: typeof item.volume === "number" ? item.volume : null,
        provider: "KeywordTool",
        checkedAt: stamp,
        status: typeof item.volume === "number" ? "verified" : "missing"
      } satisfies VolumeLookupResult
    ])
  );
}

async function fetchProviderVolumes(
  provider: VolumeProviderName,
  keywords: string[],
  context: VolumeProviderContext
) {
  if (provider === "semrush") {
    return fetchSemrushVolumes(keywords, context);
  }

  if (provider === "ahrefs") {
    return fetchAhrefsVolumes(keywords, context);
  }

  return fetchKeywordToolVolumes(keywords, context);
}

export function keywordVolumeHealth(language: Language = "vi") {
  const providers = configuredProviders();

  return {
    configured: providers.length > 0,
    activeProvider: providers[0] ?? null,
    providers,
    country: countryForLanguage(language)
  };
}

export async function enrichKeywordIdeasWithVolumes(
  keywordIdeas: KeywordIdea[],
  context: VolumeProviderContext
) {
  const providers = configuredProviders();

  if (providers.length === 0) {
    return keywordIdeas.map((idea) => ({
      ...idea,
      monthlyVolume: null,
      provider: "Chưa có nguồn dữ liệu",
      checkedAt: null,
      status: "missing" as const
    }));
  }

  let enriched: KeywordIdea[] = keywordIdeas.map((idea) => ({
    ...idea,
    monthlyVolume: null,
    provider: "Chưa có nguồn dữ liệu",
    checkedAt: null,
    status: "missing" as const
  }));

  let lastError: Error | null = null;
  let lastFailedProvider: VolumeProviderName | null = null;

  for (const provider of providers) {
    const cachedRecords = await readVolumeCache(provider, context.language);
    const freshCache = new Map(
      cachedRecords
        .filter((record) => isFreshCache(record.cachedAt))
        .map((record) => [
          normalizeKeyword(record.keyword),
          {
            monthlyVolume: record.monthlyVolume,
            provider: record.providerLabel,
            checkedAt: record.checkedAt,
            status: record.status
          } satisfies VolumeLookupResult
        ])
    );

    enriched = enriched.map((idea) => {
      if (idea.status === "verified") {
        return idea;
      }

      const cached = freshCache.get(normalizeKeyword(idea.keyword));
      if (!cached) {
        return idea;
      }

      return {
        ...idea,
        ...cached
      };
    });

    const unresolvedKeywords = enriched
      .filter((idea) => idea.status !== "verified" && idea.provider === "Chưa có nguồn dữ liệu")
      .map((idea) => idea.keyword);

    if (unresolvedKeywords.length === 0) {
      break;
    }

    try {
      const results = await fetchProviderVolumes(provider, unresolvedKeywords, context);
      await upsertVolumeCache(
        Array.from(results.entries()).map(([keyword, result]) => ({
          provider,
          providerLabel: result.provider,
          language: context.language,
          keyword,
          monthlyVolume: result.monthlyVolume,
          status: result.status,
          checkedAt: result.checkedAt,
          cachedAt: new Date().toISOString()
        }))
      );
      enriched = enriched.map((idea) => {
        const volumeResult = results.get(normalizeKeyword(idea.keyword));
        if (!volumeResult) {
          return idea;
        }

        return {
          ...idea,
          ...volumeResult
        };
      });
      lastError = null;
    } catch (error) {
      console.error(`[Volume Fetch Error - ${provider}]:`, error);
      lastError = error instanceof Error ? error : new Error("Volume provider lỗi không xác định.");
      lastFailedProvider = provider;
    }
  }

  if (!lastError) {
    return enriched.map((idea) =>
      idea.status === "verified" || idea.provider !== "Chưa có nguồn dữ liệu"
        ? idea
        : {
            ...idea,
            provider: "Chưa có nguồn dữ liệu",
            checkedAt: idea.checkedAt,
            status: "missing" as const
          }
    );
  }

  return enriched.map((idea) =>
    idea.status === "verified"
      ? idea
      : {
          ...idea,
          monthlyVolume: null,
          provider: summarizeProviderError(lastFailedProvider ?? providers[0] ?? "semrush", lastError),
          checkedAt: nowStamp(),
          status: "failed" as const
        }
  );
}
