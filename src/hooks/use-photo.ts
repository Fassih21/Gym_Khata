import { useQuery, type QueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { photoUrl } from "@/lib/photo";

const TTL_SEC = 3600; // signed URL expiry (lib/photo.ts ke saath same)
const FRESH_MS = 50 * 60 * 1000; // expiry se 10 min pehle refresh

/** Signed URL for a stored photo path (private bucket). Cached; expiry se pehle dobara nahi maangta. */
export function useSignedUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["photo", path],
    enabled: !!path,
    staleTime: FRESH_MS,
    gcTime: 55 * 60 * 1000,
    queryFn: async () => photoUrl(path),
  });
}

/** Ek batch request mein bohat si photos sign kar ke cache bhar deta hai (N requests -> 1). */
export async function seedPhotoUrls(qc: QueryClient, paths: (string | null | undefined)[]) {
  try {
    const now = Date.now();
    const missing = [...new Set(paths.filter((p): p is string => !!p))].filter(
      (p) => now - (qc.getQueryState(["photo", p])?.dataUpdatedAt ?? 0) > FRESH_MS,
    );
    if (!missing.length) return;
    const { data } = await supabase.storage.from("photos").createSignedUrls(missing, TTL_SEC);
    for (const r of data ?? []) {
      if (r.path && r.signedUrl) qc.setQueryData(["photo", r.path], r.signedUrl);
    }
  } catch {
    /* cards khud individually fetch kar lengi */
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
