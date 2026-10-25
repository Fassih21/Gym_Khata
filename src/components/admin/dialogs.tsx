import { useState } from "react";
import { api, apiDownload, genPassword } from "@/lib/admin-api";
import { Btn, Field, Modal, inp } from "./ui";

export type Gym = {
  id: string; name: string; status: "active" | "suspended"; plan: string; subscription_ends_on: string; days_left: number;
  members_count: number; created_at: string; last_sign_in_at: string | null; owner_email: string | null;
};
export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
export const todayISO = () => new Date().toISOString().slice(0, 10);

function useRun() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr("");
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Error"); } finally { setBusy(false); }
  };
  return { busy, err, run };
}
const Err = ({ m }: { m: string }) => (m ? <p role="alert" className="text-sm text-red-400">{m}</p> : null);

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Password (12+, upper/lower/digit/symbol)">
      <div className="flex gap-2">
        <input className={inp} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="off" required />
        <Btn type="button" onClick={() => onChange(genPassword())}>Generate</Btn>
      </div>
    </Field>
  );
}
const Creds = ({ email, pw }: { email: string; pw: string }) => (
  <div className="space-y-2 rounded border border-emerald-700 p-3 text-sm">
    <p>Done. Ye password sirf abhi dikh raha hai — owner ko bhej dein.</p>
    <p className="break-all font-mono">{email}<br />{pw}</p>
    <Btn onClick={() => navigator.clipboard.writeText(`${email}\n${pw}`)}>Copy</Btn>
  </div>
);

export function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { busy, err, run } = useRun();
  const [f, setF] = useState({ name: "", owner_email: "", password: "", plan: "standard", subscription_ends_on: addDays(todayISO(), 30) });
  const [ok, setOk] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal title="Create gym" onClose={() => { if (ok) onDone(); onClose(); }}>
      {ok ? <Creds email={f.owner_email} pw={f.password} /> : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void run(async () => { await api("create-gym", f); setOk(true); }); }}>
          <Field label="Gym name"><input className={inp} value={f.name} onChange={set("name")} required maxLength={120} /></Field>
          <Field label="Owner email"><input className={inp} type="email" value={f.owner_email} onChange={set("owner_email")} required /></Field>
          <PasswordField value={f.password} onChange={(v) => setF({ ...f, password: v })} />
          <Field label="Plan"><input className={inp} list="plans" value={f.plan} onChange={set("plan")} required maxLength={40} /></Field>
          <datalist id="plans"><option value="basic" /><option value="standard" /><option value="pro" /></datalist>
          <Field label="Subscription ends on"><input className={inp} type="date" value={f.subscription_ends_on} min={todayISO()} onChange={set("subscription_ends_on")} required /></Field>
          <Err m={err} /><Btn tone="primary" disabled={busy} className="w-full">Create</Btn>
        </form>
      )}
    </Modal>
  );
}

export function ExtendDialog({ gym, onClose, onDone }: { gym: Gym; onClose: () => void; onDone: () => void }) {
  const { busy, err, run } = useRun();
  const [f, setF] = useState({ new_ends_on: addDays(gym.subscription_ends_on > todayISO() ? gym.subscription_ends_on : todayISO(), 30), amount: "", method: "Cash", note: "" });
  return (
    <Modal title={`Extend — ${gym.name}`} onClose={onClose}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void run(async () => {
        await api("extend", { gym_id: gym.id, new_ends_on: f.new_ends_on, amount: Number(f.amount), method: f.method, note: f.note || undefined });
        onDone(); onClose();
      }); }}>
        <p className="text-xs text-zinc-400">Current end: {gym.subscription_ends_on}</p>
        <Field label="New end date"><input className={inp} type="date" min={todayISO()} value={f.new_ends_on} onChange={(e) => setF({ ...f, new_ends_on: e.target.value })} required /></Field>
        <Field label="Amount (Rs)"><input className={inp} type="number" min={0} step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required /></Field>
        <Field label="Method">
          <select className={inp} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {["Cash", "Bank transfer", "Easypaisa", "JazzCash", "Other"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Payment note"><input className={inp} maxLength={500} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
        <Err m={err} /><Btn tone="primary" disabled={busy} className="w-full">Save</Btn>
      </form>
    </Modal>
  );
}

export function ResetDialog({ gym, onClose }: { gym: Gym; onClose: () => void }) {
  const { busy, err, run } = useRun();
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  return (
    <Modal title={`Reset owner password — ${gym.name}`} onClose={onClose}>
      {ok ? <Creds email={gym.owner_email ?? "owner"} pw={pw} /> : (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void run(async () => { await api("reset-password", { gym_id: gym.id, password: pw }); setOk(true); }); }}>
          <PasswordField value={pw} onChange={setPw} />
          <Err m={err} /><Btn tone="primary" disabled={busy} className="w-full">Reset</Btn>
        </form>
      )}
    </Modal>
  );
}

export function DeleteDialog({ gym, onClose, onDone }: { gym: Gym; onClose: () => void; onDone: () => void }) {
  const { busy, err, run } = useRun();
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const suspended = gym.status === "suspended";
  return (
    <Modal title={`Delete gym — ${gym.name}`} onClose={onClose}>
      <div className="space-y-3 text-sm">
        <p className="text-red-300">Permanent: saari rows, photos aur owner/staff logins hat jayenge.</p>
        {!suspended && <p className="text-amber-300">Pehle gym suspend karein.</p>}
        <Btn disabled={busy || !suspended} onClick={() => void run(async () => { await apiDownload("export-gym", { gym_id: gym.id }); setMsg("Export download ho gaya."); })}>
          1) Export data ZIP (optional)
        </Btn>
        {msg && <p className="text-emerald-400">{msg}</p>}
        <Field label={`2) Type gym name to confirm: ${gym.name}`}><input className={inp} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></Field>
        <Err m={err} />
        <Btn tone="danger" className="w-full" disabled={busy || !suspended || name !== gym.name}
          onClick={() => void run(async () => { await api("delete-gym", { gym_id: gym.id, confirm_name: name }); onDone(); onClose(); })}>
          Delete permanently
        </Btn>
      </div>
    </Modal>
  );
}
