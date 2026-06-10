import "./config.js";
import type {
  ArticleImageAspectRatio,
  ArticleImageKind,
  ArticleImageProviderName,
  Draft,
  GeneratedArticleImage,
  Language,
  Outline
} from "./types.js";

export type ArticleImageGenerationInput = {
  language: Language;
  primaryKeyword: string;
  secondaryKeywords: string[];
  title?: string;
  excerpt?: string;
  prompt?: string;
  kind: ArticleImageKind;
  aspectRatio: ArticleImageAspectRatio;
  stylePreset?: string;
  outline?: Outline;
  draft?: Draft;
};

export type ArticleImageProviderConfig = {
  provider?: string;
  model?: string;
  apiKey?: string;
  proxyToken?: string;
  baseUrl?: string;
};

type RawImageResponse = {
  id?: string;
  url?: string;
  imageUrl?: string;
  outputUrl?: string;
  base64?: string;
  b64_json?: string;
  mimeType?: string;
  mime_type?: string;
  width?: number;
  height?: number;
  prompt?: string;
  revisedPrompt?: string;
  revised_prompt?: string;
  altText?: string;
  alt_text?: string;
  caption?: string;
  images?: Array<RawImageResponse>;
  data?: Array<RawImageResponse>;
  output?: Array<string | RawImageResponse>;
};

export class ArticleImageProviderNotConfiguredError extends Error {
  readonly statusCode = 501;

  constructor(message = "Chưa cấu hình provider tạo ảnh. Bật IMAGE_GENERATION_PROVIDER hoặc nối adapter thật trước khi generate ảnh.") {
    super(message);
  }
}

export class ArticleImageProviderError extends Error {
  readonly statusCode = 502;
}

const imageProviders: ArticleImageProviderName[] = [
  "mock",
  "openai",
  "gemini",
  "stability",
  "replicate",
  "fal",
  "custom-proxy"
];

function isArticleImageProviderName(value: string): value is ArticleImageProviderName {
  return imageProviders.includes(value as ArticleImageProviderName);
}

function normalizeProvider(value?: string): ArticleImageProviderName {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return "mock";
  }
  return isArticleImageProviderName(normalized) ? normalized : "custom-proxy";
}

function resolveImageProviderConfig(overrides?: ArticleImageProviderConfig) {
  const provider = normalizeProvider(overrides?.provider || process.env.IMAGE_GENERATION_PROVIDER);

  return {
    provider,
    model: (overrides?.model || process.env.IMAGE_GENERATION_MODEL || defaultModelForProvider(provider)).trim(),
    apiKey: (overrides?.apiKey || process.env.IMAGE_GENERATION_API_KEY || "").trim(),
    proxyToken: (overrides?.proxyToken || process.env.IMAGE_GENERATION_PROXY_TOKEN || "").trim(),
    baseUrl: (overrides?.baseUrl || process.env.IMAGE_GENERATION_BASE_URL || "").trim()
  };
}

function defaultModelForProvider(provider: ArticleImageProviderName) {
  if (provider === "openai") return "gpt-image-1";
  if (provider === "gemini") return "imagen-4.0-generate-001";
  if (provider === "fal") return "fal-ai/flux/schnell";
  if (provider === "replicate") return "black-forest-labs/flux-1.1-pro";
  if (provider === "stability") return "stable-image-core";
  return "mock-image-plan";
}

export function articleImageHealth(overrides?: ArticleImageProviderConfig) {
  const config = resolveImageProviderConfig(overrides);
  const configured = config.provider === "mock"
    || (config.provider === "custom-proxy" && Boolean(config.baseUrl && (config.apiKey || config.proxyToken)))
    || Boolean(config.apiKey);

  return {
    provider: config.provider,
    model: config.model,
    configured
  };
}

export function buildArticleImagePrompt(input: ArticleImageGenerationInput) {
  const title = input.title?.trim() || input.draft?.title || input.primaryKeyword;
  const secondaryKeywords = input.secondaryKeywords.filter(Boolean).slice(0, 8).join(", ");
  const outlineHeadings = input.outline?.sections.map((section) => section.heading).slice(0, 6).join(" | ");
  const style = input.stylePreset?.trim() || "CoinRadar editorial crypto finance, black gold white palette, clean high-trust newsroom style";
  const languageInstruction = input.language === "vi"
    ? "Không chèn chữ tiếng Anh hoặc biểu đồ giá giả trong ảnh."
    : "Do not render fake price charts or misleading financial text in the image.";

  return [
    `Create a ${input.kind} image for a crypto/finance article.`,
    `Title: ${title}`,
    `Primary keyword: ${input.primaryKeyword}`,
    secondaryKeywords ? `Secondary keywords: ${secondaryKeywords}` : "",
    input.excerpt ? `Excerpt: ${input.excerpt}` : "",
    outlineHeadings ? `Outline themes: ${outlineHeadings}` : "",
    `Aspect ratio: ${input.aspectRatio}`,
    `Visual direction: ${style}`,
    "Use abstract market signals, coin/radar motifs, secure data-grid details, and editorial lighting.",
    "Avoid logos, trademarks, fake exchange UI, investment promises, celebrity likenesses, and readable trading advice.",
    languageInstruction
  ].filter(Boolean).join("\n");
}

function altTextForInput(input: ArticleImageGenerationInput) {
  const title = input.title?.trim() || input.draft?.title || input.primaryKeyword;
  return input.language === "vi"
    ? `Ảnh minh họa cho bài viết ${title}`
    : `Illustration for the article ${title}`;
}

function plannedImage(input: ArticleImageGenerationInput, prompt: string, provider: string, model: string): GeneratedArticleImage {
  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    provider,
    model,
    status: "planned",
    prompt,
    aspectRatio: input.aspectRatio,
    altText: altTextForInput(input),
    caption: input.language === "vi" ? "Kế hoạch ảnh, chờ nối provider thật." : "Image plan waiting for a real provider.",
    createdAt: new Date().toISOString()
  };
}

function firstImagePayload(payload: RawImageResponse): RawImageResponse {
  const outputImage = payload.output?.[0];
  if (typeof outputImage === "string") {
    return { url: outputImage };
  }
  return payload.images?.[0]
    ?? payload.data?.[0]
    ?? outputImage
    ?? payload;
}

function normalizeGeneratedImage(
  rawPayload: unknown,
  input: ArticleImageGenerationInput,
  prompt: string,
  provider: string,
  model: string
): GeneratedArticleImage {
  const image = firstImagePayload((rawPayload ?? {}) as RawImageResponse);
  const url = image.url || image.imageUrl || image.outputUrl;
  const base64 = image.base64 || image.b64_json;

  if (!url && !base64) {
    throw new ArticleImageProviderError("Provider tạo ảnh không trả về url hoặc base64 hợp lệ.");
  }

  return {
    id: image.id || crypto.randomUUID(),
    kind: input.kind,
    provider,
    model,
    status: "generated",
    prompt: image.prompt || prompt,
    revisedPrompt: image.revisedPrompt || image.revised_prompt,
    url,
    base64,
    mimeType: image.mimeType || image.mime_type || (base64 ? "image/png" : undefined),
    width: image.width,
    height: image.height,
    aspectRatio: input.aspectRatio,
    altText: image.altText || image.alt_text || altTextForInput(input),
    caption: image.caption,
    createdAt: new Date().toISOString()
  };
}

async function generateWithCustomProxy(
  input: ArticleImageGenerationInput,
  prompt: string,
  config: ReturnType<typeof resolveImageProviderConfig>
) {
  if (!config.baseUrl || (!config.apiKey && !config.proxyToken)) {
    throw new ArticleImageProviderNotConfiguredError("Thiếu IMAGE_GENERATION_BASE_URL và token/key cho custom proxy tạo ảnh.");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  if (config.proxyToken) {
    headers.Cookie = `proxy_token=${config.proxyToken}`;
    headers["x-proxy-token"] = config.proxyToken;
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      prompt,
      aspectRatio: input.aspectRatio,
      kind: input.kind,
      metadata: {
        language: input.language,
        primaryKeyword: input.primaryKeyword,
        secondaryKeywords: input.secondaryKeywords,
        title: input.title || input.draft?.title || input.primaryKeyword
      }
    })
  });

  if (!response.ok) {
    throw new ArticleImageProviderError(`Custom image proxy lỗi ${response.status}: ${await response.text()}`);
  }

  return normalizeGeneratedImage(await response.json(), input, prompt, config.provider, config.model);
}

export async function generateArticleImage(
  input: ArticleImageGenerationInput,
  overrides?: ArticleImageProviderConfig
) {
  const config = resolveImageProviderConfig(overrides);
  const prompt = input.prompt?.trim() || buildArticleImagePrompt(input);

  if (config.provider === "mock") {
    return plannedImage(input, prompt, config.provider, config.model);
  }

  if (config.provider === "custom-proxy") {
    return await generateWithCustomProxy(input, prompt, config);
  }

  if (!config.apiKey) {
    throw new ArticleImageProviderNotConfiguredError(`Thiếu IMAGE_GENERATION_API_KEY cho provider ${config.provider}.`);
  }

  throw new ArticleImageProviderNotConfiguredError(
    `Adapter ${config.provider} chưa được nối. Implement provider này trong apps/api/src/article-images.ts rồi trả về GeneratedArticleImage.`
  );
}
