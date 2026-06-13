"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import type { ArticleLibraryImportItem, ArticleLibraryImportResult, ArticleLibraryItem } from "@/features/admin/types";
import { deleteJson, getJson, patchJson, postJson } from "@/lib/api";

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
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryLanguage, setLibraryLanguage] = useState<"vi" | "en">("vi");
  const [libraryPage, setLibraryPage] = useState(1);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<ArticleLibraryImportResult | null>(null);
  const pageSize = 25;
  const filteredArticles = useMemo(() => {
    const articles = query.data?.articles ?? [];
    const normalizedSearch = librarySearch.trim().toLocaleLowerCase();

    return articles.filter((article) => {
      const matchesLanguage = article.language === libraryLanguage;
      const matchesSearch = !normalizedSearch
        || [article.title, article.url].join(" ").toLocaleLowerCase().includes(normalizedSearch);

      return matchesLanguage && matchesSearch;
    });
  }, [libraryLanguage, librarySearch, query.data?.articles]);
  const pageCount = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const currentPage = Math.min(libraryPage, pageCount);
  const visibleArticles = filteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const create = useMutation({
    mutationFn: () => postJson("/article-library", {
      id: crypto.randomUUID(),
      title,
      url,
      language,
      summary: "",
      keywords: []
    }),
    onSuccess: async () => {
      setTitle("");
      setUrl("");
      await client.invalidateQueries({ queryKey: ["article-library"] });
    }
  });
  const updateArticle = useMutation({
    mutationFn: ({ article, changes }: { article: ArticleLibraryItem; changes: Pick<ArticleLibraryItem, "title" | "url"> }) =>
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
      description="Kho URL đích dùng chung cho hệ thống gợi ý internal link. Matching hiện ưu tiên tiêu đề bài và URL."
      eyebrow="Admin"
      title="Kho links"
    />
    <section className="mb-5 grid gap-4 rounded-xl border bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#f7f7f4] p-2 text-[#80640b]"><FileSpreadsheet size={20} /></div>
        <div>
          <h2 className="font-semibold">Import CSV/XLSX</h2>
          <p className="mt-1 text-sm text-[#687386]">Cột bắt buộc: title, url. Cột language là tuỳ chọn. Nếu bỏ trống, /vi-vn/ sẽ là Vietnamese; URL hợp lệ khác sẽ là English.</p>
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
      <h2 className="font-semibold lg:col-span-4">Thêm link mới</h2>
      <Input onChange={(event) => setTitle(event.target.value)} placeholder="Article title" value={title} />
      <Input onChange={(event) => setUrl(event.target.value)} placeholder="/vi-vn/slug" value={url} />
      <Select onChange={(event) => setLanguage(event.target.value as "vi" | "en")} value={language}>
        <option value="vi">Vietnamese</option>
        <option value="en">English</option>
      </Select>
      <Button disabled={!title.trim() || !url.trim() || create.isPending} onClick={() => create.mutate()}>
        <Plus size={16} />Add
      </Button>
    </section>
    {create.error ? <div className="mb-5"><ErrorState message={create.error.message} /></div> : null}
    {updateArticle.error ? <div className="mb-5"><ErrorState message={updateArticle.error.message} /></div> : null}
    {query.isLoading
      ? <LoadingSkeleton />
      : query.error
        ? <ErrorState message={query.error.message} />
        : !query.data?.articles.length
          ? <EmptyState description="Import article URLs and titles to seed automated internal link suggestions." title="The library is empty" />
          : <>
              <section className="mb-4 grid gap-3 rounded-xl border bg-white p-4 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center">
                <h2 className="font-semibold lg:col-span-3">Danh sách link</h2>
                <Input
                  onChange={(event) => {
                    setLibrarySearch(event.target.value);
                    setLibraryPage(1);
                  }}
                  placeholder="Search title or URL"
                  value={librarySearch}
                />
                <Select
                  onChange={(event) => {
                    setLibraryLanguage(event.target.value as "vi" | "en");
                    setLibraryPage(1);
                  }}
                  value={libraryLanguage}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
                </Select>
                <p className="text-sm font-semibold text-[#566174] lg:text-right">
                  {filteredArticles.length} links
                </p>
              </section>
              {visibleArticles.length === 0
                ? <EmptyState description="Try another title, URL, or language filter." title="No matching links" />
                : <div className="grid gap-3">
                    {visibleArticles.map((article) =>
                      <ArticleLibraryCard
                        article={article}
                        isPending={updateArticle.isPending}
                        key={article.id}
                        onRemove={() => remove.mutate(article.id)}
                        onSave={(changes) => updateArticle.mutateAsync({ article, changes })}
                      />
                    )}
                  </div>}
              <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-white p-4 text-sm font-semibold text-[#566174] sm:flex-row sm:items-center sm:justify-between">
                <span>Page {currentPage} of {pageCount}</span>
                <div className="flex gap-2">
                  <Button disabled={currentPage <= 1} onClick={() => setLibraryPage((page) => Math.max(1, page - 1))} size="sm" variant="secondary">Previous</Button>
                  <Button disabled={currentPage >= pageCount} onClick={() => setLibraryPage((page) => Math.min(pageCount, page + 1))} size="sm" variant="secondary">Next</Button>
                </div>
              </div>
            </>}
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
  onSave: (changes: Pick<ArticleLibraryItem, "title" | "url">) => Promise<unknown>;
}) {
  const [title, setTitle] = useState(article.title);
  const [url, setUrl] = useState(article.url);
  const [isEditing, setIsEditing] = useState(false);

  function startEditing() {
    setTitle(article.title);
    setUrl(article.url);
    setIsEditing(true);
  }

  function cancelEditing() {
    setTitle(article.title);
    setUrl(article.url);
    setIsEditing(false);
  }

  async function saveChanges() {
    await onSave({ title: title.trim(), url: url.trim() });
    setIsEditing(false);
  }

  const urlPreview = article.url.length > 60 ? `${article.url.slice(0, 57)}...` : article.url;

  return <article className="rounded-xl border bg-white p-4">
    {!isEditing
      ? <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[#172033]" title={article.url}>{urlPreview}</strong>
          <p className="mt-1 text-sm text-[#566174]">{article.title}</p>
          <p className="mt-2 text-xs text-[#687386]">Cập nhật {new Date(article.createdAt).toLocaleDateString("vi-VN")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button aria-label={`Sửa link ${article.title}`} onClick={startEditing} size="sm" variant="secondary">
            <Pencil size={14} />Sửa
          </Button>
          <Button aria-label={`Xóa link ${article.title}`} onClick={onRemove} size="sm" variant="danger">
            <Trash2 size={14} />Xóa
          </Button>
        </div>
      </div>
      : <div className="grid gap-2">
        <Input
          aria-label={`URL for ${article.title}`}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="/vi-vn/slug or https://..."
          value={url}
        />
        <Input
          aria-label={`Title for ${article.title}`}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Article title"
          value={title}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            aria-label={`Lưu thay đổi cho ${article.title}`}
            disabled={!title.trim() || !url.trim() || isPending}
            onClick={() => void saveChanges()}
            size="sm"
            variant="secondary"
          >
            <Save size={15} />Lưu
          </Button>
          <Button disabled={isPending} onClick={cancelEditing} size="sm" variant="ghost">
            <X size={15} />Hủy
          </Button>
        </div>
      </div>
    }
  </article>;
}
