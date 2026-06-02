"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import type { ArticleLibraryItem } from "@/features/admin/types";
import { deleteJson, getJson, postJson } from "@/lib/api";

export function InternalLinksFeature() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["article-library"], queryFn: () => getJson<{ articles: ArticleLibraryItem[] }>("/article-library") });
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const create = useMutation({
    mutationFn: () => postJson("/article-library", { id: crypto.randomUUID(), title, url, language, summary: "", keywords: [] }),
    onSuccess: async () => { setTitle(""); setUrl(""); await client.invalidateQueries({ queryKey: ["article-library"] }); }
  });
  const remove = useMutation({ mutationFn: (id: string) => deleteJson(`/article-library/${id}`), onSuccess: async () => client.invalidateQueries({ queryKey: ["article-library"] }) });

  return <><PageHeader description="Kho link dùng chung. Mỗi thay đổi là CRUD từng item để tránh ghi đè danh sách của người khác." eyebrow="Admin" title="Internal link library" /><section className="mb-5 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_1fr_140px_auto]"><Input onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề bài" value={title} /><Input onChange={(event) => setUrl(event.target.value)} placeholder="/vi-vn/slug" value={url} /><Select onChange={(event) => setLanguage(event.target.value as "vi" | "en")} value={language}><option value="vi">Tiếng Việt</option><option value="en">English</option></Select><Button disabled={!title || !url || create.isPending} onClick={() => create.mutate()}><Plus size={16} />Thêm</Button></section>{query.isLoading ? <LoadingSkeleton /> : query.error ? <ErrorState message={query.error.message} /> : !query.data?.articles.length ? <EmptyState description="Thêm bài đã có để AI gợi ý link nội bộ." title="Kho link đang trống" /> : <div className="grid gap-3">{query.data.articles.map((article) => <article className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4" key={article.id}><div><strong>{article.title}</strong><p className="text-sm text-[#687386]">{article.url}</p></div><Button aria-label="Xóa link" onClick={() => remove.mutate(article.id)} size="sm" variant="ghost"><Trash2 size={16} /></Button></article>)}</div>}</>;
}

