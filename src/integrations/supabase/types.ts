export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      employee_attendance: {
        Row: {
          created_at: string
          created_by: string
          date: string
          employee_id: string
          gym_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          date: string
          employee_id: string
          gym_id?: string
          id?: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          employee_id?: string
          gym_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_employee_id_gym_id_fkey"
            columns: ["employee_id", "gym_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "gym_id"]
          },
          {
            foreignKeyName: "employee_attendance_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          gym_id: string
          id: string
          join_date: string
          monthly_salary: number
          name: string
          phone: string
          photo_path: string | null
          role_title: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          gym_id?: string
          id?: string
          join_date?: string
          monthly_salary: number
          name: string
          phone: string
          photo_path?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          gym_id?: string
          id?: string
          join_date?: string
          monthly_salary?: number
          name?: string
          phone?: string
          photo_path?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          expense_date: string
          gym_id: string
          id: string
          note: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string
          expense_date?: string
          gym_id?: string
          id?: string
          note?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          expense_date?: string
          gym_id?: string
          id?: string
          note?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gym_users: {
        Row: {
          created_at: string
          gym_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gym_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gym_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_users_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
          subscription_ends_on: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: string
          subscription_ends_on: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
          subscription_ends_on?: string
        }
        Relationships: []
      }
      member_payments: {
        Row: {
          amount_paid: number
          created_at: string
          created_by: string
          gym_id: string
          id: string
          member_id: string
          month: string
          note: string | null
          paid_on: string
          updated_at: string
          voided_at: string | null
          voided_by: string | null
          void_reason: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          created_by?: string
          gym_id?: string
          id?: string
          member_id: string
          month: string
          note?: string | null
          paid_on?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
          void_reason?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          created_by?: string
          gym_id?: string
          id?: string
          member_id?: string
          month?: string
          note?: string | null
          paid_on?: string
          updated_at?: string
          voided_at?: string | null
          voided_by?: string | null
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_payments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_payments_member_id_gym_id_fkey"
            columns: ["member_id", "gym_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id", "gym_id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          active: boolean
          created_at: string
          duration_months: number
          gym_id: string
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_months: number
          gym_id?: string
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_months?: number
          gym_id?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_plans_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          gym_id: string
          id: string
          join_date: string
          membership_expires_on: string | null
          name: string
          notes: string | null
          phone: string
          photo_path: string | null
          plan_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          gym_id?: string
          id?: string
          join_date?: string
          membership_expires_on?: string | null
          name: string
          notes?: string | null
          phone: string
          photo_path?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          gym_id?: string
          id?: string
          join_date?: string
          membership_expires_on?: string | null
          name?: string
          notes?: string | null
          phone?: string
          photo_path?: string | null
          plan_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_plan_gym_fk"
            columns: ["plan_id", "gym_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id", "gym_id"]
          },
        ]
      }
      salary_payments: {
        Row: {
          amount_paid: number
          created_at: string
          created_by: string
          employee_id: string
          gym_id: string
          id: string
          month: string
          paid_on: string
          updated_at: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          created_by?: string
          employee_id: string
          gym_id?: string
          id?: string
          month: string
          paid_on?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          created_by?: string
          employee_id?: string
          gym_id?: string
          id?: string
          month?: string
          paid_on?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_employee_id_gym_id_fkey"
            columns: ["employee_id", "gym_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "gym_id"]
          },
          {
            foreignKeyName: "salary_payments_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_gym_id: { Args: never; Returns: string }
      is_gym_active: { Args: never; Returns: boolean }
      members_with_payments: { Args: never; Returns: string[] }
      pk_today: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const