import { test, expect, Page } from "@playwright/test";
import { addMember, feeRow, isSafeDay, oneMonthFromToday, uniqueName } from "./helpers";

const created: string[] = [];
const mk = (prefix: string) => {
  const n = uniqueName(prefix);
  created.push(n);
  return n;
};

async function deleteMember(page: Page, name: string) {
  await page.goto("/members");
  const row = page.getByText(name).locator("xpath=ancestor::*[self::li or self::div][1]");
  if (!(await row.count())) return;
  await row.locator("button").last().click(); // trash icon
  await page.getByRole("button", { name: /delete|haan|confirm|remove/i }).last().click();
  await expect(page.getByText(name)).toHaveCount(0);
}

test.afterEach(async ({ page }) => {
  while (created.length) {
    const name = created.pop()!;
    await deleteMember(page, name).catch(() => {});
  }
});

test("naya member fees ke saath: expiry aaj + 1 mahina", async ({ page }) => {
  test.skip(!isSafeDay(), "Mahine ke 29-31 tareekh par date math alag ho sakti hai");
  const name = mk("QA-fee");
  await addMember(page, { name, fee: "3500" });
  await expect(page.getByText(name).locator("xpath=ancestor::*[self::li or self::div][1]"))
    .toContainText(oneMonthFromToday());
});

// Wohi bug jo 7 Jan 2027 dikha raha tha: ek payment = ek mahina, do nahi.
test("fees khali add karke pehli payment: expiry sirf 1 mahina", async ({ page }) => {
  test.skip(!isSafeDay(), "Mahine ke 29-31 tareekh par date math alag ho sakti hai");
  const name = mk("QA-nofee");
  await addMember(page, { name }); // fees khali

  await page.goto("/fees");
  await feeRow(page, name).getByRole("button", { name: /Mark paid/ }).click();

  const dlg = page.getByRole("dialog");
  await dlg.locator("#fee-amount").fill("3500");
  const renew = dlg.getByRole("checkbox", { name: /renew/i });
  if (!(await renew.isChecked())) await renew.check();

  await expect(dlg).toContainText(`Nayi expiry: ${oneMonthFromToday()}`);
  await dlg.getByRole("button", { name: "Mark paid" }).click();
  await expect(dlg).toBeHidden();

  await page.goto("/members");
  await expect(page.getByText(name).locator("xpath=ancestor::*[self::li or self::div][1]"))
    .toContainText(oneMonthFromToday());
});

test("payment undo (void) ke baad dobara pay ho sakti hai", async ({ page }) => {
  const name = mk("QA-void");
  await addMember(page, { name, fee: "3500" });

  await page.goto("/fees");
  const row = feeRow(page, name);
  await row.getByRole("button", { name: /Undo/ }).click();
  await page.getByRole("button", { name: "Haan, undo karein" }).click();
  await expect(row.getByRole("button", { name: /Mark paid/ })).toBeVisible();

  // Dobara payment: ek live payment per mahina wali partial unique index yahan parkhi jati hai
  await row.getByRole("button", { name: /Mark paid/ }).click();
  const dlg = page.getByRole("dialog");
  await dlg.locator("#fee-amount").fill("3500");
  const renew = dlg.getByRole("checkbox", { name: /renew/i });
  if (await renew.isChecked()) await renew.uncheck();
  await dlg.getByRole("button", { name: "Mark paid" }).click();
  await expect(dlg).toBeHidden();
  await expect(row.getByRole("button", { name: /Undo/ })).toBeVisible();
});