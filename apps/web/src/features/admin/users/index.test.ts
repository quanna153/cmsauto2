import { describe, expect, it } from "vitest";

import type { AdminUser } from "@/features/admin/types";
import { buildCreateUserPayload, countUsersByRole, filterUsers, isValidOptionalEmail } from "./model";

const users: AdminUser[] = [
  {
    id: "super-1",
    username: "superadmin",
    fullName: "Super Admin",
    email: null,
    role: "super_admin",
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "admin-1",
    username: "editor",
    fullName: "Content Editor",
    email: "editor@example.com",
    role: "admin",
    isActive: true,
    mustChangePassword: true,
    lastLoginAt: "2026-01-02T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z"
  },
  {
    id: "admin-2",
    username: "locked",
    fullName: "Locked User",
    email: "locked@example.com",
    role: "admin",
    isActive: false,
    mustChangePassword: false,
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z"
  }
];

describe("filterUsers", () => {
  it("filters by username, full name, and nullable email safely", () => {
    expect(filterUsers(users, { search: "super", role: "all", status: "all" }).map((user) => user.id)).toEqual(["super-1"]);
    expect(filterUsers(users, { search: "content", role: "all", status: "all" }).map((user) => user.id)).toEqual(["admin-1"]);
    expect(filterUsers(users, { search: "locked@example", role: "all", status: "all" }).map((user) => user.id)).toEqual(["admin-2"]);
    expect(filterUsers(users, { search: "missing", role: "all", status: "all" })).toEqual([]);
  });

  it("filters by role and account state", () => {
    expect(filterUsers(users, { search: "", role: "admin", status: "active" }).map((user) => user.id)).toEqual(["admin-1"]);
    expect(filterUsers(users, { search: "", role: "admin", status: "inactive" }).map((user) => user.id)).toEqual(["admin-2"]);
    expect(filterUsers(users, { search: "", role: "all", status: "password" }).map((user) => user.id)).toEqual(["admin-1"]);
  });

  it("counts role tabs without relying on hardcoded roles in the UI", () => {
    expect(countUsersByRole(users)).toEqual({ all: 3, admin: 2, super_admin: 1 });
  });

  it("builds a create-user payload that matches the existing API schema", () => {
    expect(buildCreateUserPayload({
      username: " editor ",
      fullName: " Content Editor ",
      email: "",
      temporaryPassword: " Password123 "
    })).toEqual({
      username: "editor",
      fullName: "Content Editor",
      temporaryPassword: "Password123"
    });

    expect(buildCreateUserPayload({
      username: "editor",
      fullName: "Content Editor",
      email: " editor@example.com ",
      temporaryPassword: "Password123"
    }).email).toBe("editor@example.com");
  });

  it("validates optional email before sending create-user requests", () => {
    expect(isValidOptionalEmail("")).toBe(true);
    expect(isValidOptionalEmail("editor@example.com")).toBe(true);
    expect(isValidOptionalEmail("not-an-email")).toBe(false);
  });
});
