"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import type { ArticleLibraryImportItem, ArticleLibraryImportResult, ArticleLibraryItem } from "@/features/admin/types";
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

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function normalizeLanguage(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "vi" || normalized === "vi-vn" || normalized === "vietnamese") {
    return "vi";
  }
  if (normalized === "en" || normalized === "en-us" || normalized === "english") {
    return "en";
  }
  return null;
}

function splitKeywords(value: unknown) {
  return String(value ?? "")
    .split(/[,;\n]+/)
    .map((keyword) => keyword.trim().replace(/^#+/, "").trim())
    .filter(Boolean);
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      field += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field.trim());
      if (row.some(Boolean)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  row.push(field.trim());
  if (row.some(Boolean)) {
    rows.push(row);
  }
  return rows;
}

function rowsToImportItems(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
    );
    return {
      title: String(normalized.title ?? "").trim(),
      url: String(normalized.url ?? "").trim(),
      keywords: splitKeywords(normalized.keywords),
      language: normalizeLanguage(normalized.language)
    } satisfies ArticleLibraryImportItem;
  });
}

async function parseImportFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const [headers = [], ...bodyRows] = parseCsvRows(await file.text());
    return rowsToImportItems(bodyRows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
    ));
  }

  if (extension === "xlsx") {
    const { read, utils } = await import("xlsx");
    const workbook = read(await file.arrayBuffer(), { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return [];
    }
    return rowsToImportItems(utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], { defval: "" }));
  }

  throw new Error("Only .csv and .xlsx files are supported.");
}

export function InternalLinksFeature() {
  const client = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const query = useQuery({
    queryKey: ["article-library"],
    queryFn: () => getJson<{ articles: ArticleLibraryItem[] }>("/article-library")
  });
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [keywordLabels, setKeywordLabels] = useState("");
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ArticleLibraryImportResult | null>(null);
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
  const importLibrary = useMutation({
    mutationFn: (items: ArticleLibraryImportItem[]) => postJson<ArticleLibraryImportResult>("/article-library/import", { items }),
    onSuccess: async (result) => {
      setImportResult(result);
      await client.invalidateQueries({ queryKey: ["article-library"] });
    }
  });

  async function handleImportFile(file: File | null) {
    if (!file) {
      return;
    }
    setImportError("");
    setImportResult(null);
    try {
      const items = await parseImportFile(file);
      if (items.length === 0) {
        setImportError("The file does not contain any import rows.");
        return;
      }
      importLibrary.mutate(items);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not parse the import file.");
    }
  }

  return <>
    <PageHeader
      description="Shared destination URL database for automated internal link suggestions. Import CSV/XLSX once and reuse those records for future articles."
      eyebrow="Admin"
      title="Internal Link Library"
    />
    <section className="mb-5 grid gap-4 rounded-xl border bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#f7f7f4] p-2 text-[#80640b]"><FileSpreadsheet size={20} /></div>
        <div>
          <h2 className="font-semibold">Import CSV/XLSX</h2>
          <p className="mt-1 text-sm text-[#687386]">Required columns: title, url. Optional columns: keywords, language. If language is empty, /vi-vn/ imports as Vietnamese; other valid URLs import as English.</p>
        </div>
      </div>
      <input
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(event) => {
          void handleImportFile(event.target.files?.[0] ?? null)
            .finally(() => {
              event.target.value = "";
            });
        }}
        ref={fileInputRef}
        type="file"
      />
      <Button disabled={importLibrary.isPending} onClick={() => fileInputRef.current?.click()} type="button">
        <Upload size={16} />{importLibrary.isPending ? "Importing..." : "Import CSV/XLSX"}
      </Button>
      {importResult
        ? <div className="rounded-lg bg-[#f7f7f4] p-3 text-sm text-[#566174] lg:col-span-2">
            <strong className="text-[#273247]">Import complete:</strong> {importResult.created} created, {importResult.updated} updated, {importResult.skipped} skipped.
            {importResult.errors.length
              ? <ul className="mt-2 grid gap-1 text-xs text-red-700">
                  {importResult.errors.slice(0, 5).map((error) => <li key={`${error.row}-${error.message}`}>Row {error.row}: {error.message}</li>)}
                </ul>
              : null}
          </div>
        : null}
    </section>
    {importError ? <div className="mb-5"><ErrorState message={importError} /></div> : null}
    {importLibrary.error ? <div className="mb-5"><ErrorState message={importLibrary.error.message} /></div> : null}
    <section className="mb-5 grid gap-3 rounded-xl border bg-white p-4 lg:grid-cols-[1fr_1fr_140px_auto]">
      <Input onChange={(event) => setTitle(event.target.value)} placeholder="Article title" value={title} />
      <Input onChange={(event) => setUrl(event.target.value)} placeholder="/vi-vn/slug" value={url} />
      <Select onChange={(event) => setLanguage(event.target.value as "vi" | "en")} value={language}>
        <option value="vi">Vietnamese</option>
        <option value="en">English</option>
      </Select>
      <Button disabled={!title.trim() || !url.trim() || create.isPending} onClick={() => create.mutate()}>
        <Plus size={16} />Add
      </Button>
      <label className="grid gap-1 lg:col-span-4">
        <span className="text-xs font-semibold text-[#566174]">Optional keywords, separated by commas</span>
        <Input
          onChange={(event) => setKeywordLabels(event.target.value)}
          placeholder="#bitcoin, #blockchain, what is bitcoin"
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
          ? <EmptyState description="Import article URLs and titles to seed automated internal link suggestions." title="The library is empty" />
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
        <p className="mt-1 text-xs text-[#687386]">Imported {new Date(article.createdAt).toLocaleDateString()}</p>
      </div>
      <Button aria-label="Delete link" onClick={onRemove} size="sm" variant="ghost"><Trash2 size={16} /></Button>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      {article.keywords.length > 0
        ? article.keywords.map((keyword) => <Badge key={keyword}>#{keyword}</Badge>)
        : <p className="text-xs font-semibold text-[#687386]">No keywords yet; matching can still use the title.</p>}
    </div>
    <div className="mt-3 grid gap-2">
      <Input
        aria-label={`Title for ${article.title}`}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Article title"
        value={title}
      />
      <Input
        aria-label={`URL for ${article.title}`}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="/vi-vn/slug or https://..."
        value={url}
      />
      <Input
        aria-label={`Keywords for ${article.title}`}
        onChange={(event) => setKeywordLabels(event.target.value)}
        placeholder="#bitcoin, #blockchain"
        value={keywordLabels}
      />
      <div><Button
        aria-label={`Save changes for ${article.title}`}
        disabled={!title.trim() || !url.trim() || isPending}
        onClick={() => onSave({ title: title.trim(), url: url.trim(), keywords: parsedKeywords })}
        size="sm"
        variant="secondary"
      >
        <Save size={15} />Save changes
      </Button></div>
    </div>
  </article>;
}
