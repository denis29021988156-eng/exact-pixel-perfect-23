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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_logs: {
        Row: {
          duration_ms: number | null
          error_flag: boolean
          id: string
          input_summary: string | null
          module: string
          output_summary: string | null
          risk_index: number | null
          timestamp: string
        }
        Insert: {
          duration_ms?: number | null
          error_flag?: boolean
          id?: string
          input_summary?: string | null
          module: string
          output_summary?: string | null
          risk_index?: number | null
          timestamp?: string
        }
        Update: {
          duration_ms?: number | null
          error_flag?: boolean
          id?: string
          input_summary?: string | null
          module?: string
          output_summary?: string | null
          risk_index?: number | null
          timestamp?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          amount: number | null
          contractor: string | null
          created_at: string
          deadline: string | null
          department: string | null
          id: string
          name: string
          risk_level: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          contractor?: string | null
          created_at?: string
          deadline?: string | null
          department?: string | null
          id?: string
          name: string
          risk_level?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contractor?: string | null
          created_at?: string
          deadline?: string | null
          department?: string | null
          id?: string
          name?: string
          risk_level?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      escalations: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          channels: Json | null
          created_at: string
          id: string
          message: string
          severity: number
          source_id: string | null
          source_type: string
          status: Database["public"]["Enums"]["escalation_status"]
          suggested_action: string | null
          type: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          channels?: Json | null
          created_at?: string
          id?: string
          message: string
          severity?: number
          source_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["escalation_status"]
          suggested_action?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          channels?: Json | null
          created_at?: string
          id?: string
          message?: string
          severity?: number
          source_id?: string | null
          source_type?: string
          status?: Database["public"]["Enums"]["escalation_status"]
          suggested_action?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          responsible: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          sla_deadline: string | null
          sla_overdue: boolean | null
          social_object: boolean | null
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          type: Database["public"]["Enums"]["incident_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          responsible?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          sla_deadline?: string | null
          sla_overdue?: boolean | null
          social_object?: boolean | null
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          responsible?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          sla_deadline?: string | null
          sla_overdue?: boolean | null
          social_object?: boolean | null
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          blocker: string | null
          budget_spent: number | null
          budget_total: number | null
          created_at: string
          department: string | null
          description: string | null
          id: string
          name: string
          planned_end: string | null
          planned_start: string | null
          progress: number | null
          responsible: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          blocker?: string | null
          budget_spent?: number | null
          budget_total?: number | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          name: string
          planned_end?: string | null
          planned_start?: string | null
          progress?: number | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          blocker?: string | null
          budget_spent?: number | null
          budget_total?: number | null
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          name?: string
          planned_end?: string | null
          planned_start?: string | null
          progress?: number | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by_name: string | null
          deadline: string | null
          department: string | null
          description: string | null
          id: string
          overdue: boolean | null
          responsible: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by_name?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          id?: string
          overdue?: boolean | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by_name?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          id?: string
          overdue?: boolean | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "mayor" | "deputy" | "employee"
      escalation_status: "active" | "acknowledged" | "resolved"
      incident_severity: "low" | "medium" | "high"
      incident_status: "new" | "in_progress" | "resolved" | "closed"
      incident_type:
        | "housing"
        | "road"
        | "social"
        | "ecology"
        | "transport"
        | "other"
      project_status: "on_track" | "risk" | "overdue" | "completed"
      task_status: "new" | "in_progress" | "completed" | "cancelled"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["mayor", "deputy", "employee"],
      escalation_status: ["active", "acknowledged", "resolved"],
      incident_severity: ["low", "medium", "high"],
      incident_status: ["new", "in_progress", "resolved", "closed"],
      incident_type: [
        "housing",
        "road",
        "social",
        "ecology",
        "transport",
        "other",
      ],
      project_status: ["on_track", "risk", "overdue", "completed"],
      task_status: ["new", "in_progress", "completed", "cancelled"],
    },
  },
} as const
