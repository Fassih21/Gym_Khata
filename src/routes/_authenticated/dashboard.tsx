import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CountUp, Stagger, StaggerItem } from "@/components/fx";
import { MonthSelect } from "@/components/month-select";
import { CenterSpinner, ErrorState, PageHeader } from "@/components/page";
import { supabase } from "@/integrations/supabase/client";
import { expectedMonthlyFee, expiryInfo, feeInfo } from "@/lib/fees";
import { fetchAll } from "@/lib/fetch-all";
import { usePlans } from "@/hooks/use-plans";
import { formatDate, formatPKR, lastNMonths, monthKey, monthShortLabel, toNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — GymKhata" },
      { name: "description", content: "Is mahine ka revenue, expenses aur members ka khulasa." },
    ],
  }),
  component: Dashboard,
});

const money = (n: number) => formatPKR(Math.round(n));
const whole = (n: number) => String(Math.round(n));

function Stat({
  label,
  value,
  format,
  tone,
  hero,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  tone?: "good" | "bad";
  hero?: boolean;
  icon?: typeof TrendingUp;
  hint?: string;
}) {
  return (
    <StaggerItem
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        hero ? "bg-brand-grad border-transparent text-white" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-sm font-medium", hero ? "text-white/80" : "text-muted-foreground")}>{label}</p>
        {Icon && <Icon className={cn("size-4", tone === "good" && "text-success", tone === "bad" && "text-destructive", hero && "text-white/80")} />}
      </div>
      <CountUp
        value={value}
        format={format}
        className={cn(
          "display-num mt-3 block text-4xl tracking-wide",
          tone === "good" && "text-success",
          tone === "bad" && "text-destructive",
        )}
      />
      {hint && <p className={cn("mt-1 text-xs", hero ? "text-white/70" : "text-muted-foreground")}>{hint}</p>}
    </StaggerItem>
  );
}

function ProgressRow({ label, done, total, tone }: { label: string; done: number; total: number; tone?: "good" }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {done} / {total} ({pct}%)
        </span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={cn("h-full rounded-full", tone === "good" ? "bg-success" : "bg-primary")}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

type ExpiryRow = { m: { id: string; name: string; phone: string; membership_expires_on: string | null }; ex: { days: number } };

function ExpiryList({ title, empty, rows, tone }: { title: string; empty: string; rows: ExpiryRow[]; tone: "warn" | "bad" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{title} <span className="text-muted-foreground">({rows.length})</span></h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 max-h-64 divide-y divide-border overflow-y-auto">
          {rows.map(({ m, ex }) => (
            <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 truncate font-medium">{m.name} <span className="font-normal text-muted-foreground">{m.phone}</span></span>
              <span className={cn("shrink-0 text-xs font-semibold", tone === "bad" ? "text-destructive" : "text-amber-600")}>
                {formatDate(m.membership_expires_on)} · {ex.days === 0 ? "aaj" : ex.days > 0 ? `${ex.days} din baqi` : `${-ex.days} din pehle`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Dashboard() {
  const [month, setMonth] = useState(monthKey());
  const months6 = lastNMonths(6);
  const first6 = months6[0];

  const paymentsQ = useQuery({
    queryKey: ["payments6", months6.join(",")],
    queryFn: async () => {
      return fetchAll<{ member_id: string; month: string; amount_paid: number }>((from, to) =>
        supabase.from("member_payments").select("member_id, month, amount_paid").in("month", months6).order("id").range(from, to),
      );
    },
  });
  const expensesQ = useQuery({
    queryKey: ["expenses6", first6],
    queryFn: async () => {
      return fetchAll<{ amount: number; expense_date: string }>((from, to) =>
        supabase.from("expenses").select("amount, expense_date").gte("expense_date", first6).order("id").range(from, to),
      );
    },
  });
  const salariesQ = useQuery({
    queryKey: ["salaries6", months6.join(",")],
    queryFn: async () => {
      return fetchAll<{ employee_id: string; month: string; amount_paid: number }>((from, to) =>
        supabase.from("salary_payments").select("employee_id, month, amount_paid").in("month", months6).order("id").range(from, to),
      );
    },
  });
  const membersQ = useQuery({
    queryKey: ["members-counts"],
    queryFn: async () => {
      return fetchAll<{ id: string; name: string; phone: string; status: string; join_date: string; plan_id: string | null; membership_expires_on: string | null }>((from, to) =>
        supabase
          .from("members")
          .select("id, name, phone, status, join_date, plan_id, membership_expires_on")
          .is("deleted_at", null)
          .order("id")
          .range(from, to),
      );
    },
  });
  const plansQ = usePlans();
  const employeesQ = useQuery({
    queryKey: ["employees-counts"],
    queryFn: async () => {
      return fetchAll<{ id: string }>((from, to) =>
        supabase.from("employees").select("id").is("deleted_at", null).order("id").range(from, to),
      );
    },
  });

  const loading =
    paymentsQ.isPending || expensesQ.isPending || salariesQ.isPending || membersQ.isPending || employeesQ.isPending;
  const error = paymentsQ.error || expensesQ.error || salariesQ.error || membersQ.error || employeesQ.error;
  const retry = () => {
    void paymentsQ.refetch();
    void expensesQ.refetch();
    void salariesQ.refetch();
    void membersQ.refetch();
    void employeesQ.refetch();
  };

  if (loading) return <CenterSpinner />;
  if (error) return <ErrorState onRetry={retry} />;

  const payments = paymentsQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const salaries = salariesQ.data ?? [];
  const members = membersQ.data ?? [];
  const employees = employeesQ.data ?? [];

  const monthPayments = payments.filter((p) => p.month === month);
  const revenue = monthPayments.reduce((s, p) => s + toNumber(p.amount_paid), 0);
  const monthExpenses = expenses.filter((e) => e.expense_date.slice(0, 7) === month.slice(0, 7));
  const expenseTotal = monthExpenses.reduce((s, e) => s + toNumber(e.amount), 0);
  const salaryTotal = salaries.filter((s) => s.month === month).reduce((s, r) => s + toNumber(r.amount_paid), 0);
  const net = revenue - (expenseTotal + salaryTotal);
  const activeMembers = members.filter((m) => m.status === "active").length;
  const paidIds = new Set(monthPayments.map((p) => p.member_id));
  // Unpaid = payment nahi hui, YA payment hui magar membership expire ho chuki (sirf maujooda mahine mein).
  const paidActive = members.filter((m) => m.status === "active" && paidIds.has(m.id));
  const expiredPaid = paidActive.filter((m) => feeInfo(m.join_date, month, true, undefined, m.membership_expires_on).expired).length;
  const unpaidCount = activeMembers - paidActive.length + expiredPaid;
  const paidSalaryIds = new Set(salaries.filter((s) => s.month === month).map((s) => s.employee_id));
  const salariesPending = employees.filter((e) => !paidSalaryIds.has(e.id)).length;

  // Overdue: hamesha aaj ke calendar mahine ke hisaab se (selector se independent).
  const nowMonth = monthKey();
  const lastPaid = new Map<string, number>();
  [...payments].sort((a, b) => a.month.localeCompare(b.month)).forEach((p) => lastPaid.set(p.member_id, toNumber(p.amount_paid)));
  const paidNow = new Set(payments.filter((p) => p.month === nowMonth).map((p) => p.member_id));
  const overdueMembers = members.filter(
    (m) => m.status === "active" && feeInfo(m.join_date, nowMonth, paidNow.has(m.id), undefined, m.membership_expires_on).status === "overdue",
  );
  const planById = new Map((plansQ.data ?? []).map((p) => [p.id, p]));
  const overdueAmount = overdueMembers.reduce(
    (s, m) => s + expectedMonthlyFee(m.plan_id ? planById.get(m.plan_id) : undefined, lastPaid.get(m.id)),
    0,
  );
  const approx = overdueMembers.some((m) => !m.plan_id || !planById.has(m.plan_id));
  const withExpiry = members
    .filter((m) => m.status === "active" && m.membership_expires_on)
    .map((m) => ({ m, ex: expiryInfo(m.membership_expires_on)! }))
    .sort((a, b) => a.ex.days - b.ex.days);
  const expiringSoon = withExpiry.filter((x) => x.ex.soon);
  const expired = withExpiry.filter((x) => x.ex.expired).reverse(); // sab se haal hi mein expire hone wale pehle

  const chartData = months6.map((m) => ({
    month: monthShortLabel(m),
    revenue: payments.filter((p) => p.month === m).reduce((s, p) => s + toNumber(p.amount_paid), 0),
    expense:
      expenses
        .filter((e) => e.expense_date.slice(0, 7) === m.slice(0, 7))
        .reduce((s, e) => s + toNumber(e.amount), 0) +
      salaries.filter((s) => s.month === m).reduce((s, r) => s + toNumber(r.amount_paid), 0),
  }));

  const paidCount = activeMembers - unpaidCount;
  const donut = activeMembers > 0
    ? [{ name: "Paid", value: paidCount, color: "var(--chart-1)" }, { name: "Unpaid", value: unpaidCount, color: "var(--chart-2)" }]
    : [{ name: "Koi member nahi", value: 1, color: "var(--chart-2)" }];
  const paidPct = activeMembers > 0 ? Math.round((paidCount / activeMembers) * 100) : 0;
  const tip = {
    cursor: { stroke: "var(--border)" },
    contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" },
    formatter: (v: number) => formatPKR(v),
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Is mahine ka khulasa" action={<MonthSelect value={month} onChange={setMonth} />} />

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat hero label="Fees collected" value={revenue} format={money} hint={`${paidCount} members ne fees di`} />
        <Stat label="Expenses (incl. salaries)" value={expenseTotal + salaryTotal} format={money} />
        <Stat label={net >= 0 ? "Net profit" : "Net loss"} value={net} format={money} tone={net >= 0 ? "good" : "bad"} icon={net >= 0 ? TrendingUp : TrendingDown} />
        <Stat label="Active members" value={activeMembers} format={whole} />
        <Stat label="Fees unpaid" value={unpaidCount} format={whole} tone={unpaidCount > 0 ? "bad" : "good"} />
        <Stat label="Salaries pending" value={salariesPending} format={whole} tone={salariesPending > 0 ? "bad" : "good"} />
        <Stat label="Overdue members" value={overdueMembers.length} format={whole} tone={overdueMembers.length > 0 ? "bad" : "good"} hint="Due date guzar gayi, fees nahi aayi" />
        <Stat label={approx ? "Total pending amount (approx)" : "Total pending amount"} value={overdueAmount} format={money} tone={overdueAmount > 0 ? "bad" : "good"} hint={approx ? "approx: kuch members ka plan nahi, aakhri payment/Rs 3000 ka andaaza" : "Plan ke hisaab se"} />
      </Stagger>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold">6 mahine: Revenue vs Expenses</h2>
          <div className="mt-3 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gk-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" width={44} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gk-rev)" animationDuration={600} />
                <Area type="monotone" dataKey="expense" name="Expenses" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="4 3" fill="none" animationDuration={600} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Fees status</h2>
          <div className="relative mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donut} dataKey="value" innerRadius="64%" outerRadius="88%" paddingAngle={activeMembers > 0 ? 3 : 0} stroke="none" animationDuration={600}>
                  {donut.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <CountUp value={paidPct} format={(n) => `${Math.round(n)}%`} className="display-num text-4xl" />
              <span className="text-xs text-muted-foreground">paid</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ExpiryList title="Jald khatam hone wale (3 din)" empty="Agle 3 din mein koi membership expire nahi ho rahi." rows={expiringSoon} tone="warn" />
        <ExpiryList title="Expired memberships" empty="Koi expired membership nahi." rows={expired} tone="bad" />
      </div>

      <div className="mt-4 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <ProgressRow label="Members ki fees" done={paidCount} total={activeMembers} />
        <ProgressRow label="Employees ki salary" done={employees.length - salariesPending} total={employees.length} tone="good" />
      </div>
    </div>
  );
}