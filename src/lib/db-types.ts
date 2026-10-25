import type { Database } from "@/integrations/supabase/types";

export type Gym = Database["public"]["Tables"]["gyms"]["Row"];
export type GymUser = Database["public"]["Tables"]["gym_users"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
export type MemberPayment = Database["public"]["Tables"]["member_payments"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type Employee = Database["public"]["Tables"]["employees"]["Row"];
export type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
export type SalaryPayment = Database["public"]["Tables"]["salary_payments"]["Row"];
export type Attendance = Database["public"]["Tables"]["employee_attendance"]["Row"];
export type MembershipPlan = Database["public"]["Tables"]["membership_plans"]["Row"];
