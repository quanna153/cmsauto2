"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/ui/states";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/lib/api";

import type { ArticleSession } from "../types";

type Language = ArticleSession["inputs"]["language"];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function createManualArticle(input: {
  title: string;
  language: Language;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  markdown: string;
}): ArticleSession {
  const now = new Date().toISOString();
  const seedKeyword = input.title.trim();
  const draft = {
    title: input.title.trim(),
    slug: input.slug.trim(),
    excerpt: input.excerpt.trim(),
    metaTitle: input.metaTitle.trim() || input.title.trim(),
    metaDescription: input.metaDescription.trim() || input.excerpt.trim(),
    markdown: input.markdown.trim()
  };

  return {
    id: crypto.randomUUID(),
    revision: 1,
    createdAt: now,
    updatedAt: now,
    inputs: { language: input.language, seedKeyword },
    activeStep: "ready",
    keywordIdeas: [],
    primaryKeywordId: null,
    secondaryKeywordIds: [],
    brief: null,
    outline: null,
    draft,
    linkSuggestions: [],
    finalMarkdown: draft.markdown,
    reviewStatus: "editor_ready",
    reviewNote: "",
    publishAt: null,
    publishedAt: null,
    livePath: null,
    lastPublishError: null
  };
}

export function ManualPostFeature() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<Language>("vi");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedSlug = useMemo(() => slugify(slug || title), [slug, title]);
  const canSubmit = title.trim().length > 0 && resolvedSlug.length > 0 && markdown.trim().length > 0 && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Vui lòng nhập tiêu đề và nội dung Markdown trước khi tạo bài.");
      return;
    }

    setIsSubmitting(true);
    try {
      const article = createManualArticle({
        title,
        language,
        slug: resolvedSlug,
        excerpt,
        metaTitle,
        metaDescription,
        markdown
      });
      const result = await postJson<{ article: ArticleSession }>("/articles", { article });
      router.push(`/admin/articles/${result.article.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Không tạo được bài viết. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        description="Tạo bài viết thủ công, lưu vào danh sách bài để biên tập và lên lịch xuất bản."
        eyebrow="Admin"
        title="Đăng bài thủ công"
      />

      <form className="grid gap-5 rounded-xl border bg-white p-5" onSubmit={handleSubmit}>
        {error ? <ErrorState message={error} /> : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <label className="grid gap-1 text-sm font-semibold">
            Tiêu đề
            <Input onChange={(event) => setTitle(event.target.value)} placeholder="Nhập tiêu đề bài viết" value={title} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Ngôn ngữ
            <Select onChange={(event) => setLanguage(event.target.value as Language)} value={language}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </Select>
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Slug
          <Input
            onChange={(event) => setSlug(event.target.value)}
            placeholder={resolvedSlug || "slug-tu-dong-theo-tieu-de"}
            value={slug}
          />
          <span className="text-xs font-normal text-[#687386]">Slug sẽ dùng: {resolvedSlug || "chưa có"}</span>
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          Tóm tắt
          <Textarea
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="Tóm tắt ngắn hiển thị ở danh sách bài viết"
            rows={3}
            value={excerpt}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Meta title
            <Input onChange={(event) => setMetaTitle(event.target.value)} placeholder="Để trống sẽ dùng tiêu đề" value={metaTitle} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Meta description
            <Input
              onChange={(event) => setMetaDescription(event.target.value)}
              placeholder="Để trống sẽ dùng tóm tắt"
              value={metaDescription}
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          Nội dung Markdown
          <Textarea
            className="min-h-72 font-mono"
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder="# Tiêu đề phụ&#10;&#10;Viết nội dung bài tại đây..."
            value={markdown}
          />
        </label>

        <div className="flex justify-end">
          <Button disabled={!canSubmit} type="submit">
            {isSubmitting ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
            {isSubmitting ? "Đang tạo..." : "Tạo bài viết"}
          </Button>
        </div>
      </form>
    </>
  );
}
