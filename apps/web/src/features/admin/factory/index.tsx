"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  FileCheck2,
  FileText,
  ImagePlus,
  Link2,
  ListTree,
  Loader2,
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
import type { ArticleImageAspectRatio, ArticleImageKind, ArticleSession, GeneratedArticleImage, InternalLinkSuggestion } from "@/features/admin/types";
import { getJson, patchJson, postJson, publicApiUrl } from "@/lib/api";
import { ImagePickerModal } from "./image-modals";

type Keyword = ArticleSession["keywordIdeas"][number];
type Brief = NonNullable<ArticleSession["brief"]>;
type Outline = NonNullable<ArticleSession["outline"]>;
export type Draft = NonNullable<ArticleSession["draft"]>;
type Step = ArticleSession["activeStep"];
type AiStep = Exclude<Step, "ready">;
type PromptTemplates = Record<AiStep, string>;
type PromptRecord = { key: AiStep; value: string; revision: number; updatedAt: string };
type CompletedSteps = Record<Step, boolean>;
type ImageLibraryItem = {
  id: string;
  createdAt: string;
  provider: string;
  prompt: string;
  url: string;
  metadataJson: string;
};
type FactorySessionValues = {
  language: "vi" | "en";
  seedKeyword: string;
  activeStep: Step;
  keywordIdeas: Keyword[];
  primaryKeywordId: string | null;
  secondaryKeywordIds: string[];
  brief: Brief | null;
  outline: Outline | null;
  draft: Draft | null;
  linkSuggestions: InternalLinkSuggestion[];
  finalMarkdown: string;
};

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
  const [imageProvider, setImageProvider] = useState("");
  const [imageModel, setImageModel] = useState("");
  const [imageApiKey, setImageApiKey] = useState("");
  const [imageProxyToken, setImageProxyToken] = useState("");
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

    const savedImageProvider = localStorage.getItem("cmsauto_image_generation_provider");
    if (savedImageProvider) setImageProvider(savedImageProvider);

    const savedImageModel = localStorage.getItem("cmsauto_image_generation_model");
    if (savedImageModel) setImageModel(savedImageModel);

    const savedImageApiKey = localStorage.getItem("cmsauto_image_generation_api_key");
    if (savedImageApiKey) setImageApiKey(savedImageApiKey);

    const savedImageProxyToken = localStorage.getItem("cmsauto_image_generation_proxy_token");
    if (savedImageProxyToken) setImageProxyToken(savedImageProxyToken);
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
  const [rejectedLinkHistory, setRejectedLinkHistory] = useState<InternalLinkSuggestion[]>([]);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplates>(fallbackPrompts);
  const [promptsHydrated, setPromptsHydrated] = useState(false);
  const [selectedStep, setSelectedStep] = useState<Step>("keywords");
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedArticleId, setSavedArticleId] = useState<string | null>(null);
  const [savedRevision, setSavedRevision] = useState<number | null>(null);
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
  useEffect(() => {
    const articleId = new URLSearchParams(window.location.search).get("articleId");
    if (!articleId) return;

    let cancelled = false;
    setBusy(true);
    setBusyLabel("Đang nạp bài đang làm dở...");
    getJson<{ articles: ArticleSession[] }>("/articles")
      .then(({ articles }) => {
        if (cancelled) return;
        const article = articles.find((item) => item.id === articleId);
        if (!article) {
          setError("Không tìm thấy bài đang làm dở.");
          return;
        }
        hydrateFromArticle(article);
        setSaveMessage(`Đã nạp bài lưu tạm, revision ${article.revision}.`);
      })
      .catch((restoreError) => setError(restoreError instanceof Error ? restoreError.message : "Không nạp được bài đang làm dở."))
      .finally(() => {
        if (!cancelled) {
          setBusy(false);
          setBusyLabel("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function run(action: () => Promise<void>, label = "Đang xử lý...") {
    setBusy(true);
    setBusyLabel(label);
    setError(null);
    try {
      await action();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Không chạy được bước này.");
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  }

  async function apiPost<T>(path: string, body: unknown) {
    const headers: Record<string, string> = {};
    if (geminiApiKey) headers["x-gemini-api-key"] = geminiApiKey;
    if (geminiModel) headers["x-gemini-model"] = geminiModel;
    if (tavilyApiKey) headers["x-tavily-api-key"] = tavilyApiKey;
    if (imageProvider) headers["x-image-generation-provider"] = imageProvider;
    if (imageModel) headers["x-image-generation-model"] = imageModel;
    if (imageApiKey) headers["x-image-generation-api-key"] = imageApiKey;
    if (imageProxyToken) headers["x-image-generation-proxy-token"] = imageProxyToken;
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
    setSecondaryKeywordIds(result.keywordIdeas.slice(1).map((item) => item.id));
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
      brief,
      keywordIdeas: [primary, ...secondary]
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
    const currentRejectedLinks = links.filter((link) => link.status === "rejected");
    const rejectedSuggestions = currentRejectedLinks.length > 0
      ? mergeRejectedSuggestionHistory(rejectedLinkHistory, currentRejectedLinks)
      : [];
    const result = await apiPost<{ suggestions: InternalLinkSuggestion[] }>("/links/suggest", {
      primaryKeyword: primary.keyword,
      secondaryKeywords: secondary.map((item) => item.keyword),
      language,
      prompt: promptTemplates.links,
      draft,
      existingSuggestions: links,
      preservedSuggestions: links.filter((link) => link.status !== "rejected"),
      rejectedSuggestions
    });
    setLinks(result.suggestions.map((link) => ({ ...link, status: link.status ?? (link.targetUrl ? "accepted" : "pending") })));
  }

  async function runAutoArticle() {
    const nextSeedKeyword = seedKeyword.trim();
    if (!nextSeedKeyword) {
      setError("Nhập từ khóa cần viết trước khi chạy tự động.");
      return;
    }

    setBusy(true);
    setError(null);
    setSaveMessage("");
    setSeedKeyword(nextSeedKeyword);

    try {
      setSelectedStep("keywords");
      setBusyLabel("01/07 Đang lấy keyword và volume từ Semrush...");
      const keywordResult = await apiPost<{ keywordIdeas: Keyword[] }>("/keywords/suggest", {
        seedKeyword: nextSeedKeyword,
        language,
        prompt: promptTemplates.keywords,
        semrushToken
      });
      const nextKeywords = keywordResult.keywordIdeas;
      const nextPrimary = nextKeywords[0];
      const nextSecondary = nextKeywords.slice(1);
      if (!nextPrimary || nextSecondary.length === 0) {
        throw new Error("Không đủ keyword để chạy tự động. Cần ít nhất 1 từ khóa chính và 1 từ khóa phụ.");
      }

      setKeywords(nextKeywords);
      setPrimaryKeywordId(nextPrimary.id);
      setSecondaryKeywordIds(nextSecondary.map((item) => item.id));
      setBrief(null);
      setOutline(null);
      setDraft(null);
      setLinks([]);

      setSelectedStep("brief");
      setBusyLabel("02/07 Đang đọc top 10 kết quả và rút insight đối thủ...");
      const briefResult = await apiPost<{ brief: Brief }>("/brief/generate", {
        primaryKeyword: nextPrimary.keyword,
        secondaryKeywords: nextSecondary.map((item) => item.keyword),
        language,
        prompt: promptTemplates.brief
      });
      const nextBrief = briefResult.brief;
      setBrief(nextBrief);

      setSelectedStep("outline");
      setBusyLabel("03/07 Đang ghép keyword, volume và insight để sinh outline...");
      const outlineResult = await apiPost<{ outline: Outline }>("/outline/generate", {
        primaryKeyword: nextPrimary.keyword,
        secondaryKeywords: nextSecondary.map((item) => item.keyword),
        language,
        prompt: promptTemplates.outline,
        brief: nextBrief,
        keywordIdeas: [nextPrimary, ...nextSecondary]
      });
      const nextOutline = outlineResult.outline;
      setOutline(nextOutline);

      setSelectedStep("draft");
      setBusyLabel("04/07 Đang viết bản nháp bằng Gemini...");
      const draftResult = await apiPost<{ draft: Draft }>("/draft/generate", {
        primaryKeyword: nextPrimary.keyword,
        secondaryKeywords: nextSecondary.map((item) => item.keyword),
        language,
        prompt: promptTemplates.draft,
        outline: nextOutline
      });
      const nextDraft = draftResult.draft;
      setDraft(nextDraft);

      setBusyLabel("05/07 Đang tạo ảnh bìa và ảnh minh họa tự động...");
      const generatedImages = await Promise.all([
        generateArticleImageFromDraft({ draft: nextDraft, keyword: nextPrimary.keyword, kind: "hero" }),
        generateArticleImageFromDraft({ draft: nextDraft, keyword: nextPrimary.keyword, kind: "inline" })
      ]);
      const nextDraftWithImages: Draft = {
        ...nextDraft,
        generatedImages: [...generatedImages, ...(nextDraft.generatedImages ?? [])]
      };
      setDraft(nextDraftWithImages);

      setSelectedStep("links");
      setBusyLabel("06/07 Đang phân tích bản nháp và so khớp kho internal links...");
      const linksResult = await apiPost<{ suggestions: InternalLinkSuggestion[] }>("/links/suggest", {
        primaryKeyword: nextPrimary.keyword,
        secondaryKeywords: nextSecondary.map((item) => item.keyword),
        language,
        prompt: promptTemplates.links,
        draft: nextDraftWithImages
      });
      const nextLinks = linksResult.suggestions.map((link) => ({ ...link, status: link.targetUrl ? "accepted" as const : "pending" as const }));
      setLinks(nextLinks);
      setRejectedLinkHistory([]);

      setSelectedStep("ready");
      setBusyLabel("07/07 Đang áp dụng link và lưu bài vào danh sách chờ duyệt...");
      const applied = await apiPost<{ markdown: string }>("/links/apply", {
        markdown: nextDraftWithImages.markdown,
        suggestions: nextLinks
      });
      const savedArticle = await persistFactorySession({
        language,
        seedKeyword: nextSeedKeyword,
        activeStep: "ready",
        keywordIdeas: nextKeywords,
        primaryKeywordId: nextPrimary.id,
        secondaryKeywordIds: nextSecondary.map((item) => item.id),
        brief: nextBrief,
        outline: nextOutline,
        draft: nextDraftWithImages,
        linkSuggestions: nextLinks,
        finalMarkdown: applied.markdown
      }, { ready: true });

      setSaveMessage(
        nextLinks.length > 0
          ? `Đã tạo tự động và lưu bài vào Quản lý bài viết, revision ${savedArticle.revision}.`
          : `Đã tạo tự động và lưu bài vào Quản lý bài viết, nhưng chưa match được internal link nào. Revision ${savedArticle.revision}.`
      );
    } catch (autoError) {
      setError(autoError instanceof Error ? autoError.message : "Không chạy được luồng tạo bài tự động.");
    } finally {
      setBusy(false);
      setBusyLabel("");
    }
  }

  function hydrateFromArticle(article: ArticleSession) {
    setLanguage(article.inputs.language);
    setSeedKeyword(article.inputs.seedKeyword);
    setKeywords(article.keywordIdeas);
    setPrimaryKeywordId(article.primaryKeywordId);
    setSecondaryKeywordIds(article.secondaryKeywordIds);
    setBrief(article.brief);
    setOutline(article.outline);
    setDraft(article.draft);
    setLinks(article.linkSuggestions);
    setRejectedLinkHistory([]);
    setSavedArticleId(article.id);
    setSavedRevision(article.revision);
    setSelectedStep(article.activeStep);
  }

  function buildCurrentFactorySessionValues(stepToSave: Step, finalMarkdown: string): FactorySessionValues {
    return {
      language,
      seedKeyword,
      activeStep: stepToSave,
      keywordIdeas: keywords,
      primaryKeywordId,
      secondaryKeywordIds,
      brief,
      outline,
      draft,
      linkSuggestions: links,
      finalMarkdown
    };
  }

  function buildArticleSnapshot(values: FactorySessionValues) {
    const now = new Date().toISOString();
    return {
      id: savedArticleId ?? crypto.randomUUID(), revision: savedRevision ?? 1, createdAt: now, updatedAt: now,
      inputs: { language: values.language, seedKeyword: values.seedKeyword }, activeStep: values.activeStep, keywordIdeas: values.keywordIdeas,
      primaryKeywordId: values.primaryKeywordId, secondaryKeywordIds: values.secondaryKeywordIds, brief: values.brief, outline: values.outline, draft: values.draft, linkSuggestions: values.linkSuggestions,
      finalMarkdown: values.finalMarkdown, reviewStatus: values.activeStep === "ready" ? "editor_ready" : "needs_fix", reviewNote: values.activeStep === "ready" ? "" : "Bài đang làm dở trong Article Factory.",
      publishAt: null, publishedAt: null, livePath: null, lastPublishError: null
    } satisfies ArticleSession;
  }

  function buildSessionChanges(values: FactorySessionValues) {
    return {
      inputs: { language: values.language, seedKeyword: values.seedKeyword },
      activeStep: values.activeStep,
      keywordIdeas: values.keywordIdeas,
      primaryKeywordId: values.primaryKeywordId,
      secondaryKeywordIds: values.secondaryKeywordIds,
      brief: values.brief,
      outline: values.outline,
      draft: values.draft,
      linkSuggestions: values.linkSuggestions,
      finalMarkdown: values.finalMarkdown,
      reviewNote: values.activeStep === "ready" ? "" : "Bài đang làm dở trong Article Factory."
    };
  }

  async function persistFactorySession(values: FactorySessionValues, { ready = false }: { ready?: boolean } = {}) {
    if (savedArticleId && savedRevision !== null) {
      const result = await patchJson<{ article: ArticleSession }>(`/articles/${savedArticleId}`, {
        expectedRevision: savedRevision,
        changes: buildSessionChanges(values)
      });
      setSavedRevision(result.article.revision);
      setSaveMessage(ready ? "Đã lưu bài vào danh sách chờ duyệt." : `Đã lưu tạm bài đang làm dở, revision ${result.article.revision}.`);
      return result.article;
    }

    const result = await postJson<{ article: ArticleSession }>("/articles", { article: buildArticleSnapshot(values) });
    setSavedArticleId(result.article.id);
    setSavedRevision(result.article.revision);
    setSaveMessage(ready ? "Đã lưu bài vào danh sách chờ duyệt." : `Đã lưu tạm bài đang làm dở, revision ${result.article.revision}.`);
    return result.article;
  }

  async function saveFactorySession({ ready = false }: { ready?: boolean } = {}) {
    const stepToSave = ready ? "ready" : activeStep;
    const markdownToSave = ready && draft
      ? (await apiPost<{ markdown: string }>("/links/apply", { markdown: draft.markdown, suggestions: links })).markdown
      : draft?.markdown ?? "";
    return persistFactorySession(buildCurrentFactorySessionValues(stepToSave, markdownToSave), { ready });
  }

  async function saveProgress() {
    if (!seedKeyword.trim() && keywords.length === 0) {
      setSaveMessage("Nhập hoặc sinh keyword trước khi lưu tạm.");
      return;
    }
    await saveFactorySession();
  }

  async function finish() {
    if (!draft) return;
    await saveFactorySession({ ready: true });
    router.push("/admin/articles");
  }

  function resetFrom(step: Step) {
    const startIndex = workflowStages.findIndex((item) => item.key === step);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "brief")) setBrief(null);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "outline")) setOutline(null);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "draft")) setDraft(null);
    if (startIndex <= workflowStages.findIndex((item) => item.key === "links")) {
      setLinks([]);
      setRejectedLinkHistory([]);
    }
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
    setRejectedLinkHistory([]);
    setSelectedStep("keywords");
    setSavedArticleId(null);
    setSavedRevision(null);
    setSaveMessage("");
    setError(null);
    window.history.replaceState(null, "", "/admin/factory");
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
    if (status === "rejected") {
      const rejectedLink = links.find((link) => link.id === id);
      if (rejectedLink) {
        setRejectedLinkHistory((current) =>
          mergeRejectedSuggestionHistory(current, [{ ...rejectedLink, status: "rejected" }])
        );
      }
    }
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
              <div className="border-t pt-3">
                <label className="mb-1 block text-xs text-[#687386]">Image Provider</label>
                <Input className="w-full text-xs" value={imageProvider} onChange={(e) => handleConfigChange("cmsauto_image_generation_provider", e.target.value, setImageProvider)} placeholder="mock / openai / gemini / custom-proxy" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#687386]">Image Model</label>
                <Input className="w-full text-xs" value={imageModel} onChange={(e) => handleConfigChange("cmsauto_image_generation_model", e.target.value, setImageModel)} placeholder="Dùng .env hoặc default provider" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#687386]">Image API Key</label>
                <Input type="password" className="w-full text-xs" value={imageApiKey} onChange={(e) => handleConfigChange("cmsauto_image_generation_api_key", e.target.value, setImageApiKey)} placeholder="Dùng .env mặc định" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#687386]">Image Proxy Token</label>
                <Input type="password" className="w-full text-xs" value={imageProxyToken} onChange={(e) => handleConfigChange("cmsauto_image_generation_proxy_token", e.target.value, setImageProxyToken)} placeholder="Nếu provider dùng cookie/proxy" />
              </div>
            </div>
          </div>
        )}
        <Button disabled={busy || !seedKeyword.trim()} onClick={() => void runAutoArticle()} size="sm">
          <Wand2 size={15} />Tạo tự động
        </Button>
        <Button disabled={busy || (!seedKeyword.trim() && keywords.length === 0)} onClick={() => void run(saveProgress, "Đang lưu tạm bài vào Quản lý bài viết...")} size="sm" variant="secondary">
          <Save size={15} />Lưu tạm
        </Button>
        <Button onClick={resetSession} size="sm" variant="secondary"><RotateCcw size={15} />Tạo bài mới</Button>
      </div>
    </header>
    {saveMessage ? <div className="mb-4 rounded-lg border bg-white p-3 text-sm font-medium text-[#80640b]">{saveMessage}</div> : null}

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
          busyLabel={busyLabel}
          onFinish={() => void run(finish, "Đang áp dụng link và lưu bài để duyệt...")}
          onGenerateBrief={() => void run(generateBrief, "Đang đọc top 10 kết quả và rút insight đối thủ...")}
          onGenerateDraft={() => void run(generateDraft, "Đang viết bản nháp bằng Gemini...")}
          onAddImage={(img) => {
            setDraft((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                generatedImages: [img, ...(prev.generatedImages ?? [])]
              };
            });
          }}
          onAddImages={(imgs) => {
            setDraft((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                generatedImages: [...imgs, ...(prev.generatedImages ?? [])]
              };
            });
          }}
          onRemoveImage={(id) => {
            setDraft((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                generatedImages: (prev.generatedImages ?? []).filter(img => img.id !== id)
              };
            });
          }}
          onGenerateKeywords={() => void run(generateKeywords, "Đang lấy keyword và volume từ Semrush...")}
          onUpdateMarkdown={(md) => {
            setDraft((prev) => {
              if (!prev) return prev;
              return { ...prev, markdown: md };
            });
          }}
          onGenerateLinks={() => void run(generateLinks, "Đang phân tích bản nháp và so khớp kho internal links, bước này có thể mất 1-2 phút...")}
          onGenerateOutline={() => void run(generateOutline, "Đang ghép keyword, volume và insight để sinh outline...")}
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
  busyLabel: string;
  draft: Draft | null;
  keywords: Keyword[];
  language: "vi" | "en";
  links: InternalLinkSuggestion[];
  onFinish: () => void;
  onGenerateBrief: () => void;
  onGenerateDraft: () => void;
  onUpdateMarkdown: (md: string) => void;
  onAddImage: (img: GeneratedArticleImage) => void;
  onAddImages?: (imgs: GeneratedArticleImage[]) => void;
  onRemoveImage: (id: string) => void;
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
    {props.selectedStep === "brief" ? <BriefWorkspace brief={props.brief} busy={props.busy} busyLabel={props.busyLabel} onConfirm={() => props.onSelect("outline")} onGenerate={props.onGenerateBrief} /> : null}
    {props.selectedStep === "outline" ? <OutlineWorkspace busy={props.busy} busyLabel={props.busyLabel} onConfirm={() => props.onSelect("draft")} onGenerate={props.onGenerateOutline} outline={props.outline} /> : null}
    {props.selectedStep === "draft" ? <DraftWorkspace busy={props.busy} busyLabel={props.busyLabel} draft={props.draft} keyword={props.keywords.find(k => k.id === props.primaryKeywordId)?.keyword} onConfirm={() => props.onSelect("links")} onGenerate={props.onGenerateDraft} onUpdateMarkdown={props.onUpdateMarkdown} onAddImage={props.onAddImage} onAddImages={props.onAddImages} onRemoveImage={props.onRemoveImage} /> : null}
    {props.selectedStep === "links"
      ? <LinksWorkspace busy={props.busy} busyLabel={props.busyLabel} links={props.links} onConfirm={() => props.onSelect("ready")} onGenerate={props.onGenerateLinks} onSetStatus={props.onSetLinkStatus} />
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
      {busy ? <div className="mt-3"><LoadingSkeleton label="Đang lấy keyword và volume từ Semrush..." /></div> : null}
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

function BriefWorkspace({ brief, busy, busyLabel, onGenerate, onConfirm }: { brief: Brief | null; busy: boolean; busyLabel: string; onGenerate: () => void; onConfirm: () => void }) {
  return <ResultWorkspace
    actionLabel={brief ? "Sinh lại brief" : "Sinh brief"}
    busy={busy}
    busyLabel={busyLabel}
    emptyDescription="Chốt bộ từ khóa ở bước trước rồi sinh brief."
    emptyTitle="Chưa có định hướng bài"
    onGenerate={onGenerate}
  >
    {brief ? <div className="grid gap-4">
      <ResultCard label="Search intent"><p>{brief.searchIntent}</p></ResultCard>
      <ResultCard label="Góc triển khai"><p>{brief.angle}</p></ResultCard>
      <ResultCard label="Semantic topics"><TagList items={brief.semanticTopics} /></ResultCard>
      <ResultCard label="FAQ đề xuất"><List items={brief.candidateFaqs} /></ResultCard>
      {brief.competitorInsights && brief.competitorInsights.length > 0 ? (
        <ResultCard label="Insight đối thủ">
          <div className="grid gap-3">
            {brief.competitorInsights.slice(0, 10).map((insight) => (
              <article className="rounded-lg border p-3" key={`${insight.rank}-${insight.url}`}>
                <p className="text-xs font-semibold text-[#80640b]">#{insight.rank} · {insight.title}</p>
                <p className="mt-2 text-sm text-[#273247]">{insight.contentSummary}</p>
                <p className="mt-2 text-xs text-[#687386]">{insight.outlinePattern}</p>
              </article>
            ))}
          </div>
        </ResultCard>
      ) : null}
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

function OutlineWorkspace({ busy, busyLabel, onGenerate, onConfirm, outline }: { busy: boolean; busyLabel: string; onGenerate: () => void; onConfirm: () => void; outline: Outline | null }) {
  return <ResultWorkspace
    actionLabel={outline ? "Sinh lại outline" : "Sinh outline"}
    busy={busy}
    busyLabel={busyLabel}
    emptyDescription="Sinh brief trước khi tạo dàn ý."
    emptyTitle="Chưa có dàn ý"
    onGenerate={onGenerate}
  >
    {outline ? <div className="grid gap-3">
      <ResultCard label="Tiêu đề dự kiến"><h3 className="font-bold break-words">{outline.title}</h3><p className="mt-2 text-sm text-[#687386] break-words">{outline.introDirection}</p></ResultCard>
      {outline.keywordCoverage && outline.keywordCoverage.length > 0 ? (
        <ResultCard label="Keyword coverage">
          <div className="grid gap-2">
            {outline.keywordCoverage.map((item) => (
              <div className="rounded-lg border p-3" key={`${item.keyword}-${item.placement}`}>
                <p className="text-sm font-semibold text-[#273247]">{item.keyword}</p>
                <p className="mt-1 text-xs text-[#687386]">Volume {item.monthlyVolume ?? "missing"} · {item.intent}</p>
                <p className="mt-1 text-xs text-[#80640b]">{item.placement}</p>
              </div>
            ))}
          </div>
        </ResultCard>
      ) : null}
      {outline.sections.map((section, index) =>
        <ResultCard key={`${section.heading}-${index}`} label={`${index + 1}. ${section.heading}`}><List items={section.bullets} /></ResultCard>
      )}
      <div className="mt-4 flex justify-end border-t pt-4">
        <Button onClick={onConfirm}><CheckCircle2 size={16} className="mr-2" />Xác nhận dàn ý và tiếp tục</Button>
      </div>
    </div> : null}
  </ResultWorkspace>;
}

function DraftWorkspace({
  busy,
  busyLabel,
  draft,
  keyword,
  onGenerate,
  onUpdateMarkdown,
  onConfirm,
  onAddImage,
  onAddImages,
  onRemoveImage
}: {
  busy: boolean;
  busyLabel: string;
  draft: Draft | null;
  keyword?: string;
  onConfirm: () => void;
  onGenerate: () => void;
  onUpdateMarkdown: (md: string) => void;
  onAddImage: (img: GeneratedArticleImage) => void;
  onAddImages?: (imgs: GeneratedArticleImage[]) => void;
  onRemoveImage: (id: string) => void;
}) {
  return <ResultWorkspace
    actionLabel={draft ? "Sinh lại draft" : "Sinh draft"}
    busy={busy}
    busyLabel={busyLabel}
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
      <ArticleImagesPanel busy={busy} images={draft.generatedImages ?? []} draft={draft} keyword={keyword} onAddImage={onAddImage} onAddImages={onAddImages} onRemoveImage={onRemoveImage} />
      <ResultCard label="Markdown">
        <Textarea className="min-h-[520px] font-mono text-xs leading-6" value={draft.markdown} onChange={(e) => onUpdateMarkdown(e.target.value)} />
      </ResultCard>
      <div className="mt-4 flex justify-end border-t pt-4">
        <Button onClick={onConfirm}><CheckCircle2 size={16} className="mr-2" />Xác nhận bản nháp và tiếp tục</Button>
      </div>
    </div> : null}
  </ResultWorkspace>;
}

export function ArticleImagesPanel({
  busy,
  images,
  draft,
  keyword,
  onAddImage,
  onAddImages,
  onRemoveImage
}: {
  busy: boolean;
  images: GeneratedArticleImage[];
  draft?: Draft | null;
  keyword?: string;
  onAddImage: (img: GeneratedArticleImage) => void;
  onAddImages?: (imgs: GeneratedArticleImage[]) => void;
  onRemoveImage: (id: string) => void;
}) {
  const [pickerModal, setPickerModal] = useState<{ isOpen: boolean; kind: "hero" | "inline" }>({ isOpen: false, kind: "hero" });
  const [generatingImageKey, setGeneratingImageKey] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggestPrompts = async () => {
    if (!draft || !keyword || !onAddImages) return;
    try {
      setIsSuggesting(true);
      const res = await postJson<{ images: GeneratedArticleImage[] }>("/admin/article-images/suggest-prompts", { draft, keyword });
      if (res && res.images) onAddImages(res.images);
    } catch (e) {
      alert("Lỗi gợi ý kịch bản ảnh: " + String(e));
    } finally {
      setIsSuggesting(false);
    }
  };

  const generateImage = async (kind: "hero" | "inline", source?: GeneratedArticleImage) => {
    if (!draft) return;
    const imageKey = source?.id ?? `${kind}-new`;

    try {
      setGeneratingImageKey(imageKey);
      const image = await generateArticleImageFromDraft({ draft, keyword, kind });

      if (source) {
        onRemoveImage(source.id);
      }
      onAddImage(image);
    } catch (error) {
      alert(`Lỗi tạo ảnh: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setGeneratingImageKey(null);
    }
  };

  const renderImages = (kind: "hero" | "inline") => {
    const filtered = images.filter(i => i.kind === kind);
    if (filtered.length === 0) return <p className="mt-2 rounded-lg bg-[#f7f7f4] p-3 text-sm text-[#687386]">Chưa có ảnh {kind === "hero" ? "bìa" : "chèn bài"}.</p>;
    
    return <div className="mt-2 grid gap-3">
      {filtered.map((image) => {
        const src = image.url || (image.base64 ? `data:${image.mimeType ?? "image/png"};base64,${image.base64}` : "");
        const isGeneratingThisImage = generatingImageKey === image.id;
        return <article className="group relative grid gap-3 rounded-lg border p-3 md:grid-cols-[220px_minmax(0,1fr)]" key={image.id}>
          <Button 
            variant="danger" 
            className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full p-0 group-hover:flex"
            disabled={isGeneratingThisImage}
            onClick={() => onRemoveImage(image.id)}
          >
            <XCircle size={12} />
          </Button>
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-[#f7f7f4] text-center text-xs font-semibold text-[#687386]">
            {src ? <img alt={image.altText} className="h-full w-full object-cover" src={src} /> : "Image plan"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{image.provider}</Badge>
              <Badge>{image.status}</Badge>
              {image.status === "planned" && (
                <Button
                  disabled={busy || isGeneratingThisImage || Boolean(generatingImageKey)}
                  size="sm"
                  className="ml-2 h-6 px-2 text-xs"
                  onClick={() => void generateImage(kind, image)}
                >
                  {isGeneratingThisImage ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Wand2 size={12} className="mr-1" />}
                  {isGeneratingThisImage ? "Đang tạo..." : "Tạo ảnh ngay"}
                </Button>
              )}
              {image.status !== "planned" && src && (
                <>
                  <Button
                    disabled={busy || isGeneratingThisImage || Boolean(generatingImageKey)}
                    size="sm"
                    variant="secondary"
                    className="ml-2 h-6 px-2 text-xs"
                    onClick={() => void generateImage(kind, image)}
                  >
                    {isGeneratingThisImage ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Wand2 size={12} className="mr-1" />}
                    {isGeneratingThisImage ? "Đang tạo..." : "Tạo lại"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      const md = `![${image.altText || "Minh họa bài viết"}](${src})`;
                      navigator.clipboard.writeText(md);
                      alert("Đã copy mã Markdown! Bạn có thể dán vào nội dung bên dưới.");
                    }}
                  >
                    <FileText size={12} className="mr-1" /> Copy Markdown
                  </Button>
                </>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-[#273247]">{image.altText}</p>
            {image.caption ? <p className="mt-1 text-xs text-[#687386]">{image.caption}</p> : null}
            <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-[#f7f7f4] p-3 text-xs leading-5 text-[#566174]">{image.prompt}</pre>
          </div>
        </article>;
      })}
    </div>;
  };

  return <ResultCard label="Ảnh bài viết">
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#273247]">1. Ảnh bìa (Hero Image)</p>
          <p className="mt-1 text-xs text-[#687386]">Dùng làm cover/thumbnail. Prompt được sinh tự động từ metadata và nội dung bài.</p>
        </div>
        <div className="flex gap-2">
          {draft && onAddImages && (
            <Button disabled={busy || isSuggesting} onClick={handleSuggestPrompts} size="sm" variant="secondary">
              <Wand2 size={15} className="mr-2" />{isSuggesting ? "Đang nghĩ..." : "Gợi ý kịch bản (AI)"}
            </Button>
          )}
          <Button disabled={busy} onClick={() => setPickerModal({ isOpen: true, kind: "hero" })} size="sm" variant="secondary">
            <ImagePlus size={15} className="mr-2" />Chọn từ thư viện
          </Button>
          <Button disabled={busy || !draft || Boolean(generatingImageKey)} onClick={() => void generateImage("hero")} size="sm" variant="secondary">
            {generatingImageKey === "hero-new" ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Wand2 size={15} className="mr-2" />}
            {generatingImageKey === "hero-new" ? "Đang tạo..." : "Tạo ảnh bìa"}
          </Button>
        </div>
      </div>
      {renderImages("hero")}
    </div>
    
    <div className="border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#273247]">2. Ảnh chèn trong bài (Inline Images)</p>
          <p className="mt-1 text-xs text-[#687386]">Tự tạo hình minh họa liên quan đến bài, không cần nhập prompt thủ công.</p>
        </div>
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => setPickerModal({ isOpen: true, kind: "inline" })} size="sm" variant="secondary">
            <ImagePlus size={15} className="mr-2" />Chọn từ thư viện
          </Button>
          <Button disabled={busy || !draft || Boolean(generatingImageKey)} onClick={() => void generateImage("inline")} size="sm" variant="secondary">
            {generatingImageKey === "inline-new" ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Wand2 size={15} className="mr-2" />}
            {generatingImageKey === "inline-new" ? "Đang tạo..." : "Tạo ảnh chèn bài"}
          </Button>
        </div>
      </div>
      {renderImages("inline")}
    </div>

    <ImagePickerModal 
      isOpen={pickerModal.isOpen} 
      kind={pickerModal.kind} 
      onClose={() => setPickerModal({ isOpen: false, kind: pickerModal.kind })} 
      onPick={onAddImage}
    />
  </ResultCard>;
}

const ARTICLE_IMAGE_NEGATIVE_PROMPT = [
  "readable text",
  "typography",
  "font",
  "letters",
  "words",
  "glyphs",
  "numbers",
  "ticker symbols",
  "article title text",
  "printed text",
  "signage",
  "labels",
  "captions",
  "subtitles",
  "logo",
  "watermark",
  "brand mark",
  "official coin logo",
  "bitcoin logo",
  "protocol logo",
  "UI screenshot",
  "fake trading interface",
  "fake chart numbers",
  "people",
  "person",
  "human",
  "humanoid",
  "man",
  "woman",
  "face",
  "portrait",
  "character",
  "avatar",
  "statue",
  "monk",
  "trader",
  "investor",
  "hands",
  "body",
  "low quality",
  "blurry",
  "distorted"
].join(", ");

function imageDimensionsForKind(kind: "hero" | "inline"): { width: number; height: number; aspectRatio: ArticleImageAspectRatio } {
  return kind === "hero"
    ? { width: 1200, height: 630, aspectRatio: "16:9" }
    : { width: 900, height: 600, aspectRatio: "4:3" };
}

async function generateArticleImageFromDraft({
  draft,
  keyword,
  kind
}: {
  draft: Draft;
  keyword?: string;
  kind: "hero" | "inline";
}) {
  const dimensions = imageDimensionsForKind(kind);
  const prompt = buildAutomaticArticleImagePrompt({ draft, keyword, kind });
  const newItem = await postJson<ImageLibraryItem>("/admin/images/generate", {
    provider: "modelslab",
    prompt,
    negativePrompt: ARTICLE_IMAGE_NEGATIVE_PROMPT,
    width: dimensions.width,
    height: dimensions.height,
    filename: `${draft.slug || "article"}-${kind}`
  });
  const metadata = parseImageMetadata(newItem.metadataJson);

  return {
    id: newItem.id,
    kind,
    provider: newItem.provider,
    model: stringFromMetadata(metadata, "model") || (newItem.provider === "modelslab" ? "modelslab" : "unknown"),
    status: "generated",
    prompt: newItem.prompt,
    url: publicApiUrl(newItem.url),
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: dimensions.aspectRatio,
    altText: buildArticleImageAltText({ draft, keyword, kind }),
    createdAt: newItem.createdAt
  } satisfies GeneratedArticleImage;
}

function buildAutomaticArticleImagePrompt({
  draft,
  keyword,
  kind
}: {
  draft: Draft;
  keyword?: string;
  kind: ArticleImageKind;
}) {
  const topic = buildShortVisualTopic(keyword || draft.title || draft.metaTitle || draft.excerpt || "crypto market");
  const format = kind === "hero" ? "wide hero image" : "inline article image";

  return `Create a simple abstract ${format} related to: ${topic}. Minimal 3D icon-style crypto/finance illustration: symbol-free circular tokens, blockchain node dots, glowing connection lines, wallet cube, abstract market line shapes without labels. No people, no humanoids, no faces, no hands, no characters, no text, no numbers, no logos, no watermarks.`;
}

function buildArticleImageAltText({
  draft,
  keyword,
  kind
}: {
  draft: Draft;
  keyword?: string;
  kind: "hero" | "inline";
}) {
  const subject = cleanPromptText(keyword || draft.title || "bài viết").slice(0, 120);
  return kind === "hero"
    ? `Ảnh bìa minh họa cho bài viết ${subject}`
    : `Ảnh minh họa trong bài về ${subject}`;
}

function cleanPromptText(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[`*_>#-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildShortVisualTopic(value: string) {
  const cleaned = cleanPromptText(value).toLowerCase();

  if (/giá|price|tỷ giá|bảng giá|market/.test(cleaned) && /coin|crypto|bitcoin|altcoin|token/.test(cleaned)) {
    return "crypto market prices today, symbol-free tokens, abstract market movement, blockchain data network";
  }

  if (/chainlink|oracle|\blink\b/.test(cleaned)) {
    return "oracle network connecting blockchain data feeds to real world data";
  }

  if (/avalanche|avax|layer 1|subnet/.test(cleaned)) {
    return "layer one blockchain ecosystem, subnet network, DeFi infrastructure";
  }

  if (/defi|staking|yield/.test(cleaned)) {
    return "DeFi staking system, liquidity flows, secure wallet infrastructure";
  }

  if (/wallet|bảo mật|security|hack|leak|risk|rủi ro/.test(cleaned)) {
    return "crypto wallet security, encrypted data shield, blockchain risk signals";
  }

  return cleanPromptText(value)
    .replace(/\([A-Z0-9]{2,12}\)/g, "")
    .replace(/\b[A-Z0-9]{2,12}\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "crypto finance concept";
}

function parseImageMetadata(metadataJson: string) {
  try {
    const parsed = JSON.parse(metadataJson || "{}");
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function stringFromMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

function LinksWorkspace({
  busy,
  busyLabel,
  links,
  onGenerate,
  onSetStatus,
  onConfirm
}: {
  busy: boolean;
  busyLabel: string;
  links: InternalLinkSuggestion[];
  onGenerate: () => void;
  onSetStatus: (id: string, status: InternalLinkSuggestion["status"]) => void;
  onConfirm: () => void;
}) {
  return <ResultWorkspace
    actionLabel={links.length ? "Gợi ý lại link" : "Gợi ý link"}
    busy={busy}
    busyLabel={busyLabel}
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
  busyLabel,
  children,
  emptyDescription,
  emptyTitle,
  onGenerate
}: {
  actionLabel: string;
  busy: boolean;
  busyLabel: string;
  children: React.ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  onGenerate: () => void;
}) {
  return <section>
    <Button disabled={busy} onClick={onGenerate}><Wand2 size={16} />{actionLabel}</Button>
    <div className="mt-4 grid gap-4">
      {busy ? <LoadingSkeleton label={busyLabel || "Đang xử lý..."} /> : null}
      {children || (busy ? null : <EmptyState description={emptyDescription} title={emptyTitle} />)}
    </div>
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
