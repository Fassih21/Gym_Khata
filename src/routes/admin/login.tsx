import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell, Btn, Field, inp } from "@/components/admin/ui";
import { api, ApiError } from "@/lib/admin-api";
import { supabase } from "@/lib/admin-supabase";

export const Route = createFileRoute("/admin/login")({ ssr: false, head: () => ({ meta: [{ title: "GymKhata Platform Admin" }, { name: "robots", content: "noindex,nofollow" }] }), component: Login });

type Step = { t: "creds" } | { t: "totp"; factorId: string } | { t: "enroll"; factorId: string; qr: string; secret: string };

function Login() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>({ t: "creds" });
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr("");
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Error"); } finally { setBusy(false); }
  };

  const finish = async () => {
    try { await api("me"); } catch (e) {
      await supabase.auth.signOut();
      setStep({ t: "creds" });
      throw new Error(e instanceof ApiError && e.status === 403 ? "Access denied" : "Server error");
    }
    await nav({ to: "/admin", replace: true });
  };

  const signIn = () => run(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) throw new Error("Invalid credentials");
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal2") return finish();
    const { data: f } = await supabase.auth.mfa.listFactors();
    const verified = f?.totp?.[0];
    if (verified) return setStep({ t: "totp", factorId: verified.id });
    for (const u of f?.all ?? []) if (u.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: u.id });
    const { data: en, error: ee } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `admin-${Date.now()}` });
    if (ee || !en) throw new Error("MFA enroll failed (Auth settings mein TOTP enable hai?)");
    setStep({ t: "enroll", factorId: en.id, qr: en.totp.qr_code, secret: en.totp.secret });
  });

  const verify = (factorId: string) => run(async () => {
    const { data: ch, error: ce } = await supabase.auth.mfa.challenge({ factorId });
    if (ce || !ch) throw new Error("Challenge failed");
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: ch.id, code: code.trim() });
    if (error) throw new Error("Wrong code");
    await finish();
  });

  return (
    <AdminShell>
    <main className="mx-auto mt-24 max-w-sm space-y-4 p-4">
      <h1 className="text-lg font-semibold">GymKhata Platform Admin</h1>
      {step.t === "creds" && (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void signIn(); }}>
          <Field label="Email"><input className={inp} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Password"><input className={inp} type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field>
          <Btn tone="primary" disabled={busy} className="w-full">Sign in</Btn>
        </form>
      )}
      {step.t !== "creds" && (
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void verify(step.factorId); }}>
          {step.t === "enroll" && (
            <div className="space-y-2 text-xs text-zinc-400">
              <p>Authenticator app se QR scan karein, phir 6-digit code dalein.</p>
              <img src={step.qr} alt="TOTP QR" className="size-40 rounded bg-white p-1" />
              <p className="break-all">Secret: {step.secret}</p>
            </div>
          )}
          <Field label="6-digit code"><input className={inp} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required /></Field>
          <Btn tone="primary" disabled={busy} className="w-full">Verify</Btn>
        </form>
      )}
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
    </main>
    </AdminShell>
  );
}
