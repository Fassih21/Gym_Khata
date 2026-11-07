import { test, expect } from "@playwright/test";
import { ENV, addMember, login, uniqueName } from "./helpers";

// Gym A ka member Gym B ko nazar nahi aana chahiye.
test("Gym B, Gym A ka member nahi dekh sakta", async ({ page, browser }) => {
  test.skip(!ENV.emailB || !ENV.passwordB, ".env.test mein E2E_EMAIL_B aur E2E_PASSWORD_B likhein");
  const name = uniqueName("QA-iso");
  await addMember(page, { name }); // Gym A

  const ctxB = await browser.newContext({ ...test.info().project.use, storageState: undefined });
  const pageB = await ctxB.newPage();
  await login(pageB, ENV.emailB, ENV.passwordB);
  await expect(pageB).toHaveURL(/dashboard/);
  await pageB.goto("/members");
  await pageB.getByPlaceholder("Naam ya phone search karein").fill(name);
  await expect(pageB.getByText(name)).toHaveCount(0);
  await ctxB.close();
});
