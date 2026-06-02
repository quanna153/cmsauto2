import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  editor_ready: "Sẵn sàng duyệt",
  needs_fix: "Cần xử lý",
  scheduled: "Đã lên lịch",
  publishing: "Đang publish",
  published: "Đã publish",
  failed: "Lỗi publish"
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn(status === "published" && "bg-green-50 text-green-700", status === "failed" && "bg-red-50 text-red-700", status === "scheduled" && "bg-amber-50 text-amber-700")}>{labels[status] ?? status}</Badge>;
}

