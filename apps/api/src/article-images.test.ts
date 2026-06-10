import { describe, expect, it } from "vitest";
import {
  ArticleImageProviderNotConfiguredError,
  articleImageHealth,
  buildArticleImagePrompt,
  generateArticleImage
} from "./article-images.js";

const baseInput = {
  language: "vi" as const,
  primaryKeyword: "bitcoin halving",
  secondaryKeywords: ["gia bitcoin", "chu ky thi truong"],
  kind: "hero" as const,
  aspectRatio: "16:9" as const,
  title: "Bitcoin halving la gi?"
};

describe("article image generation scaffold", () => {
  it("builds a provider-neutral prompt from article context", () => {
    const prompt = buildArticleImagePrompt(baseInput);

    expect(prompt).toContain("bitcoin halving");
    expect(prompt).toContain("16:9");
    expect(prompt).toContain("CoinRadar");
  });

  it("returns a planned image in mock mode", async () => {
    const image = await generateArticleImage(baseInput, { provider: "mock" });

    expect(image.status).toBe("planned");
    expect(image.provider).toBe("mock");
    expect(image.prompt).toContain("bitcoin halving");
    expect(image.url).toBeUndefined();
  });

  it("reports custom proxy as unconfigured without base url and token", async () => {
    await expect(generateArticleImage(baseInput, { provider: "custom-proxy" }))
      .rejects
      .toBeInstanceOf(ArticleImageProviderNotConfiguredError);
  });

  it("marks mock provider as configured for local development", () => {
    expect(articleImageHealth({ provider: "mock" })).toMatchObject({
      provider: "mock",
      configured: true
    });
  });
});
