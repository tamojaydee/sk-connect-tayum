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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      barangay_budgets: {
        Row: {
          available_budget: number
          barangay_id: string
          created_at: string | null
          id: string
          total_budget: number
          updated_at: string | null
        }
        Insert: {
          available_budget?: number
          barangay_id: string
          created_at?: string | null
          id?: string
          total_budget?: number
          updated_at?: string | null
        }
        Update: {
          available_budget?: number
          barangay_id?: string
          created_at?: string | null
          id?: string
          total_budget?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barangay_budgets_barangay_id_fkey"
            columns: ["barangay_id"]
            isOneToOne: true
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      barangays: {
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
      budget_transactions: {
        Row: {
          amount: number
          barangay_id: string
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          related_event_id: string | null
          related_project_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          barangay_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          related_event_id?: string | null
          related_project_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          barangay_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          related_event_id?: string | null
          related_project_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_transactions_barangay_id_fkey"
            columns: ["barangay_id"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transactions_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transactions_related_project_id_fkey"
            columns: ["related_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          barangay_id: string
          created_at: string | null
          created_by: string
          description: string | null
          document_type: string
          file_url: string | null
          id: string
          is_public: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          barangay_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          document_type: string
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          barangay_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_barangay_id_fkey"
            columns: ["barangay_id"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          barangay_id: string
          budget: number | null
          created_at: string | null
          created_by: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          barangay_id: string
          budget?: number | null
          created_at?: string | null
          created_by: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          barangay_id?: string
          budget?: number | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_barangay_id_fkey"
            columns: ["barangay_id"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_settings: {
        Row: {
          hero_background_url: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          hero_background_url?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          hero_background_url?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          barangay_id: string | null
          contact_number: string | null
          created_at: string | null
          email: string
          facebook_url: string | null
          full_name: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          term_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          barangay_id?: string | null
          contact_number?: string | null
          created_at?: string | null
          email: string
          facebook_url?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          term_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          barangay_id?: string | null
          contact_number?: string | null
          created_at?: string | null
          email?: string
          facebook_url?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          term_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_barangay_id_fkey"
            columns: ["barangay_id"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_url: string
          project_id: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url: string
          project_id: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_url?: string
          project_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          barangay_id: string
          budget: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          progress: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          barangay_id: string
          budget?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          barangay_id?: string
          budget?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          progress?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_barangay_id_fkey"
            columns: ["barangay_id"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      slideshow_images: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_insights: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          report_type: string
          survey_month: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_type: string
          survey_month: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          report_type?: string
          survey_month?: string
          updated_at?: string
        }
        Relationships: []
      }
      surveys: {
        Row: {
          address: string | null
          age: number
          available_time: string | null
          barangay_id: string
          contact_number: string | null
          created_at: string
          duration_years: number | null
          email: string | null
          favorite_activity: string | null
          full_name: string
          gender: string
          has_participated: boolean
          id: string
          impact_description: string | null
          improvement_suggestions: string | null
          interest_areas: string[] | null
          interested_in_joining: boolean
          participation_type: string | null
          preferred_activities: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          age: number
          available_time?: string | null
          barangay_id: string
          contact_number?: string | null
          created_at?: string
          duration_years?: number | null
          email?: string | null
          favorite_activity?: string | null
          full_name: string
          gender: string
          has_participated?: boolean
          id?: string
          impact_description?: string | null
          improvement_suggestions?: string | null
          interest_areas?: string[] | null
          interested_in_joining?: boolean
          participation_type?: string | null
          preferred_activities?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          age?: number
          available_time?: string | null
          barangay_id?: string
          contact_number?: string | null
          created_at?: string
          duration_years?: number | null
          email?: string | null
          favorite_activity?: string | null
          full_name?: string
          gender?: string
          has_participated?: boolean
          id?: string
          impact_description?: string | null
          improvement_suggestions?: string | null
          interest_areas?: string[] | null
          interested_in_joining?: boolean
          participation_type?: string | null
          preferred_activities?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_barangay_id_fkey"
            columns: ["barangay_id"]
            isOneToOne: false
            referencedRelation: "barangays"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_barangay_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "main_admin" | "sk_chairman" | "kagawad"
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
      user_role: ["main_admin", "sk_chairman", "kagawad"],
    },
  },
} as const
