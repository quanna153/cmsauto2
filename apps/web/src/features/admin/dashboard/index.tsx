import { ScaffoldPanel } from "@/components/admin/scaffold-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardSnapshot } from "./adapter";

export async function DashboardFeature() {
  const snapshot = await getDashboardSnapshot();
  return <><PageHeader description="Scaffold tổng quan đã tách riêng để bổ sung KPI, chart và activity feed." eyebrow="Admin" title="Tổng quan vận hành" /><ScaffoldPanel description="Dữ liệu hiện là typed mock. Thay adapter khi backend analytics sẵn sàng." items={snapshot.metrics} title="Tình trạng nội dung" /><section className="mt-5 rounded-xl border bg-white p-5"><h2 className="font-bold">Ghi chú triển khai</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#687386]">{snapshot.notes.map((note) => <li key={note}>{note}</li>)}</ul></section></>;
}

