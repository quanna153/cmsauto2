"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FlaskConical, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { buildFactoryRetryHref, shouldShowFactoryRetry } from "@/features/admin/articles/factory-retry";
import { ArticleImagesPanel } from "@/features/admin/factory";
import type { ArticleSession, GeneratedArticleImage, InternalLinkSuggestion } from "@/features/admin/types";
import type { Draft } from "@/features/admin/factory";
import { ApiError, deleteJson, getJson, patchJson, postJson } from "@/lib/api";

export function ArticleEditorFeature({ id }: { id: string }) {
  const client = useQueryClient();
  const router = useRouter();
  const query = useQuery({ queryKey: ["articles"], queryFn: () => getJson<{ articles: ArticleSession[] }>("/articles") });
  const article = query.data?.articles.find((item) => item.id === id);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [linkSuggestions, setLinkSuggestions] = useState<InternalLinkSuggestion[]>([]);
  const [markdown, setMarkdown] = useState("");
  const [publishAtLocal, setPublishAtLocal] = useState("");
  const [revision, setRevision] = useState<number | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("Đang tải...");
  const initializedScheduleFor = useRef<string | null>(null);

  useEffect(() => {
    if (article && revision === null) {
      setDraft(article.draft ?? null);
      setLinkSuggestions(article.linkSuggestions);
      setMarkdown(article.finalMarkdown || article.draft?.markdown || "");
      setRevision(article.revision);
      setSyncMessage("Đã đồng bộ");
    }
  }, [article, revision]);

  useEffect(() => {
    if (!article) return;
    const scheduleKey = `${article.id}:${article.publishAt ?? "default"}`;
    if (initializedScheduleFor.current === scheduleKey) return;
    setPublishAtLocal(toDatetimeLocalValue(article.publishAt ?? defaultPublishAt()));
    initializedScheduleFor.current = scheduleKey;
  }, [article]);

  const save = useMutation({
    mutationFn: async () => {
      if (!article || revision === null) return null;
      return patchJson<{ article: ArticleSession }>(`/articles/${article.id}`, {
        expectedRevision: revision,
        changes: { finalMarkdown: markdown, linkSuggestions, draft: draft ?? undefined }
      });
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
  const remove = useMutation({
    mutationFn: async () => deleteJson(`/articles/${id}`),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["articles"] });
      router.push("/admin/articles");
    }
  });

  useEffect(() => {
    if (!article || revision === null || !hasLocalChanges(article, markdown, linkSuggestions, draft)) return;
    setSyncMessage("Đang chờ tự động lưu...");
    const timer = window.setTimeout(() => save.mutate(), 700);
    return () => window.clearTimeout(timer);
  }, [article, linkSuggestions, markdown, revision, draft]);

  function updateLinkSuggestion(id: string, changes: Partial<InternalLinkSuggestion>) {
    const previous = linkSuggestions.find((item) => item.id === id);
    if (!previous) return;
    const next = { ...previous, ...changes };
    setLinkSuggestions((current) => current.map((item) => item.id === id ? next : item));
    setMarkdown((current) => syncMarkdownLink(current, previous, next));
  }

  async function reviewGate() {
    if (save.isPending) {
      setScheduleMessage("Đang lưu nội dung và internal link, vui lòng chờ trước khi cập nhật lịch đăng.");
      return;
    }

    const publishAt = new Date(publishAtLocal);
    if (!publishAtLocal || Number.isNaN(publishAt.getTime())) {
      setScheduleMessage("Chọn ngày và giờ đăng hợp lệ trước khi duyệt bài.");
      return;
    }

    setReviewBusy(true);
    setScheduleMessage("");
    try {
      if (article && hasLocalChanges(article, markdown, linkSuggestions, draft)) {
        await save.mutateAsync();
      }
      const result = await postJson<{ article: ArticleSession }>(`/articles/${id}/review-gate`, {
        publishAt: publishAt.toISOString()
      });
      setRevision(result.article.revision);
      setPublishAtLocal(toDatetimeLocalValue(result.article.publishAt ?? publishAt.toISOString()));
      setSyncMessage("Đã duyệt và đồng bộ lịch đăng");
      setScheduleMessage("Đã cập nhật lịch đăng bài.");
      client.setQueryData<{ articles: ArticleSession[] }>(["articles"], (current) => ({
        articles: current?.articles.map((item) => item.id === result.article.id ? result.article : item) ?? [result.article]
      }));
    } catch (error) {
      setScheduleMessage(error instanceof Error ? error.message : "Không cập nhật được lịch đăng.");
    } finally {
      setReviewBusy(false);
    }
  }

  function confirmDeleteArticle() {
    const title = article?.draft?.title || article?.inputs.seedKeyword || "bài viết này";
    if (!window.confirm(`Xóa "${title}"? Bài sẽ bị xóa khỏi quản lý bài và public nếu đã publish.`)) {
      return;
    }
    remove.mutate();
  }

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.error) return <ErrorState message={query.error.message} />;
  if (!article) return <ErrorState message="Không tìm thấy bài viết." />;

  const hasUnsavedChanges = hasLocalChanges(article, markdown, linkSuggestions, draft);
  const baseActionLabel = article.reviewStatus === "scheduled"
    ? "Cập nhật lịch đăng"
    : article.reviewStatus === "published"
      ? "Đăng lại thay đổi"
      : "Duyệt & lên lịch";
  const actionLabel = hasUnsavedChanges
    ? `Lưu & ${baseActionLabel.toLocaleLowerCase("vi-VN")}`
    : baseActionLabel;
  const showFactoryRetry = shouldShowFactoryRetry(article);
  const factoryRetryHref = buildFactoryRetryHref(article);

  return <>
    <PageHeader
      actions={<div className="flex flex-wrap gap-2">
        {showFactoryRetry ? <Link
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#172033] bg-[#172033] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#273247]"
          href={factoryRetryHref}
        >
          <FlaskConical size={16} />Tạo lại bằng AI
        </Link> : null}
        <Button disabled={save.isPending || reviewBusy || remove.isPending} onClick={confirmDeleteArticle} variant="danger">
          <Trash2 size={16} />{remove.isPending ? "Đang xóa..." : "Xóa bài"}
        </Button>
        <Button disabled={save.isPending || !hasUnsavedChanges} onClick={() => save.mutate()} variant="secondary">
          <Save size={16} />{save.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
        <Button disabled={save.isPending || reviewBusy || !publishAtLocal} onClick={() => void reviewGate()}>
          <CalendarClock size={16} />{reviewBusy ? "Đang cập nhật..." : actionLabel}
        </Button>
      </div>}
      description={syncMessage}
      eyebrow="Editor"
      title={article.draft?.title || article.inputs.seedKeyword}
    />
    {remove.error ? <div className="mb-5"><ErrorState message={remove.error.message} /></div> : null}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <section className="rounded-xl border bg-white p-5">
          <label className="grid gap-2 mb-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-[#687386]">Nội dung bài viết</span>
            <Textarea className="min-h-[620px] font-mono" onChange={(event) => setMarkdown(event.target.value)} value={markdown} />
          </label>
          <ArticleImagesPanel
            busy={save.isPending}
            images={draft?.generatedImages ?? []}
            draft={draft}
            keyword={article.inputs.seedKeyword}
            onAddImage={(img) => setDraft((prev: Draft | null) => prev ? { ...prev, generatedImages: [img, ...(prev.generatedImages ?? [])] } : null)}
            onAddImages={(imgs) => setDraft((prev: Draft | null) => prev ? { ...prev, generatedImages: [...imgs, ...(prev.generatedImages ?? [])] } : null)}
            onRemoveImage={(id) => setDraft((prev: Draft | null) => prev ? { ...prev, generatedImages: (prev.generatedImages ?? []).filter((i: GeneratedArticleImage) => i.id !== id) } : null)}
          />
        </section>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Internal links trong bài</h2>
          <p className="mt-1 text-sm text-[#687386]">Sửa anchor, URL đích hoặc bỏ link. Link đã chốt sẽ được đồng bộ vào Markdown.</p>
          {linkSuggestions.length === 0
            ? <p className="mt-4 rounded-lg bg-[#f7f7f4] p-3 text-sm text-[#687386]">Bài viết chưa có gợi ý internal link.</p>
            : <div className="mt-4 grid gap-3">
                {linkSuggestions.map((link) =>
                  <article className="grid gap-3 rounded-xl border p-4" key={link.id}>
                    <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_150px]">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-[#687386]">Anchor</span>
                        <Input onChange={(event) => updateLinkSuggestion(link.id, { anchor: event.target.value })} value={link.anchor} />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-[#687386]">URL đích</span>
                        <Input onChange={(event) => updateLinkSuggestion(link.id, { targetUrl: event.target.value })} value={link.targetUrl} />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold text-[#687386]">Trạng thái</span>
                        <Select onChange={(event) => updateLinkSuggestion(link.id, { status: event.target.value as InternalLinkSuggestion["status"] })} value={link.status}>
                          <option value="accepted">Dùng link</option>
                          <option value="pending">Chờ duyệt</option>
                          <option value="rejected">Bỏ link</option>
                        </Select>
                      </label>
                    </div>
                    <p className="text-xs text-[#687386]">{link.reason}</p>
                  </article>
                )}
              </div>}
        </section>
      </div>
      <aside className="space-y-4">
        <section className="rounded-xl border bg-white p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-[#687386]">Trạng thái</p>
          <StatusBadge status={article.reviewStatus} />
          <p className="mt-3 text-xs text-[#687386]">Revision {revision}</p>
          {article.livePath ? <Link className="mt-3 block text-sm font-semibold text-[#80640b]" href={article.livePath}>Mở bài public</Link> : null}
        </section>
        <section className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2"><CalendarClock className="text-[#a88412]" size={17} /><h2 className="font-semibold">Lịch đăng bài</h2></div>
          <p className="mt-2 text-xs leading-5 text-[#687386]">Chọn ngày và giờ theo múi giờ trên thiết bị này trước khi duyệt bài.</p>
          <Input className="mt-3" onChange={(event) => setPublishAtLocal(event.target.value)} type="datetime-local" value={publishAtLocal} />
          {scheduleMessage ? <p className="mt-2 text-xs leading-5 text-[#80640b]">{scheduleMessage}</p> : null}
        </section>
        <section className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold">Review note</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#687386]">{article.reviewNote || "Chưa có ghi chú."}</p>
          {showFactoryRetry ? <Link
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#172033] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#273247]"
            href={factoryRetryHref}
          >
            <FlaskConical size={15} />Quay lại 6 bước để gen lại
          </Link> : null}
        </section>
      </aside>
    </div>
  </>;
}

function hasLocalChanges(article: ArticleSession, markdown: string, linkSuggestions: InternalLinkSuggestion[], draft: Draft | null) {
  return markdown !== (article.finalMarkdown || article.draft?.markdown || "")
    || JSON.stringify(linkSuggestions) !== JSON.stringify(article.linkSuggestions)
    || JSON.stringify(draft) !== JSON.stringify(article.draft ?? null);
}

function syncMarkdownLink(markdown: string, previous: InternalLinkSuggestion, next: InternalLinkSuggestion) {
  const nextMarkup = next.status === "accepted" && next.targetUrl.trim()
    ? `[${next.anchor}](${next.targetUrl})`
    : next.anchor;
  const previousMarkup = previous.targetUrl.trim()
    ? new RegExp(`\\[${escapeRegExp(previous.anchor)}\\]\\(${escapeRegExp(previous.targetUrl)}\\)`, "gi")
    : null;

  if (previousMarkup?.test(markdown)) {
    return markdown.replace(previousMarkup, nextMarkup);
  }

  if (next.status !== "accepted" || !next.targetUrl.trim()) {
    return markdown;
  }

  const lines = markdown.split("\n");
  const anchorMatcher = anchorBoundaryMatcher(next.anchor);
  const lineIndex = lines.findIndex((line) => line.trim() && !line.trim().startsWith("#") && !line.includes("](") && anchorMatcher.test(line));
  if (lineIndex >= 0) {
    lines[lineIndex] = lines[lineIndex].replace(anchorMatcher, (matched) => `[${matched}](${next.targetUrl})`);
    return lines.join("\n");
  }

  return markdown;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function anchorBoundaryMatcher(anchor: string) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(anchor)}(?![\\p{L}\\p{N}])`, "iu");
}

function defaultPublishAt() {
  return new Date(Date.now() + 30 * 60 * 1000).toISOString();
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
