import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      tenant_members: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      email_accounts: {
        Row: {
          id: string
          tenant_id: string
          email: string
          provider: 'ms365'
          access_token: string | null
          refresh_token: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          provider?: 'ms365'
          access_token?: string | null
          refresh_token?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          provider?: 'ms365'
          access_token?: string | null
          refresh_token?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      warmup_campaigns: {
        Row: {
          id: string
          tenant_id: string
          email_account_id: string
          name: string
          status: 'draft' | 'active' | 'paused' | 'completed'
          daily_volume: number
          ramp_up_days: number
          current_day: number
          settings: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email_account_id: string
          name: string
          status?: 'draft' | 'active' | 'paused' | 'completed'
          daily_volume?: number
          ramp_up_days?: number
          current_day?: number
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email_account_id?: string
          name?: string
          status?: 'draft' | 'active' | 'paused' | 'completed'
          daily_volume?: number
          ramp_up_days?: number
          current_day?: number
          settings?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      warmup_emails: {
        Row: {
          id: string
          campaign_id: string
          sender_email: string
          recipient_email: string
          subject: string
          status: 'pending' | 'sent' | 'delivered' | 'failed'
          sent_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          sender_email: string
          recipient_email: string
          subject: string
          status?: 'pending' | 'sent' | 'delivered' | 'failed'
          sent_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          sender_email?: string
          recipient_email?: string
          subject?: string
          status?: 'pending' | 'sent' | 'delivered' | 'failed'
          sent_at?: string | null
          delivered_at?: string | null
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
