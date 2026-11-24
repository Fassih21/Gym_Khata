// Formatting helpers — PKR currency, PK phone numbers, month keys.
// Money arrives from Postgres numeric columns as strings; never use floats.

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** PKR money format: Rs 3,000 */
export function formatPKR(amount: number | string | null | undefined): string {
  const n = toNumber(amount);
  return `Rs ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(n)}`;
}

/** Short display for tight spaces: 3,000 */
export function formatNumber(amount: number | string | null | undefined): string {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(toNumber(amount));
}

export const PHONE_DIGITS_RE = /^03\d{9}$/;
export const PHONE_INPUT_RE = /^03\d{2}-?\d{7}$/;

/** Accepts 03321234567 or 0332-1234567; stores digits only. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return PHONE_DIGITS_RE.test(digits) ? digits : null;
}

/** 03321234567 -> 0332-1234567 for display. */
export function formatPhone(phone: string): string {
  return phone.length === 11 ? `${phone.slice(0, 4)}-${phone.slice(4)}` : phone;
}

/** Local (PK) phone to wa.me international form: 0332... -> 92332... */
export function whatsappLink(phone: string, message: string): string {
  const intl = `92${phone.replace(/\D/g, "").slice(1)}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export const PAKISTAN_TIME_ZONE = "Asia/Karachi";

function pakistanDateParts(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PAKISTAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const part = (type: "year" | "month" | "day") =>
    parts.find((item) => item.type === type)?.value ?? "";
  return { year: part("year"), month: part("month"), day: part("day") };
}

/** First day of the month in Asia/Karachi, as YYYY-MM-01 (the DB month key). */
export function monthKey(d: Date = new Date()): string {
  const { year, month } = pakistanDateParts(d);
  return `${year}-${month}-01`;
}

/** Parses YYYY-MM-01 into a local Date without UTC shifting. */
export function parseMonthKey(key: string): Date {
  const parts = key.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  return new Date(y, m - 1, 1);
}

export function monthLabel(key: string): string {
  const d = parseMonthKey(key);
  return d.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
}

export function monthShortLabel(key: string): string {
  const d = parseMonthKey(key);
  return d.toLocaleDateString("en-PK", { month: "short" });
}

/** Last n month keys, oldest first. */
export function lastNMonths(n: number, from: Date = new Date()): string[] {
  const current = monthKey(from);
  return Array.from({ length: n }, (_, index) => addMonths(current, index - (n - 1)));
}

export function addMonths(key: string, delta: number): string {
  const [year, month] = key.slice(0, 7).split("-").map(Number) as [number, number];
  const total = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = ((total % 12) + 12) % 12;
  return `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01`;
}

export function todayISO(): string {
  const { year, month, day } = pakistanDateParts(new Date());
  return `${year}-${month}-${day}`;
}

/** Local YYYY-MM-DD for a Date. */
export function dateISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export function isSameMonth(iso: string | null | undefined, key: string): boolean {
  return (iso ?? "").slice(0, 7) === key.slice(0, 7);
}

/** Last calendar date of a YYYY-MM-01 month key. */
export function monthEndISO(key: string): string {
  const [year, month] = key.slice(0, 7).split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

/** Stable billing-day anchor inferred from existing calendar dates. */
export function billingDayAnchor(...dates: Array<string | null | undefined>): number {
  const days = dates
    .filter((date): date is string => Boolean(date))
    .map((date) => Number(date.slice(8, 10)))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31);
  return days.length > 0 ? Math.max(...days) : 1;
}

/** YYYY-MM-DD + n calendar months, preserving a stable billing-day anchor. */
export function addMonthsToDate(iso: string, n: number, billingDay = billingDayAnchor(iso)): string {
  const [year, month] = iso.slice(0, 7).split("-").map(Number) as [number, number];
  const targetMonth = addMonths(`${year}-${String(month).padStart(2, "0")}-01`, n);
  const last = Number(monthEndISO(targetMonth).slice(8, 10));
  return `${targetMonth.slice(0, 8)}${String(Math.min(billingDay, last)).padStart(2, "0")}`;
}

/** YYYY-MM-DD + n days. */
export function addDaysToDate(iso: string, n: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number) as [number, number, number];
  return dateISO(new Date(y, m - 1, d + n));
}

/** Whole days from a to b (b - a), both YYYY-MM-DD. */
export function daysBetween(a: string, b: string): number {
  const p = (s: string) => {
    const [y, m, d] = s.slice(0, 10).split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((p(b) - p(a)) / 86_400_000);
}
