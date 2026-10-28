import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { fetchAll } from "@/lib/fetch-all";

/** Un members ki id jinki kam az kam ek (cancel na hui) payment maujood hai.
 *  Membership expiry sirf tab "covered" maani jati hai jab payment ka saboot ho. */
export function useEverPaid() {
  return useQuery({
    queryKey: ["ever-paid"],
    queryFn: async () => {
      const ids = await fetchAll<string>((from, to) => supabase.rpc("members_with_payments").range(from, to));
      return new Set(ids);
    },
    staleTime: 60_000,
  });
} 