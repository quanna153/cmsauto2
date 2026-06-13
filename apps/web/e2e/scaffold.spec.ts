import { expect, test, type Page } from "@playwright/test";

async function readCanvasFrame(page: Page) {
  return page.locator('[data-home-globe-scene="true"] canvas').evaluate((canvasElement) => {
    const canvas = canvasElement as HTMLCanvasElement;
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) return { checksum: 0, visibleSamples: 0 };

    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, pixels);
    let checksum = 0;
    let visibleSamples = 0;
    for (let index = 0; index < pixels.length; index += 64) {
      if (pixels[index + 3] > 0) visibleSamples += 1;
      checksum = (checksum * 31 + pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7) % 2_147_483_647;
    }
    return { checksum, visibleSamples };
  });
}

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
  await expect(page.getByRole("heading", { level: 1, name: /crypto newsroom focused on data/i })).toBeVisible();
});

test("shares one homepage ticker request and renders English reader copy", async ({ page }) => {
  let tickerRequests = 0;
  await page.route("**/public/markets/tickers?*", async (route) => {
    tickerRequests += 1;
    const pairs = new URL(route.request().url()).searchParams.get("pairs")?.split(",") ?? [];
    await route.fulfill({
      json: {
        stale: false,
        tickers: pairs.map((pair) => ({
          pair,
          symbol: pair.replace("USDT", ""),
          price: 100,
          changePercent: 1.25,
          status: "verified"
        }))
      }
    });
  });

  await page.goto("/en-us");
  await expect(page.getByText("Latest updates", { exact: true })).toBeVisible();
  await expect.poll(() => tickerRequests).toBe(1);
  await expect(page.getByText("Binance/API", { exact: true })).toBeVisible();

  const globe = page.locator('[data-home-globe-scene="true"] canvas');
  await globe.scrollIntoViewIfNeeded();
  await expect(globe).toBeVisible();
  await expect(globe).toHaveAttribute("data-rendered", "true");
  const box = await globe.boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(box?.height).toBeGreaterThan(300);

  const firstFrame = await readCanvasFrame(page);
  expect(firstFrame.visibleSamples).toBeGreaterThan(100);
  await page.waitForTimeout(250);
  const secondFrame = await readCanvasFrame(page);
  expect(secondFrame.checksum).not.toBe(firstFrame.checksum);
});

test("shows complete homepage fallback data when the market API is unavailable", async ({ page }) => {
  await page.route("**/public/markets/tickers?*", async (route) => {
    await route.fulfill({ status: 503, json: { error: "Market provider unavailable" } });
  });
  await page.route("**/public/articles?*", async (route) => {
    await route.fulfill({ status: 503, json: { error: "Article provider unavailable" } });
  });

  await page.goto("/vi-vn");
  await expect(page.getByText("Dữ liệu mẫu", { exact: true })).toBeVisible();
  await expect(page.getByText("$63,702.12", { exact: true }).first()).toBeVisible();
  const latestUpdates = page.locator("article").filter({ has: page.getByText("Cập nhật mới nhất", { exact: true }) });
  await expect(latestUpdates.locator("a").nth(1)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Đang cập nhật");
  await expect(page.locator("body")).not.toContainText("Chưa có bài viết mới");
});

test("renders the article index in both locales", async ({ page }) => {
  await page.goto("/vi-vn/articles");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bài mới" })).toBeVisible();

  await page.goto("/en-us/articles");
  await expect(page.getByRole("heading", { name: "Latest articles" })).toBeVisible();
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
  await expect(page.getByText("1 links")).toBeVisible();
  await expect(page.getByText("Library Article 29")).toBeVisible();
});
