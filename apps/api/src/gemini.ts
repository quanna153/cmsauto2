import { z } from "zod";
import "./config.js";

const geminiModel = process.env.GEMINI_MODEL?.trim();
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

export function hasGeminiConfig(overrides?: { model?: string; apiKey?: string }) {
  return Boolean((overrides?.model || geminiModel) && (overrides?.apiKey || geminiApiKey));
}

export function getGeminiConfig(overrides?: { model?: string; apiKey?: string }) {
  if (!hasGeminiConfig(overrides)) {
    throw new Error("Thiếu cấu hình Gemini Model hoặc API Key.");
  }

  return {
    model: (overrides?.model || geminiModel) as string,
    apiKey: (overrides?.apiKey || geminiApiKey) as string
  };
}

function renderPrompt(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce(
    (current, [key, value]) => current.replaceAll(`{{${key}}}`, value),
    template
  );
}

function extractJsonText(payload: unknown) {
  const text = (payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  })?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    throw new Error("Gemini không trả về text hợp lệ.");
  }

  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export async function generateStructuredJson<T>(options: {
  prompt: string;
  variables: Record<string, string>;
  contextLines: string[];
  jsonShapeHint: string;
  responseJsonSchema: Record<string, unknown>;
  validator: z.ZodType<T>;
  temperature?: number;
  customConfig?: { model?: string; apiKey?: string };
}) {
  const { model, apiKey } = getGeminiConfig(options.customConfig);

  const renderedPrompt = renderPrompt(options.prompt, options.variables);
  const userText = [
    renderedPrompt,
    "",
    "Dữ liệu thực tế để xử lý:",
    ...options.contextLines.map((line) => `- ${line}`),
    "",
    "Bắt buộc:",
    "- Chỉ trả về JSON hợp lệ.",
    "- Không bọc markdown.",
    "- Không thêm giải thích ngoài JSON.",
    "- JSON phải bám đúng cấu trúc dưới đây.",
    "",
    "Cấu trúc JSON mong muốn:",
    options.jsonShapeHint
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userText }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: options.responseJsonSchema,
          temperature: options.temperature ?? 0.4
        }
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API lỗi ${response.status}: ${body}`);
  }

  const payload = await response.json();
  const jsonText = extractJsonText(payload);
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const preview = jsonText.slice(0, 600);
    throw new Error(
      `Gemini trả về JSON không parse được: ${error instanceof Error ? error.message : "unknown"}. Preview: ${preview}`
    );
  }

  return options.validator.parse(parsed);
}
