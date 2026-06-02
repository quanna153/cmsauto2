"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleSession } from "@/features/admin/types";
import { ApiError, getJson, patchJson, postJson } from "@/lib/api";

export function ArticleEditorFeature({ id }: { id: string }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["articles"], queryFn: () => getJson<{ articles: ArticleSession[] }>("/articles") });
  const article = query.data?.articles.find((item) => item.id === id);
  const [markdown, setMarkdown] = useState("");
  const [revision, setRevision] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState("Đang tải...");

  useEffect(() => {
    if (article && revision === null) {
      setMarkdown(article.finalMarkdown || article.draft?.markdown || "");
      setRevision(article.revision);
      setSyncMessage("Đã đồng bộ");
    }
  }, [article, revision]);

  const save = useMutation({
    mutationFn: async () => {
      if (!article || revision === null) return null;
      return patchJson<{ article: ArticleSession }>(`/articles/${article.id}`, { expectedRevision: revision, changes: { finalMarkdown: markdown } });
    },
    onSuccess(result) {
      if (!result) return;
      setRevision(result.article.revision);
      setSyncMessage("Đã tự động lưu");
      client.setQueryData<{ articles: ArticleSession[] }>(["articles"], (current) => ({ articles: current?.articles.map((item) => item.id === result.article.id ? result.article : item) ?? [result.article] }));
    },
    onError(error) {
      setSyncMessage(error instanceof ApiError && error.status === 409 ? "Có phiên sửa mới hơn. Tải lại trang trước khi tiếp tục." : error.message);
    }
  });

  useEffect(() => {
    if (!article || revision === null || markdown === (article.finalMarkdown || article.draft?.markdown || "")) return;
    setSyncMessage("Đang chờ tự động lưu...");
    const timer = window.setTimeout(() => save.mutate(), 700);
    return () => window.clearTimeout(timer);
  }, [article, markdown, revision]);

  async function reviewGate() {
    await postJson(`/articles/${id}/review-gate`, {});
    await client.invalidateQueries({ queryKey: ["articles"] });
  }

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.error) return <ErrorState message={query.error.message} />;
  if (!article) return <ErrorState message="Không tìm thấy bài viết." />;

  return <><PageHeader actions={<Button onClick={() => void reviewGate()}><Save size={16} />Duyệt & lên lịch</Button>} description={syncMessage} eyebrow="Fallback editor" title={article.draft?.title || article.inputs.seedKeyword} /><div className="grid gap-5 lg:grid-cols-[1fr_280px]"><section className="rounded-xl border bg-white p-5"><Textarea className="min-h-[620px] font-mono" onChange={(event) => setMarkdown(event.target.value)} value={markdown} /></section><aside className="space-y-4"><section className="rounded-xl border bg-white p-4"><p className="mb-2 text-xs uppercase tracking-wide text-[#687386]">Trạng thái</p><StatusBadge status={article.reviewStatus} /><p className="mt-3 text-xs text-[#687386]">Revision {revision}</p>{article.livePath ? <Link className="mt-3 block text-sm font-semibold text-[#80640b]" href={article.livePath}>Mở bài public</Link> : null}</section><section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Review note</h2><p className="mt-2 whitespace-pre-wrap text-sm text-[#687386]">{article.reviewNote || "Chưa có ghi chú."}</p></section></aside></div></>;
}

