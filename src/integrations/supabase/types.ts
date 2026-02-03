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
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          mode: string | null
          topic: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode?: string | null
          topic?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string | null
          topic?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_attempts: {
        Row: {
          attempt_data: Json | null
          completed: boolean | null
          created_at: string | null
          id: string
          lesson_id: string
          score: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          attempt_data?: Json | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          lesson_id: string
          score?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          attempt_data?: Json | null
          completed?: boolean | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          score?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string | null
          id: string
          lesson_seed: Json | null
          order_index: number
          title: string
          unit_id: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_seed?: Json | null
          order_index: number
          title: string
          unit_id: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_seed?: Json | null
          order_index?: number
          title?: string
          unit_id?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          coach_style: string | null
          created_at: string | null
          display_name: string | null
          explain_in_english: boolean | null
          id: string
          last_activity_date: string | null
          level: string | null
          speaking_speed: string | null
          streak_days: number | null
          updated_at: string | null
          xp_points: number | null
        }
        Insert: {
          coach_style?: string | null
          created_at?: string | null
          display_name?: string | null
          explain_in_english?: boolean | null
          id: string
          last_activity_date?: string | null
          level?: string | null
          speaking_speed?: string | null
          streak_days?: number | null
          updated_at?: string | null
          xp_points?: number | null
        }
        Update: {
          coach_style?: string | null
          created_at?: string | null
          display_name?: string | null
          explain_in_english?: boolean | null
          id?: string
          last_activity_date?: string | null
          level?: string | null
          speaking_speed?: string | null
          streak_days?: number | null
          updated_at?: string | null
          xp_points?: number | null
        }
        Relationships: []
      }
      pronunciation_attempts: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          similarity_score: number | null
          target_text: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          similarity_score?: number | null
          target_text: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          similarity_score?: number | null
          target_text?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      user_vocab_progress: {
        Row: {
          id: string
          last_seen: string | null
          strength: number | null
          times_correct: number | null
          times_missed: number | null
          user_id: string
          vocab_id: string
        }
        Insert: {
          id?: string
          last_seen?: string | null
          strength?: number | null
          times_correct?: number | null
          times_missed?: number | null
          user_id: string
          vocab_id: string
        }
        Update: {
          id?: string
          last_seen?: string | null
          strength?: number | null
          times_correct?: number | null
          times_missed?: number | null
          user_id?: string
          vocab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vocab_progress_vocab_id_fkey"
            columns: ["vocab_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_items: {
        Row: {
          created_at: string | null
          english: string
          id: string
          pronunciation_hint: string | null
          spanish: string
          tags: string[] | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          english: string
          id?: string
          pronunciation_hint?: string | null
          spanish: string
          tags?: string[] | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          english?: string
          id?: string
          pronunciation_hint?: string | null
          spanish?: string
          tags?: string[] | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
