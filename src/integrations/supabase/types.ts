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
      ai_companions: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          companion_type: string
          created_at: string | null
          creator_id: string | null
          currency: string | null
          description: string | null
          dominance: number | null
          empathy: number | null
          humor: number | null
          id: string
          intelligence: number | null
          interests: string[] | null
          is_active: boolean | null
          loyalty: number | null
          lust: number | null
          name: string
          playfulness: number | null
          price_per_message: number
          romance: number | null
          system_prompt: string
          tagline: string | null
          total_chats: number | null
          updated_at: string | null
          voice_tone: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          companion_type: string
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          dominance?: number | null
          empathy?: number | null
          humor?: number | null
          id?: string
          intelligence?: number | null
          interests?: string[] | null
          is_active?: boolean | null
          loyalty?: number | null
          lust?: number | null
          name: string
          playfulness?: number | null
          price_per_message?: number
          romance?: number | null
          system_prompt: string
          tagline?: string | null
          total_chats?: number | null
          updated_at?: string | null
          voice_tone?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          companion_type?: string
          created_at?: string | null
          creator_id?: string | null
          currency?: string | null
          description?: string | null
          dominance?: number | null
          empathy?: number | null
          humor?: number | null
          id?: string
          intelligence?: number | null
          interests?: string[] | null
          is_active?: boolean | null
          loyalty?: number | null
          lust?: number | null
          name?: string
          playfulness?: number | null
          price_per_message?: number
          romance?: number | null
          system_prompt?: string
          tagline?: string | null
          total_chats?: number | null
          updated_at?: string | null
          voice_tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_companions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_type: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_type: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "user_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_reviews: {
        Row: {
          companion_id: string | null
          created_at: string | null
          id: string
          rating: number | null
          review_text: string | null
          user_id: string | null
        }
        Insert: {
          companion_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review_text?: string | null
          user_id?: string | null
        }
        Update: {
          companion_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          review_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companion_reviews_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: string[] | null
          updated_at: string
          user_id: string
          username: string | null
          verified_badge_id: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified_badge_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified_badge_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_chats: {
        Row: {
          companion_id: string
          created_at: string
          id: string
          last_message_at: string | null
          total_messages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          companion_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          total_messages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          companion_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          total_messages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_chats_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_chat_message_count: {
        Args: { chat_id_param: string }
        Returns: undefined
      }
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
