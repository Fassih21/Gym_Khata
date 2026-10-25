import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { CenterSpinner, EmptyState, ErrorState, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGym } from "@/hooks/use-gym";
import { usePlans } from "@/hooks/use-plans";
import { initials, seedPhotoUrls, useSignedUrl } from "@/hooks/use-photo";
import { supabase } from "@/integrations/supabase/client";
import { invalidate } from "@/lib/query";
import { expiryInfo, FEE_BADGE, feeInfo } from "@/lib/fees";
import { fetchAll } from "@/lib/fetch-all";
import { addMonthsToDate, formatDate, monthKey, todayISO } from "@/lib/format";
import { uploadPhoto } from "@/lib/photo";
import { memberSchema } from "@/lib/schemas";
import type { Member, MemberPayment } from "@/lib/db-types";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [
      { title: "Members — GymKhata" },
      { name: "description", content: "Apne gym ke members ka poora record." },
    ],
  }),
  component: MembersPage,
});

const PAGE_SIZE = 20;

function Avatar({ member }: { member: Member }) {
  const { data: url } = useSignedUrl(member.photo_path);
  return url ? (
    <img src={url} alt={member.name} className="size-10 rounded-lg object-cover" />
  ) : (
    <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
      {initials(member.name)}
    </span>
  );
}

function MembersPage() {
  const qc = useQueryClient();
  const { gym } = useGym();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [feeThisMonth, setFeeThisMonth] = useState("");
  const [deleting, setDeleting] = useState<Member | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [joinDate, setJoinDate] = useState(todayISO());
  const [photo, setPhoto] = useState<File | null>(null);
  const [planId, setPlanId] = useState("none");
  const [expiresOn, setExpiresOn] = useState("");
  const plansQ = usePlans();

  const membersQ = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const data = await fetchAll<Member>((from, to) =>
        supabase
          .from("members")
          .select("id, name, phone, address, photo_path, join_date, status, notes, plan_id, membership_expires_on")
          .is("deleted_at", null)
          .order("name")
          .order("id")
          .range(from, to),
      );
      await seedPhotoUrls(qc, data.slice(0, 100).map((m) => m.photo_path));
      return data as Member[];
    },
  });

  const month = monthKey();
  const paidQ = useQuery({
    queryKey: ["fees-payments", month],
    queryFn: async () => {
      return fetchAll<MemberPayment>((from, to) =>
        supabase.from("member_payments").select("id, member_id, month, amount_paid, paid_on, note").eq("month", month).order("id").range(from, to),
      );
    },
  });
  const paidIds = new Set((paidQ.data ?? []).map((p) => p.member_id));

  const openForm = (member?: Member) => {
    setEditing(member ?? null);
    setName(member?.name ?? "");
    setPhone(member?.phone ?? "");
    setAddress(member?.address ?? "");
    setJoinDate(member?.join_date ?? todayISO());
    setFeeThisMonth("");
    setPlanId(member?.plan_id ?? "none");
    setExpiresOn(member?.membership_expires_on ?? "");
    setPhoto(null);
    setFormError(null);
    setFormOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const parsed = memberSchema.safeParse({
        name, phone, address, join_date: joinDate,
        status: editing?.status ?? "active",
        notes: editing?.notes ?? "",
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Form check karein");
      if (expiresOn && expiresOn < parsed.data.join_date) throw new Error("Expiry date join date se pehle nahi ho sakti");
      let photoPath: string | null = null;
      if (photo) {
        if (!gym) throw new Error("Gym load nahi hua");
        photoPath = await uploadPhoto(photo, gym.id, "members");
      }
      const payload = {
        name: parsed.data.name,
        phone: parsed.data.phone,
        address: parsed.data.address || null,
        join_date: parsed.data.join_date,
        plan_id: planId === "none" ? null : planId,
        membership_expires_on: expiresOn || null,
        ...(photoPath ? { photo_path: photoPath } : {}),
      };
      if (editing) {
        const { error } = await supabase.from("members").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("members").insert(payload).select("id").single();
        if (error) throw error;
        if (feeThisMonth) {
          const { error: payError } = await supabase.from("member_payments").insert({
            member_id: data.id,
            month: monthKey(),
            amount_paid: Number(feeThisMonth.replace(/,/g, "")),
          });
          if (payError) throw payError;
        }
      }
    },
    onSuccess: () => {
      setFormOpen(false);
      setFormError(null);
      void invalidate.members(qc);
      void invalidate.payments(qc);
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : "Save nahi hua"),
  });

  const deactivate = useMutation({
    mutationFn: async (member: Member) => {
      const { error } = await supabase.from("members").update({ deleted_at: new Date().toISOString() }).eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDeleting(null);
      void invalidate.members(qc);
    },
  });

  const onPlanChange = (id: string) => {
    setPlanId(id);
    const plan = plansQ.data?.find((p) => p.id === id);
    if (plan) setExpiresOn(addMonthsToDate(editing ? todayISO() : joinDate, plan.duration_months));
  };
  const planOptions = (plansQ.data ?? []).filter((p) => p.active || p.id === editing?.plan_id);

  if (membersQ.isPending) return <CenterSpinner />;
  if (membersQ.error) return <ErrorState onRetry={() => void membersQ.refetch()} />;

  const all = membersQ.data ?? [];
  const filtered = all.filter((m) =>
    (showInactive ? true : m.status === "active") &&
    (search === "" || `${m.name} ${m.phone}`.toLowerCase().includes(search.toLowerCase())),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const shown = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle={`${all.filter((m) => m.status === "active").length} active members`}
        action={<Button onClick={() => openForm()}><Plus className="size-4" /> Add Member</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Naam ya phone search karein" className="pl-9" />
        </div>
        <Button variant={showInactive ? "default" : "outline"} size="sm" onClick={() => { setShowInactive((v) => !v); setPage(0); }}>
          Inactive bhi dikhayen
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Koi member nahi mila" hint={search ? "Search clear kar ke dekhein." : "Add Member se pehla member jama karein."} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {shown.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
              <Avatar member={m} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{m.name}</p>
                <p className="text-sm text-muted-foreground">
                  {m.phone} · joined {formatDate(m.join_date)}
                  {m.membership_expires_on && (() => {
                    const ex = expiryInfo(m.membership_expires_on);
                    return (
                      <span className={ex?.expired ? "font-semibold text-destructive" : ex?.soon ? "font-semibold text-amber-600" : ""}>
                        {" "}· {ex?.expired ? "expired" : "expires"} {formatDate(m.membership_expires_on)}
                      </span>
                    );
                  })()}
                </p>
              </div>
              {m.status === "active" && !paidQ.isPending && (() => {
                const fi = feeInfo(m.join_date, month, paidIds.has(m.id), todayISO(), m.membership_expires_on);
                const b = FEE_BADGE[fi.status];
                return (
                  <Badge variant="secondary" className={b.className}>
                    {fi.covered ? "Covered" : b.label}{fi.status === "overdue" ? ` · ${fi.daysLate}d` : ""}
                  </Badge>
                );
              })()}
              <Badge variant={m.status === "active" ? "secondary" : "outline"} className={m.status === "active" ? "bg-success/15 text-success" : "text-muted-foreground"}>
                {m.status === "active" ? "Active" : "Inactive"}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openForm(m)}><Pencil className="size-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Deactivate" onClick={() => setDeleting(m)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((p) => p - 1)} aria-label="Pichla page"><ChevronLeft className="size-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page + 1} / {pages}</span>
          <Button variant="outline" size="icon" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} aria-label="Agla page"><ChevronRight className="size-4" /></Button>
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Member edit karein" : "Naya member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-name">Naam</Label>
              <Input ref={nameRef} id="m-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-phone">Phone (03XX-XXXXXXX)</Label>
              <Input id="m-phone" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0332-1234567" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-address">Address (optional)</Label>
              <Input id="m-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-join">Join date</Label>
              <Input id="m-join" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select value={planId} onValueChange={onPlanChange}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Plan chunein" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Koi plan nahi</SelectItem>
                    {planOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · Rs {p.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-expiry">Expiry date</Label>
                <Input id="m-expiry" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} className="h-11" />
              </div>
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <Label htmlFor="m-fee">Is mahine ki fees (optional, Rs)</Label>
                <Input id="m-fee" inputMode="numeric" value={feeThisMonth} onChange={(e) => setFeeThisMonth(e.target.value)} placeholder="3000" className="h-11" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="m-photo">Photo (JPG/PNG/WebP)</Label>
              <Input id="m-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="file:mr-3" />
            </div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : editing ? "Save" : "Add member"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{deleting?.name} ko deactivate karein?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Member list se hat jayega, magar purana record mehfooz rahega. Inactive members ki fees ki zarurat nahi paregi.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Rok dein</Button>
            <Button variant="destructive" disabled={deactivate.isPending} onClick={() => deleting && deactivate.mutate(deleting)}>
              {deactivate.isPending ? "Working…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
