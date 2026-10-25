import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlans } from "@/hooks/use-plans";
import { supabase } from "@/integrations/supabase/client";
import type { MembershipPlan } from "@/lib/db-types";
import { formatPKR } from "@/lib/format";
import { invalidate } from "@/lib/query";

export function PlansManager() {
  const qc = useQueryClient();
  const plansQ = usePlans();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [name, setName] = useState("");
  const [months, setMonths] = useState("1");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const openForm = (p?: MembershipPlan) => {
    setEditing(p ?? null);
    setName(p?.name ?? "");
    setMonths(String(p?.duration_months ?? 1));
    setPrice(p ? String(p.price) : "");
    setError(null);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      const d = Number(months);
      const pr = Number(price.replace(/,/g, ""));
      if (!n || n.length > 60) throw new Error("Plan ka naam likhein (max 60 harf)");
      if (!Number.isInteger(d) || d < 1 || d > 120) throw new Error("Muddat 1 se 120 mahine ke beech ho");
      if (!Number.isFinite(pr) || pr < 0 || pr > 99_999_999) throw new Error("Sahi price likhein");
      const payload = { name: n, duration_months: d, price: pr };
      const { error: e } = editing
        ? await supabase.from("membership_plans").update(payload).eq("id", editing.id)
        : await supabase.from("membership_plans").insert(payload);
      if (e) throw e.code === "23505" ? new Error("Is naam ka plan pehle se maujood hai") : e;
    },
    onSuccess: () => {
      setOpen(false);
      void invalidate.plans(qc);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Save nahi hua"),
  });

  const toggle = useMutation({
    mutationFn: async (p: MembershipPlan) => {
      const { error: e } = await supabase.from("membership_plans").update({ active: !p.active }).eq("id", p.id);
      if (e) throw e;
    },
    onSuccess: () => void invalidate.plans(qc),
  });

  const plans = plansQ.data ?? [];

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Membership plans</h2>
        <Button size="sm" onClick={() => openForm()}><Plus className="size-4" /> Naya plan</Button>
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {plansQ.isPending ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">Abhi koi plan nahi. "Naya plan" se Monthly / Quarterly / Yearly add karein.</p>
        ) : (
          plans.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.duration_months} mahine · {formatPKR(p.price)}</p>
              </div>
              {!p.active && <Badge variant="outline" className="text-muted-foreground">Band</Badge>}
              <Switch checked={p.active} disabled={toggle.isPending} onCheckedChange={() => toggle.mutate(p)} aria-label="Plan active" />
              <Button variant="ghost" size="icon" aria-label="Edit plan" onClick={() => openForm(p)}><Pencil className="size-4" /></Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Plan edit karein" : "Naya plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pl-name">Naam</Label>
              <Input id="pl-name" list="plan-names" value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly" className="h-11" />
              <datalist id="plan-names"><option value="Monthly" /><option value="Quarterly" /><option value="Yearly" /></datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-months">Muddat (mahine)</Label>
              <Input id="pl-months" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-price">Price (Rs)</Label>
              <Input id="pl-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="3000" className="h-11" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
