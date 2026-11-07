import { test as setup, expect } from "@playwright/test";
import { ENV, login } from "./helpers";

// Ek baar login, session file mein save. Baqi tests dobara login nahi karte.
setup("login Gym A", async ({ page }) => {
  if (!ENV.email || !ENV.password) throw new Error(".env.test mein E2E_EMAIL aur E2E_PASSWORD likhein.");
  await login(page, ENV.email, ENV.password);
  await expect(page).toHaveURL(/dashboard/);
  await page.context().storageState({ path: "e2e/.auth/gymA.json" });
});
