import { expect, test, type Page } from "@playwright/test";

const user = {
  id: "playwright-superadmin",
  username: "admin",
  fullName: "Playwright Super Admin",
  email: null,
  authorTitle: "",
  authorBio: "",
  role: "super_admin",
  isActive: true,
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  canManageUsers: true
};

async function mockAdminSession(page: Page) {
  let loggedIn = false;
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
}

async function login(page: Page) {
  await page.getByPlaceholder("Username").fill("admin");
  await page.getByPlaceholder("Mật khẩu").fill("1");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

test("renders reader scaffold routes in both locales", async ({ page }) => {
  await page.goto("/vi-vn/markets");
  await expect(page.getByRole("heading", { level: 1, name: "Thị trường crypto hôm nay" })).toBeVisible();

  await page.goto("/en-us/about");
  await expect(page.getByRole("heading", { level: 1, name: /CoinRadar/ })).toBeVisible();
});

test("clears the admin shell after logout", async ({ page }) => {
  await mockAdminSession(page);

  await page.goto("/admin/dashboard");
  await login(page);
  await expect(page.getByRole("heading", { name: "Tổng quan vận hành" })).toBeVisible();

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page.getByRole("heading", { name: "Đăng nhập CMS" })).toBeVisible();
});

test("runs keyword research UI with mocked API data", async ({ page }) => {
  await mockAdminSession(page);
  await page.route("**/api/keywords/suggest", async (route) => {
    await route.fulfill({
      json: {
        recordId: "playwright-keywords",
        keywordIdeas: [{
          id: "bitcoin-la-gi",
          keyword: "bitcoin là gì",
          intent: "informational",
          cluster: "bitcoin",
          monthlyVolume: 12100,
          provider: "Semrush",
          checkedAt: "2026-01-01T00:00:00.000Z",
          status: "verified"
        }]
      }
    });
  });

  await page.goto("/admin/keyword-research");
  await login(page);
  await page.getByPlaceholder("bitcoin là gì").fill("bitcoin");
  await page.getByRole("button", { name: "Get keywords" }).click();
  await expect(page.locator("body")).toContainText("bitcoin là gì");
  await expect(page.locator("body")).toContainText("12,100");
});

test("filters and paginates the internal links library", async ({ page }) => {
  await mockAdminSession(page);
  const articles = Array.from({ length: 30 }, (_, index) => ({
    id: `link-${index + 1}`,
    revision: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    title: `Library Article ${index + 1}`,
    url: `/vi-vn/article-${index + 1}`,
    language: "vi",
    summary: "",
    keywords: [`keyword-${index + 1}`]
  }));
  await page.route("**/api/article-library", async (route) => {
    await route.fulfill({ json: { articles } });
  });

  await page.goto("/admin/link-library");
  await login(page);
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page.getByPlaceholder("Search title or URL").fill("article-29");
  await expect(page.getByText("1 / 30 links")).toBeVisible();
  await expect(page.getByLabel("Title for Library Article 29")).toBeVisible();
});
