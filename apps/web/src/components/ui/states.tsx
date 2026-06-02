import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed bg-white p-8 text-center"><Inbox className="mx-auto mb-3 text-[#a88412]" /><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-[#687386]">{description}</p></div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle size={18} />{message}</div>;
}

export function LoadingSkeleton({ label = "Đang tải..." }: { label?: string }) {
  return <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-sm text-[#687386]"><LoaderCircle className="animate-spin" size={18} />{label}</div>;
}

