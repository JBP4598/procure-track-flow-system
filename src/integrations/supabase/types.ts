export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_savings: {
        Row: {
          actual_amount: number
          created_at: string | null
          id: string
          obligated_amount: number
          planned_amount: number
          po_item_id: string | null
          ppmp_item_id: string | null
          pr_item_id: string | null
          savings_amount: number | null
          savings_percentage: number | null
        }
        Insert: {
          actual_amount: number
          created_at?: string | null
          id?: string
          obligated_amount: number
          planned_amount: number
          po_item_id?: string | null
          ppmp_item_id?: string | null
          pr_item_id?: string | null
          savings_amount?: number | null
          savings_percentage?: number | null
        }
        Update: {
          actual_amount?: number
          created_at?: string | null
          id?: string
          obligated_amount?: number
          planned_amount?: number
          po_item_id?: string | null
          ppmp_item_id?: string | null
          pr_item_id?: string | null
          savings_amount?: number | null
          savings_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_savings_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "po_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_savings_ppmp_item_id_fkey"
            columns: ["ppmp_item_id"]
            isOneToOne: false
            referencedRelation: "ppmp_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_savings_pr_item_id_fkey"
            columns: ["pr_item_id"]
            isOneToOne: false
            referencedRelation: "pr_items"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      disbursement_vouchers: {
        Row: {
          amount: number
          check_number: string | null
          created_at: string | null
          created_by: string
          dv_number: string
          iar_id: string
          id: string
          payee_name: string
          payment_date: string | null
          payment_method: string | null
          po_id: string
          processed_at: string | null
          processed_by: string | null
          receipt_attachments: string[] | null
          status: Database["public"]["Enums"]["dv_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          check_number?: string | null
          created_at?: string | null
          created_by: string
          dv_number: string
          iar_id: string
          id?: string
          payee_name: string
          payment_date?: string | null
          payment_method?: string | null
          po_id: string
          processed_at?: string | null
          processed_by?: string | null
          receipt_attachments?: string[] | null
          status?: Database["public"]["Enums"]["dv_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          check_number?: string | null
          created_at?: string | null
          created_by?: string
          dv_number?: string
          iar_id?: string
          id?: string
          payee_name?: string
          payment_date?: string | null
          payment_method?: string | null
          po_id?: string
          processed_at?: string | null
          processed_by?: string | null
          receipt_attachments?: string[] | null
          status?: Database["public"]["Enums"]["dv_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disbursement_vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursement_vouchers_iar_id_fkey"
            columns: ["iar_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursement_vouchers_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursement_vouchers_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      iar_items: {
        Row: {
          accepted_quantity: number
          created_at: string | null
          iar_id: string
          id: string
          inspected_quantity: number
          po_item_id: string
          rejected_quantity: number
          remarks: string | null
          result: Database["public"]["Enums"]["inspection_result"]
          updated_at: string | null
        }
        Insert: {
          accepted_quantity?: number
          created_at?: string | null
          iar_id: string
          id?: string
          inspected_quantity: number
          po_item_id: string
          rejected_quantity?: number
          remarks?: string | null
          result: Database["public"]["Enums"]["inspection_result"]
          updated_at?: string | null
        }
        Update: {
          accepted_quantity?: number
          created_at?: string | null
          iar_id?: string
          id?: string
          inspected_quantity?: number
          po_item_id?: string
          rejected_quantity?: number
          remarks?: string | null
          result?: Database["public"]["Enums"]["inspection_result"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iar_items_iar_id_fkey"
            columns: ["iar_id"]
            isOneToOne: false
            referencedRelation: "inspection_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iar_items_po_item_id_fkey"
            columns: ["po_item_id"]
            isOneToOne: false
            referencedRelation: "po_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_reports: {
        Row: {
          created_at: string | null
          iar_number: string
          id: string
          image_attachments: string[] | null
          inspection_date: string
          inspector_id: string
          overall_result: Database["public"]["Enums"]["inspection_result"]
          po_id: string
          remarks: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          iar_number: string
          id?: string
          image_attachments?: string[] | null
          inspection_date: string
          inspector_id: string
          overall_result: Database["public"]["Enums"]["inspection_result"]
          po_id: string
          remarks?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          iar_number?: string
          id?: string
          image_attachments?: string[] | null
          inspection_date?: string
          inspector_id?: string
          overall_result?: Database["public"]["Enums"]["inspection_result"]
          po_id?: string
          remarks?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_reports_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_reports_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_items: {
        Row: {
          cancel_remarks: string | null
          cancelled: boolean | null
          created_at: string | null
          delivered_quantity: number | null
          id: string
          po_id: string
          pr_item_id: string
          quantity: number
          remaining_quantity: number | null
          total_cost: number
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          cancel_remarks?: string | null
          cancelled?: boolean | null
          created_at?: string | null
          delivered_quantity?: number | null
          id?: string
          po_id: string
          pr_item_id: string
          quantity: number
          remaining_quantity?: number | null
          total_cost: number
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          cancel_remarks?: string | null
          cancelled?: boolean | null
          created_at?: string | null
          delivered_quantity?: number | null
          id?: string
          po_id?: string
          pr_item_id?: string
          quantity?: number
          remaining_quantity?: number | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_items_pr_item_id_fkey"
            columns: ["pr_item_id"]
            isOneToOne: false
            referencedRelation: "pr_items"
            referencedColumns: ["id"]
          },
        ]
      }
      ppmp_files: {
        Row: {
          created_at: string | null
          department_id: string
          file_name: string
          file_url: string | null
          fiscal_year: number
          id: string
          status: string | null
          total_budget: number
          updated_at: string | null
          uploaded_by: string
          version: number | null
        }
        Insert: {
          created_at?: string | null
          department_id: string
          file_name: string
          file_url?: string | null
          fiscal_year: number
          id?: string
          status?: string | null
          total_budget?: number
          updated_at?: string | null
          uploaded_by: string
          version?: number | null
        }
        Update: {
          created_at?: string | null
          department_id?: string
          file_name?: string
          file_url?: string | null
          fiscal_year?: number
          id?: string
          status?: string | null
          total_budget?: number
          updated_at?: string | null
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ppmp_files_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppmp_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ppmp_items: {
        Row: {
          budget_category: string
          created_at: string | null
          description: string | null
          id: string
          item_name: string
          ppmp_file_id: string
          procurement_method: string | null
          quantity: number
          remaining_budget: number | null
          remaining_quantity: number | null
          schedule_quarter: string | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          budget_category: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_name: string
          ppmp_file_id: string
          procurement_method?: string | null
          quantity: number
          remaining_budget?: number | null
          remaining_quantity?: number | null
          schedule_quarter?: string | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          budget_category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string
          ppmp_file_id?: string
          procurement_method?: string | null
          quantity?: number
          remaining_budget?: number | null
          remaining_quantity?: number | null
          schedule_quarter?: string | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ppmp_items_ppmp_file_id_fkey"
            columns: ["ppmp_file_id"]
            isOneToOne: false
            referencedRelation: "ppmp_files"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_items: {
        Row: {
          budget_category: string
          created_at: string | null
          description: string | null
          id: string
          item_name: string
          ppmp_item_id: string | null
          pr_id: string
          quantity: number
          remarks: string | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          budget_category: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_name: string
          ppmp_item_id?: string | null
          pr_id: string
          quantity: number
          remarks?: string | null
          total_cost: number
          unit: string
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          budget_category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string
          ppmp_item_id?: string | null
          pr_id?: string
          quantity?: number
          remarks?: string | null
          total_cost?: number
          unit?: string
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pr_items_ppmp_item_id_fkey"
            columns: ["ppmp_item_id"]
            isOneToOne: false
            referencedRelation: "ppmp_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pr_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department_id: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string
          delivery_date: string | null
          delivery_status: Database["public"]["Enums"]["delivery_status"] | null
          file_attachments: string[] | null
          id: string
          po_number: string
          status: Database["public"]["Enums"]["po_status"] | null
          supplier_address: string | null
          supplier_contact: string | null
          supplier_name: string
          terms_conditions: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by: string
          delivery_date?: string | null
          delivery_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
          file_attachments?: string[] | null
          id?: string
          po_number: string
          status?: Database["public"]["Enums"]["po_status"] | null
          supplier_address?: string | null
          supplier_contact?: string | null
          supplier_name: string
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string
          delivery_date?: string | null
          delivery_status?:
            | Database["public"]["Enums"]["delivery_status"]
            | null
          file_attachments?: string[] | null
          id?: string
          po_number?: string
          status?: Database["public"]["Enums"]["po_status"] | null
          supplier_address?: string | null
          supplier_contact?: string | null
          supplier_name?: string
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          department_id: string
          file_attachments: string[] | null
          id: string
          ppmp_file_id: string | null
          pr_number: string
          purpose: string
          remarks: string | null
          requested_by: string
          status: Database["public"]["Enums"]["pr_status"] | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department_id: string
          file_attachments?: string[] | null
          id?: string
          ppmp_file_id?: string | null
          pr_number: string
          purpose: string
          remarks?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["pr_status"] | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department_id?: string
          file_attachments?: string[] | null
          id?: string
          ppmp_file_id?: string | null
          pr_number?: string
          purpose?: string
          remarks?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["pr_status"] | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_ppmp_file_id_fkey"
            columns: ["ppmp_file_id"]
            isOneToOne: false
            referencedRelation: "ppmp_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_department: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      delivery_status:
        | "not_delivered"
        | "partially_delivered"
        | "fully_delivered"
      dv_status: "for_signature" | "submitted" | "processed"
      inspection_result: "accepted" | "rejected" | "requires_reinspection"
      po_status: "pending" | "approved" | "cancelled"
      pr_status:
        | "pending"
        | "for_approval"
        | "approved"
        | "awarded"
        | "returned"
      user_role: "admin" | "encoder" | "inspector" | "bac" | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      delivery_status: [
        "not_delivered",
        "partially_delivered",
        "fully_delivered",
      ],
      dv_status: ["for_signature", "submitted", "processed"],
      inspection_result: ["accepted", "rejected", "requires_reinspection"],
      po_status: ["pending", "approved", "cancelled"],
      pr_status: ["pending", "for_approval", "approved", "awarded", "returned"],
      user_role: ["admin", "encoder", "inspector", "bac", "accountant"],
    },
  },
} as const
