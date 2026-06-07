import { z } from "zod";
import "./config.js";
import { readVolumeCache, upsertVolumeCache } from "./store.js";
import type { DataStatus, KeywordIdea, Language } from "./types.js";


type VolumeProviderName = "dataforseo" | "ahrefs" | "keywordtool";

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

const dataForSeoResponseSchema = z.object({
  status_code: z.number(),
  status_message: z.string(),
  tasks: z.array(z.object({
    status_code: z.number(),
    status_message: z.string(),
    result: z.array(z.object({
      keyword: z.string(),
      search_volume: z.number().nullable().optional()
    })).optional()
  }))
});

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
  const requestedOrder = (process.env.KEYWORD_VOLUME_PROVIDER_ORDER ?? "dataforseo,ahrefs,keywordtool")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean) as VolumeProviderName[];

  return requestedOrder.filter((provider, index, collection) => {
    if (collection.indexOf(provider) !== index) {
      return false;
    }

    if (provider === "ahrefs") {
      return Boolean(process.env.AHREFS_API_KEY?.trim());
    }

    if (provider === "keywordtool") {
      return Boolean(process.env.KEYWORDTOOL_API_KEY?.trim());
    }

    if (provider === "dataforseo") {
      return Boolean(
        (process.env.DATAFORSEO_LOGIN?.trim() && process.env.DATAFORSEO_PASSWORD?.trim())
        || process.env.DATAFORSEO_BASIC_AUTH?.trim()
      );
    }

    return false;
  });
}

function countryForLanguage(language: Language) {
  return (process.env.KEYWORD_VOLUME_COUNTRY?.trim() || (language === "vi" ? "VN" : "US")).toUpperCase();
}

function keywordToolMetricsLanguage(language: Language) {
  return (process.env.KEYWORD_VOLUME_METRICS_LANGUAGE?.trim() || language).toLowerCase();
}

function envByLanguage(baseName: string, language: Language) {
  const languageKey = `${baseName}_${language.toUpperCase()}`;
  const scopedValue = process.env[languageKey]?.trim();
  if (scopedValue) {
    return scopedValue;
  }

  return process.env[baseName]?.trim() || "";
}

function dataForSeoLocationName(language: Language) {
  const explicit = envByLanguage("DATAFORSEO_LOCATION_NAME", language);
  if (explicit) {
    return explicit;
  }

  const country = countryForLanguage(language);
  const knownLocations: Record<string, string> = {
    VN: "Vietnam",
    US: "United States",
    GB: "United Kingdom",
    AU: "Australia",
    CA: "Canada",
    SG: "Singapore"
  };

  return knownLocations[country] ?? "Vietnam";
}

function dataForSeoLanguageName(language: Language) {
  const explicit = envByLanguage("DATAFORSEO_LANGUAGE_NAME", language);
  if (explicit) {
    return explicit;
  }

  return language === "vi" ? "Vietnamese" : "English";
}

function dataForSeoAuthorizationHeader() {
  const basic = process.env.DATAFORSEO_BASIC_AUTH?.trim();
  if (basic) {
    return `Basic ${basic}`;
  }

  const login = process.env.DATAFORSEO_LOGIN?.trim();
  const password = process.env.DATAFORSEO_PASSWORD?.trim();

  if (!login || !password) {
    throw new Error("Thiếu DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD.");
  }

  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

async function fetchDataForSeoVolumes(
  keywords: string[],
  context: VolumeProviderContext
) {
  const response = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
    method: "POST",
    headers: {
      Authorization: dataForSeoAuthorizationHeader(),
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify([
      {
        location_name: dataForSeoLocationName(context.language),
        language_name: dataForSeoLanguageName(context.language),
        keywords
      }
    ])
  });

  if (!response.ok) {
    throw new Error(`DataForSEO API lỗi ${response.status}: ${await response.text()}`);
  }

  const payload = dataForSeoResponseSchema.parse(await response.json());
  const task = payload.tasks[0];

  if (!task) {
    throw new Error("DataForSEO không trả về task result.");
  }

  if (payload.status_code !== 20000 || task.status_code !== 20000) {
    throw new Error(`DataForSEO lỗi ${task.status_code}: ${task.status_message}`);
  }

  const stamp = nowStamp();

  return new Map(
    (task.result ?? []).map((item) => [
      normalizeKeyword(item.keyword),
      {
        monthlyVolume: typeof item.search_volume === "number" ? item.search_volume : null,
        provider: "DataForSEO Google Ads",
        checkedAt: stamp,
        status: typeof item.search_volume === "number" ? "verified" : "missing"
      } satisfies VolumeLookupResult
    ])
  );
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
  if (provider === "dataforseo") {
    return fetchDataForSeoVolumes(keywords, context);
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
          provider: summarizeProviderError(lastFailedProvider ?? providers[0] ?? "dataforseo", lastError),
          checkedAt: nowStamp(),
          status: "failed" as const
        }
  );
}
