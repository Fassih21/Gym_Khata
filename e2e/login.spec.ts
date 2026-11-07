import { test, expect } from "@playwright/test";
import { ENV, login } from "./helpers";

test("sahi email/password se dashboard khulta hai", async ({ page }) => {
  await login(page, ENV.email, ENV.password);
  await expect(page).toHaveURL(/dashboard/);
});

test("galat password par error aata hai aur login nahi hota", async ({ page }) => {
  await login(page, ENV.email, "galat-password-123");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/login/);
});

test("bina login ke andar ke page band hain", async ({ page }) => {
  await page.goto("/members");
  await expect(page).toHaveURL(/login/);
});
