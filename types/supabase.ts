export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          role: 'ADMIN' | 'CUSTOMER'
          state: 'active' | 'blocked'
          email_verified: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string
          role?: 'ADMIN' | 'CUSTOMER'
          state?: 'active' | 'blocked'
          email_verified?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          role?: 'ADMIN' | 'CUSTOMER'
          state?: 'active' | 'blocked'
          email_verified?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string
          country: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone?: string
          country?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string
          country?: string
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          name: string
          address: string
          timezone: string
          currency: string
          weekday_price_night: number
          weekend_price_night: number
          cleaning_fee: number
          vat_percent: number
          min_nights: number
          max_nights: number
          max_adults: number
          max_children: number
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          timezone: string
          currency: string
          weekday_price_night: number
          weekend_price_night: number
          cleaning_fee?: number
          vat_percent?: number
          min_nights?: number
          max_nights?: number
          max_adults?: number
          max_children?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          timezone?: string
          currency?: string
          weekday_price_night?: number
          weekend_price_night?: number
          cleaning_fee?: number
          vat_percent?: number
          min_nights?: number
          max_nights?: number
          max_adults?: number
          max_children?: number
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          property_id: string
          user_id: string
          check_in: string
          check_out: string
          nights: number
          adults: number
          children: number
          total: number
          status: 'PENDING' | 'AWAITING_APPROVAL' | 'APPROVED' | 'PAID' | 'CANCELLED'
          guest_notes: string | null
          admin_notes: string | null
          coupon_code: string | null
          discount_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          user_id: string
          check_in: string
          check_out: string
          nights: number
          adults: number
          children: number
          total: number
          status?: 'PENDING' | 'AWAITING_APPROVAL' | 'APPROVED' | 'PAID' | 'CANCELLED'
          guest_notes?: string | null
          admin_notes?: string | null
          coupon_code?: string | null
          discount_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          user_id?: string
          check_in?: string
          check_out?: string
          nights?: number
          adults?: number
          children?: number
          total?: number
          status?: 'PENDING' | 'AWAITING_APPROVAL' | 'APPROVED' | 'PAID' | 'CANCELLED'
          guest_notes?: string | null
          admin_notes?: string | null
          coupon_code?: string | null
          discount_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      blocked_periods: {
        Row: {
          id: string
          property_id: string
          start_date: string
          end_date: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          start_date: string
          end_date: string
          reason?: string
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          start_date?: string
          end_date?: string
          reason?: string
          created_at?: string
        }
      }
      seasons: {
        Row: {
          id: string
          property_id: string
          name: string
          start_date: string
          end_date: string
          price_per_night: number
          price_per_adult: number
          price_per_child: number
          min_nights: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          name: string
          start_date: string
          end_date: string
          price_per_night: number
          price_per_adult?: number
          price_per_child?: number
          min_nights?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          name?: string
          start_date?: string
          end_date?: string
          price_per_night?: number
          price_per_adult?: number
          price_per_child?: number
          min_nights?: number
          created_at?: string
          updated_at?: string
        }
      }
      custom_pricing: {
        Row: {
          id: string
          property_id: string
          date: string
          price_per_night: number
          price_per_adult: number | null
          price_per_child: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          date: string
          price_per_night: number
          price_per_adult?: number | null
          price_per_child?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          date?: string
          price_per_night?: number
          price_per_adult?: number | null
          price_per_child?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string
          discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
          discount_value: number
          max_uses: number
          used_count: number
          valid_from: string
          valid_until: string
          min_nights: number | null
          min_amount: number | null
          is_active: boolean
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string
          discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
          discount_value: number
          max_uses?: number
          used_count?: number
          valid_from: string
          valid_until: string
          min_nights?: number | null
          min_amount?: number | null
          is_active?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          discount_type?: 'PERCENTAGE' | 'FIXED_AMOUNT'
          discount_value?: number
          max_uses?: number
          used_count?: number
          valid_from?: string
          valid_until?: string
          min_nights?: number | null
          min_amount?: number | null
          is_active?: boolean
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      verification_tokens: {
        Row: {
          id: string
          token: string
          user_id: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          user_id: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          token?: string
          user_id?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          reservation_id: string
          amount: number
          provider: 'PAYPAL' | 'PAYTABS' | 'HYPERPAY'
          provider_payment_id: string
          status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
          webhook_data: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          amount: number
          provider: 'PAYPAL' | 'PAYTABS' | 'HYPERPAY'
          provider_payment_id: string
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
          webhook_data?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string
          amount?: number
          provider?: 'PAYPAL' | 'PAYTABS' | 'HYPERPAY'
          provider_payment_id?: string
          status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
          webhook_data?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_user_id: string | null
          action: string
          target_type: string
          target_id: string
          payload: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_user_id?: string | null
          action: string
          target_type: string
          target_id: string
          payload?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_user_id?: string | null
          action?: string
          target_type?: string
          target_id?: string
          payload?: Record<string, any> | null
          created_at?: string
        }
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
  }
}