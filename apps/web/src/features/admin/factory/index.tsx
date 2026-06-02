"use client";

import { CheckCircle2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import type { ArticleSession, InternalLinkSuggestion } from "@/features/admin/types";
import { postJson } from "@/lib/api";

type Keyword = ArticleSession["keywordIdeas"][number];
type Brief = NonNullable<ArticleSession["brief"]>;
type Outline = NonNullable<ArticleSession["outline"]>;
type Draft = NonNullable<ArticleSession["draft"]>;
type Step = ArticleSession["activeStep"];

const prompts = {
  keywords: "Đề xuất keyword cluster rõ ràng cho {{keyword}}.",
  brief: "Tạo brief SEO cho {{primary_keyword}}.",
  outline: "Tạo outline thực dụng cho {{primary_keyword}}.",
  draft: "Viết bài hoàn chỉnh theo outline cho {{primary_keyword}}.",
  links: "Đề xuất anchor internal link phù hợp cho bài."
};

export function FactoryFeature() {
  const router = useRouter();
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [seedKeyword, setSeedKeyword] = useState("");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [primaryKeywordId, setPrimaryKeywordId] = useState<string | null>(null);
  const [secondaryKeywordIds, setSecondaryKeywordIds] = useState<string[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [links, setLinks] = useState<InternalLinkSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primary = keywords.find((item) => item.id === primaryKeywordId);
  const secondary = keywords.filter((item) => secondaryKeywordIds.includes(item.id));
  const activeStep: Step = !keywords.length ? "keywords" : !brief ? "brief" : !outline ? "outline" : !draft ? "draft" : !links.length ? "links" : "ready";

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try { await action(); } catch (runError) { setError(runError instanceof Error ? runError.message : "Không chạy được bước này."); } finally { setBusy(false); }
  }

  async function generateKeywords() {
    const result = await postJson<{ keywordIdeas: Keyword[] }>("/keywords/suggest", { seedKeyword, language, prompt: prompts.keywords });
    setKeywords(result.keywordIdeas);
    setPrimaryKeywordId(result.keywordIdeas[0]?.id ?? null);
    setSecondaryKeywordIds(result.keywordIdeas.slice(1, 4).map((item) => item.id));
  }

  async function generateBrief() {
    if (!primary) return;
    const result = await postJson<{ brief: Brief }>("/brief/generate", { primaryKeyword: primary.keyword, secondaryKeywords: secondary.map((item) => item.keyword), language, prompt: prompts.brief });
    setBrief(result.brief);
  }

  async function generateOutline() {
    if (!primary || !brief) return;
    const result = await postJson<{ outline: Outline }>("/outline/generate", { primaryKeyword: primary.keyword, secondaryKeywords: secondary.map((item) => item.keyword), language, prompt: prompts.outline, brief });
    setOutline(result.outline);
  }

  async function generateDraft() {
    if (!primary || !outline) return;
    const result = await postJson<{ draft: Draft }>("/draft/generate", { primaryKeyword: primary.keyword, secondaryKeywords: secondary.map((item) => item.keyword), language, prompt: prompts.draft, outline });
    setDraft(result.draft);
  }

  async function generateLinks() {
    if (!primary || !draft) return;
    const result = await postJson<{ suggestions: InternalLinkSuggestion[] }>("/links/suggest", { primaryKeyword: primary.keyword, secondaryKeywords: secondary.map((item) => item.keyword), language, prompt: prompts.links, draft });
    setLinks(result.suggestions.map((link) => ({ ...link, status: link.targetUrl ? "accepted" : "pending" })));
  }

  async function finish() {
    if (!draft) return;
    const applied = await postJson<{ markdown: string }>("/links/apply", { markdown: draft.markdown, suggestions: links });
    const now = new Date().toISOString();
    const article: ArticleSession = {
      id: crypto.randomUUID(), revision: 1, createdAt: now, updatedAt: now,
      inputs: { language, seedKeyword }, activeStep: "ready", keywordIdeas: keywords,
      primaryKeywordId, secondaryKeywordIds, brief, outline, draft, linkSuggestions: links,
      finalMarkdown: applied.markdown, reviewStatus: "editor_ready", reviewNote: "",
      publishAt: null, publishedAt: null, livePath: null, lastPublishError: null
    };
    await postJson("/articles", { article });
    router.push("/admin/articles");
  }

  return <><PageHeader description="Flow thật từ keyword tới bài sẵn sàng duyệt. Mỗi bước chỉ mở sau khi đầu ra trước đó đã có." eyebrow="Article Factory" title="Tạo bài viết bằng AI" /><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><section className="rounded-xl border bg-white p-5"><div className="mb-5 grid gap-3 sm:grid-cols-[160px_1fr_auto]"><Select onChange={(event) => setLanguage(event.target.value as "vi" | "en")} value={language}><option value="vi">Tiếng Việt</option><option value="en">English</option></Select><Input onChange={(event) => setSeedKeyword(event.target.value)} placeholder="Nhập từ khóa gốc" value={seedKeyword} /><Button disabled={busy || !seedKeyword.trim()} onClick={() => void run(generateKeywords)}><Wand2 size={16} />Gợi ý keyword</Button></div>{error ? <ErrorState message={error} /> : null}<div className="mt-5 grid gap-3">{keywords.map((keyword) => <label className="flex items-center gap-3 rounded-lg border p-3" key={keyword.id}><input checked={keyword.id === primaryKeywordId} name="primary-keyword" onChange={() => setPrimaryKeywordId(keyword.id)} type="radio" /><span className="min-w-0 flex-1"><strong className="block">{keyword.keyword}</strong><small className="text-[#687386]">{keyword.intent} · {keyword.provider}</small></span><span className="text-sm font-semibold">{keyword.monthlyVolume ?? "N/A"}</span></label>)}</div></section><aside className="rounded-xl border bg-white p-5"><h2 className="font-bold">Tiến trình</h2><p className="mt-1 text-sm text-[#687386]">Bước hiện tại: <strong>{activeStep}</strong></p><div className="mt-5 grid gap-2"><StepButton disabled={!primary || busy || Boolean(brief)} label="Sinh brief" onClick={() => void run(generateBrief)} ready={Boolean(brief)} /><StepButton disabled={!brief || busy || Boolean(outline)} label="Sinh outline" onClick={() => void run(generateOutline)} ready={Boolean(outline)} /><StepButton disabled={!outline || busy || Boolean(draft)} label="Sinh draft" onClick={() => void run(generateDraft)} ready={Boolean(draft)} /><StepButton disabled={!draft || busy || Boolean(links.length)} label="Gợi ý link" onClick={() => void run(generateLinks)} ready={Boolean(links.length)} /><StepButton disabled={!draft || busy || !links.length} label="Lưu bài để duyệt" onClick={() => void run(finish)} ready={false} /></div></aside></div></>;
}

function StepButton({ label, disabled, ready, onClick }: { label: string; disabled: boolean; ready: boolean; onClick: () => void }) {
  return <Button className="justify-start" disabled={disabled} onClick={onClick} variant={ready ? "secondary" : "primary"}>{ready ? <CheckCircle2 size={16} /> : <Wand2 size={16} />}{label}</Button>;
}
