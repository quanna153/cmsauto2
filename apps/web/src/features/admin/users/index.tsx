"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Lock, LogOut, MoreHorizontal, Plus, Search, Shield, Trash2, Unlock, UserCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/ui/states";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableCell, TableHead } from "@/components/ui/table";
import type { AdminUser, UserRole } from "@/features/admin/types";
import { deleteJson, getJson, patchJson, postJson } from "@/lib/api";
import { buildCreateUserPayload, countUsersByRole, filterUsers, isValidOptionalEmail, type RoleFilter, type StatusFilter } from "./model";

type UsersResponse = { users: AdminUser[] };
type BulkAction = "none" | "lock" | "unlock";
type UserWithArticleCount = AdminUser & {
  articleCount?: number;
  articlesCount?: number;
  postCount?: number;
  postsCount?: number;
};

export function UsersFeature() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["users"], queryFn: () => getJson<UsersResponse>("/users") });
  const users = query.data?.users ?? [];
  const [createOpen, setCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [createFormTouched, setCreateFormTouched] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bulkAction, setBulkAction] = useState<BulkAction>("none");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
  const [resetPasswordByUserId, setResetPasswordByUserId] = useState<Record<string, string>>({});

  const roleCounts = useMemo(() => countUsersByRole(users), [users]);
  const filteredUsers = useMemo(() => filterUsers(users, { search, role: roleFilter, status: statusFilter }), [users, search, roleFilter, statusFilter]);
  const selectableUsers = filteredUsers.filter(canManageUser);
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  const selectedManageableUsers = selectedUsers.filter(canManageUser);
  const emailValid = isValidOptionalEmail(email);
  const createDisabled = !username.trim() || !fullName.trim() || temporaryPassword.trim().length < 8 || !emailValid;
  const emailError = (createFormTouched || email.trim().length > 0) && !emailValid ? "Nhập email đúng định dạng hoặc để trống." : "";

  const invalidateUsers = async () => {
    await client.invalidateQueries({ queryKey: ["users"] });
  };

  const create = useMutation({
    mutationFn: () => postJson("/users", buildCreateUserPayload({ username, fullName, email, temporaryPassword })),
    onSuccess: async () => {
      setUsername("");
      setFullName("");
      setEmail("");
      setTemporaryPassword("");
      setCreateFormTouched(false);
      setCreateOpen(false);
      await invalidateUsers();
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ user, isActive }: { user: AdminUser; isActive: boolean }) =>
      patchJson(`/users/${user.id}`, { fullName: user.fullName, email: user.email, isActive }),
    onSuccess: async () => {
      setActionMenuUserId(null);
      await invalidateUsers();
    }
  });

  const deleteUser = useMutation({
    mutationFn: (user: AdminUser) => deleteJson(`/users/${user.id}`),
    onSuccess: async () => {
      setActionMenuUserId(null);
      setSelectedIds((current) => current.filter((id) => users.some((user) => user.id === id)));
      await invalidateUsers();
    }
  });

  const resetPassword = useMutation({
    mutationFn: ({ user, temporaryPassword: password }: { user: AdminUser; temporaryPassword: string }) =>
      postJson(`/users/${user.id}/reset-password`, { temporaryPassword: password }),
    onSuccess: async (_result, variables) => {
      setResetPasswordByUserId((current) => ({ ...current, [variables.user.id]: "" }));
      setActionMenuUserId(null);
      await invalidateUsers();
    }
  });

  const revokeSessions = useMutation({
    mutationFn: (user: AdminUser) => postJson(`/users/${user.id}/revoke-sessions`, {}),
    onSuccess: async () => {
      setActionMenuUserId(null);
      await invalidateUsers();
    }
  });

  const bulkStatus = useMutation({
    mutationFn: async (isActive: boolean) => {
      await Promise.all(selectedManageableUsers.map((user) =>
        patchJson(`/users/${user.id}`, { fullName: user.fullName, email: user.email, isActive })
      ));
    },
    onSuccess: async () => {
      setSelectedIds([]);
      setBulkAction("none");
      await invalidateUsers();
    }
  });

  const busy = create.isPending || updateStatus.isPending || deleteUser.isPending || resetPassword.isPending || revokeSessions.isPending || bulkStatus.isPending;
  const mutationError = create.error || updateStatus.error || deleteUser.error || resetPassword.error || revokeSessions.error || bulkStatus.error;

  function toggleSelected(userId: string) {
    setSelectedIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
  }

  function toggleAllFiltered() {
    const visibleIds = selectableUsers.map((user) => user.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  function applyBulkAction() {
    if (bulkAction === "lock") {
      bulkStatus.mutate(false);
    }
    if (bulkAction === "unlock") {
      bulkStatus.mutate(true);
    }
  }

  function submitCreateUser() {
    setCreateFormTouched(true);
    if (createDisabled) return;
    create.mutate();
  }

  function closeCreateModal() {
    setCreateOpen(false);
    setCreateFormTouched(false);
  }

  return <>
    <PageHeader
      actions={<Button onClick={() => setCreateOpen(true)} type="button"><Plus size={16} />Thêm mới</Button>}
      description="Theo dõi tài khoản nội bộ và xử lý trạng thái truy cập theo quyền super admin hiện có."
      eyebrow="Admin"
      title="Quản lý tài khoản"
    />

    <section className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
      {roleTabs.map((tab, index) => <RoleTab
        active={roleFilter === tab.value}
        count={roleCounts[tab.value]}
        key={tab.value}
        label={tab.label}
        onClick={() => {
          setRoleFilter(tab.value);
          setSelectedIds([]);
        }}
        showDivider={index > 0}
      />)}
    </section>

    <section className="mb-3 grid gap-3 rounded-xl border bg-white p-3 lg:grid-cols-[auto_160px_minmax(0,1fr)_auto] lg:items-center">
      <div className="flex gap-2">
        <select className="min-w-40 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-[#273247] outline-[#a88412]" onChange={(event) => setBulkAction(event.target.value as BulkAction)} value={bulkAction}>
          <option value="none">Bulk actions</option>
          <option value="lock">Khóa tài khoản</option>
          <option value="unlock">Mở khóa tài khoản</option>
        </select>
        <Button disabled={busy || bulkAction === "none" || selectedManageableUsers.length === 0} onClick={applyBulkAction} type="button" variant="secondary">Apply</Button>
      </div>
      <select className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-[#273247] outline-[#a88412]" onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}>
        <option value="all">Tất cả trạng thái</option>
        <option value="active">Đang hoạt động</option>
        <option value="inactive">Đã khóa</option>
        <option value="password">Cần đổi mật khẩu</option>
      </select>
      <div className="relative lg:justify-self-end">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#687386]" size={16} />
        <Input className="pl-9 lg:w-80" onChange={(event) => setSearch(event.target.value)} placeholder="Search users" value={search} />
      </div>
      <p className="text-sm font-medium text-[#687386] lg:text-right">{filteredUsers.length} tài khoản</p>
    </section>

    {selectedManageableUsers.length > 0 ? <p className="mb-3 rounded-lg bg-[#f7f7f4] px-3 py-2 text-sm font-medium text-[#273247]">Đã chọn {selectedManageableUsers.length} tài khoản admin.</p> : null}
    {mutationError ? <div className="mb-4"><ErrorState message={mutationError.message} /></div> : null}

    {query.isLoading ? <LoadingSkeleton label="Đang tải danh sách tài khoản..." /> : query.error ? <ErrorState message={query.error.message} /> : filteredUsers.length === 0 ? <EmptyState description="Không có tài khoản nào khớp bộ lọc hiện tại." title={users.length === 0 ? "Chưa có tài khoản" : "Không tìm thấy tài khoản"} /> : <>
      <div className="hidden max-h-[68vh] overflow-auto rounded-xl border bg-white lg:block">
        <Table className="min-w-[1000px] table-fixed text-[13px]">
          <colgroup>
            <col className="w-12" />
            <col className="w-[200px]" />
            <col className="w-[116px]" />
            <col className="w-[168px]" />
            <col className="w-[144px]" />
            <col className="w-[96px]" />
            <col className="w-[132px]" />
            <col className="w-[96px]" />
          </colgroup>
          <TableHead>
            <tr>
              <th className="sticky top-0 z-10 bg-[#f7f7f4] px-4 py-4"><input aria-label="Chọn tất cả tài khoản đang lọc" checked={selectableUsers.length > 0 && selectableUsers.every((user) => selectedIds.includes(user.id))} onChange={toggleAllFiltered} type="checkbox" /></th>
              <th className="sticky top-0 z-10 bg-[#f7f7f4] px-4 py-4">User</th>
              <th className="sticky top-0 z-10 bg-[#f7f7f4] px-4 py-4">Role</th>
              <th className="sticky top-0 z-10 bg-[#f7f7f4] px-4 py-4">Trạng thái</th>
              <th className="sticky top-0 z-10 bg-[#f7f7f4] px-4 py-4">Email</th>
              <th className="sticky top-0 z-10 bg-[#f7f7f4] px-4 py-4 text-center">Bài viết</th>
              <th className="sticky top-0 z-10 bg-[#f7f7f4] px-4 py-4 text-center">Đăng nhập cuối</th>
              <th className="sticky top-0 z-10 whitespace-nowrap bg-[#f7f7f4] px-4 py-4 text-right">Thao tác</th>
            </tr>
          </TableHead>
          <tbody>{filteredUsers.map((user) => <UserTableRow
            actionMenuOpen={actionMenuUserId === user.id}
            busy={busy}
            key={user.id}
            onDelete={() => deleteUser.mutate(user)}
            onMenuToggle={() => setActionMenuUserId((current) => current === user.id ? null : user.id)}
            onResetPassword={(password) => resetPassword.mutate({ user, temporaryPassword: password })}
            onRevokeSessions={() => revokeSessions.mutate(user)}
            onToggleSelected={() => toggleSelected(user.id)}
            onToggleStatus={() => updateStatus.mutate({ user, isActive: !user.isActive })}
            resetPassword={resetPasswordByUserId[user.id] ?? ""}
            selected={selectedIds.includes(user.id)}
            setResetPassword={(value) => setResetPasswordByUserId((current) => ({ ...current, [user.id]: value }))}
            user={user}
          />)}</tbody>
        </Table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {filteredUsers.map((user) => <UserCard
          actionMenuOpen={actionMenuUserId === user.id}
          busy={busy}
          key={user.id}
          onDelete={() => deleteUser.mutate(user)}
          onMenuToggle={() => setActionMenuUserId((current) => current === user.id ? null : user.id)}
          onResetPassword={(password) => resetPassword.mutate({ user, temporaryPassword: password })}
          onRevokeSessions={() => revokeSessions.mutate(user)}
          onToggleSelected={() => toggleSelected(user.id)}
          onToggleStatus={() => updateStatus.mutate({ user, isActive: !user.isActive })}
          resetPassword={resetPasswordByUserId[user.id] ?? ""}
          selected={selectedIds.includes(user.id)}
          setResetPassword={(value) => setResetPasswordByUserId((current) => ({ ...current, [user.id]: value }))}
          user={user}
        />)}
      </div>
    </>}

    {createOpen ? <CreateUserModal
      busy={busy}
      createDisabled={createDisabled}
      email={email}
      emailError={emailError}
      fullName={fullName}
      onClose={closeCreateModal}
      onCreate={submitCreateUser}
      setEmail={setEmail}
      setFullName={setFullName}
      setTemporaryPassword={setTemporaryPassword}
      setUsername={setUsername}
      temporaryPassword={temporaryPassword}
      username={username}
    /> : null}
  </>;
}

const roleTabs: Array<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "super_admin", label: "Super admin" },
  { value: "admin", label: "Admin" }
];

function RoleTab({ active, count, label, onClick, showDivider }: { active: boolean; count: number; label: string; onClick: () => void; showDivider: boolean }) {
  return <>
    {showDivider ? <span className="text-[#c6c9c2]">|</span> : null}
    <button className={`font-semibold ${active ? "text-[#172033]" : "text-[#80640b] hover:underline"}`} onClick={onClick} type="button">{label} <span className="font-normal text-[#687386]">({count})</span></button>
  </>;
}

function canManageUser(user: AdminUser) {
  return user.role === "admin";
}

function UserTableRow(props: UserRowProps) {
  const { user, selected, busy, resetPassword, setResetPassword, actionMenuOpen, onMenuToggle, onToggleSelected, onToggleStatus, onResetPassword, onRevokeSessions, onDelete } = props;
  const manageable = canManageUser(user);

  return <tr className="group h-[88px] odd:bg-white even:bg-[#fcfbf7] hover:!bg-[#f5f2e8]">
    <TableCell className="px-4 py-5 align-middle"><input aria-label={`Chọn ${user.username}`} checked={selected} disabled={!manageable} onChange={onToggleSelected} type="checkbox" /></TableCell>
    <TableCell className="px-4 py-5 align-middle">
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div className="min-w-0">
          <strong className="block truncate text-[#172033]">{user.fullName || user.username}</strong>
          <p className="truncate text-xs font-medium text-[#687386]">@{user.username}</p>
        </div>
      </div>
    </TableCell>
    <TableCell className="px-4 py-5 align-middle"><RoleBadge role={user.role} /></TableCell>
    <TableCell className="px-4 py-5 align-middle"><StatusBadge user={user} /></TableCell>
    <TableCell className="truncate px-4 py-5 align-middle text-[#80640b]">{user.email || "Chưa có email"}</TableCell>
    <TableCell className="px-4 py-5 text-center align-middle font-semibold text-[#273247]">{formatArticleCount(user)}</TableCell>
    <TableCell className="whitespace-nowrap px-4 py-5 text-center align-middle"><LastLogin value={user.lastLoginAt} /></TableCell>
    <TableCell className="relative px-4 py-5 text-right align-middle">
      <button aria-expanded={actionMenuOpen} aria-label={`Mở thao tác cho ${user.username}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-[#566174] opacity-100 transition hover:bg-[#f7f7f4] lg:opacity-0 lg:group-hover:opacity-100" onClick={onMenuToggle} type="button">
        <MoreHorizontal size={17} />
      </button>
      {actionMenuOpen ? <UserActionMenu
        busy={busy}
        manageable={manageable}
        onDelete={onDelete}
        onResetPassword={onResetPassword}
        onRevokeSessions={onRevokeSessions}
        onToggleStatus={onToggleStatus}
        resetPassword={resetPassword}
        setResetPassword={setResetPassword}
        user={user}
      /> : null}
    </TableCell>
  </tr>;
}

function UserCard(props: UserRowProps) {
  const { user, selected, busy, resetPassword, setResetPassword, actionMenuOpen, onMenuToggle, onToggleSelected, onToggleStatus, onResetPassword, onRevokeSessions, onDelete } = props;
  const manageable = canManageUser(user);

  return <article className="grid gap-3 rounded-xl border bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-3"><Avatar user={user} /><div className="min-w-0"><strong className="block truncate text-[#172033]">{user.fullName || user.username}</strong><p className="truncate text-sm font-medium text-[#687386]">@{user.username}</p></div></div>
      </div>
      <input aria-label={`Chọn ${user.username}`} checked={selected} disabled={!manageable} onChange={onToggleSelected} type="checkbox" />
    </div>
    <p className="truncate text-sm text-[#80640b]">{user.email || "Chưa có email"}</p>
    <div className="flex flex-wrap gap-2"><RoleBadge role={user.role} /><StatusBadge user={user} /></div>
    <dl className="grid gap-2 text-sm text-[#566174]">
      <div className="flex justify-between gap-3"><dt>Bài viết</dt><dd className="text-right font-medium text-[#273247]">{formatArticleCount(user)}</dd></div>
      <div className="flex justify-between gap-3"><dt>Đăng nhập cuối</dt><dd className="text-right"><LastLogin value={user.lastLoginAt} /></dd></div>
      <div className="flex justify-between gap-3"><dt>Cập nhật</dt><dd className="text-right font-medium text-[#273247]">{formatDateTime(user.updatedAt)}</dd></div>
    </dl>
    <div className="relative">
      <Button className="w-full" onClick={onMenuToggle} type="button" variant="secondary"><MoreHorizontal size={16} />Thao tác</Button>
      {actionMenuOpen ? <UserActionMenu
        busy={busy}
        manageable={manageable}
        onDelete={onDelete}
        onResetPassword={onResetPassword}
        onRevokeSessions={onRevokeSessions}
        onToggleStatus={onToggleStatus}
        resetPassword={resetPassword}
        setResetPassword={setResetPassword}
        user={user}
      /> : null}
    </div>
  </article>;
}

type UserRowProps = {
  user: AdminUser;
  selected: boolean;
  busy: boolean;
  resetPassword: string;
  setResetPassword: (value: string) => void;
  actionMenuOpen: boolean;
  onMenuToggle: () => void;
  onToggleSelected: () => void;
  onToggleStatus: () => void;
  onResetPassword: (password: string) => void;
  onRevokeSessions: () => void;
  onDelete: () => void;
};

function UserActionMenu(props: {
  user: AdminUser;
  busy: boolean;
  manageable: boolean;
  resetPassword: string;
  setResetPassword: (value: string) => void;
  onToggleStatus: () => void;
  onResetPassword: (password: string) => void;
  onRevokeSessions: () => void;
  onDelete: () => void;
}) {
  const { user, busy, manageable, resetPassword, setResetPassword, onToggleStatus, onResetPassword, onRevokeSessions, onDelete } = props;
  return <div className="absolute right-0 top-10 z-20 grid w-72 gap-2 rounded-lg border bg-white p-3 text-left shadow-lg">
    <button className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-[#273247] hover:bg-[#f7f7f4] disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !manageable} onClick={onToggleStatus} type="button">
      {user.isActive ? <Lock size={15} /> : <Unlock size={15} />}{user.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
    </button>
    <button className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-[#273247] hover:bg-[#f7f7f4] disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} onClick={onRevokeSessions} type="button"><LogOut size={15} />Thu hồi session</button>
    <div className="grid gap-2 border-y py-2">
      <Input onChange={(event) => setResetPassword(event.target.value)} placeholder="Mật khẩu tạm mới" type="password" value={resetPassword} />
      <Button disabled={busy || !manageable || resetPassword.trim().length < 8} onClick={() => onResetPassword(resetPassword.trim())} size="sm" type="button" variant="secondary"><KeyRound size={14} />Reset mật khẩu</Button>
    </div>
    <button className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !manageable} onClick={onDelete} type="button"><Trash2 size={15} />Xóa tài khoản</button>
  </div>;
}

function CreateUserModal(props: {
  username: string;
  fullName: string;
  email: string;
  emailError: string;
  temporaryPassword: string;
  busy: boolean;
  createDisabled: boolean;
  setUsername: (value: string) => void;
  setFullName: (value: string) => void;
  setEmail: (value: string) => void;
  setTemporaryPassword: (value: string) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  const { username, fullName, email, emailError, temporaryPassword, busy, createDisabled, setUsername, setFullName, setEmail, setTemporaryPassword, onCreate, onClose } = props;
  return <div className="fixed inset-0 z-40 grid place-items-center bg-[#172033]/40 p-4">
    <section className="grid w-full max-w-xl gap-4 rounded-xl border bg-white p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-bold text-[#172033]">Thêm tài khoản admin</h2><p className="mt-1 text-sm text-[#687386]">Tài khoản mới sẽ phải đổi mật khẩu ở lần đăng nhập đầu.</p></div>
        <button aria-label="Đóng" className="rounded-md p-1 text-[#687386] hover:bg-[#f7f7f4]" onClick={onClose} type="button"><X size={18} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input aria-label="Username" onChange={(event) => setUsername(event.target.value)} placeholder="Username" value={username} />
        <Input aria-label="Họ tên" onChange={(event) => setFullName(event.target.value)} placeholder="Họ tên" value={fullName} />
        <label className="grid gap-1">
          <Input aria-invalid={Boolean(emailError)} aria-label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="Email (tuỳ chọn)" type="email" value={email} />
          {emailError ? <span className="text-xs font-medium text-red-600">{emailError}</span> : null}
        </label>
        <Input aria-label="Mật khẩu tạm" onChange={(event) => setTemporaryPassword(event.target.value)} placeholder="Mật khẩu tạm, tối thiểu 8 ký tự" type="password" value={temporaryPassword} />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button disabled={busy} onClick={onClose} type="button" variant="secondary">Hủy</Button>
        <Button disabled={busy || createDisabled} onClick={onCreate} type="button"><Plus size={16} />Tạo tài khoản</Button>
      </div>
    </section>
  </div>;
}

function Avatar({ user }: { user: AdminUser }) {
  return <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#f0ead8] text-sm font-bold text-[#80640b]">{initials(user.fullName || user.username)}</div>;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function RoleBadge({ role }: { role: UserRole }) {
  const isSuperAdmin = role === "super_admin";
  return <span className={`inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ${isSuperAdmin ? "bg-[#f0ead8] text-[#80640b]" : "bg-[#eef2ff] text-[#364b8b]"}`}>
    {isSuperAdmin ? <Shield size={12} /> : <UserCheck size={12} />}
    {isSuperAdmin ? "Super admin" : "Admin"}
  </span>;
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (!user.isActive) {
    return <span className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full bg-red-50 px-2.5 text-xs font-semibold text-red-700"><Lock size={12} />Đã khóa</span>;
  }

  if (user.mustChangePassword) {
    return <span className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2.5 text-xs font-semibold text-amber-700"><KeyRound size={12} />Cần đổi mật khẩu</span>;
  }

  return <span className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full bg-green-50 px-2.5 text-xs font-semibold text-green-700"><Unlock size={12} />Hoạt động</span>;
}

function LastLogin({ value }: { value: string | null }) {
  if (!value) {
    return <span className="inline-flex rounded-full bg-[#eef0f3] px-2.5 py-1 text-xs font-semibold text-[#687386]">Chưa đăng nhập</span>;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return <span className="text-sm font-medium text-[#687386]">Không rõ</span>;
  }

  return <span className="font-semibold text-[#273247]">{formatRelativeTime(date)}</span>;
}

function formatArticleCount(user: AdminUser) {
  const count = getArticleCount(user);
  return typeof count === "number" ? new Intl.NumberFormat("vi-VN").format(count) : "-";
}

function getArticleCount(user: AdminUser) {
  const withCount = user as UserWithArticleCount;
  return withCount.articleCount ?? withCount.articlesCount ?? withCount.postCount ?? withCount.postsCount;
}

function formatDateTime(value: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không rõ";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function formatRelativeTime(date: Date) {
  const diffMs = date.getTime() - Date.now();
  const absoluteMs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
    ["second", 1000]
  ];
  const [unit, unitMs] = units.find(([, milliseconds]) => absoluteMs >= milliseconds) ?? ["second", 1000];
  const value = Math.round(diffMs / unitMs);
  return new Intl.RelativeTimeFormat("vi-VN", { numeric: "auto" }).format(value, unit);
}
