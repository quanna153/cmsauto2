"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/features/admin/types";
import { ApiError, getJson, postJson } from "@/lib/api";

type SessionResponse = { user: AdminUser };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => getJson<SessionResponse>("/session/me"),
    retry: false
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError(null);
    try {
      const result = await postJson<SessionResponse>("/session/login", { username, password });
      client.setQueryData(["session"], result);
      setPassword("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Không đăng nhập được.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    setBusy(true);
    setError(null);
    try {
      await postJson("/session/change-password", { currentPassword, newPassword });
      await session.refetch();
      setCurrentPassword("");
      setNewPassword("");
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Không đổi được mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await postJson("/session/logout", {});
    client.setQueryData(["session"], undefined);
    await session.refetch();
  }

  if (session.isLoading) return <main className="mx-auto max-w-lg p-8"><LoadingSkeleton label="Đang kiểm tra phiên đăng nhập..." /></main>;

  const user = session.data?.user;
  if (!user) return <AuthPanel title="Đăng nhập CMS" error={error ?? (session.error instanceof ApiError && session.error.status !== 401 ? session.error.message : null)}><Input onChange={(event) => setUsername(event.target.value)} placeholder="Username" value={username} /><Input onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu" type="password" value={password} /><Button disabled={busy || !username || !password} onClick={() => void login()}>Đăng nhập</Button></AuthPanel>;

  if (user.mustChangePassword) return <AuthPanel title="Đổi mật khẩu lần đầu" error={error}><Input onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Mật khẩu tạm" type="password" value={currentPassword} /><Input onChange={(event) => setNewPassword(event.target.value)} placeholder="Mật khẩu mới, tối thiểu 8 ký tự" type="password" value={newPassword} /><Button disabled={busy || newPassword.length < 8} onClick={() => void changePassword()}>Cập nhật mật khẩu</Button></AuthPanel>;

  return <div className="lg:flex"><AdminSidebar canManageUsers={Boolean(user.canManageUsers)} /><div className="min-w-0 flex-1"><AdminTopbar onLogout={() => void logout()} user={user} /><main className="mx-auto max-w-7xl p-5 lg:p-8">{children}</main></div></div>;
}

function AuthPanel({ title, error, children }: { title: string; error: string | null; children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center p-5"><section className="w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a88412]">CMS Auto</p><h1 className="mb-5 mt-2 text-2xl font-bold">{title}</h1><div className="grid gap-3">{error ? <ErrorState message={error} /> : null}{children}</div></section></main>;
}

