import { z } from "zod";

import { PHONE_DIGITS_RE } from "./format";

const digits = (v: string) => v.replace(/\D/g, "");

export const phoneField = z
  .string()
  .trim()
  .transform(digits)
  .refine((v) => PHONE_DIGITS_RE.test(v), "Sahi phone number likhein — e.g. 0332-1234567");

export const moneyField = z
  .string()
  .trim()
  .transform((v: string) => v.replace(/,/g, ""))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Sirf amount likhein (e.g. 3000)")
  .refine((v) => Number(v) >= 0, "Amount zero ya us se zyada ho")
  .refine((v) => Number(v) <= 99_999_999, "Amount bohat zyada hai");

export const memberSchema = z.object({
  name: z.string().trim().min(1, "Naam likhein").max(120),
  phone: phoneField,
  address: z.string().trim().max(300).optional().or(z.literal("")),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Join date chuniye"),
  status: z.enum(["active", "inactive"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  photo_file: z.instanceof(File).nullable().optional(),
});
export type MemberForm = z.infer<typeof memberSchema>;

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Naam likhein").max(120),
  phone: phoneField,
  address: z.string().trim().max(300).optional().or(z.literal("")),
  monthly_salary: moneyField,
  role_title: z.string().trim().max(80).optional().or(z.literal("")),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Join date chuniye"),
  status: z.enum(["active", "inactive"]),
  photo_file: z.instanceof(File).nullable().optional(),
});
export type EmployeeForm = z.infer<typeof employeeSchema>;

export const EXPENSE_CATEGORIES = ["Rent", "Electricity", "Equipment", "Maintenance", "Salaries", "Other"] as const;

export const expenseSchema = z.object({
  title: z.string().trim().min(1, "Kharcha likhein").max(120),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: moneyField,
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date chuniye"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});
export type ExpenseForm = z.infer<typeof expenseSchema>;

export const paymentSchema = z.object({
  amount: moneyField,
  paid_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date chuniye"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});
export type PaymentForm = z.infer<typeof paymentSchema>;
