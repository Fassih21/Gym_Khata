import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/format";
import type { Gym } from "@/lib/db-types";

export type GymState =
  | { phase: "loading" }
  | { phase: "no-gym" } // signed in but not linked to any gym
  | { phase: "suspended"; gym: Gym }
  | { phase: "expired"; gym: Gym }
  | { phase: "active"; gym: Gym };

export function useGym(): { state: GymState; gym: Gym | null; refetch: () => void } {
  const q = useQuery({
    queryKey: ["gym"],
    queryFn: async (): Promise<Gym | null> => {
      const { data, error } = await supabase.from("gyms").select("id, name, status, subscription_ends_on").maybeSingle();
      if (error) throw error;
      return data as Gym | null;
    },
    retry: 1,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true, // suspend/expiry jaldi pakray
  });

  const gym = q.data ?? null;
  let state: GymState = { phase: "loading" };
  if (!q.isPending && !q.isLoading) {
    if (!gym) state = { phase: "no-gym" };
    else if (gym.status === "suspended") state = { phase: "suspended", gym };
    else if (gym.subscription_ends_on < todayISO()) state = { phase: "expired", gym };
    else state = { phase: "active", gym };
  }

  return { state, gym, refetch: () => void q.refetch() };
}
