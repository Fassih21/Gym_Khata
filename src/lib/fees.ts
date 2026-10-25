// Fee status — derived on the fly (no stored flag, so it can never go stale).
import { daysBetween, dateISO, todayISO, toNumber } from "./format";

export type FeeStatus = "paid" | "due" | "overdue" | "new";

/** Fallback monthly fee when a member has no plan and no past payment. */
export const DEFAULT_MONTHLY_FEE = 3000;

/** Due date of `month` (YYYY-MM-01) for a member: same day-of-month as join_date (clamped). */
export function dueDateFor(joinDate: string, month: string): string {
  const day = Number(joinDate.slice(8, 10)) || 1;
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(y, m, 0).getDate();
  return dateISO(new Date(y, m - 1, Math.min(day, last)));
}

export interface FeeInfo {
  status: FeeStatus;
  dueDate: string;
  daysLate: number; // > 0 only when overdue
  covered: boolean; // is mahine ki payment nahi, magar membership (expiry) abhi chal rahi hai
}

/**
 * paid    : is mahine ki payment maujood, ya membership_expires_on aaj/aage ki hai (covered)
 * new     : join isi (ya aane wale) mahine mein hua, pehli fees abhi nahi aayi
 * overdue : due date guzar gayi aur fees nahi di
 * due     : due date aaj ya aage
 */
export function feeInfo(
  joinDate: string,
  month: string,
  paid: boolean,
  today: string = todayISO(),
  expiresOn?: string | null,
): FeeInfo {
  const dueDate = dueDateFor(joinDate, month);
  if (paid) return { status: "paid", dueDate, daysLate: 0, covered: false };
  // Quarterly/Yearly: expiry aaj ya aage ki hai to is mahine ki entry ke baghair bhi covered.
  // (Sirf current/guzishta mahine par; expiry guzar gayi ya plan nahi => normal rule.)
  if (expiresOn && expiresOn >= today && month.slice(0, 7) <= today.slice(0, 7))
    return { status: "paid", dueDate, daysLate: 0, covered: true };
  if (joinDate.slice(0, 7) >= month.slice(0, 7)) return { status: "new", dueDate, daysLate: 0, covered: false };
  if (dueDate < today) return { status: "overdue", dueDate, daysLate: daysBetween(dueDate, today), covered: false };
  return { status: "due", dueDate, daysLate: 0, covered: false };
}

export const FEE_BADGE: Record<FeeStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-success/15 text-success" },
  due: { label: "Due", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive" },
  new: { label: "New", className: "bg-primary/15 text-primary" },
};

/** Monthly expected fee: plan price / months, else last payment, else default. */
export function expectedMonthlyFee(
  plan: { price: number | string; duration_months: number } | undefined,
  lastPaid?: number | string | null,
): number {
  if (plan && plan.duration_months > 0) return Math.round(toNumber(plan.price) / plan.duration_months);
  const last = toNumber(lastPaid);
  return last > 0 ? last : DEFAULT_MONTHLY_FEE;
}

/** Expiry state of a membership (null expiry = untracked). */
export function expiryInfo(expiresOn: string | null | undefined, today: string = todayISO()) {
  if (!expiresOn) return null;
  const days = daysBetween(today, expiresOn);
  return { days, expired: days < 0, soon: days >= 0 && days <= 3 };
}
