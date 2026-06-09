import type { AdminUser, UserRole } from "@/features/admin/types";

export type StatusFilter = "all" | "active" | "inactive" | "password";
export type RoleFilter = "all" | UserRole;
export type CreateUserForm = {
  username: string;
  fullName: string;
  email: string;
  temporaryPassword: string;
};

export function filterUsers(users: AdminUser[], filters: { search: string; role: RoleFilter; status: StatusFilter }) {
  const search = filters.search.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch = !search || [user.username, user.fullName, user.email ?? ""].some((value) => value.toLowerCase().includes(search));
    const matchesRole = filters.role === "all" || user.role === filters.role;
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && user.isActive) ||
      (filters.status === "inactive" && !user.isActive) ||
      (filters.status === "password" && user.mustChangePassword);

    return matchesSearch && matchesRole && matchesStatus;
  });
}

export function countUsersByRole(users: AdminUser[]) {
  return users.reduce<Record<RoleFilter, number>>((counts, user) => {
    counts.all += 1;
    counts[user.role] += 1;
    return counts;
  }, { all: 0, admin: 0, super_admin: 0 });
}

export function isValidOptionalEmail(value: string) {
  const email = value.trim();
  return email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function buildCreateUserPayload(form: CreateUserForm) {
  const email = form.email.trim();
  const payload: {
    username: string;
    fullName: string;
    email?: string;
    temporaryPassword: string;
  } = {
    username: form.username.trim(),
    fullName: form.fullName.trim(),
    temporaryPassword: form.temporaryPassword.trim()
  };

  if (email.length > 0) {
    payload.email = email;
  }

  return payload;
}
