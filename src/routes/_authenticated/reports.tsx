import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";

import { MonthSelect } from "@/components/month-select";
import { CenterSpinner, ErrorState, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { downloadCSV, toCSV } from "@/lib/csv";
import { feeInfo } from "@/lib/fees";
import { addMonths, formatPKR, monthKey, monthLabel, todayISO, toNumber } from "@/lib/format";
import type { Expense, Member, MemberPayment, SalaryPayment } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — GymKhata" },
      { name: "description", content: "Mahana khulasa aur CSV export." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const [month, setMonth] = useState(monthKey());

  const paymentsQ = useQuery({
    queryKey: ["report-payments", month],
    queryFn: async () => {
      return fetchAll<MemberPayment & { member: { name: string } | null }>((from, to) =>
        supabase.from("member_payments").select("id, member_id, month, amount_paid, paid_on, note, member:members(name)").eq("month", month).order("id").range(from, to),
      );
    },
  });
  const salariesQ = useQuery({
    queryKey: ["report-salaries", month],
    queryFn: async () => {
      return fetchAll<SalaryPayment & { employee: { name: string } | null }>((from, to) =>
        supabase.from("salary_payments").select("id, employee_id, month, amount_paid, paid_on, employee:employees(name)").eq("month", month).order("id").range(from, to),
      );
    },
  });
  const expensesQ = useQuery({
    queryKey: ["report-expenses", month],
    queryFn: async () => {
      return fetchAll<Expense>((from, to) =>
        supabase.from("expenses").select("id, title, category, amount, expense_date, note").gte("expense_date", month).lt("expense_date", addMonths(month, 1)).order("id").range(from, to),
      );
    },
  });
  const membersQ = useQuery({
    queryKey: ["report-members"],
    queryFn: async () => {
      return fetchAll<Member>((from, to) =>
        supabase.from("members").select("id, name, phone, status, join_date, membership_expires_on").is("deleted_at", null).eq("status", "active").order("id").range(from, to),
      );
    },
  });

  const loading = paymentsQ.isPending || salariesQ.isPending || expensesQ.isPending || membersQ.isPending;
  if (loading) return <CenterSpinner />;
  const error = paymentsQ.error || salariesQ.error || expensesQ.error || membersQ.error;
  if (error)
    return <ErrorState onRetry={() => { void paymentsQ.refetch(); void salariesQ.refetch(); void expensesQ.refetch(); void membersQ.refetch(); }} />;

  const payments = paymentsQ.data ?? [];
  const salaries = salariesQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const members = membersQ.data ?? [];

  const revenue = payments.reduce((s, p) => s + toNumber(p.amount_paid), 0);
  const salaryTotal = salaries.reduce((s, r) => s + toNumber(r.amount_paid), 0);
  const expenseTotal = expenses.reduce((s, e) => s + toNumber(e.amount), 0) + salaryTotal;
  const net = revenue - expenseTotal;
  const paidIds = new Set(payments.map((p) => p.member_id));
  const dues = members.filter((m) => !paidIds.has(m.id) && !feeInfo(m.join_date, month, false, todayISO(), m.membership_expires_on).covered);

  const rows = [
    { label: "Fees collected", value: formatPKR(revenue) },
    { label: "Salaries paid", value: formatPKR(salaryTotal) },
    { label: "Other expenses", value: formatPKR(expenseTotal - salaryTotal) },
    { label: "Total expenses", value: formatPKR(expenseTotal) },
    { label: "Net profit/loss", value: formatPKR(net) },
    { label: "Members paid / unpaid", value: `${payments.length} / ${dues.length}` },
  ];

  const exportDues = () =>
    downloadCSV(`gymkhata-dues-${month.slice(0, 7)}.csv`, toCSV(
      dues.map((m) => ({ name: m.name, phone: m.phone, month: month.slice(0, 7), pending_amount: "" })),
      ["name", "phone", "month", "pending_amount"],
    ));
  const exportPayments = () =>
    downloadCSV(`gymkhata-payments-${month.slice(0, 7)}.csv`, toCSV(
      payments.map((p) => ({ member: p.member?.name ?? "", month: p.month, amount_paid: p.amount_paid, paid_on: p.paid_on, note: p.note ?? "" })),
      ["member", "month", "amount_paid", "paid_on", "note"],
    ));
  const exportExpenses = () =>
    downloadCSV(`gymkhata-expenses-${month.slice(0, 7)}.csv`, toCSV([
      ...expenses.map((e) => ({ title: e.title, category: e.category, amount: e.amount, date: e.expense_date, note: e.note ?? "" })),
      ...salaries.map((s) => ({ title: `Salary — ${s.employee?.name ?? ""}`, category: "Salaries", amount: s.amount_paid, date: s.paid_on, note: "" })),
    ], ["title", "category", "amount", "date", "note"]));

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={monthLabel(month)}
        action={<MonthSelect value={month} onChange={setMonth} />}
      />

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-muted-foreground">{r.label}</p>
            <p className="display-num text-xl tracking-wide">{r.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportDues}><Download className="size-4" /> Members dues CSV</Button>
        <Button variant="outline" onClick={exportPayments}><Download className="size-4" /> Payments CSV</Button>
        <Button variant="outline" onClick={exportExpenses}><Download className="size-4" /> Expenses CSV</Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{dues.length} members ki is mahine fees baqi hai.</p>
    </div>
  );
}
