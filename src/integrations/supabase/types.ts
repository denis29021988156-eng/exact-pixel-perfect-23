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
      address_normalization: {
        Row: {
          created_at: string
          district: string | null
          id: string
          lat: number | null
          lng: number | null
          normalized_address: string
          raw_text: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          normalized_address: string
          raw_text: string
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          normalized_address?: string
          raw_text?: string
        }
        Relationships: []
      }
      agenda_items: {
        Row: {
          channel: string
          created_at: string
          day: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          description: string | null
          expected_effect: string | null
          id: string
          municipality_id: string | null
          status: string
          title: string
        }
        Insert: {
          channel: string
          created_at?: string
          day: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          expected_effect?: string | null
          id?: string
          municipality_id?: string | null
          status?: string
          title: string
        }
        Update: {
          channel?: string
          created_at?: string
          day?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          description?: string | null
          expected_effect?: string | null
          id?: string
          municipality_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_items_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_calls: {
        Row: {
          at: string
          id: number
          kind: string
          user_id: string
        }
        Insert: {
          at?: string
          id?: number
          kind: string
          user_id: string
        }
        Update: {
          at?: string
          id?: number
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
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
      ai_memory: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key: string
          kind: string
          source: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          kind: string
          source?: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          kind?: string
          source?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      ai_status_state: {
        Row: {
          consecutive_failures: number
          current_state: string
          id: number
          last_alert_at: string | null
          last_changed_at: string
        }
        Insert: {
          consecutive_failures?: number
          current_state?: string
          id?: number
          last_alert_at?: string | null
          last_changed_at?: string
        }
        Update: {
          consecutive_failures?: number
          current_state?: string
          id?: number
          last_alert_at?: string | null
          last_changed_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          city_lat: number | null
          city_lng: number | null
          city_name: string
          demo_mode: boolean
          id: number
          region_name: string | null
          updated_at: string
        }
        Insert: {
          city_lat?: number | null
          city_lng?: number | null
          city_name?: string
          demo_mode?: boolean
          id: number
          region_name?: string | null
          updated_at?: string
        }
        Update: {
          city_lat?: number | null
          city_lng?: number | null
          city_name?: string
          demo_mode?: boolean
          id?: number
          region_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ask_log: {
        Row: {
          answer: Json | null
          at: string
          id: string
          ok: boolean
          question: string
          user_id: string
        }
        Insert: {
          answer?: Json | null
          at?: string
          id?: string
          ok?: boolean
          question: string
          user_id: string
        }
        Update: {
          answer?: Json | null
          at?: string
          id?: string
          ok?: boolean
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          category: string | null
          city_name: string | null
          created_at: string
          id: string
          metric_name: string
          metric_value: number
          norm_value: number
          period: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          city_name?: string | null
          created_at?: string
          id?: string
          metric_name: string
          metric_value?: number
          norm_value?: number
          period?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          city_name?: string | null
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          norm_value?: number
          period?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      budget_forecast: {
        Row: {
          actual_amount: number | null
          actual_payment_date: string | null
          contract_id: string
          created_at: string
          id: string
          planned_amount: number | null
          planned_payment_date: string | null
        }
        Insert: {
          actual_amount?: number | null
          actual_payment_date?: string | null
          contract_id: string
          created_at?: string
          id?: string
          planned_amount?: number | null
          planned_payment_date?: string | null
        }
        Update: {
          actual_amount?: number | null
          actual_payment_date?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          planned_amount?: number | null
          planned_payment_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_forecast_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      comms_settings: {
        Row: {
          avoid: Json
          id: number
          tone: Json
          updated_at: string
        }
        Insert: {
          avoid?: Json
          id?: number
          tone?: Json
          updated_at?: string
        }
        Update: {
          avoid?: Json
          id?: number
          tone?: Json
          updated_at?: string
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
          execution_rate: number | null
          id: string
          name: string
          political_sensitivity: string
          risk_level: string | null
          risk_of_non_execution: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          contractor?: string | null
          created_at?: string
          deadline?: string | null
          department?: string | null
          execution_rate?: number | null
          id?: string
          name: string
          political_sensitivity?: string
          risk_level?: string | null
          risk_of_non_execution?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          contractor?: string | null
          created_at?: string
          deadline?: string | null
          department?: string | null
          execution_rate?: number | null
          id?: string
          name?: string
          political_sensitivity?: string
          risk_level?: string | null
          risk_of_non_execution?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_briefs: {
        Row: {
          day: string
          generated_at: string
          headline: string
          items: Json
          source: string
          summary: string
        }
        Insert: {
          day: string
          generated_at?: string
          headline: string
          items?: Json
          source: string
          summary: string
        }
        Update: {
          day?: string
          generated_at?: string
          headline?: string
          items?: Json
          source?: string
          summary?: string
        }
        Relationships: []
      }
      data_sources: {
        Row: {
          config: Json
          created_at: string
          id: string
          last_sync_at: string | null
          latency_minutes: number
          name: string
          reliability: number
          status: Database["public"]["Enums"]["data_source_status"]
          success_rate: number
          type: Database["public"]["Enums"]["data_source_type"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          latency_minutes?: number
          name: string
          reliability?: number
          status?: Database["public"]["Enums"]["data_source_status"]
          success_rate?: number
          type: Database["public"]["Enums"]["data_source_type"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          latency_minutes?: number
          name?: string
          reliability?: number
          status?: Database["public"]["Enums"]["data_source_status"]
          success_rate?: number
          type?: Database["public"]["Enums"]["data_source_type"]
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
      executors: {
        Row: {
          created_at: string
          id: string
          kind: string
          municipality_id: string | null
          name: string
          short_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          municipality_id?: string | null
          name: string
          short_name: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          municipality_id?: string | null
          name?: string
          short_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "executors_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          enabled_at: string | null
          enabled_for_roles: string[]
          key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          enabled_at?: string | null
          enabled_for_roles?: string[]
          key: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          enabled_at?: string | null
          enabled_for_roles?: string[]
          key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          address: string | null
          confidence_score: number
          created_at: string
          created_by: string | null
          department: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          political_sensitivity: string
          raw_source_id: string | null
          responsible: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          sla_deadline: string | null
          sla_overdue: boolean | null
          social_object: boolean | null
          source_id: string | null
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          type: Database["public"]["Enums"]["incident_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          political_sensitivity?: string
          raw_source_id?: string | null
          responsible?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          sla_deadline?: string | null
          sla_overdue?: boolean | null
          social_object?: boolean | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          confidence_score?: number
          created_at?: string
          created_by?: string | null
          department?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          political_sensitivity?: string
          raw_source_id?: string | null
          responsible?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          sla_deadline?: string | null
          sla_overdue?: boolean | null
          social_object?: boolean | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          type?: Database["public"]["Enums"]["incident_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_raw_source_id_fkey"
            columns: ["raw_source_id"]
            isOneToOne: false
            referencedRelation: "staging_raw"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents_severity_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          incident_id: string
          previous_severity: string | null
          severity: string
          source: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          incident_id: string
          previous_severity?: string | null
          severity: string
          source?: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          incident_id?: string
          previous_severity?: string | null
          severity?: string
          source?: string
        }
        Relationships: []
      }
      ingestion_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          records_failed: number
          records_in: number
          records_normalized: number
          source_id: string | null
          status: Database["public"]["Enums"]["ingestion_status"]
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          records_failed?: number
          records_in?: number
          records_normalized?: number
          source_id?: string | null
          status: Database["public"]["Enums"]["ingestion_status"]
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          records_failed?: number
          records_in?: number
          records_normalized?: number
          source_id?: string | null
          status?: Database["public"]["Enums"]["ingestion_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_log_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_events: {
        Row: {
          actor: string | null
          at: string
          id: string
          instruction_id: string
          kind: string
          note: string | null
        }
        Insert: {
          actor?: string | null
          at?: string
          id?: string
          instruction_id: string
          kind: string
          note?: string | null
        }
        Update: {
          actor?: string | null
          at?: string
          id?: string
          instruction_id?: string
          kind?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instruction_events_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      instructions: {
        Row: {
          created_at: string
          created_by: string | null
          details: string | null
          done_at: string | null
          due_date: string
          effect: string | null
          effect_positive: boolean | null
          executor_id: string
          id: string
          last_reminded_at: string | null
          municipality_id: string | null
          postponed: number
          promise_id: string | null
          reminders: number
          signal_id: string | null
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          details?: string | null
          done_at?: string | null
          due_date: string
          effect?: string | null
          effect_positive?: boolean | null
          executor_id: string
          id?: string
          last_reminded_at?: string | null
          municipality_id?: string | null
          postponed?: number
          promise_id?: string | null
          reminders?: number
          signal_id?: string | null
          source?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          details?: string | null
          done_at?: string | null
          due_date?: string
          effect?: string | null
          effect_positive?: boolean | null
          executor_id?: string
          id?: string
          last_reminded_at?: string | null
          municipality_id?: string | null
          postponed?: number
          promise_id?: string | null
          reminders?: number
          signal_id?: string | null
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructions_executor_id_fkey"
            columns: ["executor_id"]
            isOneToOne: false
            referencedRelation: "executors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructions_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructions_promise_id_fkey"
            columns: ["promise_id"]
            isOneToOne: false
            referencedRelation: "promises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructions_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      media_mentions: {
        Row: {
          created_at: string
          id: string
          published_at: string
          sentiment: string
          source: string
          title: string
          topic: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          published_at?: string
          sentiment?: string
          source: string
          title: string
          topic?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          published_at?: string
          sentiment?: string
          source?: string
          title?: string
          topic?: string | null
          url?: string | null
        }
        Relationships: []
      }
      metrics_baseline: {
        Row: {
          captured_at: string
          context: Json
          id: string
          metric: string
          value: number
        }
        Insert: {
          captured_at?: string
          context?: Json
          id?: string
          metric: string
          value: number
        }
        Update: {
          captured_at?: string
          context?: Json
          id?: string
          metric?: string
          value?: number
        }
        Relationships: []
      }
      municipalities: {
        Row: {
          center: string | null
          created_at: string
          id: string
          name: string
          sort: number
        }
        Insert: {
          center?: string | null
          created_at?: string
          id?: string
          name: string
          sort?: number
        }
        Update: {
          center?: string | null
          created_at?: string
          id?: string
          name?: string
          sort?: number
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
          political_sensitivity: string
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
          political_sensitivity?: string
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
          political_sensitivity?: string
          progress?: number | null
          responsible?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      promises: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          municipality_id: string | null
          occasion: string
          said_on: string
          text: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          municipality_id?: string | null
          occasion: string
          said_on: string
          text: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          municipality_id?: string | null
          occasion?: string
          said_on?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "promises_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      public_complaints: {
        Row: {
          complaint_text: string | null
          confidence_score: number
          created_at: string
          district: string | null
          id: string
          raw_source_id: string | null
          sentiment: string | null
          source: string
          source_id: string | null
          topic: string
        }
        Insert: {
          complaint_text?: string | null
          confidence_score?: number
          created_at?: string
          district?: string | null
          id?: string
          raw_source_id?: string | null
          sentiment?: string | null
          source?: string
          source_id?: string | null
          topic: string
        }
        Update: {
          complaint_text?: string | null
          confidence_score?: number
          created_at?: string
          district?: string | null
          id?: string
          raw_source_id?: string | null
          sentiment?: string | null
          source?: string
          source_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_complaints_raw_source_id_fkey"
            columns: ["raw_source_id"]
            isOneToOne: false
            referencedRelation: "staging_raw"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_complaints_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      public_metrics_snapshot: {
        Row: {
          active_incidents: number
          active_projects: number
          active_tasks: number
          critical_incidents: number
          id: number
          risk_projects: number
          spent_budget: number
          total_budget: number
          updated_at: string
        }
        Insert: {
          active_incidents?: number
          active_projects?: number
          active_tasks?: number
          critical_incidents?: number
          id?: number
          risk_projects?: number
          spent_budget?: number
          total_budget?: number
          updated_at?: string
        }
        Update: {
          active_incidents?: number
          active_projects?: number
          active_tasks?: number
          critical_incidents?: number
          id?: number
          risk_projects?: number
          spent_budget?: number
          total_budget?: number
          updated_at?: string
        }
        Relationships: []
      }
      risk_index_snapshots: {
        Row: {
          components: Json
          created_at: string
          formula_version: string
          id: string
          index_value: number
          level: string
          snapshot_date: string
        }
        Insert: {
          components?: Json
          created_at?: string
          formula_version?: string
          id?: string
          index_value: number
          level: string
          snapshot_date: string
        }
        Update: {
          components?: Json
          created_at?: string
          formula_version?: string
          id?: string
          index_value?: number
          level?: string
          snapshot_date?: string
        }
        Relationships: []
      }
      scenario_history: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          input_params: Json
          predicted_output: Json
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          input_params?: Json
          predicted_output?: Json
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          input_params?: Json
          predicted_output?: Json
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          ai_cause: string | null
          ai_forecast: string | null
          ai_recommendation: string | null
          created_at: string
          created_by: string | null
          detected_at: string
          id: string
          instruction_id: string | null
          kind: string
          mentions: number | null
          municipality_id: string | null
          severity: string
          source: string | null
          status: string
          status_note: string | null
          suggested_due: string | null
          suggested_executor_id: string | null
          suggested_title: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_cause?: string | null
          ai_forecast?: string | null
          ai_recommendation?: string | null
          created_at?: string
          created_by?: string | null
          detected_at?: string
          id?: string
          instruction_id?: string | null
          kind: string
          mentions?: number | null
          municipality_id?: string | null
          severity: string
          source?: string | null
          status?: string
          status_note?: string | null
          suggested_due?: string | null
          suggested_executor_id?: string | null
          suggested_title?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_cause?: string | null
          ai_forecast?: string | null
          ai_recommendation?: string | null
          created_at?: string
          created_by?: string | null
          detected_at?: string
          id?: string
          instruction_id?: string | null
          kind?: string
          mentions?: number | null
          municipality_id?: string | null
          severity?: string
          source?: string | null
          status?: string
          status_note?: string | null
          suggested_due?: string | null
          suggested_executor_id?: string | null
          suggested_title?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_instruction_fk"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "instructions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_suggested_executor_id_fkey"
            columns: ["suggested_executor_id"]
            isOneToOne: false
            referencedRelation: "executors"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_matrix_draft: {
        Row: {
          approved: boolean
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          note: string | null
          reaction_hours: number
          resolution_hours: number
          severity: Database["public"]["Enums"]["incident_severity"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved?: boolean
          id?: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          note?: string | null
          reaction_hours?: number
          resolution_hours?: number
          severity: Database["public"]["Enums"]["incident_severity"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved?: boolean
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          note?: string | null
          reaction_hours?: number
          resolution_hours?: number
          severity?: Database["public"]["Enums"]["incident_severity"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      staging_raw: {
        Row: {
          confidence: number
          created_at: string
          error_message: string | null
          id: string
          parsed_payload: Json | null
          raw_payload: Json
          source_id: string | null
          status: Database["public"]["Enums"]["staging_status"]
          target_id: string | null
          target_table: string | null
          updated_at: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          error_message?: string | null
          id?: string
          parsed_payload?: Json | null
          raw_payload?: Json
          source_id?: string | null
          status?: Database["public"]["Enums"]["staging_status"]
          target_id?: string | null
          target_table?: string | null
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          error_message?: string | null
          id?: string
          parsed_payload?: Json | null
          raw_payload?: Json
          source_id?: string | null
          status?: Database["public"]["Enums"]["staging_status"]
          target_id?: string | null
          target_table?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staging_raw_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          confidence_score: number
          created_at: string
          created_by_name: string | null
          deadline: string | null
          department: string | null
          description: string | null
          id: string
          overdue: boolean | null
          raw_source_id: string | null
          responsible: string | null
          source_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          confidence_score?: number
          created_at?: string
          created_by_name?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          id?: string
          overdue?: boolean | null
          raw_source_id?: string | null
          responsible?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          confidence_score?: number
          created_at?: string
          created_by_name?: string | null
          deadline?: string | null
          department?: string | null
          description?: string | null
          id?: string
          overdue?: boolean | null
          raw_source_id?: string | null
          responsible?: string | null
          source_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_raw_source_id_fkey"
            columns: ["raw_source_id"]
            isOneToOne: false
            referencedRelation: "staging_raw"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          chat_title: string | null
          confidence: number
          created_at: string
          error_message: string | null
          extracted_payload: Json | null
          from_username: string | null
          processed: boolean
          raw_update: Json
          staging_raw_id: string | null
          text: string | null
          update_id: number
        }
        Insert: {
          chat_id: number
          chat_title?: string | null
          confidence?: number
          created_at?: string
          error_message?: string | null
          extracted_payload?: Json | null
          from_username?: string | null
          processed?: boolean
          raw_update: Json
          staging_raw_id?: string | null
          text?: string | null
          update_id: number
        }
        Update: {
          chat_id?: number
          chat_title?: string | null
          confidence?: number
          created_at?: string
          error_message?: string | null
          extracted_payload?: Json | null
          from_username?: string | null
          processed?: boolean
          raw_update?: Json
          staging_raw_id?: string | null
          text?: string | null
          update_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "telegram_messages_staging_raw_id_fkey"
            columns: ["staging_raw_id"]
            isOneToOne: false
            referencedRelation: "staging_raw"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_index: {
        Row: {
          appeals_resolved: number | null
          day: string
          event_kind: string | null
          event_label: string | null
          media_tone: number | null
          response_speed: number | null
          survey: number | null
          value: number
        }
        Insert: {
          appeals_resolved?: number | null
          day: string
          event_kind?: string | null
          event_label?: string | null
          media_tone?: number | null
          response_speed?: number | null
          survey?: number | null
          value: number
        }
        Update: {
          appeals_resolved?: number | null
          day?: string
          event_kind?: string | null
          event_label?: string | null
          media_tone?: number | null
          response_speed?: number | null
          survey?: number | null
          value?: number
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
      weather_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: Database["public"]["Enums"]["weather_alert_type"]
          city_name: string
          created_at: string
          description: string | null
          ends_at: string
          id: string
          peak_unit: string | null
          peak_value: number | null
          raw_forecast: Json | null
          severity: Database["public"]["Enums"]["weather_alert_severity"]
          starts_at: string
          title: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: Database["public"]["Enums"]["weather_alert_type"]
          city_name: string
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          peak_unit?: string | null
          peak_value?: number | null
          raw_forecast?: Json | null
          severity?: Database["public"]["Enums"]["weather_alert_severity"]
          starts_at: string
          title: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: Database["public"]["Enums"]["weather_alert_type"]
          city_name?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          peak_unit?: string | null
          peak_value?: number | null
          raw_forecast?: Json | null
          severity?: Database["public"]["Enums"]["weather_alert_severity"]
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      weather_snapshot: {
        Row: {
          active_alerts: number
          city_name: string
          current: Json
          fetched_at: string
          forecast_72h: Json
          id: number
        }
        Insert: {
          active_alerts?: number
          city_name?: string
          current?: Json
          fetched_at?: string
          forecast_72h?: Json
          id: number
        }
        Update: {
          active_alerts?: number
          city_name?: string
          current?: Json
          fetched_at?: string
          forecast_72h?: Json
          id?: number
        }
        Relationships: []
      }
    }
    Views: {
      public_metrics: {
        Row: {
          active_incidents: number | null
          active_projects: number | null
          active_tasks: number | null
          critical_incidents: number | null
          risk_projects: number | null
          spent_budget: number | null
          total_budget: number | null
        }
        Insert: {
          active_incidents?: number | null
          active_projects?: number | null
          active_tasks?: number | null
          critical_incidents?: number | null
          risk_projects?: number | null
          spent_budget?: number | null
          total_budget?: number | null
        }
        Update: {
          active_incidents?: number | null
          active_projects?: number | null
          active_tasks?: number | null
          critical_incidents?: number | null
          risk_projects?: number | null
          spent_budget?: number | null
          total_budget?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _demo_after: {
        Args: { _a: number; _c: number; _k: number; _w: number }
        Returns: number
      }
      _demo_bump: {
        Args: { _a: number; _c: number; _k: number; _w: number }
        Returns: number
      }
      _demo_num: { Args: { _signed?: boolean; _v: number }; Returns: string }
      _demo_seed: { Args: never; Returns: undefined }
      _demo_step: {
        Args: { _a: number; _c: number; _k: number }
        Returns: number
      }
      _gov_agenda_payload: { Args: { _today: string }; Returns: Json }
      _gov_context_payload: { Args: { _today: string }; Returns: Json }
      _gov_instructions_payload: { Args: { _today: string }; Returns: Json }
      _gov_signals_payload: { Args: { _today: string }; Returns: Json }
      _gov_today_payload: { Args: { _today: string }; Returns: Json }
      _instruction_json: {
        Args: {
          _today: string
          i: Database["public"]["Tables"]["instructions"]["Row"]
        }
        Returns: Json
      }
      _promise_json: {
        Args: {
          _today: string
          p: Database["public"]["Tables"]["promises"]["Row"]
        }
        Returns: Json
      }
      _severity_rank: { Args: { _s: string }; Returns: number }
      _signal_json: {
        Args: { s: Database["public"]["Tables"]["signals"]["Row"] }
        Returns: Json
      }
      _trust_series: { Args: { _days: number; _today: string }; Returns: Json }
      _trust_summary: { Args: { _today: string }; Returns: Json }
      admin_list_users: { Args: never; Returns: Json }
      admin_set_role: {
        Args: { _role: string; _user_id: string }
        Returns: undefined
      }
      demo_reset: { Args: never; Returns: undefined }
      detect_complaint_surge: { Args: never; Returns: undefined }
      get_user_department: { Args: { _user_id: string }; Returns: string }
      gov_agenda: { Args: never; Returns: Json }
      gov_agenda_decide: {
        Args: { _decision: string; _id: string; _note?: string }
        Returns: Json
      }
      gov_ai_quota: {
        Args: { _kind: string; _limit: number }
        Returns: boolean
      }
      gov_assign_signal: {
        Args: {
          _due?: string
          _executor_id?: string
          _note?: string
          _signal_id: string
          _title?: string
        }
        Returns: Json
      }
      gov_call_report: { Args: { _id: string }; Returns: Json }
      gov_cancel_instruction: { Args: { _id: string }; Returns: Json }
      gov_context: { Args: never; Returns: Json }
      gov_create_instruction: {
        Args: {
          _details?: string
          _due: string
          _executor_id: string
          _municipality_id?: string
          _promise_id?: string
          _source?: string
          _title: string
        }
        Returns: Json
      }
      gov_instructions: { Args: never; Returns: Json }
      gov_log_ask: {
        Args: { _answer: Json; _ok: boolean; _question: string }
        Returns: undefined
      }
      gov_my_role: { Args: never; Returns: string }
      gov_postpone: {
        Args: { _due: string; _id: string; _note?: string }
        Returns: Json
      }
      gov_remind: { Args: { _id: string }; Returns: Json }
      gov_require: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][] }
        Returns: undefined
      }
      gov_signal_status: {
        Args: { _note?: string; _signal_id: string; _status: string }
        Returns: Json
      }
      gov_signals: { Args: never; Returns: Json }
      gov_store_brief: {
        Args: {
          _headline: string
          _items: Json
          _source: string
          _summary: string
        }
        Returns: Json
      }
      gov_today: { Args: never; Returns: Json }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _uid: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_deputy_of_department: { Args: { _dept: string }; Returns: boolean }
      msk_today: { Args: never; Returns: string }
      normalize_department: { Args: { _raw: string }; Returns: string }
      refresh_public_metrics: { Args: never; Returns: undefined }
      team_set_instruction_status: {
        Args: {
          _effect?: string
          _effect_positive?: boolean
          _id: string
          _status: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "mayor" | "deputy" | "employee" | "admin" | "governor" | "team"
      data_source_status: "active" | "warning" | "error" | "disabled"
      data_source_type: "email" | "excel" | "telegram" | "manual" | "db" | "api"
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
      ingestion_status: "success" | "error" | "partial"
      project_status: "on_track" | "risk" | "overdue" | "completed"
      staging_status:
        | "pending"
        | "parsed"
        | "normalized"
        | "rejected"
        | "promoted"
      task_status: "new" | "in_progress" | "completed" | "cancelled"
      weather_alert_severity: "info" | "warning" | "danger"
      weather_alert_type:
        | "heavy_rain"
        | "heavy_snow"
        | "extreme_heat"
        | "extreme_cold"
        | "storm"
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
    Enums: {
      app_role: ["mayor", "deputy", "employee", "admin", "governor", "team"],
      data_source_status: ["active", "warning", "error", "disabled"],
      data_source_type: ["email", "excel", "telegram", "manual", "db", "api"],
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
      ingestion_status: ["success", "error", "partial"],
      project_status: ["on_track", "risk", "overdue", "completed"],
      staging_status: [
        "pending",
        "parsed",
        "normalized",
        "rejected",
        "promoted",
      ],
      task_status: ["new", "in_progress", "completed", "cancelled"],
      weather_alert_severity: ["info", "warning", "danger"],
      weather_alert_type: [
        "heavy_rain",
        "heavy_snow",
        "extreme_heat",
        "extreme_cold",
        "storm",
      ],
    },
  },
} as const
