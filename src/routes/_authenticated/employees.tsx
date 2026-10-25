import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Plus, XCircle } from "lucide-react";
import { useState } from "react";

import { MonthSelect } from "@/components/month-select";
import { CenterSpinner, EmptyState, ErrorState, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGym } from "@/hooks/use-gym";
import { initials, seedPhotoUrls, useSignedUrl } from "@/hooks/use-photo";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { invalidate } from "@/lib/query";
import { formatPKR, monthKey, todayISO } from "@/lib/format";
import { uploadPhoto } from "@/lib/photo";
import { employeeSchema } from "@/lib/schemas";
import type { Employee, SalaryPayment } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({
    meta: [
      { title: "Employees — GymKhata" },
      { name: "description", content: "Staff, salaries aur unka record." },
    ],
  }),
  component: EmployeesPage,
});

function Avatar({ employee }: { employee: Employee }) {
  const { data: url } = useSignedUrl(employee.photo_path);
  return url ? (
    <img src={url} alt={employee.name} className="size-10 rounded-lg object-cover" />
  ) : (
    <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
      {initials(employee.name)}
    </span>
  );
}

function EmployeesPage() {
  const qc = useQueryClient();
  const { gym } = useGym();
  const [month, setMonth] = useState(monthKey());
  const [formOpen, setFormOpen] = useState(false);
  const [payFor, setPayFor] = useState<Employee | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paidOn, setPaidOn] = useState(todayISO());
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [salary, setSalary] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [joinDate, setJoinDate] = useState(todayISO());
  const [photo, setPhoto] = useState<File | null>(null);

  const employeesQ = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const data = await fetchAll<Employee>((from, to) =>
        supabase.from("employees").select("id, name, phone, address, role_title, monthly_salary, join_date, photo_path, status").is("deleted_at", null).eq("status", "active").order("name").order("id").range(from, to),
      );
      await seedPhotoUrls(qc, data.map((e) => e.photo_path));
      return data as Employee[];
    },
  });
  const salariesQ = useQuery({
    queryKey: ["salaries", month],
    queryFn: async () => {
      return fetchAll<SalaryPayment>((from, to) =>
        supabase.from("salary_payments").select("id, employee_id, month, amount_paid, paid_on").eq("month", month).order("id").range(from, to),
      );
    },
  });

  const openForm = () => {
    setName(""); setPhone(""); setAddress(""); setSalary(""); setRoleTitle(""); setJoinDate(todayISO()); setPhoto(null); setFormError(null);
    setFormOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = employeeSchema.safeParse({ name, phone, address, monthly_salary: salary, role_title: roleTitle, join_date: joinDate, status: "active" });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Form check karein");
      let photoPath: string | null = null;
      if (photo) {
        if (!gym) throw new Error("Gym load nahi hua");
        photoPath = await uploadPhoto(photo, gym.id, "employees");
      }
      const payload = {
        name: parsed.data.name, phone: parsed.data.phone,
        address: parsed.data.address || null,
        monthly_salary: Number(parsed.data.monthly_salary),
        role_title: parsed.data.role_title || null,
        join_date: parsed.data.join_date,
        ...(photo ? { photo_path: photoPath } : {}),
      };
      const { error } = await supabase.from("employees").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { setFormOpen(false); void invalidate.employees(qc); },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Save nahi hua"),
  });

  const markPaid = useMutation({
    mutationFn: async (employee: Employee) => {
      const amount = payAmount.replace(/,/g, "");
      if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) < 0) throw new Error("Sahi amount likhein");
      const { error } = await supabase.from("salary_payments").insert({
        employee_id: employee.id, month, amount_paid: Number(amount), paid_on: paidOn,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Is mahine ki salary pehle hi mark ho chuki hai.");
        throw error;
      }
    },
    onSuccess: () => { setPayFor(null); void invalidate.salaries(qc); },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Save nahi hua"),
  });

  const loading = employeesQ.isPending || salariesQ.isPending;
  if (loading) return <CenterSpinner />;
  if (employeesQ.error || salariesQ.error) return <ErrorState onRetry={() => { void employeesQ.refetch(); void salariesQ.refetch(); }} />;

  const employees = employeesQ.data ?? [];
  const salaries = salariesQ.data ?? [];
  const paidIds = new Set(salaries.map((s) => s.employee_id));
  const pending = employees.filter((e) => !paidIds.has(e.id)).length;

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle={`${pending} ki is mahine salary baqi hai`}
        action={<Button onClick={openForm}><Plus className="size-4" /> Add Employee</Button>}
      />
      <div className="mb-4"><MonthSelect value={month} onChange={setMonth} /></div>

      {employees.length === 0 ? (
        <EmptyState title="Koi employee nahi" hint="Trainer ya staff add karein." />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {employees.map((e) => {
            const paid = paidIds.has(e.id);
            return (
              <div key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                <Avatar employee={e} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.name}{e.role_title ? ` · ${e.role_title}` : ""}</p>
                  <p className="text-sm text-muted-foreground">{e.phone} · {formatPKR(e.monthly_salary)}/month</p>
                </div>
                {paid ? (
                  <Badge className="gap-1 bg-success/15 text-success"><CheckCircle2 className="size-3.5" /> Salary paid</Badge>
                ) : (
                  <>
                    <Badge variant="secondary" className="gap-1 text-destructive"><XCircle className="size-3.5" /> Not paid</Badge>
                    <Button size="sm" onClick={() => { setPayFor(e); setPayAmount(String(e.monthly_salary)); setPaidOn(todayISO()); setFormError(null); }}>
                      Mark salary paid
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Naya employee</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="e-name">Naam</Label><Input id="e-name" value={name} onChange={(ev) => setName(ev.target.value)} className="h-11" /></div>
            <div className="space-y-1.5"><Label htmlFor="e-phone">Phone (03XX-XXXXXXX)</Label><Input id="e-phone" inputMode="numeric" value={phone} onChange={(ev) => setPhone(ev.target.value)} placeholder="0332-1234567" className="h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="e-salary">Monthly salary (Rs)</Label><Input id="e-salary" inputMode="numeric" value={salary} onChange={(ev) => setSalary(ev.target.value)} placeholder="40000" className="h-11" /></div>
              <div className="space-y-1.5"><Label htmlFor="e-role">Role (optional)</Label><Input id="e-role" value={roleTitle} onChange={(ev) => setRoleTitle(ev.target.value)} placeholder="Trainer" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="e-address">Address (optional)</Label><Input id="e-address" value={address} onChange={(ev) => setAddress(ev.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="e-join">Join date</Label><Input id="e-join" type="date" value={joinDate} onChange={(ev) => setJoinDate(ev.target.value)} className="h-11" /></div>
            <div className="space-y-1.5"><Label htmlFor="e-photo">Photo (JPG/PNG/WebP)</Label><Input id="e-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(ev) => setPhoto(ev.target.files?.[0] ?? null)} className="file:mr-3" /></div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Add employee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payFor} onOpenChange={(o) => !o && setPayFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Salary jama karein — {payFor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="s-amount">Amount (Rs)</Label><Input id="s-amount" inputMode="numeric" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="h-11" /></div>
            <div className="space-y-1.5"><Label htmlFor="s-date">Date</Label><Input id="s-date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="h-11" /></div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayFor(null)}>Cancel</Button>
            <Button disabled={markPaid.isPending} onClick={() => payFor && markPaid.mutate(payFor)}>{markPaid.isPending ? "Saving…" : "Mark paid"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
