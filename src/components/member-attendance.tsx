import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CenterSpinner, EmptyState, ErrorState, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initials } from "@/hooks/use-photo";
import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetch-all";
import { expiryInfo } from "@/lib/fees";
import { formatDate, monthLabel, todayISO } from "@/lib/format";
import type { Member } from "@/lib/db-types";

type Row = Pick<Member, "id" | "name" | "phone" | "membership_expires_on">;
type Summary = { member_id: string; visits: number; last_visit: string };

const TOGGLE_KEY = ["member-attendance-toggle"];
const PAGE_STEP = 50;

export function MemberAttendance() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(PAGE_STEP);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  const month = `${date.slice(0, 7)}-01`;

  const membersQ = useQuery({
    queryKey: ["attendance-members"],
    staleTime: 5 * 60_000,
    queryFn: () =>
      fetchAll<Row>((from, to) =>
        supabase
          .from("members")
          .select("id, name, phone, membership_expires_on")
          .is("deleted_at", null)
          .eq("status", "active")
          .order("name")
          .order("id")
          .range(from, to),
      ),
  });

  const dayQ = useQuery({
    queryKey: ["member-attendance", date],
    staleTime: 30_000,
    enabled: !!date,
    queryFn: () =>
      fetchAll<{ member_id: string }>((from, to) =>
        supabase.from("member_attendance").select("member_id").eq("date", date).order("member_id").range(from, to),
      ).then((r) => r.map((x) => x.member_id)),
  });

  const summaryQ = useQuery({
    queryKey: ["member-attendance-summary", month],
    staleTime: 60_000,
    enabled: !!date,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("member_attendance_summary", { p_month: month });
      if (error) throw error;
      return new Map((data as Summary[]).map((s) => [s.member_id, s]));
    },
  });

  const toggle = useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: async ({ memberId, present, date }: { memberId: string; present: boolean; date: string }) => {
      if (present) {
        const { error } = await supabase.from("member_attendance").delete().eq("member_id", memberId).eq("date", date);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("member_attendance")
          .upsert({ member_id: memberId, date }, { onConflict: "member_id,date", ignoreDuplicates: true });
        if (error) throw error;
      }
    },
    onMutate: async ({ memberId, present, date }) => {
      setSaveError(null);
      setPending((p) => new Set(p).add(memberId));
      await qc.cancelQueries({ queryKey: ["member-attendance", date] });
      const prev = qc.getQueryData<string[]>(["member-attendance", date]) ?? [];
      qc.setQueryData<string[]>(["member-attendance", date], present ? prev.filter((id) => id !== memberId) : [...prev, memberId]);
      return { prev };
    },
    onError: (_e, { date }, ctx) => {
      if (ctx) qc.setQueryData(["member-attendance", date], ctx.prev);
      setSaveError("Hazri save nahi hui, dobara koshish karein");
    },
    onSettled: (_d, _e, { memberId, date }) => {
      setPending((p) => {
        const n = new Set(p);
        n.delete(memberId);
        return n;
      });
      if (qc.isMutating({ mutationKey: TOGGLE_KEY }) === 1) {
        void qc.invalidateQueries({ queryKey: ["member-attendance", date] });
        void qc.invalidateQueries({ queryKey: ["member-attendance-summary", `${date.slice(0, 7)}-01`] });
      }
    },
  });

  const members = membersQ.data;
  const presentIds = useMemo(() => new Set(dayQ.data ?? []), [dayQ.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = members ?? [];
    const digits = q.replace(/\D/g, "");
    return q ? all.filter((m) => m.name.toLowerCase().includes(q) || (digits !== "" && m.phone.replace(/\D/g, "").includes(digits))) : all;
  }, [members, search]);

  if (membersQ.isPending || dayQ.isPending) return <CenterSpinner />;
  if (membersQ.error || dayQ.error)
    return <ErrorState onRetry={() => { void membersQ.refetch(); void dayQ.refetch(); }} />;

  const shown = filtered.slice(0, limit);
  const total = members?.length ?? 0;
  const presentCount = (members ?? []).filter((m) => presentIds.has(m.id)).length;
  const summary = summaryQ.data;

  return (
    <div>
      <PageHeader title="Member Attendance" subtitle={`${monthLabel(month)} · ${presentCount} / ${total} hazir`} />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <label htmlFor="mem-att-date" className="mb-1.5 block text-sm font-medium">Tareekh</label>
          <Input
            id="mem-att-date"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => { if (e.target.value) { setDate(e.target.value); setSaveError(null); } }}
            className="h-11"
          />
        </div>
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setLimit(PAGE_STEP); }}
            placeholder="Naam ya phone search karein"
            className="h-11 pl-9"
          />
        </div>
      </div>

      {saveError && <p role="alert" className="mb-3 text-sm text-destructive">{saveError}</p>}

      {shown.length === 0 ? (
        <EmptyState title="Koi member nahi mila" hint={search ? "Search clear kar ke dekhein." : "Pehle members page par member add karein."} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {shown.map((m) => {
            const present = presentIds.has(m.id);
            const ex = expiryInfo(m.membership_expires_on);
            const s = summary?.get(m.id);
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground">
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.phone}
                    {s && ` · ${s.visits} din (aakhri ${formatDate(s.last_visit)})`}
                  </p>
                </div>
                {ex?.expired && <Badge variant="secondary" className="bg-destructive/15 text-destructive">Expired</Badge>}
                <Button
                  size="sm"
                  variant={present ? "default" : "outline"}
                  className="min-w-24 font-semibold"
                  disabled={pending.has(m.id)}
                  aria-pressed={present}
                  onClick={() => toggle.mutate({ memberId: m.id, present, date })}
                >
                  {present ? <><Check className="mr-1 size-4" />Hazir</> : "Check-in"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > limit && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE_STEP)}>
            Aur dikhayen ({filtered.length - limit})
          </Button>
        </div>
      )}
    </div>
  );
}
