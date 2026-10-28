import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle, Undo2, XCircle } from "lucide-react";
import { useState } from "react";

import { MonthSelect } from "@/components/month-select";
import { CenterSpinner, EmptyState, ErrorState, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlans } from "@/hooks/use-plans";
import { supabase } from "@/integrations/supabase/client";
import { invalidate } from "@/lib/query";
import { useEverPaid } from "@/hooks/use-ever-paid";
import { expectedMonthlyFee, FEE_BADGE, feeInfo } from "@/lib/fees";
import { fetchAll } from "@/lib/fetch-all";
import { addMonths, addMonthsToDate, formatDate, formatPKR, monthKey, monthLabel, todayISO, whatsappLink } from "@/lib/format";
import { paymentSchema } from "@/lib/schemas";
import type { Member, MemberPayment } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/fees")({
  head: () => ({
    meta: [
      { title: "This Month's Fees — GymKhata" },
      { name: "description", content: "Kis member ne fees di, kis ne nahi — ek nazar mein." },
    ],
  }),
  component: FeesPage,
});

function FeesPage() {
  const qc = useQueryClient();
  const [month, setMonth] = useState(monthKey());
  const [filter, setFilter] = useState<"all" | "unpaid" | "overdue">("all");
  const [payFor, setPayFor] = useState<Member | null>(null);
  const [amount, setAmount] = useState("3000");
  const [paidOn, setPaidOn] = useState(todayISO());
  const [note, setNote] = useState("");
  const [renew, setRenew] = useState(false);
  const [renewPlanId, setRenewPlanId] = useState("");
  // Expired member ki renewal: payment agle mahine ki fees ke taur par save hoti hai (ek member, ek mahina, ek payment).
  const [payMonth, setPayMonth] = useState<string | null>(null);
  const plansQ = usePlans();
  const everQ = useEverPaid();
  const [formError, setFormError] = useState<string | null>(null);
  const [undoPayment, setUndoPayment] = useState<MemberPayment | null>(null);
  const [undoingFor, setUndoingFor] = useState<Member | null>(null);

  const membersQ = useQuery({
    queryKey: ["fees-members"],
    queryFn: async () => {
      return fetchAll<Member>((from, to) =>
        supabase
          .from("members")
          .select("id, name, phone, status, join_date, plan_id, membership_expires_on")
          .is("deleted_at", null)
          .eq("status", "active")
          .order("name")
          .order("id")
          .range(from, to),
      );
    },
  });
  const paymentsQ = useQuery({
    queryKey: ["fees-payments", month],
    queryFn: async () => {
      return fetchAll<MemberPayment>((from, to) =>
        supabase.from("member_payments").select("id, member_id, month, amount_paid, paid_on, note").is("voided_at", null).eq("month", month).order("id").range(from, to),
      );
    },
  });

  const activePlans = (plansQ.data ?? []).filter((p) => p.active);
  const renewPlan = activePlans.find((p) => p.id === renewPlanId);
  // Expiry abhi baqi hai to uske baad se barhao, warna payment date se.
  const renewBase = payFor?.membership_expires_on && payFor.membership_expires_on > paidOn ? payFor.membership_expires_on : paidOn;
  const newExpiry = renewPlan ? addMonthsToDate(renewBase, renewPlan.duration_months) : "";

  const pickRenewPlan = (id: string) => {
    setRenewPlanId(id);
    const plan = activePlans.find((p) => p.id === id);
    if (plan) setAmount(String(plan.price));
  };

  const markPaid = useMutation({
    mutationFn: async (member: Member) => {
      const parsed = paymentSchema.safeParse({ amount, paid_on: paidOn, note });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Form check karein");
      if (payMonth && !(renew && renewPlan)) throw new Error("Renew ke liye membership plan chunein (plan na ho to pehle Plans banayein).");
      const { error } = await supabase.from("member_payments").insert({
        member_id: member.id,
        month: payMonth ?? month,
        amount_paid: Number(parsed.data.amount),
        paid_on: parsed.data.paid_on,
        note: note || null,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Us mahine ki fees pehle hi mark ho chuki hai.");
        throw error;
      }
      if (renew && renewPlan) {
        const { error: renewError } = await supabase
          .from("members")
          .update({ plan_id: renewPlan.id, membership_expires_on: newExpiry })
          .eq("id", member.id);
        if (renewError) throw new Error("Payment save ho gayi, magar expiry update nahi hui. Members page se expiry edit karein.");
      }
    },
    onSuccess: () => {
      setPayFor(null);
      setPayMonth(null);
      setFormError(null);
      void invalidate.payments(qc);
      void invalidate.members(qc);
    },
    onError: (e) => {
      setFormError(e instanceof Error ? e.message : "Save nahi hua");
      void invalidate.payments(qc);
    },
  });

  const undo = useMutation({
    mutationFn: async (payment: MemberPayment) => {
      const { error } = await supabase.from("member_payments").update({ voided_at: new Date().toISOString(), void_reason: "Undo (Fees page)" }).eq("id", payment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setUndoPayment(null);
      setUndoingFor(null);
      void invalidate.payments(qc);
    },
    onError: () => setFormError("Undo nahi hua, dobara koshish karein"),
  });

  const loading = membersQ.isPending || paymentsQ.isPending || everQ.isPending;
  if (loading) return <CenterSpinner />;
  if (membersQ.error || paymentsQ.error) return <ErrorState onRetry={() => { void membersQ.refetch(); void paymentsQ.refetch(); }} />;

  const ever = everQ.data ?? new Set<string>();
  // Jo member is mahine se baad join hua, us mahine ki list mein nahi aata.
  const members = (membersQ.data ?? []).filter((m) => m.join_date.slice(0, 7) <= month.slice(0, 7));
  const payments = paymentsQ.data ?? [];
  const byMember = new Map(payments.map((p) => [p.member_id, p]));
  const infoOf = (m: Member) => feeInfo(m.join_date, month, byMember.has(m.id), todayISO(), m.membership_expires_on, ever.has(m.id));
  const unpaid = members.filter((m) => infoOf(m).status !== "paid");
  const overdue = members.filter((m) => infoOf(m).status === "overdue");
  const shown = filter === "overdue" ? overdue : filter === "unpaid" ? unpaid : members;

  return (
    <div>
      <PageHeader
        title="Is mahine ki fees"
        subtitle={`${unpaid.length} members ki fees baqi hai`}
        action={<MonthSelect value={month} onChange={setMonth} />}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          Sab members
        </Button>
        <Button variant={filter === "unpaid" ? "default" : "outline"} size="sm" onClick={() => setFilter("unpaid")}>
          Unpaid only ({unpaid.length})
        </Button>
        <Button variant={filter === "overdue" ? "destructive" : "outline"} size="sm" onClick={() => setFilter("overdue")}>
          Overdue ({overdue.length})
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState title={filter !== "all" ? "Sab ki fees aa gayi" : "Koi member nahi"} hint={filter !== "all" ? "Is mahine koi pending nahi." : "Pehle members page par member add karein."} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {shown.map((m) => {
            const payment = byMember.get(m.id);
            const fi = infoOf(m);
            return (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-accent/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.phone} · due {formatDate(fi.dueDate)}
                    {fi.status === "overdue" && <span className="font-semibold text-destructive"> · {fi.daysLate} din late</span>}
                  </p>
                </div>
                {payment && !fi.expired ? (
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 bg-success/15 text-success">
                      <CheckCircle2 className="size-3.5" /> {formatPKR(payment.amount_paid)}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => { setUndoPayment(payment); setUndoingFor(m); }}>
                      <Undo2 className="size-4" /> Undo
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`gap-1 ${FEE_BADGE[fi.status].className}`}>
                      {fi.covered ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />} {fi.covered ? "Covered" : fi.expired ? "Expired" : fi.status === "overdue" ? "Overdue" : fi.status === "new" ? "New · Unpaid" : "Due"}
                    </Badge>
                    <a
                      href={whatsappLink(m.phone, fi.expired ? `Assalam o alaikum ${m.name}! Aapki membership expire ho chuki hai. Please jald renew karwa lein. — GymKhata` : `Assalam o alaikum ${m.name}! Is mahine ki fees baqi hai. Please jald ada karein. — GymKhata`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <MessageCircle className="size-4" /> Reminder
                      </Button>
                    </a>
                    <Button size="sm" onClick={() => {
                      const own = (plansQ.data ?? []).find((p) => p.id === m.plan_id);
                      const planId = own?.active ? own.id : activePlans[0]?.id ?? "";
                      setPayFor(m); setAmount(String(expectedMonthlyFee(own))); setPaidOn(todayISO()); setNote(""); setFormError(null);
                      setRenewPlanId(planId);
                      if (fi.expired) {
                        setPayMonth(addMonths(month, 1));
                        setRenew(true);
                        const rp = activePlans.find((p) => p.id === planId);
                        if (rp) setAmount(String(rp.price));
                      } else {
                        setPayMonth(null);
                        setRenew(false);
                      }
                    }}>
                      {fi.expired ? "Renew" : "Mark paid"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mark paid dialog */}
      <Dialog open={!!payFor} onOpenChange={(o) => !o && setPayFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{payMonth ? "Membership renew" : "Fees jama karein"} — {payFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {payMonth && (
              <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                Membership expire ho chuki hai. Ye payment <b>{monthLabel(payMonth)}</b> ki fees ke taur par save hogi.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="fee-amount">Amount (Rs)</Label>
              <Input id="fee-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee-date">Date</Label>
              <Input id="fee-date" type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee-note">Note (optional)</Label>
              <Input id="fee-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {activePlans.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    disabled={!!payMonth}
                    checked={renew}
                    onCheckedChange={(v) => {
                      setRenew(v === true);
                      if (v === true) pickRenewPlan(renewPlanId || activePlans[0]!.id);
                    }}
                  />
                  Membership renew karein
                </label>
                {renew && (
                  <>
                    <Select value={renewPlanId} onValueChange={pickRenewPlan}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Plan chunein" /></SelectTrigger>
                      <SelectContent>
                        {activePlans.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} · {formatPKR(p.price)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newExpiry && <p className="text-xs text-muted-foreground">Nayi expiry: <b>{formatDate(newExpiry)}</b></p>}
                  </>
                )}
              </div>
            )}
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayFor(null)}>Cancel</Button>
            <Button disabled={markPaid.isPending} onClick={() => payFor && markPaid.mutate(payFor)}>
              {markPaid.isPending ? "Saving…" : "Mark paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo confirm */}
      <Dialog open={!!undoPayment} onOpenChange={(o) => !o && setUndoPayment(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment undo karein?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {undoingFor?.name} ki {formatPKR(undoPayment?.amount_paid)} ki entry hat jayegi. Ghalat entry thi to theek hai.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUndoPayment(null)}>Rok dein</Button>
            <Button variant="destructive" disabled={undo.isPending} onClick={() => undoPayment && undo.mutate(undoPayment)}>
              {undo.isPending ? "Removing…" : "Haan, undo karein"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
