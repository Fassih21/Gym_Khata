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
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", "2026-12-01", "2026-01-01")).toMatchObject({ status: "paid", covered: true });
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", "2026-10-25", "2026-01-01").covered).toBe(true); // aaj tak
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", "2026-10-24").status).toBe("overdue"); // expiry guzar gayi
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", null).status).toBe("overdue"); // plan nahi
  });
  it("expiry bina payment ke covered nahi (free membership nahi)", () => {
    const m = "2026-10-01";
    expect(feeInfo("2026-10-05", m, false, "2026-10-25", "2026-11-05", null)).toMatchObject({ status: "new", covered: false });
    expect(feeInfo("2026-01-05", m, false, "2026-10-25", "2026-12-01", null)).toMatchObject({ status: "overdue", covered: false });
  });
  it("month math + expiry", () => {
    expect(addMonthsToDate("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsToDate("2026-10-25", 12)).toBe("2027-10-25");
    expect(expiryInfo("2026-10-28", "2026-10-25")).toMatchObject({ soon: true, expired: false });
    expect(expiryInfo("2026-10-24", "2026-10-25")?.expired).toBe(true);
  });
  it("paid but membership expired => overdue (renewal due), sirf maujooda mahine mein", () => {
    const cur = "2026-10-01";
    // Ahmad: payment hai, expiry 26 Oct guzar chuki, aaj 28 Oct
    expect(feeInfo("2026-10-05", cur, true, "2026-10-28", "2026-10-26")).toMatchObject({
      status: "overdue", expired: true, daysLate: 2, dueDate: "2026-10-26", covered: false,
    });
    // expiry aaj ya aage ki => paid
    expect(feeInfo("2026-10-05", cur, true, "2026-10-28", "2026-10-28")).toMatchObject({ status: "paid", expired: false });
    expect(feeInfo("2026-10-05", cur, true, "2026-10-28", "2026-11-27")).toMatchObject({ status: "paid", expired: false });
    // expiry set hi nahi => pehle jaisa
    expect(feeInfo("2026-10-05", cur, true, "2026-10-28", null)).toMatchObject({ status: "paid", expired: false });
    // purane mahine ki history nahi badalti
    expect(feeInfo("2026-01-05", "2026-09-01", true, "2026-10-28", "2026-10-26")).toMatchObject({ status: "paid", expired: false });
  });
  it("coverage pehli payment se pehle ke mahino par nahi lagti", () => {
    // Jan join, pehli payment Oct, expiry agle saal: Feb ka mahina covered nahi
    expect(feeInfo("2026-01-05", "2026-02-01", false, "2026-10-25", "2027-01-25", "2026-10-01").status).toBe("overdue");
    expect(feeInfo("2026-01-05", "2026-11-01", false, "2026-11-25", "2027-01-25", "2026-10-01")).toMatchObject({ status: "paid", covered: true });
  });
  it("monthly renew ke baad paid (expired nahi)", () => {
    expect(feeInfo("2026-10-05", "2026-11-01", true, "2026-11-06", "2026-12-06", "2026-10-01")).toMatchObject({ status: "paid", expired: false });
  });
});