import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { MonthSelect } from "@/components/month-select";
import { CenterSpinner, EmptyState, ErrorState, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { invalidate } from "@/lib/query";
import { addMonths, formatDate, formatPKR, monthKey, toNumber, todayISO } from "@/lib/format";
import { EXPENSE_CATEGORIES, expenseSchema } from "@/lib/schemas";
import type { Expense } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — GymKhata" },
      { name: "description", content: "Gym ke kharche — kiraya, bijli, equipment aur baqi sab." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(monthKey());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  const expensesQ = useQuery({
    queryKey: ["expenses", month],
    queryFn: async () => {
      return fetchAll<Expense>((from, to) =>
        supabase
          .from("expenses")
          .select("id, title, category, amount, expense_date, note")
          .gte("expense_date", month)
          .lt("expense_date", addMonths(month, 1))
          .order("expense_date", { ascending: false })
          .order("id")
          .range(from, to),
      );
    },
  });

  const openForm = (expense?: Expense) => {
    setEditing(expense ?? null);
    setTitle(expense?.title ?? "");
    setCategory(expense?.category ?? "Other");
    setAmount(expense ? String(expense.amount) : "");
    setDate(expense?.expense_date ?? todayISO());
    setNote(expense?.note ?? "");
    setFormError(null);
    setFormOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = expenseSchema.safeParse({ title, category, amount, expense_date: date, note });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Form check karein");
      const payload = {
        title: parsed.data.title, category: parsed.data.category,
        amount: Number(parsed.data.amount), expense_date: parsed.data.expense_date,
        note: parsed.data.note || null,
      };
      const { error } = editing
        ? await supabase.from("expenses").update(payload).eq("id", editing.id)
        : await supabase.from("expenses").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { setFormOpen(false); void invalidate.expenses(qc); },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Save nahi hua"),
  });

  const remove = useMutation({
    mutationFn: async (expense: Expense) => {
      const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => { setDeleting(null); void invalidate.expenses(qc); },
  });

  if (expensesQ.isPending) return <CenterSpinner />;
  if (expensesQ.error) return <ErrorState onRetry={() => void expensesQ.refetch()} />;

  const expenses = expensesQ.data ?? [];
  const total = expenses.reduce((s, e) => s + toNumber(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`Is mahine ka total: ${formatPKR(total)}`}
        action={<Button onClick={() => openForm()}><Plus className="size-4" /> Add Expense</Button>}
      />
      <div className="mb-4"><MonthSelect value={month} onChange={setMonth} /></div>

      {expenses.length === 0 ? (
        <EmptyState title="Is mahine koi kharcha nahi" hint="Add Expense se kharcha darj karein." />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.title} <span className="text-xs font-medium text-muted-foreground">· {e.category}</span></p>
                <p className="text-sm text-muted-foreground">{formatDate(e.expense_date)}{e.note ? ` · ${e.note}` : ""}</p>
              </div>
              <p className="font-bold">{formatPKR(e.amount)}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openForm(e)}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleting(e)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Kharcha edit karein" : "Naya kharcha"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="x-title">Kharcha</Label><Input id="x-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bijli ka bill" className="h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="x-amount">Amount (Rs)</Label><Input id="x-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="x-date">Date</Label><Input id="x-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" /></div>
            <div className="space-y-1.5"><Label htmlFor="x-note">Note (optional)</Label><Input id="x-note" value={note} onChange={(e) => setNote(e.target.value)} /></div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Kharcha delete karein?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">"{deleting?.title}" ({formatPKR(deleting?.amount)}) hamesha ke liye hat jayega.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Rok dein</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting)}>{remove.isPending ? "Deleting…" : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
