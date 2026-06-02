"use client";

import { useQuery } from "@tanstack/react-query";
import { FilePlus2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import type { ArticleSession } from "@/features/admin/types";
import { getJson } from "@/lib/api";

export function ArticlesFeature() {
  const query = useQuery({ queryKey: ["articles"], queryFn: () => getJson<{ articles: ArticleSession[] }>("/articles") });
  return <><PageHeader actions={<Link href="/admin/articles/new"><Button><FilePlus2 size={16} />Đăng bài thủ công</Button></Link>} description="Theo dõi bài AI và mở editor fallback khi cần xử lý tay." eyebrow="Admin" title="Quản lý bài viết" />{query.isLoading ? <LoadingSkeleton /> : query.error ? <ErrorState message={query.error.message} /> : !query.data?.articles.length ? <EmptyState description="Tạo bài bằng Article Factory hoặc đăng bài thủ công." title="Chưa có bài viết" /> : <div className="overflow-hidden rounded-xl border bg-white"><Table><TableHead><tr><th className="px-4 py-3">Bài viết</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></TableHead><tbody>{query.data.articles.map((article) => <tr key={article.id}><TableCell><strong>{article.draft?.title || article.inputs.seedKeyword}</strong><p className="mt-1 text-xs text-[#687386]">{article.inputs.language === "vi" ? "Tiếng Việt" : "English"}</p></TableCell><TableCell><StatusBadge status={article.reviewStatus} /></TableCell><TableCell>{new Date(article.updatedAt).toLocaleString("vi-VN")}</TableCell><TableCell><Link className="font-semibold text-[#80640b]" href={`/admin/articles/${article.id}`}>Mở bài</Link></TableCell></tr>)}</tbody></Table></div>}</>;
}

