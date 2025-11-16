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
          access_price: number
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
          romance: number | null
          system_prompt: string
          tagline: string | null
          total_chats: number | null
          updated_at: string | null
          voice_tone: string | null
        }
        Insert: {
          access_price?: number
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
          romance?: number | null
          system_prompt: string
          tagline?: string | null
          total_chats?: number | null
          updated_at?: string | null
          voice_tone?: string | null
        }
        Update: {
          access_price?: number
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
      badges: {
        Row: {
          badge_type: string
          color: string | null
          created_at: string | null
          criteria: Json
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          badge_type?: string
          color?: string | null
          created_at?: string | null
          criteria: Json
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          badge_type?: string
          color?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      call_history: {
        Row: {
          call_type: string
          caller_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          match_id: string
          receiver_id: string
          started_at: string
          status: string
        }
        Insert: {
          call_type?: string
          caller_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          match_id: string
          receiver_id: string
          started_at?: string
          status?: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          match_id?: string
          receiver_id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          audio_duration: number | null
          chat_id: string
          content: string
          created_at: string
          id: string
          listened: boolean | null
          media_thumbnail: string | null
          media_type: string | null
          media_url: string | null
          reply_to_message_id: string | null
          sender_type: string
        }
        Insert: {
          audio_duration?: number | null
          chat_id: string
          content: string
          created_at?: string
          id?: string
          listened?: boolean | null
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          reply_to_message_id?: string | null
          sender_type: string
        }
        Update: {
          audio_duration?: number | null
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          listened?: boolean | null
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          reply_to_message_id?: string | null
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
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_access: {
        Row: {
          access_price: number
          companion_id: string
          created_at: string
          id: string
          purchased_at: string
          transaction_signature: string | null
          user_id: string
        }
        Insert: {
          access_price?: number
          companion_id: string
          created_at?: string
          id?: string
          purchased_at?: string
          transaction_signature?: string | null
          user_id: string
        }
        Update: {
          access_price?: number
          companion_id?: string
          created_at?: string
          id?: string
          purchased_at?: string
          transaction_signature?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_access_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
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
      creator_earnings: {
        Row: {
          amount: number
          companion_id: string
          created_at: string
          creator_id: string
          id: string
          paid_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          companion_id: string
          created_at?: string
          creator_id: string
          id?: string
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          companion_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_chat_usage: {
        Row: {
          created_at: string | null
          id: string
          message_count: number
          updated_at: string | null
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_count?: number
          updated_at?: string | null
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_count?: number
          updated_at?: string | null
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          unread_count_1: number | null
          unread_count_2: number | null
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          unread_count_1?: number | null
          unread_count_2?: number | null
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          unread_count_1?: number | null
          unread_count_2?: number | null
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_id_1_profiles_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_user_id_2_profiles_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      message_deletions: {
        Row: {
          deleted_at: string
          id: string
          message_id: string
          message_type: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          id?: string
          message_id: string
          message_type: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          id?: string
          message_id?: string
          message_type?: string
          user_id?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "user_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_drafts: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          can_create_companion: boolean | null
          cover_photo_url: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: string[] | null
          is_verified: boolean | null
          social_links: Json | null
          updated_at: string
          user_id: string
          username: string | null
          verification_documents: Json | null
          verification_status: string | null
          verification_type: string | null
          verified_badge_id: string | null
          wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          can_create_companion?: boolean | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          is_verified?: boolean | null
          social_links?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verification_type?: string | null
          verified_badge_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          can_create_companion?: boolean | null
          cover_photo_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[] | null
          is_verified?: boolean | null
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verification_type?: string | null
          verified_badge_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content_id: string | null
          content_type: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_id: string | null
          reporter_id: string
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_id?: string | null
          reporter_id: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string | null
          reporter_id?: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      super_like_notifications: {
        Row: {
          created_at: string | null
          id: string
          recipient_id: string
          sender_id: string
          viewed: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipient_id: string
          sender_id: string
          viewed?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipient_id?: string
          sender_id?: string
          viewed?: boolean | null
        }
        Relationships: []
      }
      super_like_usage: {
        Row: {
          count: number
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          count?: number
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          count?: number
          id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          action: string
          created_at: string | null
          id: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      undo_usage: {
        Row: {
          count: number
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          count?: number
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          count?: number
          id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
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
      user_messages: {
        Row: {
          audio_duration: number | null
          content: string
          created_at: string | null
          id: string
          listened: boolean | null
          match_id: string
          media_thumbnail: string | null
          media_type: string | null
          media_url: string | null
          read: boolean | null
          reply_to_message_id: string | null
          sender_id: string
        }
        Insert: {
          audio_duration?: number | null
          content: string
          created_at?: string | null
          id?: string
          listened?: boolean | null
          match_id: string
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          read?: boolean | null
          reply_to_message_id?: string | null
          sender_id: string
        }
        Update: {
          audio_duration?: number | null
          content?: string
          created_at?: string | null
          id?: string
          listened?: boolean | null
          match_id?: string
          media_thumbnail?: string | null
          media_type?: string | null
          media_url?: string | null
          read?: boolean | null
          reply_to_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "user_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_seen: string | null
          online: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          last_seen?: string | null
          online?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          last_seen?: string | null
          online?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      accept_chat_request: { Args: { request_id: string }; Returns: string }
      check_and_award_badges: {
        Args: { check_user_id: string }
        Returns: undefined
      }
      check_daily_chat_limit: { Args: { p_user_id: string }; Returns: Json }
      check_super_like_limit: { Args: { p_user_id: string }; Returns: Json }
      check_undo_limit: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_chat_message_count: {
        Args: { chat_id_param: string }
        Returns: undefined
      }
      user_has_companion_access: {
        Args: { _companion_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "creator" | "moderator" | "admin"
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
      app_role: ["user", "creator", "moderator", "admin"],
    },
  },
} as const
