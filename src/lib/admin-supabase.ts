import { createClient } from "@supabase/supabase-js";

// Sirf publishable key. Alag storageKey: customer app ke session se koi mel nahi.
export const supabase = createClient(
  import.meta.env["VITE_SUPABASE_URL"] as string,
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string,
  {
    auth: {
      storageKey: "gymkhata-admin-auth",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
    },
  },
);
