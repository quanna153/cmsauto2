import type { ArticleSession } from "@/features/admin/types";
import { postJson } from "@/lib/api";

export type ManualPostInput = {
  title: string;
  content: string;
};

export type ManualScheduledPostInput = ManualPostInput & {
  publishAt: string;
};

export function createManualPost(input: ManualPostInput) {
  return postJson<{ article: ArticleSession }>("/articles/manual", input);
}

export function scheduleManualPost(input: ManualScheduledPostInput) {
  return postJson<{ article: ArticleSession }>("/articles/manual/schedule", input);
}

export function saveManualPostDraft(input: ManualPostInput) {
  const now = new Date().toISOString();
  const slug = slugify(input.title);

  return postJson<{ article: ArticleSession }>("/articles", {
    article: {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      inputs: {
        language: "vi",
        seedKeyword: input.title
      },
      activeStep: "ready",
      keywordIdeas: [],
      primaryKeywordId: null,
      secondaryKeywordIds: [],
      brief: null,
      outline: null,
      draft: {
        title: input.title,
        slug,
        excerpt: "",
        metaTitle: input.title,
        metaDescription: "",
        markdown: input.content
      },
      linkSuggestions: [],
      finalMarkdown: input.content,
      reviewNote: "Lưu nháp thủ công."
    }
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "ban-nhap";
}
