"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, RotateCcw, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { getKeywordResearchHistory, refreshKeywordVolumes, suggestKeywords } from "./adapter";
import type { KeywordResearchLanguage, KeywordResearchRow } from "./model";
import type { HistoryRecord } from "@/features/admin/types";

const defaultPrompt = [
  "Select 4 to 8 useful SEO keyword ideas from the provider data.",
  "Return strict JSON only with keywordIdeas containing keyword, intent, and cluster."
].join("\n");

const intentLabels: Record<KeywordResearchRow["intent"], string> = {
  commercial: "Commercial",
  comparison: "Comparison",
  informational: "Informational",
  transactional: "Transactional"
};

function formatVolume(volume: number | null) {
  return volume === null ? "Missing" : volume.toLocaleString("en-US");
}

function formatCheckedAt(value: string | null) {
  if (!value) {
    return "Not checked";
  }

  return new Date(value).toLocaleString("vi-VN");
}

export function KeywordResearchFeature() {
  const client = useQueryClient();
  const [seedKeyword, setSeedKeyword] = useState("");
  const [language, setLanguage] = useState<KeywordResearchLanguage>("vi");
  const [rows, setRows] = useState<KeywordResearchRow[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const historyQuery = useQuery({
    queryKey: ["keyword-research-history"],
    queryFn: getKeywordResearchHistory
  });
  const keywordHistory = useMemo(() => historyQuery.data?.slice(0, 8) ?? [], [historyQuery.data]);

  const suggest = useMutation({
    mutationFn: () => suggestKeywords({
      language,
      prompt: defaultPrompt,
      seedKeyword: seedKeyword.trim()
    }),
    onSuccess: (result) => {
      setRows(result.keywordIdeas);
      setRecordId(result.recordId ?? null);
      void client.invalidateQueries({ queryKey: ["keyword-research-history"] });
    }
  });
  const refresh = useMutation({
    mutationFn: () => refreshKeywordVolumes({
      language,
      keywordIdeas: rows.map((row) => ({
        cluster: row.cluster,
        id: row.id,
        intent: row.intent,
        keyword: row.keyword
      }))
    }),
    onSuccess: (result) => {
      setRows(result.keywordIdeas);
      setRecordId(result.recordId ?? recordId);
      void client.invalidateQueries({ queryKey: ["keyword-research-history"] });
    }
  });
  const isBusy = suggest.isPending || refresh.isPending;

  useEffect(() => {
    if (historyHydrated || rows.length > 0 || seedKeyword.trim()) {
      return;
    }
    const latest = keywordHistory[0];
    if (!latest) {
      return;
    }
    restoreHistory(latest);
    setHistoryHydrated(true);
  }, [historyHydrated, keywordHistory, rows.length, seedKeyword]);

  function restoreHistory(record: HistoryRecord) {
    const request = record.request as Partial<{ seedKeyword: string; language: KeywordResearchLanguage }> | null;
    const response = record.response as Partial<{ keywordIdeas: KeywordResearchRow[] }> | null;
    setSeedKeyword(request?.seedKeyword ?? "");
    setLanguage(request?.language ?? "vi");
    setRows(response?.keywordIdeas ?? []);
    setRecordId(record.id);
  }

  return <>
    <PageHeader
      description="Research Google keyword ideas, search volume, and provider status from the configured backend APIs."
      eyebrow="Admin"
      title="Nghiên cứu từ khóa"
    />
    <form
      className="mb-5 grid gap-3 rounded-xl border bg-white p-4 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto] lg:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        if (!seedKeyword.trim() || suggest.isPending) {
          return;
        }
        suggest.mutate();
      }}
    >
      <label className="grid gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#566174]">Seed keyword</span>
        <Input
          onChange={(event) => setSeedKeyword(event.target.value)}
          placeholder="bitcoin là gì"
          value={seedKeyword}
        />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#566174]">Language</span>
        <Select onChange={(event) => setLanguage(event.target.value as KeywordResearchLanguage)} value={language}>
          <option value="vi">Vietnamese</option>
          <option value="en">English</option>
        </Select>
      </label>
      <Button disabled={!seedKeyword.trim() || suggest.isPending} type="submit">
        <WandSparkles size={16} />Get keywords
      </Button>
      <Button disabled={rows.length === 0 || refresh.isPending} onClick={() => refresh.mutate()} type="button" variant="secondary">
        <RefreshCw size={16} />Refresh volume
      </Button>
    </form>

    {suggest.error ? <div className="mb-5"><ErrorState message={suggest.error.message} /></div> : null}
    {refresh.error ? <div className="mb-5"><ErrorState message={refresh.error.message} /></div> : null}
    {recordId ? <p className="mb-3 text-xs font-semibold text-[#687386]">Record ID: {recordId}</p> : null}

    {isBusy
      ? <LoadingSkeleton label={suggest.isPending ? "Fetching keyword ideas..." : "Refreshing search volume..."} />
      : rows.length === 0
        ? <EmptyState description="Enter a seed keyword and run research to test Semrush keyword and volume integration." title="No keyword research yet" />
        : <>
            <div className="hidden overflow-hidden rounded-xl border bg-white lg:block">
              <Table>
                <TableHead>
                  <tr>
                    <th className="px-4 py-3">Keyword</th>
                    <th>Intent</th>
                    <th>Cluster</th>
                    <th>Volume</th>
                    <th>Provider</th>
                    <th>Status</th>
                  </tr>
                </TableHead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <TableCell className="font-semibold">{row.keyword}</TableCell>
                      <TableCell>{intentLabels[row.intent]}</TableCell>
                      <TableCell>{row.cluster}</TableCell>
                      <TableCell>{formatVolume(row.monthlyVolume)}</TableCell>
                      <TableCell>
                        <span className="block">{row.provider}</span>
                        <span className="text-xs text-[#687386]">{formatCheckedAt(row.checkedAt)}</span>
                      </TableCell>
                      <TableCell><Badge>{row.status}</Badge></TableCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {rows.map((row) => (
                <article className="rounded-xl border bg-white p-4" key={row.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.keyword}</p>
                      <p className="mt-1 text-sm text-[#687386]">{intentLabels[row.intent]} · {row.cluster}</p>
                    </div>
                    <Badge>{row.status}</Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-semibold text-[#687386]">Volume</dt>
                      <dd className="mt-1">{formatVolume(row.monthlyVolume)}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#687386]">Provider</dt>
                      <dd className="mt-1">{row.provider}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>}
    <section className="mt-5 rounded-xl border bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#172033]">Lịch sử nghiên cứu</h2>
          <p className="mt-1 text-sm text-[#687386]">Các lần search keyword được lưu trên backend, refresh trang không mất.</p>
        </div>
        <Button disabled={!rows.length} onClick={() => {
          setRows([]);
          setRecordId(null);
          setSeedKeyword("");
        }} size="sm" type="button" variant="secondary">
          <RotateCcw size={15} />Làm mới form
        </Button>
      </div>
      {historyQuery.isLoading
        ? <LoadingSkeleton label="Đang tải lịch sử keyword..." />
        : keywordHistory.length === 0
          ? <p className="rounded-lg bg-[#f7f7f4] p-3 text-sm text-[#687386]">Chưa có lịch sử nghiên cứu từ khóa.</p>
          : <div className="grid gap-2 md:grid-cols-2">
              {keywordHistory.map((record) => <button
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
    <div className="sr-only" aria-live="polite">{rows.length} keyword results</div>
  </>;
}

function historyTitle(record: HistoryRecord) {
  const request = record.request as Partial<{ seedKeyword: string; language: KeywordResearchLanguage }> | null;
  const response = record.response as Partial<{ keywordIdeas: KeywordResearchRow[] }> | null;
  const count = response?.keywordIdeas?.length ?? 0;
  const language = request?.language === "en" ? "English" : "Vietnamese";
  return `${request?.seedKeyword ?? "Keyword"} · ${language} · ${count} kết quả`;
}
