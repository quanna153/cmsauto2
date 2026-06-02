import { Badge } from "@/components/ui/badge";

export function ScaffoldPanel({ title, description, items }: { title: string; description: string; items: Array<{ label: string; value: string }> }) {
  return <section className="rounded-xl border bg-white p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-[#687386]">{description}</p></div><Badge className="bg-[#fbf5dc] text-[#80640b]">Mock adapter</Badge></div><div className="grid gap-3 sm:grid-cols-3">{items.map((item) => <div className="rounded-lg bg-[#f7f7f4] p-4" key={item.label}><p className="text-xs uppercase tracking-wide text-[#687386]">{item.label}</p><strong className="mt-1 block text-xl">{item.value}</strong></div>)}</div></section>;
}

