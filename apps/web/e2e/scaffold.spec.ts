import { expect, test } from "@playwright/test";

test("renders reader scaffold routes in both locales", async ({ page }) => {
  await page.goto("/vi-vn/markets");
  await expect(page.getByRole("heading", { name: "Thị trường" })).toBeVisible();

  await page.goto("/en-us/about");
  await expect(page.getByRole("heading", { name: "Về CMS Auto" })).toBeVisible();
});

