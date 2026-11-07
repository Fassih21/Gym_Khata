import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { MemberAttendance } from "@/components/member-attendance";
import { MonthSelect } from "@/components/month-select";
import { CenterSpinner, EmptyState, ErrorState, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { addMonths, monthKey, monthLabel, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Attendance, Employee } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — GymKhata" },
      { name: "description", content: "Members aur employees ki rozana hazri aur mahana khulasa." },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const [tab, setTab] = useState<"employees" | "members">("members");
  return (
    <div>
      <div className="mb-5 flex gap-2">
        <Button variant={tab === "members" ? "default" : "outline"} size="sm" aria-pressed={tab === "members"} onClick={() => setTab("members")}>Members</Button>
        <Button variant={tab === "employees" ? "default" : "outline"} size="sm" aria-pressed={tab === "employees"} onClick={() => setTab("employees")}>Employees</Button>
      </div>
      {tab === "members" ? <MemberAttendance /> : <EmployeeAttendance />}
    </div>
  );
}

const STATUSES = [
  { value: "present", label: "P" },
  { value: "absent", label: "A" },
  { value: "leave", label: "L" },
] as const;

function EmployeeAttendance() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(monthKey());
  const [date, setDate] = useState(todayISO());
  const [saveError, setSaveError] = useState<string | null>(null);

  const employeesQ = useQuery({
    queryKey: ["attendance-employees"],
    queryFn: async () => {
      return fetchAll<Employee>((from, to) =>
        supabase.from("employees").select("id, name, role_title, photo_path, status").is("deleted_at", null).eq("status", "active").order("name").order("id").range(from, to),
      );
    },
  });

  const recordsQ = useQuery({
    queryKey: ["attendance", month],
    queryFn: async () => {
      return fetchAll<Attendance>((from, to) =>
        supabase.from("employee_attendance").select("employee_id, date, status").gte("date", month).lt("date", addMonths(month, 1)).order("id").range(from, to),
      );
    },
  });

  const mark = useMutation({
    mutationFn: async ({ employeeId, status }: { employeeId: string; status: "present" | "absent" | "leave" }) => {
      const { error } = await supabase
        .from("employee_attendance")
        .upsert({ employee_id: employeeId, date, status }, { onConflict: "employee_id,date" });
      if (error) throw error;
    },
    onSuccess: () => {
      setSaveError(null);
      void qc.invalidateQueries({ queryKey: ["attendance", month] });
    },
    onError: () => setSaveError("Hazri save nahi hui, dobara koshish karein"),
  });

  const loading = employeesQ.isPending || recordsQ.isPending;
  if (loading) return <CenterSpinner />;
  if (employeesQ.error || recordsQ.error)
    return <ErrorState onRetry={() => { void employeesQ.refetch(); void recordsQ.refetch(); }} />;

  const employees = employeesQ.data ?? [];
  const records = recordsQ.data ?? [];
  const byEmployeeDate = new Map(records.map((r) => [`${r.employee_id}|${r.date}`, r.status]));

  const summary = employees.map((e) => {
    const mine = records.filter((r) => r.employee_id === e.id);
    const count = (s: string) => mine.filter((r) => r.status === s).length;
    return { employee: e, present: count("present"), absent: count("absent"), leave: count("leave") };
  });

  return (
    <div>
      <PageHeader
        title="Employee Attendance"
        subtitle={monthLabel(month)}
        action={<MonthSelect value={month} onChange={setMonth} />}
      />

      <div className="mb-4 max-w-xs">
        <label htmlFor="att-date" className="mb-1.5 block text-sm font-medium">Tareekh</label>
        <Input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
      </div>

      {saveError && <p role="alert" className="mb-3 text-sm text-destructive">{saveError}</p>}

      {employees.length === 0 ? (
        <EmptyState title="Koi employee nahi" hint="Pehle employees page par staff add karein." />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {employees.map((e) => {
            const current = byEmployeeDate.get(`${e.id}|${date}`) ?? null;
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.name}</p>
                  <p className="text-sm text-muted-foreground">{e.role_title ?? ""}</p>
                </div>
                <div className="flex gap-1.5">
                  {STATUSES.map((s) => (
                    <Button
                      key={s.value}
                      size="sm"
                      variant={current === s.value ? "default" : "outline"}
                      className="min-w-10 font-semibold"
                      disabled={mark.isPending}
                      aria-pressed={current === s.value}
                      onClick={() => mark.mutate({ employeeId: e.id, status: s.value })}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mahana khulasa</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">Employee</th>
              <th className="px-2 py-2 text-center font-medium">Hazir</th>
              <th className="px-2 py-2 text-center font-medium">Ghair hazir</th>
              <th className="px-2 py-2 text-center font-medium">Chhutti</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.employee.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2.5 font-medium">{s.employee.name}</td>
                <td className={cn("px-2 py-2.5 text-center font-semibold", s.present > 0 && "text-success")}>{s.present}</td>
                <td className={cn("px-2 py-2.5 text-center font-semibold", s.absent > 0 && "text-destructive")}>{s.absent}</td>
                <td className="px-2 py-2.5 text-center font-semibold">{s.leave}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
