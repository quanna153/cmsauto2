"use client";

import { AlertTriangle, BarChart3, Clock3, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getDashboardSnapshot } from "./adapter";
import type { DashboardArticleRow, DashboardMetric } from "./model";

export function DashboardFeature() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: getDashboardSnapshot
  });

  const errorMessage = dashboardQuery.error instanceof Error
    ? dashboardQuery.error.message
    : "Không tải được dữ liệu tổng quan.";

  return (
    <>
      <PageHeader
        actions={(
          <Button
            disabled={dashboardQuery.isFetching}
            onClick={() => void dashboardQuery.refetch()}
            type="button"
            variant="secondary"
          >
            <RefreshCw className={cn("size-4", dashboardQuery.isFetching && "animate-spin")} />
            Làm mới
          </Button>
        )}
        description="Dữ liệu lấy trực tiếp từ bài viết, trạng thái duyệt và lịch publish trong CMS."
        eyebrow="Admin"
        title="Tổng quan vận hành"
      />

      {dashboardQuery.isLoading ? <LoadingSkeleton label="Đang tải dữ liệu tổng quan..." /> : null}
      {dashboardQuery.isError ? <ErrorState message={errorMessage} /> : null}

      {dashboardQuery.data ? (
        <div className="space-y-5">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardQuery.data.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.72fr)_minmax(320px,0.28fr)]">
            <div className="rounded-xl border bg-white p-5">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-bold text-[#172033]">
                    <FileText className="size-4 text-[#a88412]" />
                    Bài viết mới cập nhật
                  </h2>
                  <p className="mt-1 text-sm text-[#687386]">
                    Cập nhật lúc {formatDateTime(dashboardQuery.data.generatedAt)}
                  </p>
                </div>
                <Link className="text-sm font-semibold text-[#a88412] hover:text-[#80640b]" href="/admin/articles">
                  Xem tất cả
                </Link>
              </div>
              <ArticleTable emptyDescription="Chưa có bài viết trong CMS." rows={dashboardQuery.data.recentArticles} />
            </div>

            <div className="space-y-5">
              <section className="rounded-xl border bg-white p-5">
                <h2 className="flex items-center gap-2 font-bold text-[#172033]">
                  <BarChart3 className="size-4 text-[#a88412]" />
                  Phân bổ trạng thái
                </h2>
                <div className="mt-4 space-y-3">
                  {dashboardQuery.data.statusCounts.map((item) => (
                    <div key={item.status} className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f7f4] px-3 py-2">
                      <StatusBadge status={item.status} />
                      <span className="text-lg font-bold text-[#172033]">{item.count}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border bg-white p-5">
                <h2 className="flex items-center gap-2 font-bold text-[#172033]">
                  <AlertTriangle className="size-4 text-[#a88412]" />
                  Việc cần xử lý
                </h2>
                <div className="mt-4 space-y-3">
                  {dashboardQuery.data.actionItems.length > 0
                    ? dashboardQuery.data.actionItems.map((article) => <ActionItem key={article.id} article={article} />)
                    : (
                      <EmptyState
                        description="Không có bài lỗi, bài cần sửa hoặc bài đang làm dở."
                        title="Không có việc tồn"
                      />
                    )}
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className={cn("rounded-xl border p-5", metricToneClassNames[metric.tone ?? "neutral"])}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#687386]">{metric.label}</p>
      <p className="mt-3 text-3xl font-bold text-[#172033]">{metric.value}</p>
      <p className="mt-2 text-sm text-[#687386]">{metric.hint}</p>
    </article>
  );
}

function ArticleTable({ emptyDescription, rows }: { emptyDescription: string; rows: DashboardArticleRow[] }) {
  if (rows.length === 0) {
    return <EmptyState description={emptyDescription} title="Chưa có dữ liệu" />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHead>
          <tr>
            <th className="px-4 py-3">Tiêu đề</th>
            <th className="px-4 py-3">Trạng thái</th>
            <th className="px-4 py-3">Bước</th>
            <th className="px-4 py-3">Cập nhật</th>
          </tr>
        </TableHead>
        <tbody>
          {rows.map((article) => (
            <tr key={article.id} className="hover:bg-[#f7f7f4]">
              <TableCell>
                <Link className="font-semibold text-[#172033] hover:text-[#a88412]" href={article.href}>
                  {article.title}
                </Link>
              </TableCell>
              <TableCell><StatusBadge status={article.status} /></TableCell>
              <TableCell className="text-[#687386]">{stepLabels[article.activeStep]}</TableCell>
              <TableCell className="whitespace-nowrap text-[#687386]">{formatDateTime(article.updatedAt)}</TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function ActionItem({ article }: { article: DashboardArticleRow }) {
  return (
    <Link className="block rounded-lg border bg-[#f7f7f4] p-3 transition hover:border-[#d4af22] hover:bg-white" href={article.href}>
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm font-semibold text-[#172033]">{article.title}</p>
        <StatusBadge status={article.status} />
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs text-[#687386]">
        <Clock3 className="size-3" />
        {stepLabels[article.activeStep]} · {formatDateTime(article.updatedAt)}
      </p>
    </Link>
  );
}

const metricToneClassNames: Record<NonNullable<DashboardMetric["tone"]>, string> = {
  neutral: "bg-white",
  success: "border-green-100 bg-green-50",
  warning: "border-amber-100 bg-amber-50",
  danger: "border-red-100 bg-red-50"
};

const stepLabels: Record<DashboardArticleRow["activeStep"], string> = {
  keywords: "Từ khóa",
  brief: "Brief",
  outline: "Dàn ý",
  draft: "Bản nháp",
  links: "Internal link",
  ready: "Sẵn sàng"
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
