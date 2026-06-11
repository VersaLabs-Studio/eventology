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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string
          id: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          latency_ms: number
          model_used: string
          prompt_hash: string
          response: string
          tokens_used: number
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          latency_ms?: number
          model_used: string
          prompt_hash: string
          response: string
          tokens_used?: number
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          latency_ms?: number
          model_used?: string
          prompt_hash?: string
          response?: string
          tokens_used?: number
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          target_id: string | null
          target_label: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_label?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          event_count: number
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          event_count?: number
          icon: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          event_count?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          last_message: string | null
          last_message_at: string | null
          metadata: Json | null
          participant_ids: string[]
          subject: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          participant_ids?: string[]
          subject?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          participant_ids?: string[]
          subject?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_views: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_id: string
          id: string
          ip_hash: string | null
          referer: string | null
          session_id: string | null
          sub_city: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_id: string
          id?: string
          ip_hash?: string | null
          referer?: string | null
          session_id?: string | null
          sub_city?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_id?: string
          id?: string
          ip_hash?: string | null
          referer?: string | null
          session_id?: string | null
          sub_city?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image: string | null
          capacity: number
          category_id: string
          created_at: string
          description: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          featured_until: string | null
          gallery: string[] | null
          id: string
          is_featured: boolean
          latitude: number | null
          location: unknown
          longitude: number | null
          metadata: Json | null
          organizer_id: string
          registrations_count: number
          rejection_reason: string | null
          short_description: string | null
          slug: string
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          sub_city: string | null
          tags: string[] | null
          ticket_type: Database["public"]["Enums"]["ticket_type"]
          timezone: string
          title: string
          updated_at: string
          venue_address: string | null
          venue_id: string | null
          venue_name: string | null
          views_count: number
        }
        Insert: {
          banner_image?: string | null
          capacity?: number
          category_id: string
          created_at?: string
          description?: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          featured_until?: string | null
          gallery?: string[] | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          metadata?: Json | null
          organizer_id: string
          registrations_count?: number
          rejection_reason?: string | null
          short_description?: string | null
          slug: string
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          sub_city?: string | null
          tags?: string[] | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          timezone?: string
          title: string
          updated_at?: string
          venue_address?: string | null
          venue_id?: string | null
          venue_name?: string | null
          views_count?: number
        }
        Update: {
          banner_image?: string | null
          capacity?: number
          category_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          featured_until?: string | null
          gallery?: string[] | null
          id?: string
          is_featured?: boolean
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          metadata?: Json | null
          organizer_id?: string
          registrations_count?: number
          rejection_reason?: string | null
          short_description?: string | null
          slug?: string
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          sub_city?: string | null
          tags?: string[] | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"]
          timezone?: string
          title?: string
          updated_at?: string
          venue_address?: string | null
          venue_id?: string | null
          venue_name?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          read_by: string[] | null
          sender_id: string | null
          type: Database["public"]["Enums"]["message_type"]
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_by?: string[] | null
          sender_id?: string | null
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_by?: string[] | null
          sender_id?: string | null
          type?: Database["public"]["Enums"]["message_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_team_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string
          organizer_id: string
          profile_id: string
          role: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          organizer_id: string
          profile_id: string
          role?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          organizer_id?: string
          profile_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_team_members_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          events_count: number
          id: string
          is_verified: boolean
          metadata: Json | null
          name: string
          phone: string | null
          profile_id: string
          slug: string
          social_links: Json | null
          stripe_account_id: string | null
          total_attendees: number
          updated_at: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          events_count?: number
          id?: string
          is_verified?: boolean
          metadata?: Json | null
          name: string
          phone?: string | null
          profile_id: string
          slug: string
          social_links?: Json | null
          stripe_account_id?: string | null
          total_attendees?: number
          updated_at?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          events_count?: number
          id?: string
          is_verified?: boolean
          metadata?: Json | null
          name?: string
          phone?: string | null
          profile_id?: string
          slug?: string
          social_links?: Json | null
          stripe_account_id?: string | null
          total_attendees?: number
          updated_at?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          event_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          organizer_amount: number
          paid_at: string | null
          platform_fee: number
          provider: string | null
          provider_metadata: Json | null
          provider_ref: string | null
          refunded_at: string | null
          registration_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organizer_amount?: number
          paid_at?: string | null
          platform_fee?: number
          provider?: string | null
          provider_metadata?: Json | null
          provider_ref?: string | null
          refunded_at?: string | null
          registration_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          organizer_amount?: number
          paid_at?: string | null
          platform_fee?: number
          provider?: string | null
          provider_metadata?: Json | null
          provider_ref?: string | null
          refunded_at?: string | null
          registration_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          bank_account: Json | null
          completed_at: string | null
          created_at: string
          currency: string
          event_id: string | null
          id: string
          notes: string | null
          organizer_id: string
          processed_at: string | null
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account?: Json | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          organizer_id: string
          processed_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account?: Json | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          organizer_id?: string
          processed_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          phone: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          social_links: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_seen_at?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          applicable_tiers: string[] | null
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          event_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          max_uses: number | null
          max_uses_per_user: number
          metadata: Json | null
          organizer_id: string | null
          starts_at: string
          updated_at: string
          used_count: number
        }
        Insert: {
          applicable_tiers?: string[] | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          metadata?: Json | null
          organizer_id?: string | null
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          applicable_tiers?: string[] | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["promo_discount_type"]
          discount_value?: number
          event_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          metadata?: Json | null
          organizer_id?: string | null
          starts_at?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          attendee_email: string
          attendee_name: string
          attendee_phone: string | null
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          metadata: Json | null
          qr_data: string
          status: Database["public"]["Enums"]["registration_status"]
          ticket_tier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendee_email: string
          attendee_name: string
          attendee_phone?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          metadata?: Json | null
          qr_data: string
          status?: Database["public"]["Enums"]["registration_status"]
          ticket_tier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendee_email?: string
          attendee_name?: string
          attendee_phone?: string | null
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          qr_data?: string
          status?: Database["public"]["Enums"]["registration_status"]
          ticket_tier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          event_id: string
          flag_reason: string | null
          id: string
          is_approved: boolean
          is_flagged: boolean
          metadata: Json | null
          moderated_at: string | null
          moderated_by: string | null
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          event_id: string
          flag_reason?: string | null
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          metadata?: Json | null
          moderated_at?: string | null
          moderated_by?: string | null
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          event_id?: string
          flag_reason?: string | null
          id?: string
          is_approved?: boolean
          is_flagged?: boolean
          metadata?: Json | null
          moderated_at?: string | null
          moderated_by?: string | null
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          ipAddress?: string | null
          token: string
          updatedAt: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          logo_url: string | null
          metadata: Json | null
          name: string
          sort_order: number
          tier: Database["public"]["Enums"]["sponsor_tier"]
          updated_at: string
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["sponsor_tier"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["sponsor_tier"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tiers: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          price: number
          sold_count: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sold_count?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          event_id: string
          id: string
          issued_at: string
          qr_data: string
          registration_id: string
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          tier_name: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          issued_at?: string
          qr_data: string
          registration_id: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
          tier_name: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          issued_at?: string
          qr_data?: string
          registration_id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string
          tier_name?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          avatar_url: string | null
          createdAt: string
          email: string
          emailVerified: boolean
          full_name: string | null
          id: string
          image: string | null
          name: string
          phone: string | null
          role: string
          updatedAt: string
        }
        Insert: {
          avatar_url?: string | null
          createdAt?: string
          email: string
          emailVerified: boolean
          full_name?: string | null
          id: string
          image?: string | null
          name: string
          phone?: string | null
          role: string
          updatedAt?: string
        }
        Update: {
          avatar_url?: string | null
          createdAt?: string
          email?: string
          emailVerified?: boolean
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string
          phone?: string | null
          role?: string
          updatedAt?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          amenities: string[] | null
          capacity: number | null
          city: string
          contact_email: string | null
          contact_phone: string | null
          country: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          location: unknown
          longitude: number | null
          name: string
          slug: string
          sub_city: string
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          capacity?: number | null
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name: string
          slug: string
          sub_city: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          capacity?: number | null
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          location?: unknown
          longitude?: number | null
          name?: string
          slug?: string
          sub_city?: string
          updated_at?: string
        }
        Relationships: []
      }
      verification: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string
          value: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string
          value: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_ai_cache: { Args: never; Returns: number }
      create_registration_atomic: {
        Args: {
          p_attendee_email: string
          p_attendee_name: string
          p_attendee_phone?: string
          p_event_id: string
          p_metadata?: Json
          p_qr_data?: string
          p_ticket_tier_id: string
          p_user_id: string
        }
        Returns: Json
      }
      decrement_sold_count: { Args: { tier_id: string }; Returns: undefined }
      increment_sold_count: { Args: { tier_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_event_organizer: { Args: { p_event_id: string }; Returns: boolean }
      is_organizer: { Args: { p_organizer_id: string }; Returns: boolean }
      is_team_member: { Args: { p_organizer_id: string }; Returns: boolean }
      validate_promo_code: {
        Args: { p_code: string; p_event_id: string; p_user_id: string }
        Returns: {
          discount_type: Database["public"]["Enums"]["promo_discount_type"]
          discount_value: number
          error_message: string
          is_valid: boolean
          max_discount: number
        }[]
      }
    }
    Enums: {
      audit_action:
        | "event_approved"
        | "event_rejected"
        | "event_featured"
        | "event_unfeatured"
        | "organizer_verified"
        | "organizer_rejected"
        | "user_role_changed"
        | "user_deactivated"
        | "user_activated"
        | "registration_created"
        | "payment_completed"
        | "system_config_changed"
      conversation_type: "direct" | "event_inquiry" | "support"
      event_status: "draft" | "pending" | "approved" | "rejected" | "cancelled"
      event_type:
        | "conference"
        | "workshop"
        | "meetup"
        | "seminar"
        | "networking"
        | "concert"
        | "exhibition"
        | "training"
      featured_duration: "7_days" | "14_days" | "30_days"
      message_type: "text" | "image" | "system"
      notification_type:
        | "registration_confirmed"
        | "event_reminder"
        | "event_cancelled"
        | "event_approved"
        | "event_rejected"
        | "new_registration"
        | "payment_received"
        | "message_received"
        | "system_announcement"
      payment_method: "pay_at_door" | "chapa" | "telebirr" | "bank_transfer"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      payout_status: "pending" | "processing" | "completed" | "failed"
      promo_discount_type: "percentage" | "fixed"
      registration_status:
        | "confirmed"
        | "cancelled"
        | "checked_in"
        | "waitlisted"
        | "pending_payment"
      seat_status: "available" | "reserved" | "sold" | "blocked"
      section_type: "general" | "vip" | "stage" | "standing" | "accessible"
      sponsor_tier: "platinum" | "gold" | "silver" | "bronze"
      ticket_status: "valid" | "used" | "cancelled"
      ticket_type: "free" | "paid"
      user_role: "attendee" | "organizer" | "admin"
      verification_status: "pending" | "verified" | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action: [
        "event_approved",
        "event_rejected",
        "event_featured",
        "event_unfeatured",
        "organizer_verified",
        "organizer_rejected",
        "user_role_changed",
        "user_deactivated",
        "user_activated",
        "registration_created",
        "payment_completed",
        "system_config_changed",
      ],
      conversation_type: ["direct", "event_inquiry", "support"],
      event_status: ["draft", "pending", "approved", "rejected", "cancelled"],
      event_type: [
        "conference",
        "workshop",
        "meetup",
        "seminar",
        "networking",
        "concert",
        "exhibition",
        "training",
      ],
      featured_duration: ["7_days", "14_days", "30_days"],
      message_type: ["text", "image", "system"],
      notification_type: [
        "registration_confirmed",
        "event_reminder",
        "event_cancelled",
        "event_approved",
        "event_rejected",
        "new_registration",
        "payment_received",
        "message_received",
        "system_announcement",
      ],
      payment_method: ["pay_at_door", "chapa", "telebirr", "bank_transfer"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      payout_status: ["pending", "processing", "completed", "failed"],
      promo_discount_type: ["percentage", "fixed"],
      registration_status: [
        "confirmed",
        "cancelled",
        "checked_in",
        "waitlisted",
        "pending_payment",
      ],
      seat_status: ["available", "reserved", "sold", "blocked"],
      section_type: ["general", "vip", "stage", "standing", "accessible"],
      sponsor_tier: ["platinum", "gold", "silver", "bronze"],
      ticket_status: ["valid", "used", "cancelled"],
      ticket_type: ["free", "paid"],
      user_role: ["attendee", "organizer", "admin"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
