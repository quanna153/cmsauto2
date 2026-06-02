"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import type { ArticleLibraryItem } from "@/features/admin/types";
import { deleteJson, getJson, patchJson, postJson } from "@/lib/api";

function parseKeywordLabels(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[,;\n]+/)
    .map((label) => label.trim().replace(/^#+/, "").trim())
    .filter((label) => {
      const key = label.toLocaleLowerCase();
      if (!label || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatKeywordLabels(labels: string[]) {
  return labels.map((label) => `#${label}`).join(", ");
}

export function InternalLinksFeature() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["article-library"],
    queryFn: () => getJson<{ articles: ArticleLibraryItem[] }>("/article-library")
  });
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [keywordLabels, setKeywordLabels] = useState("");
  const parsedKeywords = parseKeywordLabels(keywordLabels);
  const create = useMutation({
    mutationFn: () => postJson("/article-library", {
      id: crypto.randomUUID(),
      title,
      url,
      language,
      summary: "",
      keywords: parsedKeywords
    }),
    onSuccess: async () => {
      setTitle("");
      setUrl("");
      setKeywordLabels("");
      await client.invalidateQueries({ queryKey: ["article-library"] });
    }
  });
  const updateArticle = useMutation({
    mutationFn: ({ article, changes }: { article: ArticleLibraryItem; changes: Pick<ArticleLibraryItem, "title" | "url" | "keywords"> }) =>
      patchJson(`/article-library/${article.id}`, {
        expectedRevision: article.revision,
        changes
      }),
    onSuccess: async () => client.invalidateQueries({ queryKey: ["article-library"] })
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteJson(`/article-library/${id}`),
    onSuccess: async () => client.invalidateQueries({ queryKey: ["article-library"] })
  });

  return <>
    <PageHeader
      description="Kho link dùng chung. AI chỉ match bài có hashtag/keyword trùng với anchor xuất hiện trong bản nháp."
      eyebrow="Admin"
      title="Internal link library"
    />
    <section className="mb-5 grid gap-3 rounded-xl border bg-white p-4 lg:grid-cols-[1fr_1fr_140px_auto]">
      <Input onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề bài" value={title} />
      <Input onChange={(event) => setUrl(event.target.value)} placeholder="/vi-vn/slug" value={url} />
      <Select onChange={(event) => setLanguage(event.target.value as "vi" | "en")} value={language}>
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </Select>
      <Button disabled={!title || !url || parsedKeywords.length === 0 || create.isPending} onClick={() => create.mutate()}>
        <Plus size={16} />Thêm
      </Button>
      <label className="grid gap-1 lg:col-span-4">
        <span className="text-xs font-semibold text-[#566174]">Hashtag / keyword để AI match, ngăn cách bằng dấu phẩy</span>
        <Input
          onChange={(event) => setKeywordLabels(event.target.value)}
          placeholder="#bitcoin, #blockchain, bitcoin là gì"
          value={keywordLabels}
        />
      </label>
    </section>
    {create.error ? <div className="mb-5"><ErrorState message={create.error.message} /></div> : null}
    {updateArticle.error ? <div className="mb-5"><ErrorState message={updateArticle.error.message} /></div> : null}
    {query.isLoading
      ? <LoadingSkeleton />
      : query.error
        ? <ErrorState message={query.error.message} />
        : !query.data?.articles.length
          ? <EmptyState description="Thêm bài đã có cùng hashtag để AI gợi ý link nội bộ." title="Kho link đang trống" />
          : <div className="grid gap-3">
              {query.data.articles.map((article) =>
                <ArticleLibraryCard
                  article={article}
                  isPending={updateArticle.isPending}
                  key={article.id}
                  onRemove={() => remove.mutate(article.id)}
                  onSave={(changes) => updateArticle.mutate({ article, changes })}
                />
              )}
            </div>}
  </>;
}

function ArticleLibraryCard({
  article,
  isPending,
  onRemove,
  onSave
}: {
  article: ArticleLibraryItem;
  isPending: boolean;
  onRemove: () => void;
  onSave: (changes: Pick<ArticleLibraryItem, "title" | "url" | "keywords">) => void;
}) {
  const [title, setTitle] = useState(article.title);
  const [url, setUrl] = useState(article.url);
  const [keywordLabels, setKeywordLabels] = useState(formatKeywordLabels(article.keywords));
  const parsedKeywords = parseKeywordLabels(keywordLabels);

  return <article className="rounded-xl border bg-white p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <strong>{title}</strong>
        <p className="text-sm text-[#687386]">{url}</p>
      </div>
      <Button aria-label="Xóa link" onClick={onRemove} size="sm" variant="ghost"><Trash2 size={16} /></Button>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      {article.keywords.length > 0
        ? article.keywords.map((keyword) => <Badge key={keyword}>#{keyword}</Badge>)
        : <p className="text-xs font-semibold text-red-600">Chưa có hashtag nên AI không thể match bài này.</p>}
    </div>
    <div className="mt-3 grid gap-2">
      <Input
        aria-label={`Tiêu đề cho ${article.title}`}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Tiêu đề bài"
        value={title}
      />
      <Input
        aria-label={`URL cho ${article.title}`}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="/vi-vn/slug hoặc https://..."
        value={url}
      />
      <Input
        aria-label={`Hashtag cho ${article.title}`}
        onChange={(event) => setKeywordLabels(event.target.value)}
        placeholder="#bitcoin, #blockchain"
        value={keywordLabels}
      />
      <div><Button
        aria-label={`Lưu thay đổi cho ${article.title}`}
        disabled={!title.trim() || !url.trim() || parsedKeywords.length === 0 || isPending}
        onClick={() => onSave({ title: title.trim(), url: url.trim(), keywords: parsedKeywords })}
        size="sm"
        variant="secondary"
      >
        <Save size={15} />Lưu thay đổi
      </Button></div>
    </div>
  </article>;
}
