// Poore gym ka CSV backup (ZIP). Har query mein gym_id filter + RLS dono; 1000-row pages.
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { toCSV } from "./csv";
import { fetchAll } from "./fetch-all";
import { formatPhone, todayISO, toNumber } from "./format";
import { makeZip } from "./zip";

type Tables = Database["public"]["Tables"];
type Row = Record<string, unknown>;

/** Excel formula injection se bachao: = + - @ se shuru hone wale text ke aage ' lagao. */
const safe = (v: unknown): unknown => (typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

const rs = (v: unknown) => toNumber(v as number | string | null); // plain number => Excel mein sum ho sake
const ymd = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : ""); // YYYY-MM-DD
const ym = (v: unknown) => (typeof v === "string" ? v.slice(0, 7) : ""); // YYYY-MM
const ts = (v: unknown) => {
  if (typeof v !== "string") return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};
// Dash wala phone Excel mein text rehta hai (03321234567 ka leading 0 nahi katta).
const phone = (v: unknown) => (typeof v === "string" ? formatPhone(v) : "");

export interface ExportResult {
  blob: Blob;
  filename: string;
  counts: { file: string; rows: number }[];
}

export async function buildBackup(
  gymId: string,
  gymName: string,
  onProgress?: (label: string) => void,
): Promise<ExportResult> {
  const load = async <N extends keyof Tables>(table: N, label: string): Promise<Tables[N]["Row"][]> => {
    onProgress?.(label);
    return fetchAll<Tables[N]["Row"]>((from, to) =>
      supabase
        .from(table as "members")
        .select("*")
        .eq("gym_id", gymId)
        .order("id")
        .range(from, to),
    );
  };

  const plans = await load("membership_plans", "Plans");
  const members = await load("members", "Members");
  const payments = await load("member_payments", "Member payments");
  const expenses = await load("expenses", "Expenses");
  const employees = await load("employees", "Employees");
  const salaries = await load("salary_payments", "Salary payments");
  const attendance = await load("employee_attendance", "Attendance");
  const memberAttendance = await load("member_attendance", "Member attendance");

  const planName = new Map(plans.map((p) => [p.id, p.name]));
  const member = new Map(members.map((m) => [m.id, m]));
  const employee = new Map(employees.map((e) => [e.id, e]));
  const byDateDesc = (key: string) => (a: object, b: object) =>
    String((b as Row)[key] ?? "").localeCompare(String((a as Row)[key] ?? ""));

  const sheets: { file: string; headers: string[]; rows: Row[] }[] = [
    {
      file: "members.csv",
      headers: ["Name", "Phone", "Address", "Join date", "Status", "Plan", "Membership expires on", "Notes", "Photo path", "Deleted on", "Created at", "Member ID"],
      rows: members.map((m) => ({
        Name: m.name, Phone: phone(m.phone), Address: m.address ?? "", "Join date": ymd(m.join_date), Status: m.status,
        Plan: m.plan_id ? (planName.get(m.plan_id) ?? "") : "", "Membership expires on": ymd(m.membership_expires_on),
        Notes: m.notes ?? "", "Photo path": m.photo_path ?? "", "Deleted on": ymd(m.deleted_at), "Created at": ts(m.created_at), "Member ID": m.id,
      })),
    },
    {
      file: "member_payments.csv",
      headers: ["Member", "Phone", "Month", "Amount (Rs)", "Paid on", "Note", "Created at", "Payment ID", "Member ID"],
      rows: [...payments].sort(byDateDesc("paid_on")).map((p) => ({
        Member: member.get(p.member_id)?.name ?? "", Phone: phone(member.get(p.member_id)?.phone),
        Month: ym(p.month), "Amount (Rs)": rs(p.amount_paid), "Paid on": ymd(p.paid_on), Note: p.note ?? "",
        "Created at": ts(p.created_at), "Payment ID": p.id, "Member ID": p.member_id,
      })),
    },
    {
      file: "expenses.csv",
      headers: ["Date", "Title", "Category", "Amount (Rs)", "Note", "Created at", "Expense ID"],
      rows: [...expenses].sort(byDateDesc("expense_date")).map((e) => ({
        Date: ymd(e.expense_date), Title: e.title, Category: e.category, "Amount (Rs)": rs(e.amount), Note: e.note ?? "",
        "Created at": ts(e.created_at), "Expense ID": e.id,
      })),
    },
    {
      file: "employees.csv",
      headers: ["Name", "Phone", "Address", "Role", "Monthly salary (Rs)", "Join date", "Status", "Photo path", "Deleted on", "Created at", "Employee ID"],
      rows: employees.map((e) => ({
        Name: e.name, Phone: phone(e.phone), Address: e.address ?? "", Role: e.role_title ?? "", "Monthly salary (Rs)": rs(e.monthly_salary),
        "Join date": ymd(e.join_date), Status: e.status, "Photo path": e.photo_path ?? "", "Deleted on": ymd(e.deleted_at),
        "Created at": ts(e.created_at), "Employee ID": e.id,
      })),
    },
    {
      file: "salary_payments.csv",
      headers: ["Employee", "Month", "Amount (Rs)", "Paid on", "Created at", "Payment ID", "Employee ID"],
      rows: [...salaries].sort(byDateDesc("paid_on")).map((s) => ({
        Employee: employee.get(s.employee_id)?.name ?? "", Month: ym(s.month), "Amount (Rs)": rs(s.amount_paid),
        "Paid on": ymd(s.paid_on), "Created at": ts(s.created_at), "Payment ID": s.id, "Employee ID": s.employee_id,
      })),
    },
    {
      file: "employee_attendance.csv",
      headers: ["Date", "Employee", "Status", "Created at", "Attendance ID", "Employee ID"],
      rows: [...attendance].sort(byDateDesc("date")).map((a) => ({
        Date: ymd(a.date), Employee: employee.get(a.employee_id)?.name ?? "", Status: a.status,
        "Created at": ts(a.created_at), "Attendance ID": a.id, "Employee ID": a.employee_id,
      })),
    },
    {
      file: "member_attendance.csv",
      headers: ["Date", "Member", "Checked in at", "Attendance ID", "Member ID"],
      rows: [...memberAttendance].sort(byDateDesc("date")).map((a) => ({
        Date: ymd(a.date), Member: member.get(a.member_id)?.name ?? "", "Checked in at": ts(a.checked_in_at),
        "Attendance ID": a.id, "Member ID": a.member_id,
      })),
    },
    {
      file: "membership_plans.csv",
      headers: ["Name", "Duration (months)", "Price (Rs)", "Active", "Plan ID"],
      rows: plans.map((p) => ({
        Name: p.name, "Duration (months)": p.duration_months, "Price (Rs)": rs(p.price), Active: p.active ? "yes" : "no", "Plan ID": p.id,
      })),
    },
  ];

  onProgress?.("ZIP ban rahi hai");
  const files = sheets.map((s) => {
    const rows = s.rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, safe(v)])));
    const csv = rows.length ? toCSV(rows, s.headers) : s.headers.join(",");
    return { name: s.file, data: "﻿" + csv + "\r\n" }; // BOM => Excel mein UTF-8/Urdu theek
  });

  const slug = gymName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "gym";
  return {
    blob: makeZip(files),
    filename: `gymkhata-${slug}-backup-${todayISO()}.zip`,
    counts: sheets.map((s) => ({ file: s.file, rows: s.rows.length })),
  };
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
