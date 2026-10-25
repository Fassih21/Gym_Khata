import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";

/**
 * Integration-owned auth gate: client-only (session lives in browser storage),
 * revalidates the session with the auth server so an invalid session lands on
 * /login instead of half-loaded data.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/login", replace: true });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { queryClient } = Route.useRouteContext();
  return (
    <AppShell queryClient={queryClient}>
      <Outlet />
    </AppShell>
  );
}
