"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/features/admin/types";

export function AdminTopbar({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  return <header className="flex items-center justify-between border-b bg-white px-5 py-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#a88412]">CMS nội bộ</p><p className="text-sm text-[#687386]">Tạo, duyệt và xuất bản nội dung</p></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><strong className="block text-sm">{user.fullName}</strong><span className="text-xs text-[#687386]">{user.role}</span></div><Button aria-label="Đăng xuất" onClick={onLogout} size="sm" variant="ghost"><LogOut size={16} />Đăng xuất</Button></div></header>;
}

