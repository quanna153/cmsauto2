"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";

export function ManualPostFeature() {
  const [title, setTitle] = useState("");
  return <><PageHeader description="Scaffold cho task đăng bài viết thủ công. UI đã có sẵn boundary để nối adapter riêng." eyebrow="Admin scaffold" title="Đăng bài thủ công" /><section className="grid gap-4 rounded-xl border bg-white p-5"><label className="grid gap-1 text-sm font-semibold">Tiêu đề<Input onChange={(event) => setTitle(event.target.value)} value={title} /></label><label className="grid gap-1 text-sm font-semibold">Tóm tắt<Textarea rows={3} /></label><label className="grid gap-1 text-sm font-semibold">Nội dung Markdown<Textarea className="min-h-72 font-mono" /></label><div><Button disabled>Scaffold: nối adapter trong task riêng</Button></div></section></>;
}

