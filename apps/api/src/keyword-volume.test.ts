import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enrichKeywordIdeasWithVolumes, keywordVolumeHealth, parseSemrushJsonText } from "./keyword-volume.js";
import type { KeywordIdea } from "./types.js";

const originalEnv = { ...process.env };

function idea(keyword: string): KeywordIdea {
  return {
    id: keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    keyword,
    intent: "informational",
    cluster: "test",
    monthlyVolume: null,
    provider: "Chưa có nguồn dữ liệu",
    checkedAt: null,
    status: "missing"
  };
}

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.SEMRUSH_PROXY_TOKEN = "test-semrush-token";
  process.env.KEYWORD_VOLUME_PROVIDER_ORDER = "semrush";
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnv };
});

describe("keyword volume provider", () => {
  it("uses Semrush as the active volume provider", () => {
    expect(keywordVolumeHealth("en")).toMatchObject({
      configured: true,
      activeProvider: "semrush",
      providers: ["semrush"],
      country: "US"
    });
  });

  it("falls back from the removed DataForSEO provider order to Semrush when the token exists", () => {
    process.env.KEYWORD_VOLUME_PROVIDER_ORDER = "dataforseo";

    expect(keywordVolumeHealth("en")).toMatchObject({
      configured: true,
      activeProvider: "semrush",
      providers: ["semrush"]
    });
  });

  it("refreshes missing volumes through Semrush", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body ?? "{}")) as { params?: { phrase?: string } };
      return new Response(JSON.stringify({
        result: {
          keywords: [{ phrase: payload.params?.phrase, volume: 1234 }]
        }
      }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const [refreshed] = await enrichKeywordIdeasWithVolumes([idea("proof of stake semrush volume")], {
      language: "en"
    });

    expect(refreshed).toMatchObject({
      monthlyVolume: 1234,
      provider: "Semrush",
      status: "verified"
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("semrush.com.in/kmtgw/v2/webapi"), expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        Cookie: "proxy_token=test-semrush-token"
      })
    }));
  });

  it("reports expired Semrush proxy sessions without leaking a JSON parse error", () => {
    expect(() => parseSemrushJsonText("Session expired", 3)).toThrow(/Semrush proxy token\/session đã hết hạn/);
    expect(() => parseSemrushJsonText("Session expired", 3)).not.toThrow(/Unexpected token/);
  });
});
