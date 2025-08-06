import { Database } from '@/lib/supabase'

// Database types
export type WarmupCampaign = Database['public']['Tables']['warmup_campaigns']['Row']
export type WarmupCampaignInsert = Database['public']['Tables']['warmup_campaigns']['Insert']
export type WarmupCampaignUpdate = Database['public']['Tables']['warmup_campaigns']['Update']

export type WarmupEmail = Database['public']['Tables']['warmup_emails']['Row']
export type WarmupEmailInsert = Database['public']['Tables']['warmup_emails']['Insert']
export type WarmupEmailUpdate = Database['public']['Tables']['warmup_emails']['Update']

// Campaign status types
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'failed'

// Extended campaign types with calculated fields
export interface CampaignWithMetrics extends WarmupCampaign {
  totalEmailsSent: number
  totalEmailsDelivered: number
  deliveryRate: number
  progressPercentage: number
  emailAccountEmail: string
}

// Campaign settings interface
export interface CampaignSettings extends Record<string, unknown> {
  startHour: number // 0-23, hour to start sending emails
  endHour: number // 0-23, hour to stop sending emails
  timezone: string // timezone identifier
  subjectTemplates: string[] // custom subject line templates
  replyRate: number // 0-100, percentage of emails that should receive replies
  readRate: number // 0-100, percentage of emails that should be marked as read
  spamFolderRate: number // 0-100, percentage that should go to spam folder
  enableWeekends: boolean // whether to send on weekends
  customDomains: string[] // custom domains to send to
  customRecipients: string[] // specific recipients to include
}

// Default campaign settings
export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  startHour: 9,
  endHour: 17,
  timezone: 'America/New_York',
  subjectTemplates: [
    'Quick question about your services',
    'Following up on our conversation',
    'Partnership opportunity',
    'Introduction and collaboration',
    'Meeting request',
    'Quick catch-up call?',
    'Project discussion',
    'Business proposal',
    'Networking opportunity'
  ],
  replyRate: 25,
  readRate: 85,
  spamFolderRate: 5,
  enableWeekends: false,
  customDomains: [],
  customRecipients: []
}

// Campaign creation wizard steps
export interface CampaignWizardStep {
  id: string
  title: string
  description: string
  isComplete: boolean
}

// Campaign analytics data
export interface CampaignAnalytics {
  campaignId: string
  totalEmails: number
  sentEmails: number
  deliveredEmails: number
  failedEmails: number
  deliveryRate: number
  reputationScore: number
  dailyStats: DailyCampaignStats[]
}

export interface DailyCampaignStats {
  date: string
  emailsSent: number
  emailsDelivered: number
  emailsFailed: number
  deliveryRate: number
  reputationScore: number
}

// Email generation templates
export interface EmailTemplate {
  subject: string
  content: string
  type: 'business' | 'follow-up' | 'introduction' | 'meeting'
}

// Ramp-up strategy types
export type RampUpStrategy = 'linear' | 'exponential' | 'custom'

export interface RampUpConfig {
  strategy: RampUpStrategy
  initialVolume: number
  targetVolume: number
  rampUpDays: number
  customSchedule?: number[] // For custom strategy
}

// Campaign filters for list view
export interface CampaignFilters {
  status?: CampaignStatus[]
  emailAccountId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
}

// Campaign sorting options
export type CampaignSortBy = 'name' | 'created_at' | 'status' | 'progress' | 'daily_volume'
export type SortOrder = 'asc' | 'desc'

export interface CampaignSort {
  sortBy: CampaignSortBy
  order: SortOrder
}
