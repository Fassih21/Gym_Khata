import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export function ChangePassword() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (!cur) return setMsg({ ok: false, text: "Purana password likhein." });
    if (pw.length < 8) return setMsg({ ok: false, text: "Password kam az kam 8 haroof ka ho." });
    if (pw !== pw2) return setMsg({ ok: false, text: "Dono password ek jaise nahi hain." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur });
    setBusy(false);
    if (error) {
      const code = (error as { code?: string }).code ?? "";
      const reasons: Record<string, string> = {
        invalid_current_password: "Purana password galat hai.",
        same_password: "Naya password purane password jaisa nahi ho sakta.",
        weak_password: "Password kamzor hai. Zyada lamba karein aur haroof, number aur symbol milayein (aam ya leak hua password nahi chalta).",
        reauthentication_needed: "Security ke liye logout karke dobara login karein, phir password badlein.",
        session_not_found: "Session khatam ho gaya. Logout karke dobara login karein.",
        session_expired: "Session khatam ho gaya. Logout karke dobara login karein.",
      };
      return setMsg({ ok: false, text: reasons[code] ?? `Password nahi badla: ${error.message}` });
    }
    setCur("");
    setPw("");
    setPw2("");
    setMsg({ ok: true, text: "Password badal gaya." });
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Password badlein</h2>
      <div className="mt-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pw0">Purana password</Label>
          <Input id="pw0" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw1">Naya password</Label>
          <Input id="pw1" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw2">Dobara likhein</Label>
          <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="h-11" />
        </div>
        {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-destructive"}`}>{msg.text}</p>}
        <Button disabled={busy} onClick={() => void submit()}>{busy ? "Saving…" : "Password badlein"}</Button>
      </div>
    </section>
  );
}