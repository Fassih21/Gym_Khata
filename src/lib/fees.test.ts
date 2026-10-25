import { describe, expect, it } from "vitest";

import { dueDateFor, expiryInfo, feeInfo } from "./fees";
import { addMonthsToDate } from "./format";

describe("fees", () => {
  it("due date uses join day, clamped to month end", () => {
    expect(dueDateFor("2026-01-05", "2026-03-01")).toBe("2026-03-05");
    expect(dueDateFor("2026-01-31", "2026-02-01")).toBe("2026-02-28");
  });
  it("statuses", () => {
    const m = "2026-10-01";
    expect(feeInfo("2026-01-05", m, true, "2026-10-25").status).toBe("paid");
    expect(feeInfo("2026-01-05", m, false, "2026-10-25")).toMatchObject({ status: "overdue", daysLate: 20 });
    expect(feeInfo("2026-01-28", m, false, "2026-10-25").status).toBe("due");
    expect(feeInfo("2026-01-25", m, false, "2026-10-25").status).toBe("due"); // aaj = due, overdue nahi
    expect(feeInfo("2026-10-03", m, false, "2026-10-25").status).toBe("new");
  });
  it("covered by membership expiry", () => {
    const m = "2026-10-01";
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", "2026-12-01")).toMatchObject({ status: "paid", covered: true });
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", "2026-10-25").covered).toBe(true); // aaj tak
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", "2026-10-24").status).toBe("overdue"); // expiry guzar gayi
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", null).status).toBe("overdue"); // plan nahi
  });
  it("month math + expiry", () => {
    expect(addMonthsToDate("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsToDate("2026-10-25", 12)).toBe("2027-10-25");
    expect(expiryInfo("2026-10-28", "2026-10-25")).toMatchObject({ soon: true, expired: false });
    expect(expiryInfo("2026-10-24", "2026-10-25")?.expired).toBe(true);
  });
});
