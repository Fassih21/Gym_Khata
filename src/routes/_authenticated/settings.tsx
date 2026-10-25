import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { ExportData } from "@/components/export-data";
import { PageHeader } from "@/components/page";
import { PlansManager } from "@/components/plans-manager";
import { Button } from "@/components/ui/button";
import { useGym } from "@/hooks/use-gym";
import { signOutEverywhere } from "@/lib/auth-helpers";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — GymKhata" },
      { name: "description", content: "Gym ki maloomat aur logout." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { gym } = useGym();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Gym ki maloomat" />

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground">Gym ka naam</p>
          <p className="mt-0.5 font-semibold">{gym?.name ?? "—"}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground">Subscription khatam hoti hai</p>
          <p className="mt-0.5 font-semibold">{formatDate(gym?.subscription_ends_on)}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground">Subscription ka status</p>
          <p className="mt-0.5 font-semibold capitalize">{gym?.status ?? "—"}</p>
        </div>
      </div>

      <PlansManager />
      <ExportData />

      <Button variant="destructive" className="mt-6" onClick={() => void signOutEverywhere(qc)}>
        <LogOut className="size-4" /> Logout
      </Button>
    </div>
  );
}
