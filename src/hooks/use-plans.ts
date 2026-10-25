import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { MembershipPlan } from "@/lib/db-types";

/** Is gym ke plans (RLS khud gym filter karti hai). */
export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_plans")
        .select("id, name, duration_months, price, active")
        .order("duration_months")
        .order("name");
      if (error) throw error;
      return data as MembershipPlan[];
    },
    staleTime: 60_000,
  });
}
