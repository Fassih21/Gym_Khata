// Supabase/PostgREST returns max 1000 rows per request — page through with .range().
const PAGE = 1000;

export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(...(rows as T[]));
    if (rows.length < PAGE) return out;
  }
}
