"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  FileCheck2,
  FileText,
  Link2,
  ListTree,
  RotateCcw,
  Save,
  Search,
  Settings,
  Wand2,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ArticleSession, InternalLinkSuggestion } from "@/features/admin/types";
import { getJson, postJson } from "@/lib/api";

type Keyword = ArticleSession["keywordIdeas"][number];
type Brief = NonNullable<ArticleSession["brief"]>;
type Outline = NonNullable<ArticleSession["outline"]>;
type Draft = NonNullable<ArticleSession["draft"]>;
type Step = ArticleSession["activeStep"];
type AiStep = Exclude<Step, "ready">;
type PromptTemplates = Record<AiStep, string>;
type PromptRecord = { key: AiStep; value: string; revision: number; updatedAt: string };
type CompletedSteps = Record<Step, boolean>;

const fallbackPrompts: PromptTemplates = {
  keywords: "Đề xuất keyword cluster rõ ràng cho {{keyword}}.",
  brief: "Tạo brief SEO cho {{primary_keyword}}.",
  outline: "Tạo outline thực dụng cho {{primary_keyword}}.",
  draft: "Viết bài hoàn chỉnh theo outline cho {{primary_keyword}}.",
  links: "Đề xuất anchor internal link phù hợp cho bài."
};

const workflowStages: Array<{
  key: Step;
  number: string;
  shortLabel: string;
  title: string;
  description: string;
  icon: typeof Search;
}> = [
  { key: "keywords", number: "01", shortLabel: "Từ khóa", title: "Từ khóa", description: "Nhập chủ đề, lấy keyword và chốt từ khóa chính cùng bộ từ khóa phụ.", icon: Search },
  { key: "brief", number: "02", shortLabel: "Định hướng bài", title: "Định hướng bài", description: "Kiểm tra search intent, góc triển khai và semantic topics trước khi dựng dàn ý.", icon: FileText },
  { key: "outline", number: "03", shortLabel: "Dàn ý", title: "Dàn ý bài viết", description: "Review cấu trúc nội dung và các ý chính để tránh sinh draft sai hướng.", icon: ListTree },
  { key: "draft", number: "04", shortLabel: "Bản nháp", title: "Bản nháp", description: "Đọc metadata và nội dung Markdown đã sinh trước khi gắn link nội bộ.", icon: FileText },
  { key: "links", number: "05", shortLabel: "Link nội bộ", title: "Link nội bộ", description: "Chọn link phù hợp, bỏ link sai ngữ cảnh và kiểm tra anchor trước khi bàn giao.", icon: Link2 },
  { key: "ready", number: "06", shortLabel: "Bàn giao", title: "Bàn giao bài viết", description: "Kiểm tra lần cuối rồi lưu bài vào danh sách chờ duyệt.", icon: FileCheck2 }
];

export function FactoryFeature() {
  const router = useRouter();
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [seedKeyword, setSeedKeyword] = useState("");
  const [semrushToken, setSemrushToken] = useState("");

  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("");
  const [tavilyApiKey, setTavilyApiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const savedSemrush = localStorage.getItem("cmsauto_semrush_token");
    if (savedSemrush) setSemrushToken(savedSemrush);

    const savedGeminiKey = localStorage.getItem("cmsauto_gemini_api_key");
    if (savedGeminiKey) setGeminiApiKey(savedGeminiKey);

    const savedGeminiModel = localStorage.getItem("cmsauto_gemini_model");
    if (savedGeminiModel) setGeminiModel(savedGeminiModel);

    const savedTavilyKey = localStorage.getItem("cmsauto_tavily_api_key");
    if (savedTavilyKey) setTavilyApiKey(savedTavilyKey);
  }, []);

  function handleConfigChange(key: string, value: string, setter: (val: string) => void) {
    setter(value);
    localStorage.setItem(key, value);
  }
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [primaryKeywordId, setPrimaryKeywordId] = useState<string | null>(null);
  const [secondaryKeywordIds, setSecondaryKeywordIds] = useState<string[]>([]);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [links, setLinks] = useState<InternalLinkSuggestion[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplates>(fallbackPrompts);
  const [promptsHydrated, setPromptsHydrated] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step>("keywords");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const promptQuery = useQuery({
    queryKey: ["prompts"],
    queryFn: () => getJson<{ prompts: PromptTemplates; defaults: PromptTemplates; records: PromptRecord[] }>("/prompts")
  });
  useEffect(() => {
    if (promptQuery.data && !promptsHydrated) {
      setPromptTemplates(promptQuery.data.prompts);
      setPromptsHydrated(true);
    }
  }, [promptQuery.data, promptsHydrated]);

  const primary = keywords.find((item) => item.id === primaryKeywordId);
  const secondary = keywords.filter((item) => secondaryKeywordIds.includes(item.id));
  const activeStep: Step = !keywords.length ? "keywords" : !brief ? "brief" : !outline ? "outline" : !draft ? "draft" : !links.length ? "links" : "ready";
  const completedSteps: CompletedSteps = {
    keywords: keywords.length > 0,
    brief: Boolean(brief),
    outline: Boolean(outline),
    draft: Boolean(draft),
    links: links.length > 0,
    ready: false
  };
  const selectedAiStep = selectedStep === "ready" ? null : selectedStep;
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Không chạy được bước này.");
    } finally {
      setBusy(false);
    }
  }

  async function apiPost<T>(path: string, body: unknown) {
    const headers: Record<string, string> = {};
    if (geminiApiKey) headers["x-gemini-api-key"] = geminiApiKey;
    if (geminiModel) headers["x-gemini-model"] = geminiModel;
    if (tavilyApiKey) headers["x-tavily-api-key"] = tavilyApiKey;
    return postJson<T>(path, body, { headers });
  }

  async function generateKeywords() {
    const result = await apiPost<{ keywordIdeas: Keyword[] }>("/keywords/suggest", {
      seedKeyword,
      language,
      prompt: promptTemplates.keywords,
      semrushToken
    });
    setKeywords(result.keywordIdeas);
    setPrimaryKeywordId(result.keywordIdeas[0]?.id ?? null);
    setSecondaryKeywordIds(result.keywordIdeas.slice(1, 4).map((item) => item.id));
    resetFrom("brief");
    setSelectedStep("keywords");
  }

  async function generateBrief() {
    if (!primary) return;
    const result = await apiPost<{ brief: Brief }>("/brief/generate", {
      primaryKeyword: primary.keyword,
      secondaryKeywords: secondary.map((item) => item.keyword),
      language,
      prompt: promptTemplates.brief
    });
    setBrief(result.brief);
    resetFrom("outline");
  }

  async function generateOutline() {
    if (!primary || !brief) return;
    const result = await apiPost<{ outline: Outline }>("/outline/generate", {
      primaryKeyword: primary.keyword,
      secondaryKeywords: secondary.map((item) => item.keyword),
      language,
      prompt: promptTemplates.outline,
      brief
    });
    setOutline(result.outline);
    resetFrom("draft");
  }

  async function generateDraft() {
    if (!primary || !outline) return;
    const result = await apiPost<{ draft: Draft }>("/draft/generate", {
      primaryKeyword: primary.keyword,
      secondaryKeywords: secondary.map((item) => item.keyword),
      language,
      prompt: promptTemplates.draft,
      outline
    });
    setDraft(result.draft);
    resetFrom("links");
  }

  async function generateLinks() {
    if (!primary || !draft) return;
    const result = await apiPost<{ suggestions: InternalLinkSuggestion[] }>("/links/suggest", {
      primaryKeyword: primary.keyword,
      secondaryKeywords: secondary.map((item) => item.keyword),
      language,
      prompt: promptTemplates.links,
      draft
    });
    setLinks(result.suggestions.map((link) => ({ ...link, status: link.targetUrl ? "accepted" : "pending" })));
  }

  async function finish() {
    if (!draft) return;
    const applied = await apiPost<{ markdown: string }>("/links/apply", { markdown: draft.markdown, suggestions: links });
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

  function resetFrom(step: Step) {
    const startIndex = workflowStages.findIndex((item) => item.key === step);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "brief")) setBrief(null);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "outline")) setOutline(null);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "draft")) setDraft(null);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "links")) setLinks([]);
  }

  function resetSession() {
    setLanguage("vi");
    setSeedKeyword("");
    setKeywords([]);
    setPrimaryKeywordId(null);
    setSecondaryKeywordIds([]);
    setBrief(null);
    setOutline(null);
    setDraft(null);
    setLinks([]);
    setSelectedStep("keywords");
    setError(null);
  }

  function selectPrimaryKeyword(id: string) {
    setPrimaryKeywordId(id);
    setSecondaryKeywordIds((current) => current.filter((item) => item !== id));
    resetFrom("brief");
  }

  function toggleSecondaryKeyword(id: string) {
    if (id === primaryKeywordId) return;
    setSecondaryKeywordIds((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
    resetFrom("brief");
  }

  function setLinkStatus(id: string, status: InternalLinkSuggestion["status"]) {
    setLinks((current) => current.map((link) => link.id === id ? { ...link, status } : link));
  }

  function isStepAvailable(step: Step) {
    const stageIndex = workflowStages.findIndex((item) => item.key === step);
    const activeIndex = workflowStages.findIndex((item) => item.key === activeStep);
    return stageIndex <= activeIndex;
  }

  return <div>
    <header className="mb-5 flex flex-col justify-between gap-3 border-b pb-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a88412]">Article Factory</p>
        <h1 className="mt-1 text-3xl font-bold text-[#172033]">Trình tạo bài viết</h1>
        <p className="mt-1 text-sm text-[#687386]">Theo dõi prompt, output AI và trạng thái bài viết theo từng bước.</p>
      </div>
      <div className="relative flex flex-col items-end gap-3 sm:flex-row sm:items-center">
        <Button onClick={() => setIsSettingsOpen(!isSettingsOpen)} size="sm" variant="secondary">
          <Settings size={15} className="mr-2" />Cài đặt API
        </Button>
        {isSettingsOpen && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border bg-white p-4 shadow-xl">
            <h3 className="mb-4 text-sm font-bold text-[#172033]">Cấu hình API Key</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[#687386]">Semrush Proxy Token</label>
                <Input className="w-full text-xs" value={semrushToken} onChange={(e) => handleConfigChange("cmsauto_semrush_token", e.target.value, setSemrushToken)} placeholder="Mặc định" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#687386]">Gemini API Key</label>
                <Input type="password" className="w-full text-xs" value={geminiApiKey} onChange={(e) => handleConfigChange("cmsauto_gemini_api_key", e.target.value, setGeminiApiKey)} placeholder="Dùng .env mặc định" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#687386]">Gemini Model</label>
                <Input className="w-full text-xs" value={geminiModel} onChange={(e) => handleConfigChange("cmsauto_gemini_model", e.target.value, setGeminiModel)} placeholder="Dùng .env mặc định" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#687386]">Tavily API Key</label>
                <Input type="password" className="w-full text-xs" value={tavilyApiKey} onChange={(e) => handleConfigChange("cmsauto_tavily_api_key", e.target.value, setTavilyApiKey)} placeholder="Dùng .env mặc định" />
              </div>
            </div>
          </div>
        )}
        <Button onClick={resetSession} size="sm" variant="secondary"><RotateCcw size={15} />Tạo bài mới</Button>
      </div>
    </header>

    <WorkflowStepper
      activeStep={activeStep}
      completedSteps={completedSteps}
      isStepAvailable={isStepAvailable}
      onSelect={setSelectedStep}
      selectedStep={selectedStep}
    />

    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <main className="min-w-0">
        {error ? <div className="mb-4"><ErrorState message={error} /></div> : null}
        <WorkflowWorkspace
          brief={brief}
          busy={busy}
          draft={draft}
          keywords={keywords}
          language={language}
          links={links}
          onFinish={() => void run(finish)}
          onGenerateBrief={() => void run(generateBrief)}
          onGenerateDraft={() => void run(generateDraft)}
          onGenerateKeywords={() => void run(generateKeywords)}
          onGenerateLinks={() => void run(generateLinks)}
          onGenerateOutline={() => void run(generateOutline)}
          onLanguageChange={setLanguage}
          onKeywordSelectionConfirm={() => setSelectedStep("brief")}
          onPrimaryChange={selectPrimaryKeyword}
          onSecondaryChange={toggleSecondaryKeyword}
          onSeedKeywordChange={setSeedKeyword}
          onSetLinkStatus={setLinkStatus}
          onSelect={setSelectedStep}
          outline={outline}
          primaryKeywordId={primaryKeywordId}
          secondaryKeywordIds={secondaryKeywordIds}
          seedKeyword={seedKeyword}
          selectedStep={selectedStep}
        />
      </main>
      <PromptInspector
        defaultPrompt={selectedAiStep ? promptQuery.data?.defaults[selectedAiStep] ?? fallbackPrompts[selectedAiStep] : null}
        error={promptQuery.error?.message}
        isLoading={promptQuery.isLoading}
        onChange={(value) => {
          if (!selectedAiStep) return;
          setPromptTemplates((current) => ({ ...current, [selectedAiStep]: value }));
        }}
        onReset={() => {
          if (!selectedAiStep) return;
          setPromptTemplates((current) => ({
            ...current,
            [selectedAiStep]: promptQuery.data?.defaults[selectedAiStep] ?? fallbackPrompts[selectedAiStep]
          }));
        }}
        prompt={selectedAiStep ? promptTemplates[selectedAiStep] : null}
        record={selectedAiStep ? promptQuery.data?.records.find((item) => item.key === selectedAiStep) : undefined}
        selectedStep={selectedStep}
      />
    </div>
  </div>;
}

function WorkflowStepper({
  activeStep,
  completedSteps,
  isStepAvailable,
  onSelect,
  selectedStep
}: {
  activeStep: Step;
  completedSteps: CompletedSteps;
  isStepAvailable: (step: Step) => boolean;
  onSelect: (step: Step) => void;
  selectedStep: Step;
}) {
  return <nav aria-label="Tiến trình tạo bài" className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
    {workflowStages.map((stage) => {
      const isSelected = stage.key === selectedStep;
      const isActive = stage.key === activeStep;
      const isCompleted = completedSteps[stage.key];
      return <button
        aria-current={isSelected ? "step" : undefined}
        className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
          isSelected
            ? "border-[#d6bc61] bg-[#fbf5dc] text-[#80640b]"
            : isActive
              ? "border-[#d6bc61] bg-white text-[#80640b]"
              : "bg-white text-[#687386] hover:bg-[#f7f7f4]"
        }`}
        disabled={!isStepAvailable(stage.key)}
        key={stage.key}
        onClick={() => onSelect(stage.key)}
        type="button"
      >
        {isCompleted ? <CheckCircle2 className="shrink-0 text-[#a88412]" size={16} /> : <Circle className="shrink-0" size={16} />}
        <span className="truncate">{stage.number}. {stage.shortLabel}</span>
      </button>;
    })}
  </nav>;
}

function WorkflowWorkspace(props: {
  brief: Brief | null;
  busy: boolean;
  draft: Draft | null;
  keywords: Keyword[];
  language: "vi" | "en";
  links: InternalLinkSuggestion[];
  onFinish: () => void;
  onGenerateBrief: () => void;
  onGenerateDraft: () => void;
  onGenerateKeywords: () => void;
  onGenerateLinks: () => void;
  onGenerateOutline: () => void;
  onLanguageChange: (language: "vi" | "en") => void;
  onKeywordSelectionConfirm: () => void;
  onPrimaryChange: (id: string) => void;
  onSecondaryChange: (id: string) => void;
  onSeedKeywordChange: (value: string) => void;
  onSetLinkStatus: (id: string, status: InternalLinkSuggestion["status"]) => void;
  onSelect: (step: Step) => void;
  outline: Outline | null;
  primaryKeywordId: string | null;
  secondaryKeywordIds: string[];
  seedKeyword: string;
  selectedStep: Step;
}) {
  const stage = workflowStages.find((item) => item.key === props.selectedStep) ?? workflowStages[0];

  return <section>
    <div className="mb-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687386]">Bước đang xem</p>
      <h2 className="mt-1 text-3xl font-bold text-[#172033]">{stage.number}. {stage.title}</h2>
      <p className="mt-1 text-sm text-[#687386]">{stage.description}</p>
    </div>
    {props.selectedStep === "keywords" ? <KeywordsWorkspace {...props} /> : null}
    {props.selectedStep === "brief" ? <BriefWorkspace brief={props.brief} busy={props.busy} onConfirm={() => props.onSelect("outline")} onGenerate={props.onGenerateBrief} /> : null}
    {props.selectedStep === "outline" ? <OutlineWorkspace busy={props.busy} onConfirm={() => props.onSelect("draft")} onGenerate={props.onGenerateOutline} outline={props.outline} /> : null}
    {props.selectedStep === "draft" ? <DraftWorkspace busy={props.busy} draft={props.draft} onConfirm={() => props.onSelect("links")} onGenerate={props.onGenerateDraft} /> : null}
    {props.selectedStep === "links"
      ? <LinksWorkspace busy={props.busy} links={props.links} onConfirm={() => props.onSelect("ready")} onGenerate={props.onGenerateLinks} onSetStatus={props.onSetLinkStatus} />
      : null}
    {props.selectedStep === "ready"
      ? <ReadyWorkspace brief={props.brief} busy={props.busy} draft={props.draft} links={props.links} onFinish={props.onFinish} outline={props.outline} />
      : null}
  </section>;
}

function KeywordsWorkspace({
  busy,
  keywords,
  language,
  onGenerateKeywords,
  onKeywordSelectionConfirm,
  onLanguageChange,
  onPrimaryChange,
  onSecondaryChange,
  onSeedKeywordChange,
  primaryKeywordId,
  secondaryKeywordIds,
  seedKeyword
}: {
  busy: boolean;
  keywords: Keyword[];
  language: "vi" | "en";
  onGenerateKeywords: () => void;
  onKeywordSelectionConfirm: () => void;
  onLanguageChange: (language: "vi" | "en") => void;
  onPrimaryChange: (id: string) => void;
  onSecondaryChange: (id: string) => void;
  onSeedKeywordChange: (value: string) => void;
  primaryKeywordId: string | null;
  secondaryKeywordIds: string[];
  seedKeyword: string;
}) {
  return <div className="grid gap-4">
    <section className="rounded-xl border bg-white p-4">
      <label className="grid gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-[#566174]">Từ khóa cần viết</span>
        <Input className="py-3" onChange={(event) => onSeedKeywordChange(event.target.value)} placeholder="Ví dụ: stablecoin lending" value={seedKeyword} />
      </label>
      <label className="mt-3 grid max-w-xl gap-1">
        <span className="text-xs font-bold uppercase tracking-wide text-[#566174]">Ngôn ngữ</span>
        <Select className="py-3" onChange={(event) => onLanguageChange(event.target.value as "vi" | "en")} value={language}>
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </Select>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button aria-label="Gợi ý keyword" disabled={busy || !seedKeyword.trim()} onClick={onGenerateKeywords}>
          <Wand2 size={16} />{keywords.length ? "Lấy lại bộ từ khóa" : "Lấy bộ từ khóa"}
        </Button>
        <p className="self-center text-xs text-[#687386]">Volume được refresh trong cùng lần gọi nếu provider đã cấu hình.</p>
      </div>
    </section>
    <section className="rounded-xl border bg-white p-4">
      <h3 className="font-semibold">Danh sách từ khóa</h3>
      <p className="mt-1 text-sm text-[#687386]">Chọn một từ khóa chính và bật các từ khóa phụ cần dùng cho bài viết.</p>
      {keywords.length === 0
        ? <div className="mt-4"><EmptyState description="Nhập từ khóa rồi bấm Lấy bộ từ khóa." title="Chưa có keyword research" /></div>
        : <div className="mt-4 grid gap-3">
            {keywords.map((keyword) =>
              <article className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto]" key={keyword.id}>
                <div>
                  <strong>{keyword.keyword}</strong>
                  <p className="mt-1 text-xs text-[#687386]">{keyword.intent} · {keyword.provider}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold">{formatVolume(keyword.monthlyVolume)}</span>
                  <label className="flex items-center gap-1 text-xs font-semibold">
                    <input checked={keyword.id === primaryKeywordId} name="primary-keyword" onChange={() => onPrimaryChange(keyword.id)} type="radio" />
                    Chính
                  </label>
                  <label className="flex items-center gap-1 text-xs font-semibold">
                    <input
                      checked={secondaryKeywordIds.includes(keyword.id)}
                      disabled={keyword.id === primaryKeywordId}
                      onChange={() => onSecondaryChange(keyword.id)}
                      type="checkbox"
                    />
                    Phụ
                  </label>
                </div>
              </article>
            )}
          </div>}
      {keywords.length > 0
        ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-[#687386]">
              Đã chọn {primaryKeywordId ? "1 từ khóa chính" : "0 từ khóa chính"} và {secondaryKeywordIds.length} từ khóa phụ.
            </p>
            <Button disabled={!primaryKeywordId} onClick={onKeywordSelectionConfirm}>
              <CheckCircle2 size={16} />Xác nhận bộ từ khóa và tiếp tục
            </Button>
          </div>
        : null}
    </section>
  </div>;
}

function BriefWorkspace({ brief, busy, onGenerate, onConfirm }: { brief: Brief | null; busy: boolean; onGenerate: () => void; onConfirm: () => void }) {
  return <ResultWorkspace
    actionLabel={brief ? "Sinh lại brief" : "Sinh brief"}
    busy={busy}
    emptyDescription="Chốt bộ từ khóa ở bước trước rồi sinh brief."
    emptyTitle="Chưa có định hướng bài"
    onGenerate={onGenerate}
  >
    {brief ? <div className="grid gap-4">
      <ResultCard label="Search intent"><p>{brief.searchIntent}</p></ResultCard>
      <ResultCard label="Góc triển khai"><p>{brief.angle}</p></ResultCard>
      <ResultCard label="Semantic topics"><TagList items={brief.semanticTopics} /></ResultCard>
      <ResultCard label="FAQ đề xuất"><List items={brief.candidateFaqs} /></ResultCard>
      {brief.competitorPages && brief.competitorPages.length > 0 ? (
        <ResultCard label="Top đối thủ (Tham khảo)">
          <div className="grid gap-3">
            {brief.competitorPages.map((page, i) => (
              <a href={page.url} target="_blank" rel="noopener noreferrer" key={i} className="block rounded-lg border p-3 hover:bg-[#fbfbf9] transition">
                <p className="text-xs font-semibold text-[#80640b] break-words">{page.keyword}</p>
                <h4 className="mt-1 text-sm font-bold text-[#172033] line-clamp-1 break-words">{page.title}</h4>
                <p className="mt-1 text-xs text-[#566174] line-clamp-2 break-words">{page.snippet}</p>
              </a>
            ))}
          </div>
        </ResultCard>
      ) : null}
      <div className="mt-4 flex justify-end border-t pt-4">
        <Button onClick={onConfirm}><CheckCircle2 size={16} className="mr-2" />Xác nhận định hướng bài và tiếp tục</Button>
      </div>
    </div> : null}
  </ResultWorkspace>;
}

function OutlineWorkspace({ busy, onGenerate, onConfirm, outline }: { busy: boolean; onGenerate: () => void; onConfirm: () => void; outline: Outline | null }) {
  return <ResultWorkspace
    actionLabel={outline ? "Sinh lại outline" : "Sinh outline"}
    busy={busy}
    emptyDescription="Sinh brief trước khi tạo dàn ý."
    emptyTitle="Chưa có dàn ý"
    onGenerate={onGenerate}
  >
    {outline ? <div className="grid gap-3">
      <ResultCard label="Tiêu đề dự kiến"><h3 className="font-bold break-words">{outline.title}</h3><p className="mt-2 text-sm text-[#687386] break-words">{outline.introDirection}</p></ResultCard>
      {outline.sections.map((section, index) =>
        <ResultCard key={`${section.heading}-${index}`} label={`${index + 1}. ${section.heading}`}><List items={section.bullets} /></ResultCard>
      )}
      <div className="mt-4 flex justify-end border-t pt-4">
        <Button onClick={onConfirm}><CheckCircle2 size={16} className="mr-2" />Xác nhận dàn ý và tiếp tục</Button>
      </div>
    </div> : null}
  </ResultWorkspace>;
}

function DraftWorkspace({ busy, draft, onGenerate, onConfirm }: { busy: boolean; draft: Draft | null; onGenerate: () => void; onConfirm: () => void }) {
  return <ResultWorkspace
    actionLabel={draft ? "Sinh lại draft" : "Sinh draft"}
    busy={busy}
    emptyDescription="Sinh outline trước khi viết nội dung."
    emptyTitle="Chưa có bản nháp"
    onGenerate={onGenerate}
  >
    {draft ? <div className="grid gap-4">
      <ResultCard label="Metadata">
        <h3 className="font-bold">{draft.title}</h3>
        <p className="mt-1 text-sm text-[#687386]">/{draft.slug}</p>
        <p className="mt-3 text-sm">{draft.excerpt}</p>
        <p className="mt-3 text-xs text-[#687386]">{draft.metaTitle} · {draft.metaDescription}</p>
      </ResultCard>
      <ResultCard label="Markdown">
        <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap text-xs leading-6">{draft.markdown}</pre>
      </ResultCard>
      <div className="mt-4 flex justify-end border-t pt-4">
        <Button onClick={onConfirm}><CheckCircle2 size={16} className="mr-2" />Xác nhận bản nháp và tiếp tục</Button>
      </div>
    </div> : null}
  </ResultWorkspace>;
}

function LinksWorkspace({
  busy,
  links,
  onGenerate,
  onSetStatus,
  onConfirm
}: {
  busy: boolean;
  links: InternalLinkSuggestion[];
  onGenerate: () => void;
  onSetStatus: (id: string, status: InternalLinkSuggestion["status"]) => void;
  onConfirm: () => void;
}) {
  return <ResultWorkspace
    actionLabel={links.length ? "Gợi ý lại link" : "Gợi ý link"}
    busy={busy}
    emptyDescription="Sinh draft trước khi gắn internal links."
    emptyTitle="Chưa có gợi ý link"
    onGenerate={onGenerate}
  >
    {links.length ? <>
      <div className="grid gap-3">
        {links.map((link) =>
          <article className="rounded-xl border bg-white p-4" key={link.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#687386]">Anchor</p>
                <h3 className="mt-1 font-bold">{link.anchor}</h3>
                <p className="mt-1 text-sm text-[#80640b]">{link.targetTitle || "Chưa match bài đích"}</p>
                <p className="text-xs text-[#687386]">{link.targetUrl || "Cần bổ sung hashtag trong kho internal links"}</p>
              </div>
              <Badge>{link.confidence}% confidence</Badge>
            </div>
            <p className="mt-3 rounded-lg bg-[#f7f7f4] p-3 text-sm text-[#566174]">{link.sourceContext}</p>
            <p className="mt-3 text-xs text-[#687386]">{link.reason}</p>
            <div className="mt-3 flex gap-2">
              <Button onClick={() => onSetStatus(link.id, "accepted")} size="sm" variant={link.status === "accepted" ? "primary" : "secondary"}>
                <CheckCircle2 size={14} />Dùng link
              </Button>
              <Button onClick={() => onSetStatus(link.id, "rejected")} size="sm" variant={link.status === "rejected" ? "danger" : "ghost"}>
                <XCircle size={14} />Bỏ link
              </Button>
            </div>
          </article>
        )}
      </div>
      <div className="mt-4 flex justify-end border-t pt-4">
        <Button onClick={onConfirm}><CheckCircle2 size={16} className="mr-2" />Xác nhận Link và tới bước Bàn giao</Button>
      </div>
    </> : null}
  </ResultWorkspace>;
}

function ReadyWorkspace({
  brief,
  busy,
  draft,
  links,
  onFinish,
  outline
}: {
  brief: Brief | null;
  busy: boolean;
  draft: Draft | null;
  links: InternalLinkSuggestion[];
  onFinish: () => void;
  outline: Outline | null;
}) {
  const acceptedLinks = links.filter((link) => link.status === "accepted");
  return <section className="rounded-xl border bg-white p-5">
    <h3 className="text-lg font-bold">Bài đã sẵn sàng bàn giao</h3>
    <p className="mt-1 text-sm text-[#687386]">Lưu bài vào danh sách chờ duyệt để editor kiểm tra lần cuối trước khi publish.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Brief" value={brief ? "Đã có" : "Thiếu"} />
      <SummaryCard label="Outline" value={outline ? `${outline.sections.length} section` : "Thiếu"} />
      <SummaryCard label="Internal links" value={`${acceptedLinks.length}/${links.length} đã chọn`} />
    </div>
    {draft ? <div className="mt-5 rounded-xl bg-[#f7f7f4] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#687386]">Bản nháp</p><h4 className="mt-1 font-bold">{draft.title}</h4><p className="mt-1 text-sm text-[#687386]">{draft.excerpt}</p></div> : null}
    <Button className="mt-5" disabled={busy || !draft || links.length === 0} onClick={onFinish} size="lg">
      <Save size={17} />Lưu bài để duyệt
    </Button>
  </section>;
}

function ResultWorkspace({
  actionLabel,
  busy,
  children,
  emptyDescription,
  emptyTitle,
  onGenerate
}: {
  actionLabel: string;
  busy: boolean;
  children: React.ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  onGenerate: () => void;
}) {
  return <section>
    <Button disabled={busy} onClick={onGenerate}><Wand2 size={16} />{actionLabel}</Button>
    <div className="mt-4">{children || <EmptyState description={emptyDescription} title={emptyTitle} />}</div>
  </section>;
}

function PromptInspector({
  defaultPrompt,
  error,
  isLoading,
  onChange,
  onReset,
  prompt,
  record,
  selectedStep
}: {
  defaultPrompt: string | null;
  error?: string;
  isLoading: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
  prompt: string | null;
  record?: PromptRecord;
  selectedStep: Step;
}) {
  const stage = workflowStages.find((item) => item.key === selectedStep) ?? workflowStages[0];
  const hasLocalEdit = prompt !== null && prompt !== record?.value;

  return <aside className="self-start rounded-xl border bg-white p-4 xl:sticky xl:top-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687386]">Prompt AI</p>
        <h2 className="mt-1 font-bold">{stage.number}. {stage.shortLabel}</h2>
      </div>
      {record ? <Badge>rev {record.revision}</Badge> : null}
    </div>
    {selectedStep === "ready"
      ? <div className="mt-4 rounded-lg bg-[#f7f7f4] p-4 text-sm text-[#687386]">Bước bàn giao không gọi AI. Quay lại từng bước để xem prompt và output đã sử dụng.</div>
      : <>
          {isLoading ? <div className="mt-4"><LoadingSkeleton label="Đang tải prompt..." /></div> : null}
          {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>{hasLocalEdit ? "Đã chỉnh trong phiên" : "Đồng bộ backend"}</Badge>
            <Badge>{selectedStep}</Badge>
          </div>
          <Textarea
            aria-label={`Prompt ${selectedStep}`}
            className="mt-3 min-h-[420px] font-mono text-xs leading-6"
            onChange={(event) => onChange(event.target.value)}
            value={prompt ?? ""}
          />
          <div className="mt-3 text-xs text-[#687386]">
            Cập nhật backend: {record?.updatedAt ? new Date(record.updatedAt).toLocaleString("vi-VN") : "chưa có metadata"}
          </div>
          <Button className="mt-3 w-full" disabled={prompt === defaultPrompt} onClick={onReset} size="sm" variant="secondary">
            <RotateCcw size={14} />Trả về mặc định
          </Button>
        </>}
  </aside>;
}

function formatVolume(value: number | null | undefined) {
  return value == null ? "N/A" : value.toLocaleString("vi-VN");
}

function ResultCard({ children, label }: { children: React.ReactNode; label: string }) {
  return <section className="rounded-xl border bg-white p-4 break-words whitespace-pre-wrap overflow-hidden">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#687386] whitespace-normal">{label}</p>
    <div className="break-words whitespace-pre-wrap">{children}</div>
  </section>;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-[#f7f7f4] p-4">
    <p className="text-xs font-bold uppercase tracking-wide text-[#687386]">{label}</p>
    <p className="mt-1 font-bold">{value}</p>
  </div>;
}

function TagList({ items }: { items: string[] }) {
  return <div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item}>{item}</Badge>)}</div>;
}

function List({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-5 text-sm text-[#566174] break-words">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}
