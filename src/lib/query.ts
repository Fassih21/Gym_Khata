import type { QueryClient } from "@tanstack/react-query";

// Ek mutation ke baad un sab pages ki queries refresh hon jo us data ko dikhate hain.
const run = (qc: QueryClient, keys: string[]) =>
  Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));

export const invalidate = {
  members: (qc: QueryClient) => run(qc, ["members", "fees-members", "members-counts", "report-members"]),
  payments: (qc: QueryClient) => run(qc, ["fees-payments", "payments6", "report-payments", "ever-paid"]),
  expenses: (qc: QueryClient) => run(qc, ["expenses", "expenses6", "report-expenses"]),
  employees: (qc: QueryClient) => run(qc, ["employees", "attendance-employees", "employees-counts"]),
  plans: (qc: QueryClient) => run(qc, ["plans"]),
  salaries: (qc: QueryClient) => run(qc, ["salaries", "salaries6", "report-salaries"]),
};