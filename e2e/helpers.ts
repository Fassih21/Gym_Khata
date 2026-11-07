import { expect, type Page } from "@playwright/test";

export const ENV = {
  email: process.env.E2E_EMAIL ?? "",
  password: process.env.E2E_PASSWORD ?? "",
  emailB: process.env.E2E_EMAIL_B ?? "",
  passwordB: process.env.E2E_PASSWORD_B ?? "",
};

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** Har run ke liye naya naam, taake purane test data se na takraye. */
export const uniqueName = (prefix = "QA") => `${prefix}-${Date.now().toString().slice(-8)}`;

export const randomPhone = () => `0300-${Math.floor(1000000 + Math.random() * 8999999)}`;

/** App jaisa hi format: "7 Dec 2026". */
export function fmt(d: Date) {
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

/** Aaj + 1 mahina. Mahine ke 29-31 tareekh par app aur yeh alag ho sakte hain, isliye
 *  tests us din skip karte hain (dekhein isSafeDay). */
export function oneMonthFromToday() {
  const t = new Date();
  return fmt(new Date(t.getFullYear(), t.getMonth() + 1, t.getDate()));
}
export const isSafeDay = () => new Date().getDate() <= 28;

/** Members page par naya member. fee khali chhodein to koi payment nahi banti. */
export async function addMember(page: Page, o: { name: string; fee?: string; plan?: string }) {
  await page.goto("/members");
  await page.getByRole("button", { name: "Add Member" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.locator("#m-name").fill(o.name);
  await dlg.locator("#m-phone").fill(randomPhone());
  const plan = o.plan ?? "Monthly";
  await dlg.getByRole("combobox").click();
  const opt = page.getByRole("option", { name: new RegExp(plan, "i") }).first();
  if (!(await opt.isVisible().catch(() => false))) {
    throw new Error(`QA gym mein "${plan}" plan nahi mila. Settings -> Plans mein banayein.`);
  }
  await opt.click();
  if (o.fee) await dlg.locator("#m-fee").fill(o.fee);
  await dlg.getByRole("button", { name: "Add member" }).click();
  await expect(dlg).toBeHidden();
  await expect(page.getByText(o.name).first()).toBeVisible();
}

/** Fees page par is member ki row. */
export function feeRow(page: Page, name: string) {
  return page
    .getByText(name, { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"px-4")][1]');
}
