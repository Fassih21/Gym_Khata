// Gym data export ZIP (CSV). Default: members/employees ka personal data REDACTED (admin ko PII nahi).
// ADMIN_EXPORT_INCLUDE_PII=true par poora data (owner ko handover ke liye).
import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpError } from "./guard.server";
import { makeZip } from "./zip.server";

const TABLES: [string, string[]][] = [
  ["membership_plans", []],
  ["members", ["name", "phone", "address", "notes", "photo_path"]],
  ["member_payments", ["note"]],
  ["expenses", []],
  ["employees", ["name", "phone", "address", "photo_path"]],
  ["salary_payments", []],
  ["employee_attendance", []],
];

const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: Record<string, unknown>[]) => {
  const cols = Object.keys(rows[0]!);
  return "\uFEFF" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n") + "\r\n";
};

async function fetchAll(d: SupabaseClient, table: string, gymId: string) {
  const out: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await d.from(table).select("*").eq("gym_id", gymId).order("id").range(from, from + 999);
    if (error) throw new HttpError(500, "Export failed");
    out.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) break;
  }
  return out;
}

export async function buildGymExport(d: SupabaseClient, gym: { id: string; name: string }) {
  const includePii = process.env["ADMIN_EXPORT_INCLUDE_PII"] === "true";
  const files: { name: string; data: string }[] = [];
  const counts: string[] = [];
  for (const [table, pii] of TABLES) {
    const rows = (await fetchAll(d, table, gym.id)).map((r) =>
      includePii ? r : Object.fromEntries(Object.entries(r).filter(([k]) => !pii.includes(k))),
    );
    counts.push(`${table}: ${rows.length}`);
    if (rows.length) files.push({ name: `${table}.csv`, data: toCsv(rows) });
  }
  files.unshift({
    name: "README.txt",
    data: `Gym: ${gym.name}\nExported: ${new Date().toISOString()}\nPersonal data (name/phone/address/notes/photos): ${includePii ? "INCLUDED" : "REDACTED"}\n\n${counts.join("\n")}\n`,
  });
  const slug = gym.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gym";
  return { blob: makeZip(files), filename: `gymkhata-${slug}-export-${new Date().toISOString().slice(0, 10)}.zip` };
}
