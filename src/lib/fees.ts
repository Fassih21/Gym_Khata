// Fee status — derived on the fly from the stored membership deadline.
import { daysBetween, monthEndISO, todayISO, toNumber } from "./format";

export type FeeStatus = "paid" | "pending" | "overdue";

/** Fallback monthly fee when a member has no plan and no past payment. */
export const DEFAULT_MONTHLY_FEE = 3000;

export interface MemberFeeState {
  status: FeeStatus;
  isPending: boolean;
  pendingAmount: number;
  deadline: string;
  daysLate: number;
}

export interface MemberFeeStateInput {
  joinDate: string;
  membershipExpiresOn?: string | null;
  selectedMonth: string;
  hasPaymentForMonth: boolean;
  firstPaidMonth?: string | null;
  expectedAmount?: number;
  today?: string;
}

/**
 * Single source of truth for member fee state.
 *
 * `membership_expires_on` is the rolling deadline. `join_date` is used only as
 * the one-time initial deadline for legacy/never-paid rows without an expiry,
 * never as a recurring day-of-month deadline.
 */
export function memberFeeState({
  joinDate,
  membershipExpiresOn,
  selectedMonth,
  hasPaymentForMonth,
  firstPaidMonth = null,
  expectedAmount = 0,
  today = todayISO(),
}: MemberFeeStateInput): MemberFeeState {
  const month = `${selectedMonth.slice(0, 7)}-01`;
  const currentMonth = `${today.slice(0, 7)}-01`;
  const firstPaid = firstPaidMonth ? `${firstPaidMonth.slice(0, 7)}-01` : null;
  const beforeFirstPayment = Boolean(firstPaid && month < firstPaid);
  const deadline = beforeFirstPayment ? joinDate : (membershipExpiresOn ?? joinDate);
  const coverageDate = month === currentMonth ? today : monthEndISO(month);

  const directPaymentCovers =
    hasPaymentForMonth && (!membershipExpiresOn || coverageDate <= deadline);
  const expiryCovers = Boolean(
    firstPaid &&
      membershipExpiresOn &&
      month >= firstPaid &&
      coverageDate <= membershipExpiresOn,
  );
  const status: FeeStatus =
    directPaymentCovers || expiryCovers ? "paid" : deadline < today ? "overdue" : "pending";
  const isPending = status !== "paid";

  return {
    status,
    isPending,
    pendingAmount: isPending ? Math.max(0, toNumber(expectedAmount)) : 0,
    deadline,
    daysLate: status === "overdue" ? daysBetween(deadline, today) : 0,
  };
}

export const FEE_BADGE: Record<FeeStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-success/15 text-success" },
  pending: { label: "Pending", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  overdue: { label: "Overdue", className: "bg-destructive/15 text-destructive" },
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
