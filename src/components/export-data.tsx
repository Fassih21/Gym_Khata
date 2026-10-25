import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useGym } from "@/hooks/use-gym";
import { buildBackup, saveBlob } from "@/lib/export";

export function ExportData() {
  const { gym } = useGym();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!gym || busy) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await buildBackup(gym.id, gym.name, (l) => setMsg(`${l}…`));
      saveBlob(res.blob, res.filename);
      setMsg(`Download ho gaya: ${res.counts.map((c) => `${c.file.replace(".csv", "")} (${c.rows})`).join(", ")}`);
    } catch (e) {
      setMsg(null);
      setError(e instanceof Error ? e.message : "Export nahi hua, dobara koshish karein");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold">Data backup</h2>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Members, payments, expenses, employees, salaries, attendance aur plans — sab CSV files ek ZIP mein (Excel mein seedha khulti hain). Photos shamil nahi, sirf unka path.
        </p>
        <Button className="mt-3" variant="outline" disabled={!gym || busy} onClick={() => void run()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export all data
        </Button>
        {msg && <p className="mt-2 text-xs text-muted-foreground">{msg}</p>}
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
