import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetch-all";

/** member_id -> unki pehli (cancel na hui) payment ka mahina (YYYY-MM-01).
 *  Membership expiry sirf us mahine se "covered" maani jati hai jab payment ka saboot ho. */
export function useEverPaid() {
  return useQuery({
    queryKey: ["ever-paid"],
    queryFn: async () => {
      const rows = await fetchAll<{ member_id: string; month: string }>((from, to) =>
        supabase.from("member_payments").select("member_id, month").is("voided_at", null).order("month").order("id").range(from, to),
      );
      const first = new Map<string, string>();
      for (const r of rows) if (!first.has(r.member_id)) first.set(r.member_id, r.month);
      return first;
    },
    staleTime: 60_000,
  });
}