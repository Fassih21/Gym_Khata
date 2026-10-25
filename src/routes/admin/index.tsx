import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CreateDialog, DeleteDialog, ExtendDialog, ResetDialog, type Gym } from "@/components/admin/dialogs";
import { AdminShell, Btn, inp } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/admin-api";
import { supabase } from "@/lib/admin-supabase";

export const Route = createFileRoute("/admin/")({ ssr: false, head: () => ({ meta: [{ title: "GymKhata Platform Admin" }, { name: "robots", content: "noindex,nofollow" }] }), component: Gyms });

type Dlg = { t: "create" } | { t: "extend" | "reset" | "delete"; g: Gym } | null;
const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "—");

function Gyms() {
  const nav = useNavigate();
  const [gyms, setGyms] = useState<Gym[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended" | "expiring">("all");
  const [dlg, setDlg] = useState<Dlg>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      setGyms((await api<{ gyms: Gym[] }>("list-gyms")).gyms);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.message === "mfa_required")) {
        await supabase.auth.signOut();
        void nav({ to: "/admin/login", replace: true });
      } else setErr(e instanceof Error ? e.message : "Error");
    }
  }, [nav]);
  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => (gyms ?? []).filter((g) => {
    const s = q.trim().toLowerCase();
    if (s && !g.name.toLowerCase().includes(s) && !(g.owner_email ?? "").toLowerCase().includes(s)) return false;
    if (filter === "active") return g.status === "active";
    if (filter === "suspended") return g.status === "suspended";
    if (filter === "expiring") return g.status === "active" && g.days_left >= 0 && g.days_left <= 7;
    return true;
  }), [gyms, q, filter]);

  const toggle = async (g: Gym) => {
    const to = g.status === "active" ? "suspended" : "active";
    if (!confirm(`${to === "suspended" ? "Suspend" : "Resume"} "${g.name}"?`)) return;
    try { await api("set-status", { gym_id: g.id, status: to }); await load(); } catch (e) { setErr(e instanceof Error ? e.message : "Error"); }
  };

  return (
    <AdminShell>
    <main className="mx-auto max-w-7xl space-y-4 p-4">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Gyms {gyms && <span className="text-sm text-zinc-400">({rows.length}/{gyms.length})</span>}</h1>
        <input className={`${inp} !w-56`} placeholder="Search name / owner email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inp} !w-40`} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="expiring">Expiring ≤ 7 days</option>
        </select>
        <Btn tone="primary" onClick={() => setDlg({ t: "create" })}>+ Create gym</Btn>
        <Btn onClick={async () => { await supabase.auth.signOut(); void nav({ to: "/admin/login" }); }}>Sign out</Btn>
      </header>
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-xs text-zinc-400">
            <tr>{["Gym", "Status", "Plan", "Ends on", "Days left", "Members", "Created", "Last sign-in", "Actions"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {gyms === null && <tr><td colSpan={9} className="p-4 text-zinc-400">Loading…</td></tr>}
            {rows.map((g) => (
              <tr key={g.id} className="border-t border-zinc-800">
                <td className="px-3 py-2"><div className="font-medium">{g.name}</div><div className="text-xs text-zinc-500">{g.owner_email ?? ""}</div></td>
                <td className="px-3 py-2"><span className={g.status === "active" ? "text-emerald-400" : "text-red-400"}>{g.status}</span></td>
                <td className="px-3 py-2">{g.plan}</td>
                <td className="px-3 py-2">{g.subscription_ends_on}</td>
                <td className={`px-3 py-2 ${g.days_left < 0 ? "text-red-400" : g.days_left <= 7 ? "text-amber-400" : ""}`}>{g.days_left}</td>
                <td className="px-3 py-2">{g.members_count}</td>
                <td className="px-3 py-2">{fmt(g.created_at)}</td>
                <td className="px-3 py-2">{fmt(g.last_sign_in_at)}</td>
                <td className="flex flex-wrap gap-1 px-3 py-2">
                  <Btn onClick={() => setDlg({ t: "extend", g })}>Extend</Btn>
                  <Btn onClick={() => void toggle(g)}>{g.status === "active" ? "Suspend" : "Resume"}</Btn>
                  <Btn onClick={() => setDlg({ t: "reset", g })}>Reset pw</Btn>
                  <Btn tone="danger" onClick={() => setDlg({ t: "delete", g })}>Delete</Btn>
                </td>
              </tr>
            ))}
            {gyms && rows.length === 0 && <tr><td colSpan={9} className="p-4 text-zinc-400">Koi gym nahi mila.</td></tr>}
          </tbody>
        </table>
      </div>
      {dlg?.t === "create" && <CreateDialog onClose={() => setDlg(null)} onDone={() => void load()} />}
      {dlg?.t === "extend" && <ExtendDialog gym={dlg.g} onClose={() => setDlg(null)} onDone={() => void load()} />}
      {dlg?.t === "reset" && <ResetDialog gym={dlg.g} onClose={() => setDlg(null)} />}
      {dlg?.t === "delete" && <DeleteDialog gym={dlg.g} onClose={() => setDlg(null)} onDone={() => void load()} />}
    </main>
    </AdminShell>
  );
}
