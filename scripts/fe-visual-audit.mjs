#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import path from "node:path";

const { chromium } = await import(new URL("../apps/web/node_modules/@playwright/test/index.mjs", import.meta.url));

const baseUrl = (process.env.WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const username = process.env.TEST_ADMIN_USERNAME ?? "admin";
const password = process.env.TEST_ADMIN_PASSWORD ?? "1";
const outputRoot = process.env.FE_AUDIT_OUTPUT_DIR ?? path.join("test-results", "fe-visual-audit", new Date().toISOString().replace(/[:.]/g, "-"));
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? "chrome";
const articlePath = process.env.VISUAL_ARTICLE_PATH;

const viewports = [
  { name: "desktop", viewport: { width: 1440, height: 1000 }, isMobile: false },
  { name: "tablet", viewport: { width: 834, height: 1112 }, isMobile: true },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true }
];

const readerRoutes = [
  ["/vi-vn", "reader-home-vi"],
  ["/en-us", "reader-home-en"],
  ["/vi-vn/markets", "reader-markets"],
  ["/vi-vn/knowledge", "reader-knowledge"],
  ["/vi-vn/analysis", "reader-analysis"],
  ["/vi-vn/articles", "reader-articles"],
  ["/vi-vn/search", "reader-search"],
  ...(articlePath ? [[articlePath, "reader-article-detail"]] : [])
];

const adminRoutes = [
  ["/admin/dashboard", "admin-dashboard"],
  ["/admin/articles", "admin-articles"],
  ["/admin/articles/new", "admin-article-new"],
  ["/admin/factory", "admin-factory"],
  ["/admin/keyword-research", "admin-keyword-research"],
  ["/admin/internal-links", "admin-internal-links"],
  ["/admin/users", "admin-users"]
];

mkdirSync(outputRoot, { recursive: true });

function screenshotPath(viewport, label) {
  return path.join(outputRoot, `${viewport}-${label}.png`);
}

async function gotoReady(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(1_000);
}

async function loginIfNeeded(page) {
  await gotoReady(page, "/admin/dashboard");
  const usernameField = page.getByPlaceholder("Username");
  if (await usernameField.count()) {
    await usernameField.fill(username);
    await page.getByPlaceholder("Mật khẩu").fill(password);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await page.waitForTimeout(900);
  }
}

async function auditPage(page) {
  return await page.evaluate(() => {
    const root = document.documentElement;
    const elements = Array.from(document.querySelectorAll("*"));
    const overflowing = elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.right > window.innerWidth + 1 || rect.left < -1);
      })
      .slice(0, 6)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: (element.getAttribute("class") ?? "").slice(0, 90),
          text: (element.textContent ?? "").trim().slice(0, 70),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      });

    return {
      title: document.title,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      hasHorizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      headings: Array.from(document.querySelectorAll("h1,h2")).slice(0, 6).map((heading) => `${heading.tagName}:${heading.textContent?.trim().slice(0, 80) ?? ""}`),
      tocCount: document.querySelectorAll("nav[aria-label='Table of Contents'], nav[aria-label='Xem nhanh']").length,
      overflowing
    };
  });
}

const browser = await chromium.launch({ channel: browserChannel, headless: true, args: ["--no-sandbox"] });
const rows = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: viewport.viewport,
    isMobile: viewport.isMobile,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  const consoleMessages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push(`${message.type()}: ${message.text().slice(0, 200)}`);
    }
  });
  page.on("pageerror", (error) => consoleMessages.push(`pageerror: ${error.message.slice(0, 200)}`));

  for (const [route, label] of readerRoutes) {
    try {
      await gotoReady(page, route);
      await page.screenshot({ path: screenshotPath(viewport.name, label), fullPage: true });
      rows.push({ viewport: viewport.name, route, ok: true, audit: await auditPage(page), consoleMessages: [...consoleMessages] });
    } catch (error) {
      rows.push({ viewport: viewport.name, route, ok: false, error: error instanceof Error ? error.message : String(error), consoleMessages: [...consoleMessages] });
    }
    consoleMessages.length = 0;
  }

  try {
    await loginIfNeeded(page);
  } catch (error) {
    rows.push({ viewport: viewport.name, route: "/admin/login", ok: false, error: error instanceof Error ? error.message : String(error), consoleMessages: [...consoleMessages] });
  }
  consoleMessages.length = 0;

  for (const [route, label] of adminRoutes) {
    try {
      await gotoReady(page, route);
      await page.screenshot({ path: screenshotPath(viewport.name, label), fullPage: true });
      rows.push({ viewport: viewport.name, route, ok: true, audit: await auditPage(page), consoleMessages: [...consoleMessages] });
    } catch (error) {
      rows.push({ viewport: viewport.name, route, ok: false, error: error instanceof Error ? error.message : String(error), consoleMessages: [...consoleMessages] });
    }
    consoleMessages.length = 0;
  }

  await context.close();
}

await browser.close();

let failed = 0;
for (const row of rows) {
  if (!row.ok) {
    failed += 1;
    console.log(`FAIL\t${row.viewport}\t${row.route}\t${row.error}`);
    continue;
  }

  const severeConsoleMessages = row.consoleMessages.filter((message) =>
    !message.includes("401 (Unauthorized)")
    && !message.includes("404 (Not Found)")
    && !message.includes("GL Driver Message")
  );
  const hasIssue = row.audit.hasHorizontalOverflow || severeConsoleMessages.length > 0;
  if (hasIssue) failed += 1;
  console.log(`${hasIssue ? "FAIL" : "PASS"}\t${row.viewport}\t${row.route}\t${row.audit.hasHorizontalOverflow ? `OVERFLOW ${row.audit.scrollWidth}/${row.audit.clientWidth}` : "no-overflow"}\tconsole=${severeConsoleMessages.length}\t${row.audit.headings.slice(0, 2).join(" | ")}`);
  if (row.audit.overflowing.length > 0) {
    console.log(`  overflowing: ${JSON.stringify(row.audit.overflowing)}`);
  }
  if (severeConsoleMessages.length > 0) {
    console.log(`  console: ${JSON.stringify(severeConsoleMessages.slice(0, 4))}`);
  }
}

console.log(`screenshots=${outputRoot}`);
if (failed > 0) {
  console.error(`fe-visual-audit found ${failed} failing route/view checks.`);
  process.exit(1);
}
