import { afterEach, describe, expect, it, vi } from "vitest";

import { expiryInfo, memberFeeState } from "./fees";
import {
  addMonthsToDate,
  billingDayAnchor,
  monthKey,
  todayISO,
} from "./format";

const state = (
  overrides: Partial<Parameters<typeof memberFeeState>[0]> = {},
) =>
  memberFeeState({
    joinDate: "2026-01-05",
    membershipExpiresOn: null,
    selectedMonth: "2026-10-01",
    hasPaymentForMonth: false,
    firstPaidMonth: null,
    expectedAmount: 3000,
    today: "2026-10-25",
    ...overrides,
  });

describe("fees", () => {
  it("uses the stored membership expiry as the authoritative deadline", () => {
    expect(
      state({
        joinDate: "2026-01-25",
        membershipExpiresOn: "2026-10-10",
        firstPaidMonth: "2026-09-01",
        today: "2026-10-15",
      }),
    ).toMatchObject({
      status: "overdue",
      isPending: true,
      pendingAmount: 3000,
      deadline: "2026-10-10",
      daysLate: 5,
    });
  });

  it("uses join date once as the initial deadline when no expiry exists", () => {
    expect(
      state({
        joinDate: "2026-10-31",
        selectedMonth: "2026-10-01",
        today: "2026-11-01",
      }),
    ).toMatchObject({
      status: "overdue",
      deadline: "2026-10-31",
      daysLate: 1,
    });
  });

  it("never-paid member with a future stored deadline is pending, not paid", () => {
    expect(
      state({
        joinDate: "2026-10-05",
        membershipExpiresOn: "2026-11-05",
      }),
    ).toMatchObject({
      status: "pending",
      isPending: true,
      deadline: "2026-11-05",
    });
  });

  it("join-month member becomes overdue after the initial deadline", () => {
    expect(
      state({
        joinDate: "2026-10-03",
        selectedMonth: "2026-10-01",
      }),
    ).toMatchObject({ status: "overdue", deadline: "2026-10-03" });
    expect(
      state({
        joinDate: "2026-10-28",
        selectedMonth: "2026-10-01",
      }),
    ).toMatchObject({ status: "pending", deadline: "2026-10-28" });
  });

  it("current-month payment is paid while its stored deadline remains valid", () => {
    expect(
      state({
        hasPaymentForMonth: true,
        membershipExpiresOn: "2026-11-25",
        firstPaidMonth: "2026-10-01",
      }),
    ).toMatchObject({ status: "paid", isPending: false, pendingAmount: 0 });
  });

  it("current-month payment cannot hide an expired membership", () => {
    expect(
      state({
        hasPaymentForMonth: true,
        membershipExpiresOn: "2026-10-20",
        firstPaidMonth: "2026-10-01",
      }),
    ).toMatchObject({
      status: "overdue",
      deadline: "2026-10-20",
      daysLate: 5,
    });
  });

  it("payment without a stored membership expiry settles that selected month", () => {
    expect(state({ hasPaymentForMonth: true })).toMatchObject({
      status: "paid",
      isPending: false,
    });
  });

  it("multi-month membership covers months between first payment and expiry", () => {
    expect(
      state({
        selectedMonth: "2026-02-01",
        today: "2026-02-20",
        membershipExpiresOn: "2026-04-30",
        firstPaidMonth: "2026-01-01",
      }),
    ).toMatchObject({ status: "paid", isPending: false });
  });

  it("historical covered month stays paid after the membership later expires", () => {
    expect(
      state({
        selectedMonth: "2026-02-01",
        today: "2026-05-01",
        membershipExpiresOn: "2026-04-30",
        firstPaidMonth: "2026-01-01",
      }),
    ).toMatchObject({ status: "paid", isPending: false });
  });

  it("coverage does not erase unpaid months before the first payment", () => {
    expect(
      state({
        selectedMonth: "2026-02-01",
        membershipExpiresOn: "2027-01-25",
        firstPaidMonth: "2026-10-01",
      }),
    ).toMatchObject({ status: "overdue", deadline: "2026-01-05" });
  });

  it("unpaid earlier deadline carries forward instead of resetting next month", () => {
    expect(
      state({
        joinDate: "2026-10-31",
        selectedMonth: "2026-11-01",
        today: "2026-11-10",
      }),
    ).toMatchObject({ status: "overdue", deadline: "2026-10-31", daysLate: 10 });
  });

  it.skip("TODO Phase 2: partial payment does not settle the full expected fee", () => {
    // Phase 1 still receives a boolean payment marker. Supporting balances/top-ups
    // needs an approved payment model and likely a database migration.
    expect(state({ hasPaymentForMonth: true }).status).toBe("overdue");
  });

  it("keeps a 31st billing anchor after renewal through February", () => {
    const billingDay = billingDayAnchor("2026-01-31");
    const februaryExpiry = addMonthsToDate("2026-01-31", 1, billingDay);
    const marchExpiry = addMonthsToDate(februaryExpiry, 1, billingDay);

    expect(februaryExpiry).toBe("2026-02-28");
    expect(marchExpiry).toBe("2026-03-31");
  });

  it("handles leap years and December to January", () => {
    expect(addMonthsToDate("2024-01-31", 1, 31)).toBe("2024-02-29");
    expect(addMonthsToDate("2026-12-31", 1, 31)).toBe("2027-01-31");
  });

  it("calculates expiry state from date-only values", () => {
    expect(expiryInfo("2026-10-28", "2026-10-25")).toMatchObject({
      soon: true,
      expired: false,
    });
    expect(expiryInfo("2026-10-24", "2026-10-25")?.expired).toBe(true);
  });

  describe("Pakistan date boundary", () => {
    afterEach(() => vi.useRealTimers());

    it("uses Asia/Karachi date and month regardless of runtime timezone", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-31T20:00:00.000Z")); // 1 Nov, 01:00 in Karachi

      expect(todayISO()).toBe("2026-11-01");
      expect(monthKey()).toBe("2026-11-01");
    });
  });
});
