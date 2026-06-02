"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import type { AdminUser } from "@/features/admin/types";
import { getJson, postJson } from "@/lib/api";

export function UsersFeature() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["users"], queryFn: () => getJson<{ users: AdminUser[] }>("/users") });
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const create = useMutation({
    mutationFn: () => postJson("/users", { username, fullName, temporaryPassword }),
    onSuccess: async () => { setUsername(""); setFullName(""); setTemporaryPassword(""); await client.invalidateQueries({ queryKey: ["users"] }); }
  });
  return <><PageHeader description="Chỉ super admin nhìn thấy route này. Tài khoản mới phải đổi mật khẩu ở lần đăng nhập đầu." eyebrow="Admin" title="Quản lý tài khoản" /><section className="mb-5 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"><Input onChange={(event) => setUsername(event.target.value)} placeholder="Username" value={username} /><Input onChange={(event) => setFullName(event.target.value)} placeholder="Họ tên" value={fullName} /><Input onChange={(event) => setTemporaryPassword(event.target.value)} placeholder="Mật khẩu tạm" type="password" value={temporaryPassword} /><Button disabled={!username || !fullName || temporaryPassword.length < 8} onClick={() => create.mutate()}><Plus size={16} />Tạo</Button></section>{query.isLoading ? <LoadingSkeleton /> : query.error ? <ErrorState message={query.error.message} /> : <div className="overflow-hidden rounded-xl border bg-white"><Table><TableHead><tr><th className="px-4 py-3">Người dùng</th><th>Role</th><th>Trạng thái</th></tr></TableHead><tbody>{query.data?.users.map((user) => <tr key={user.id}><TableCell><strong>{user.fullName}</strong><p className="text-xs text-[#687386]">{user.username}</p></TableCell><TableCell>{user.role}</TableCell><TableCell>{user.isActive ? "Đang hoạt động" : "Đã khóa"}</TableCell></tr>)}</tbody></Table></div>}</>;
}

