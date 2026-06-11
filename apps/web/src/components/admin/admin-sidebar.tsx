"use client";

import { BarChart3, BookOpenText, FilePenLine, FileSpreadsheet, FlaskConical, Link2, SearchCode, ShieldUser } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: BarChart3 },
  { href: "/admin/factory", label: "Tạo bài viết", icon: FlaskConical },
  { href: "/admin/articles", label: "Quản lý bài", icon: FilePenLine },
  { href: "/admin/internal-links", label: "Internal links", icon: Link2 },
  { href: "/admin/link-library", label: "Kho links", icon: FileSpreadsheet },
  { href: "/admin/keyword-research", label: "Nghiên cứu từ khóa", icon: SearchCode },
  { href: "/admin/users", label: "Tài khoản", icon: ShieldUser }
];

export function AdminSidebar({ canManageUsers }: { canManageUsers: boolean }) {
  const pathname = usePathname();
  return <aside className="border-b bg-[#172033] text-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r"><div className="flex items-center gap-3 border-b border-white/10 p-5"><BookOpenText className="text-[#d2b34d]" /><div><strong className="block text-sm">CMS Auto</strong><span className="text-xs text-white/55">Content workspace</span></div></div><nav className="grid gap-1 p-3 sm:grid-cols-3 lg:grid-cols-1">{navigation.filter((item) => item.href !== "/admin/users" || canManageUsers).map((item) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <Link className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white", active && "bg-white/12 text-white")} href={item.href} key={item.href}><Icon size={17} />{item.label}</Link>; })}</nav></aside>;
}
