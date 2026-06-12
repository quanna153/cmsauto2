"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Link2, RotateCcw, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { HistoryRecord, InternalLinkSuggestion } from "@/features/admin/types";
import { getJson, postJson } from "@/lib/api";

type Language = "vi" | "en";
type SuggestResponse = {
  suggestions: InternalLinkSuggestion[];
  mappingCsv?: string;
  recordId?: string;
};
type ApplyResponse = {
  markdown: string;
  recordId?: string;
};

const defaultPrompt = [
  "Chọn internal link phù hợp nhất từ candidate_articles đã được backend lọc trước.",
  "Anchor phải là cụm từ xuất hiện nguyên văn trong draft_markdown.",
  "targetUrl phải copy đúng từ candidate_articles. Trả strict JSON theo schema."
].join("\n");

export function InternalLinkToolFeature() {
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState<Language>("vi");
  const [suggestions, setSuggestions] = useState<InternalLinkSuggestion[]>([]);
  const [manualRematchSuggestionIds, setManualRematchSuggestionIds] = useState<Set<string>>(() => new Set());
  const [rejectedSuggestionHistory, setRejectedSuggestionHistory] = useState<InternalLinkSuggestion[]>([]);
  const [outputMarkdown, setOutputMarkdown] = useState("");
  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: () => getJson<{ records: HistoryRecord[] }>("/history")
  });
  const linkHistory = useMemo(() => {
    return (historyQuery.data?.records ?? [])
      .filter((record) => record.step === "links" || record.step === "apply-links")
      .slice(0, 8);
  }, [historyQuery.data?.records]);

  const suggest = useMutation({
    mutationFn: (options?: { expandSuggestions?: boolean; regenerateRejected?: boolean }) => {
      const expandSuggestions = Boolean(options?.expandSuggestions);
      const shouldRegenerateRejected = Boolean(options?.regenerateRejected || manualRematchSuggestionIds.size > 0);
      const requestSuggestions = suggestions.map((suggestion) => shouldRegenerateRejected && !expandSuggestions && manualRematchSuggestionIds.has(suggestion.id)
        ? { ...suggestion, sourceContext: "", status: "rejected" as const }
        : suggestion);
      const rejectedSuggestions = shouldRegenerateRejected
        ? mergeRejectedSuggestionHistory(
          rejectedSuggestionHistory,
          requestSuggestions.filter((suggestion) => suggestion.status === "rejected")
        )
        : [];
      return postJson<SuggestResponse>("/links/suggest", {
        primaryKeyword: title.trim(),
        secondaryKeywords: [title.trim()],
        language,
        prompt: defaultPrompt,
        draft: buildDraft(title, content),
        existingSuggestions: requestSuggestions,
        preservedSuggestions: requestSuggestions.filter((suggestion) => suggestion.status !== "rejected"),
        rejectedSuggestions: expandSuggestions ? [] : rejectedSuggestions,
        expandSuggestions
      });
    },
    onSuccess: async (result) => {
      setSuggestions(result.suggestions);
      setManualRematchSuggestionIds(new Set());
      setOutputMarkdown("");
      await client.invalidateQueries({ queryKey: ["history"] });
    }
  });

  const apply = useMutation({
    mutationFn: () => postJson<ApplyResponse>("/links/apply", {
      markdown: content,
      suggestions
    }),
    onSuccess: async (result) => {
      setOutputMarkdown(result.markdown);
      await client.invalidateQueries({ queryKey: ["history"] });
    }
  });

  useEffect(() => {
    if (!outputMarkdown) return;
    setContent(outputMarkdown);
  }, [outputMarkdown]);

  const acceptedCount = suggestions.filter((suggestion) => suggestion.status === "accepted").length;
  const busy = suggest.isPending || apply.isPending;

  function updateSuggestion(id: string, changes: Partial<InternalLinkSuggestion>) {
    const nextChanges = typeof changes.anchor === "string"
      ? { ...changes, status: "pending" as const }
      : changes;
    if (typeof changes.anchor === "string") {
      setManualRematchSuggestionIds((current) => new Set(current).add(id));
    }
    if (changes.status === "rejected") {
      const rejectedSuggestion = suggestions.find((suggestion) => suggestion.id === id);
      if (rejectedSuggestion) {
        setRejectedSuggestionHistory((current) =>
          mergeRejectedSuggestionHistory(current, [{ ...rejectedSuggestion, ...nextChanges, status: "rejected" }])
        );
      }
    }
    setSuggestions((current) => current.map((suggestion) => suggestion.id === id ? { ...suggestion, ...nextChanges } : suggestion));
  }

  function restoreHistory(record: HistoryRecord) {
    const request = record.request as Partial<{
      language: Language;
      draft: { title?: string; markdown?: string };
    }> | null;
    const response = record.response as Partial<{
      suggestions: InternalLinkSuggestion[];
      markdown: string;
    }> | null;

    setTitle(request?.draft?.title ?? title);
    setContent(response?.markdown ?? request?.draft?.markdown ?? content);
    setLanguage(request?.language ?? language);
    setSuggestions(response?.suggestions ?? []);
    setManualRematchSuggestionIds(new Set());
    setRejectedSuggestionHistory([]);
    setOutputMarkdown(response?.markdown ?? "");
  }

  return <>
    <PageHeader
      description="Dùng Kho links hiện có để gợi ý và chèn internal link cho bài viết viết bên ngoài hệ thống."
      eyebrow="Admin"
      title="Internal links"
    />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <section className="grid gap-4 rounded-xl border bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#566174]">Tiêu đề bài viết</span>
              <Input onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Bitcoin là gì" value={title} />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#566174]">Ngôn ngữ</span>
              <Select onChange={(event) => setLanguage(event.target.value as Language)} value={language}>
                <option value="vi">Vietnamese</option>
                <option value="en">English</option>
              </Select>
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#566174]">Nội dung / Markdown</span>
            <Textarea className="min-h-[360px] font-mono" onChange={(event) => setContent(event.target.value)} placeholder="Dán bài viết ngoài vào đây..." value={content} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !title.trim() || !content.trim()} onClick={() => suggest.mutate({})} type="button">
              <WandSparkles size={16} />Gợi ý internal link
            </Button>
            {suggestions.length ? <Button disabled={busy || !title.trim() || !content.trim()} onClick={() => suggest.mutate({ regenerateRejected: true })} type="button" variant="secondary">
              <WandSparkles size={16} />Gợi ý lại link
            </Button> : null}
            {suggestions.length ? <Button disabled={busy || !title.trim() || !content.trim()} onClick={() => suggest.mutate({ expandSuggestions: true })} type="button" variant="secondary">
              <WandSparkles size={16} />Gợi ý thêm link
            </Button> : null}
            <Button disabled={busy || suggestions.length === 0 || acceptedCount === 0} onClick={() => apply.mutate()} type="button" variant="secondary">
              <CheckCircle2 size={16} />Chèn link đã chọn
            </Button>
          </div>
        </section>

        {suggest.error ? <ErrorState message={suggest.error.message} /> : null}
        {apply.error ? <ErrorState message={apply.error.message} /> : null}

        <section className="rounded-xl border bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-[#172033]">Gợi ý link</h2>
              <p className="mt-1 text-sm text-[#687386]">{acceptedCount}/{suggestions.length} link đang được chọn.</p>
            </div>
          </div>
          {suggest.isPending
            ? <LoadingSkeleton label="Đang lọc Kho links và gọi AI chọn link phù hợp..." />
            : suggestions.length === 0
              ? <EmptyState description="Nhập tiêu đề và nội dung rồi bấm gợi ý internal link." title="Chưa có gợi ý" />
              : <div className="grid gap-3">
                  {suggestions.map((suggestion) => <SuggestionCard
                    key={suggestion.id}
                    onChange={(changes) => updateSuggestion(suggestion.id, changes)}
                    suggestion={suggestion}
                  />)}
                </div>}
        </section>

        {outputMarkdown ? <section className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold text-[#172033]">Output đã chèn link</h2>
          <Textarea className="mt-3 min-h-[300px] font-mono" onChange={(event) => setOutputMarkdown(event.target.value)} value={outputMarkdown} />
        </section> : null}
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2">
            <Link2 className="text-[#a88412]" size={17} />
            <h2 className="font-semibold text-[#172033]">Lịch sử internal link</h2>
          </div>
          {historyQuery.isLoading
            ? <div className="mt-4"><LoadingSkeleton label="Đang tải lịch sử..." /></div>
            : linkHistory.length === 0
              ? <p className="mt-4 rounded-lg bg-[#f7f7f4] p-3 text-sm text-[#687386]">Chưa có lần gợi ý hoặc chèn link nào.</p>
              : <div className="mt-4 grid gap-2">
                  {linkHistory.map((record) => <button
                    className="rounded-lg border bg-white p-3 text-left text-sm transition hover:border-[#d2b34d] hover:bg-[#fcfbf7]"
                    key={record.id}
                    onClick={() => restoreHistory(record)}
                    type="button"
                  >
                    <span className="block font-semibold text-[#172033]">{historyTitle(record)}</span>
                    <span className="mt-1 block text-xs text-[#687386]">{new Date(record.createdAt).toLocaleString("vi-VN")}</span>
                  </button>)}
                </div>}
        </section>
        <Button className="w-full" onClick={() => {
          setTitle("");
          setContent("");
          setSuggestions([]);
          setManualRematchSuggestionIds(new Set());
          setRejectedSuggestionHistory([]);
          setOutputMarkdown("");
        }} type="button" variant="secondary">
          <RotateCcw size={16} />Làm bài khác
        </Button>
      </aside>
    </div>
  </>;
}

function SuggestionCard({
  suggestion,
  onChange
}: {
  suggestion: InternalLinkSuggestion;
  onChange: (changes: Partial<InternalLinkSuggestion>) => void;
}) {
  return <article className="grid gap-3 rounded-xl border p-4">
    <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_150px]">
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-[#687386]">Anchor</span>
        <Input onChange={(event) => onChange({ anchor: event.target.value })} value={suggestion.anchor} />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-[#687386]">URL đích</span>
        <Input onChange={(event) => onChange({ targetUrl: event.target.value })} value={suggestion.targetUrl} />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-[#687386]">Trạng thái</span>
        <Select onChange={(event) => onChange({ status: event.target.value as InternalLinkSuggestion["status"] })} value={suggestion.status}>
          <option value="accepted">Dùng link</option>
          <option value="pending">Chờ duyệt</option>
          <option value="rejected">Bỏ link</option>
        </Select>
      </label>
    </div>
    <div className="grid gap-1 text-xs text-[#687386]">
      <span><strong className="text-[#273247]">{suggestion.targetTitle}</strong></span>
      <span>{suggestion.reason}</span>
      <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
    </div>
  </article>;
}

function buildDraft(title: string, markdown: string) {
  const normalizedTitle = title.trim();
  const normalizedMarkdown = markdown.trim();
  return {
    title: normalizedTitle,
    slug: slugify(normalizedTitle),
    excerpt: normalizedMarkdown.split(/\n+/)[0]?.slice(0, 180) ?? "",
    metaTitle: normalizedTitle,
    metaDescription: normalizedMarkdown.slice(0, 160),
    markdown: normalizedMarkdown
  };
}

function mergeRejectedSuggestionHistory(
  current: InternalLinkSuggestion[],
  next: InternalLinkSuggestion[]
) {
  const merged = new Map(current.map((suggestion) => [rejectedSuggestionKey(suggestion), suggestion]));
  for (const suggestion of next) {
    if (suggestion.anchor.trim() && suggestion.targetUrl.trim()) {
      merged.set(rejectedSuggestionKey(suggestion), suggestion);
    }
  }
  return Array.from(merged.values());
}

function rejectedSuggestionKey(suggestion: InternalLinkSuggestion) {
  return `${suggestion.anchor.trim().toLowerCase()}::${suggestion.targetUrl.trim().toLowerCase()}`;
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
    || "external-article";
}

function historyTitle(record: HistoryRecord) {
  const request = record.request as Partial<{ draft: { title?: string } }> | null;
  const title = request?.draft?.title?.trim() || "Bài ngoài";
  return record.step === "apply-links" ? `Đã chèn link: ${title}` : `Gợi ý: ${title}`;
}
