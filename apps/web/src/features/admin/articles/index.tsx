"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FilePlus2, FlaskConical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { buildFactoryRetryHref, shouldShowFactoryRetry } from "@/features/admin/articles/factory-retry";
import type { ArticleSession } from "@/features/admin/types";
import { deleteJson, getJson } from "@/lib/api";

const stepLabels: Record<ArticleSession["activeStep"], string> = {
  keywords: "Đang làm: Từ khóa",
  brief: "Đang làm: Brief",
  outline: "Đang làm: Outline",
  draft: "Đang làm: Draft",
  links: "Đang làm: Internal links",
  ready: "Sẵn sàng editor"
};

function formatPublishTime(article: ArticleSession) {
  const publishTime = article.publishedAt ?? article.publishAt;
  if (!publishTime) return "Chưa lên lịch";
  return new Date(publishTime).toLocaleString("vi-VN");
}

export function ArticlesFeature() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["articles"], queryFn: () => getJson<{ articles: ArticleSession[] }>("/articles") });
  const [languageFilter, setLanguageFilter] = useState<"all" | "vi" | "en">("all");
  const articles = query.data?.articles ?? [];
  const filteredArticles = useMemo(() => articles.filter((article) =>
    languageFilter === "all" || article.inputs.language === languageFilter
  ), [articles, languageFilter]);
  const remove = useMutation({
    mutationFn: (article: ArticleSession) => deleteJson(`/articles/${article.id}`),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["articles"] });
    }
  });

  function confirmDelete(article: ArticleSession) {
    const title = article.draft?.title || article.inputs.seedKeyword || "bài viết này";
    if (!window.confirm(`Xóa "${title}"? Bài sẽ bị xóa khỏi quản lý bài và public nếu đã publish.`)) {
      return;
    }
    remove.mutate(article);
  }

  return <>
    <PageHeader
      actions={<Link href="/admin/articles/new"><Button><FilePlus2 size={16} />Đăng bài thủ công</Button></Link>}
      description="Theo dõi bài AI, sửa nội dung, chỉnh internal link và lên lịch publish."
      eyebrow="Admin"
      title="Quản lý bài viết"
    />
    <section className="mb-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-center">
      <Select onChange={(event) => setLanguageFilter(event.target.value as "all" | "vi" | "en")} value={languageFilter}>
        <option value="all">Tất cả ngôn ngữ</option>
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </Select>
      <p className="text-sm text-[#687386]">Lọc riêng bài tiếng Việt và tiếng Anh để tránh trộn nội dung khi duyệt.</p>
      <p className="text-sm font-semibold text-[#566174] sm:text-right">{filteredArticles.length} / {articles.length} bài</p>
    </section>
    {query.isLoading
      ? <LoadingSkeleton />
      : query.error
        ? <ErrorState message={query.error.message} />
        : remove.error
          ? <ErrorState message={remove.error.message} />
        : !articles.length
          ? <EmptyState description="Tạo bài bằng Article Factory hoặc đăng bài thủ công." title="Chưa có bài viết" />
          : filteredArticles.length === 0
            ? <EmptyState description="Không có bài viết nào thuộc ngôn ngữ đang lọc." title="Không có bài phù hợp" />
          : <div className="overflow-hidden rounded-xl border bg-white">
              <Table>
                <TableHead><tr><th className="px-4 py-3">Bài viết</th><th>Trạng thái</th><th>Thời gian publish</th><th></th></tr></TableHead>
                <tbody>{filteredArticles.map((article) =>
                  <tr key={article.id}>
                    <TableCell>
                      <strong>{article.draft?.title || article.inputs.seedKeyword || "Bài chưa đặt tiêu đề"}</strong>
                      <p className="mt-1 text-xs text-[#687386]">{article.inputs.language === "vi" ? "Tiếng Việt" : "English"}</p>
                      <p className="mt-1 text-xs font-semibold text-[#80640b]">{stepLabels[article.activeStep]}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={article.reviewStatus} /></TableCell>
                    <TableCell>{formatPublishTime(article)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-3">
                        {article.activeStep !== "ready"
                          ? <Link className="inline-flex items-center gap-1 font-semibold text-[#80640b]" href={`/admin/factory?articleId=${article.id}`}><FlaskConical size={14} />Tiếp tục tạo</Link>
                          : null}
                        {shouldShowFactoryRetry(article)
                          ? <Link className="inline-flex items-center gap-1 font-semibold text-[#80640b]" href={buildFactoryRetryHref(article)}><FlaskConical size={14} />Tạo lại AI</Link>
                          : null}
                        <Link className="inline-flex items-center gap-1 font-semibold text-[#80640b]" href={`/admin/articles/${article.id}`}><Pencil size={14} />Sửa bài</Link>
                        {article.livePath ? <Link className="inline-flex items-center gap-1 font-semibold text-[#566174]" href={article.livePath}><ExternalLink size={14} />Xem public</Link> : null}
                        <button
                          className="inline-flex items-center gap-1 font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={remove.isPending}
                          onClick={() => confirmDelete(article)}
                          type="button"
                        >
                          <Trash2 size={14} />Xóa
                        </button>
                      </div>
                    </TableCell>
                  </tr>
                )}</tbody>
              </Table>
            </div>}
  </>;
}
