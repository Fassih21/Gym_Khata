import type { QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Ordered sign-out: stop in-flight queries, drop cached protected data, clear
 * the session, then replace history so Back cannot restore a protected route.
 */
export async function signOutEverywhere(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  // The root onAuthStateChange(SIGNED_OUT) listener performs the navigation.
}
