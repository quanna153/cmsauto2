import { expect, test } from "@playwright/test";

test("renders reader scaffold routes in both locales", async ({ page }) => {
  await page.goto("/vi-vn/markets");
  await expect(page.getByRole("heading", { name: "Thị trường" })).toBeVisible();

  await page.goto("/en-us/about");
  await expect(page.getByRole("heading", { name: "Về CMS Auto" })).toBeVisible();
});

test("clears the admin shell after logout", async ({ page }) => {
  let loggedIn = false;
  const user = {
    id: "playwright-superadmin",
    username: "superadmin",
    fullName: "Playwright Super Admin",
    email: null,
    role: "super_admin",
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    canManageUsers: true
  };

  await page.route("**/api/session/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith("/login")) {
      loggedIn = true;
      await route.fulfill({ json: { user } });
      return;
    }
    if (pathname.endsWith("/logout")) {
      loggedIn = false;
      await route.fulfill({ json: { ok: true } });
      return;
    }
    await route.fulfill(loggedIn
      ? { json: { user } }
      : { status: 401, json: { error: "Bạn cần đăng nhập để dùng admin." } });
  });

  await page.goto("/admin/dashboard");
  await page.getByPlaceholder("Username").fill("superadmin");
  await page.getByPlaceholder("Mật khẩu").fill("TestPassword123");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan vận hành" })).toBeVisible();

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page.getByRole("heading", { name: "Đăng nhập CMS" })).toBeVisible();
});
