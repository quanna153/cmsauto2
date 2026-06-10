"use client";

import { useMutation } from "@tanstack/react-query";
import { RefreshCw, WandSparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { refreshKeywordVolumes, suggestKeywords } from "./adapter";
import type { KeywordResearchLanguage, KeywordResearchRow } from "./model";

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
  const [seedKeyword, setSeedKeyword] = useState("");
  const [language, setLanguage] = useState<KeywordResearchLanguage>("vi");
  const [rows, setRows] = useState<KeywordResearchRow[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);

  const suggest = useMutation({
    mutationFn: () => suggestKeywords({
      language,
      prompt: defaultPrompt,
      seedKeyword: seedKeyword.trim()
    }),
    onSuccess: (result) => {
      setRows(result.keywordIdeas);
      setRecordId(result.recordId ?? null);
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
    }
  });
  const isBusy = suggest.isPending || refresh.isPending;

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
    <div className="sr-only" aria-live="polite">{rows.length} keyword results</div>
  </>;
}
