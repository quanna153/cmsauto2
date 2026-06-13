"use client";

import { BarChart3, BookOpenText, FilePenLine, FileSpreadsheet, FlaskConical, Image, Link2, LogOut, SearchCode, ShieldUser } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { AdminUser } from "@/features/admin/types";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: BarChart3 },
  { href: "/admin/factory", label: "Tạo bài viết", icon: FlaskConical },
  { href: "/admin/articles", label: "Quản lý bài", icon: FilePenLine },
  { href: "/admin/internal-links", label: "Internal links", icon: Link2 },
  { href: "/admin/link-library", label: "Kho links", icon: FileSpreadsheet },
  { href: "/admin/image-library", label: "Kho ảnh", icon: Image },
  { href: "/admin/keyword-research", label: "Nghiên cứu từ khóa", icon: SearchCode },
  { href: "/admin/users", label: "Tài khoản", icon: ShieldUser }
];

type AdminSidebarProps = {
  canManageUsers: boolean;
  onLogout: () => void;
  user: AdminUser;
};

export function AdminSidebar({ canManageUsers, onLogout, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const items = navigation.filter((item) => item.href !== "/admin/users" || canManageUsers);

  return (
    <aside className="flex flex-col border-b bg-[#172033] text-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b border-white/10 p-5">
        <BookOpenText className="text-[#d2b34d]" />
        <div>
          <strong className="block text-sm">CMS Auto</strong>
          <span className="text-xs text-white/55">Content workspace</span>
        </div>
      </div>
      <nav className="grid gap-1 p-3 sm:grid-cols-3 lg:grid-cols-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white", active && "bg-white/12 text-white")} href={item.href} key={item.href}>
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4 lg:mt-auto">
        <div className="mb-3 rounded-lg bg-white/6 px-3 py-2.5">
          <strong className="block truncate text-sm">{user.fullName}</strong>
          <span className="block truncate text-xs text-white/55">{user.role}</span>
        </div>
        <Button aria-label="Đăng xuất" className="w-full justify-start border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={onLogout} size="sm" variant="ghost">
          <LogOut size={16} />
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
