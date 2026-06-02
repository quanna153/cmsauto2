import { PageHeader } from "@/components/ui/page-header";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import { researchKeyword } from "./adapter";

export async function KeywordResearchFeature() {
  const rows = await researchKeyword();
  return <><PageHeader description="Scaffold typed mock cho task Google Suggest, volume và research workflow." eyebrow="Admin" title="Nghiên cứu từ khóa" /><div className="overflow-hidden rounded-xl border bg-white"><Table><TableHead><tr><th className="px-4 py-3">Keyword</th><th>Intent</th><th>Volume</th><th>Nguồn</th></tr></TableHead><tbody>{rows.map((row) => <tr key={row.keyword}><TableCell className="font-semibold">{row.keyword}</TableCell><TableCell>{row.intent}</TableCell><TableCell>{row.volume}</TableCell><TableCell>{row.source}</TableCell></tr>)}</tbody></Table></div></>;
}

