import { supabase } from '@/lib/supabase'
import { 
  WarmupCampaign, 
  WarmupCampaignInsert, 
  WarmupCampaignUpdate,
  WarmupEmail,
  WarmupEmailInsert,
  CampaignWithMetrics,
  CampaignAnalytics,
  DailyCampaignStats,
  CampaignFilters,
  CampaignSort,
  EmailTemplate,
  DEFAULT_CAMPAIGN_SETTINGS
} from '@/types/campaigns'
import { v4 as uuidv4 } from 'uuid'

export class CampaignService {
  // Campaign CRUD operations
  static async createCampaign(campaign: WarmupCampaignInsert): Promise<WarmupCampaign> {
    const campaignData = {
      ...campaign,
      id: uuidv4(),
      settings: campaign.settings || DEFAULT_CAMPAIGN_SETTINGS,
      status: campaign.status || 'draft',
      daily_volume: campaign.daily_volume || 5,
      ramp_up_days: campaign.ramp_up_days || 30,
      current_day: campaign.current_day || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('warmup_campaigns')
      .insert(campaignData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getCampaignsByTenant(tenantId: string, filters?: CampaignFilters, sort?: CampaignSort): Promise<CampaignWithMetrics[]> {
    let query = supabase
      .from('warmup_campaigns')
      .select(`
        *,
        email_accounts!warmup_campaigns_email_account_id_fkey(email)
      `)
      .eq('tenant_id', tenantId)

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters?.emailAccountId) {
      query = query.eq('email_account_id', filters.emailAccountId)
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start.toISOString())
        .lte('created_at', filters.dateRange.end.toISOString())
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.sortBy, { ascending: sort.order === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) throw error

    // Enrich with metrics
    const campaignsWithMetrics: CampaignWithMetrics[] = []
    
    for (const campaign of data || []) {
      const metrics = await this.getCampaignMetrics(campaign.id)
      campaignsWithMetrics.push({
        ...campaign,
        emailAccountEmail: campaign.email_accounts?.email || '',
        ...metrics
      })
    }

    return campaignsWithMetrics
  }

  static async getCampaignById(campaignId: string): Promise<WarmupCampaign | null> {
    const { data, error } = await supabase
      .from('warmup_campaigns')
      .select()
      .eq('id', campaignId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  }

  static async updateCampaign(campaignId: string, updates: WarmupCampaignUpdate): Promise<WarmupCampaign> {
    const { data, error } = await supabase
      .from('warmup_campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteCampaign(campaignId: string): Promise<void> {
    // First delete all associated emails
    await supabase
      .from('warmup_emails')
      .delete()
      .eq('campaign_id', campaignId)

    // Then delete the campaign
    const { error } = await supabase
      .from('warmup_campaigns')
      .delete()
      .eq('id', campaignId)

    if (error) throw error
  }

  // Campaign status management
  static async startCampaign(campaignId: string): Promise<WarmupCampaign> {
    return this.updateCampaign(campaignId, { 
      status: 'active',
      current_day: 0
    })
  }

  static async pauseCampaign(campaignId: string): Promise<WarmupCampaign> {
    return this.updateCampaign(campaignId, { status: 'paused' })
  }

  static async stopCampaign(campaignId: string): Promise<WarmupCampaign> {
    return this.updateCampaign(campaignId, { status: 'completed' })
  }

  static async resumeCampaign(campaignId: string): Promise<WarmupCampaign> {
    return this.updateCampaign(campaignId, { status: 'active' })
  }

  // Email operations
  static async createWarmupEmail(email: WarmupEmailInsert): Promise<WarmupEmail> {
    const emailData = {
      ...email,
      id: uuidv4(),
      status: email.status || 'pending',
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('warmup_emails')
      .insert(emailData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getEmailsByCampaign(campaignId: string): Promise<WarmupEmail[]> {
    const { data, error } = await supabase
      .from('warmup_emails')
      .select()
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async updateEmailStatus(emailId: string, status: string, timestamp?: string): Promise<WarmupEmail> {
    const updates: { status: string; sent_at?: string; delivered_at?: string } = { status }
    
    if (status === 'sent' && timestamp) {
      updates.sent_at = timestamp
    } else if (status === 'delivered' && timestamp) {
      updates.delivered_at = timestamp
    }

    const { data, error } = await supabase
      .from('warmup_emails')
      .update(updates)
      .eq('id', emailId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Analytics and metrics
  static async getCampaignMetrics(campaignId: string) {
    const { data: emails, error } = await supabase
      .from('warmup_emails')
      .select('status')
      .eq('campaign_id', campaignId)

    if (error) throw error

    const totalEmailsSent = emails?.filter(e => ['sent', 'delivered'].includes(e.status)).length || 0
    const totalEmailsDelivered = emails?.filter(e => e.status === 'delivered').length || 0
    const deliveryRate = totalEmailsSent > 0 ? (totalEmailsDelivered / totalEmailsSent) * 100 : 0

    // Get campaign to calculate progress
    const campaign = await this.getCampaignById(campaignId)
    const progressPercentage = campaign 
      ? Math.min((campaign.current_day / campaign.ramp_up_days) * 100, 100)
      : 0

    return {
      totalEmailsSent,
      totalEmailsDelivered,
      deliveryRate: Math.round(deliveryRate),
      progressPercentage: Math.round(progressPercentage)
    }
  }

  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    const campaign = await this.getCampaignById(campaignId)
    if (!campaign) throw new Error('Campaign not found')

    const emails = await this.getEmailsByCampaign(campaignId)
    
    const totalEmails = emails.length
    const sentEmails = emails.filter(e => ['sent', 'delivered'].includes(e.status)).length
    const deliveredEmails = emails.filter(e => e.status === 'delivered').length
    const failedEmails = emails.filter(e => e.status === 'failed').length
    const deliveryRate = sentEmails > 0 ? (deliveredEmails / sentEmails) * 100 : 0

    // Generate daily stats (mock data for now)
    const dailyStats = this.generateDailyStats(campaign.current_day)
    
    // Calculate reputation score based on delivery rate and campaign progress
    const reputationScore = this.calculateReputationScore(deliveryRate, campaign.current_day, campaign.ramp_up_days)

    return {
      campaignId,
      totalEmails,
      sentEmails,
      deliveredEmails,
      failedEmails,
      deliveryRate: Math.round(deliveryRate),
      reputationScore,
      dailyStats
    }
  }

  // Campaign scheduling and execution
  static calculateDailyVolume(campaign: WarmupCampaign, day: number): number {
    const { daily_volume, ramp_up_days } = campaign
    const rampUpProgress = Math.min(day / ramp_up_days, 1)
    
    // Linear ramp-up from 1 email to target daily volume
    const minVolume = 1
    return Math.ceil(minVolume + (daily_volume - minVolume) * rampUpProgress)
  }

  static async generateEmailsForDay(campaign: WarmupCampaign, day: number): Promise<WarmupEmailInsert[]> {
    const dailyVolume = this.calculateDailyVolume(campaign, day)
    const emails: WarmupEmailInsert[] = []
    
    // Get email account info
    const { data: emailAccount } = await supabase
      .from('email_accounts')
      .select('email')
      .eq('id', campaign.email_account_id)
      .single()

    if (!emailAccount) throw new Error('Email account not found')

    // Generate emails for the day
    for (let i = 0; i < dailyVolume; i++) {
      const template = this.getRandomEmailTemplate()
      const recipientEmail = this.generateRecipientEmail()
      
      emails.push({
        campaign_id: campaign.id,
        sender_email: emailAccount.email,
        recipient_email: recipientEmail,
        subject: template.subject,
        status: 'pending'
      })
    }

    return emails
  }

  // Mock email sending
  static async sendEmail(email: WarmupEmail): Promise<void> {
    // Simulate email sending with random success/failure
    const success = Math.random() > 0.05 // 95% success rate
    
    if (success) {
      await this.updateEmailStatus(email.id, 'sent', new Date().toISOString())
      
      // Simulate delivery with delay
      setTimeout(async () => {
        const delivered = Math.random() > 0.02 // 98% delivery rate for sent emails
        if (delivered) {
          await this.updateEmailStatus(email.id, 'delivered', new Date().toISOString())
        } else {
          await this.updateEmailStatus(email.id, 'failed')
        }
      }, Math.random() * 5000) // Random delay up to 5 seconds
    } else {
      await this.updateEmailStatus(email.id, 'failed')
    }
  }

  // Helper methods
  private static generateDailyStats(currentDay: number): DailyCampaignStats[] {
    const stats: DailyCampaignStats[] = []
    const today = new Date()
    
    for (let i = currentDay; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // Generate mock realistic data
      const baseVolume = Math.min(i + 1, 10)
      const emailsSent = baseVolume + Math.floor(Math.random() * 5)
      const emailsDelivered = Math.floor(emailsSent * (0.85 + Math.random() * 0.13))
      const emailsFailed = emailsSent - emailsDelivered
      const deliveryRate = emailsSent > 0 ? (emailsDelivered / emailsSent) * 100 : 0
      const reputationScore = Math.min(50 + i * 1.5 + Math.random() * 10, 100)
      
      stats.push({
        date: date.toISOString().split('T')[0],
        emailsSent,
        emailsDelivered,
        emailsFailed,
        deliveryRate: Math.round(deliveryRate),
        reputationScore: Math.round(reputationScore)
      })
    }
    
    return stats.reverse()
  }

  private static calculateReputationScore(deliveryRate: number, currentDay: number, totalDays: number): number {
    const progressScore = (currentDay / totalDays) * 50
    const deliveryScore = (deliveryRate / 100) * 50
    return Math.min(Math.round(progressScore + deliveryScore), 100)
  }

  private static getRandomEmailTemplate(): EmailTemplate {
    const templates: EmailTemplate[] = [
      {
        subject: 'Quick question about your services',
        content: 'Hi there, I was wondering if you could help me understand your services better.',
        type: 'business'
      },
      {
        subject: 'Following up on our conversation',
        content: 'Thanks for the great conversation yesterday. I wanted to follow up on a few points.',
        type: 'follow-up'
      },
      {
        subject: 'Partnership opportunity',
        content: 'I believe there might be a great partnership opportunity between our companies.',
        type: 'business'
      },
      {
        subject: 'Introduction and collaboration',
        content: 'I\'d love to introduce myself and explore potential collaboration opportunities.',
        type: 'introduction'
      },
      {
        subject: 'Meeting request',
        content: 'Would you be available for a brief call next week to discuss our mutual interests?',
        type: 'meeting'
      }
    ]
    
    return templates[Math.floor(Math.random() * templates.length)]
  }

  private static generateRecipientEmail(): string {
    const domains = ['example.com', 'test.com', 'demo.org', 'sample.net', 'warmup.co']
    const names = ['john', 'sarah', 'mike', 'lisa', 'david', 'emma', 'alex', 'maria', 'chris', 'anna']
    
    const name = names[Math.floor(Math.random() * names.length)]
    const domain = domains[Math.floor(Math.random() * domains.length)]
    
    return `${name}@${domain}`
  }

  // Campaign automation
  static async processActiveCampaigns(): Promise<void> {
    const { data: activeCampaigns, error } = await supabase
      .from('warmup_campaigns')
      .select()
      .eq('status', 'active')

    if (error) throw error

    for (const campaign of activeCampaigns || []) {
      await this.processCampaignDay(campaign)
    }
  }

  private static async processCampaignDay(campaign: WarmupCampaign): Promise<void> {
    // Check if we've already processed today
    const today = new Date().toISOString().split('T')[0]
    const { data: todaysEmails } = await supabase
      .from('warmup_emails')
      .select('id')
      .eq('campaign_id', campaign.id)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)

    if (todaysEmails && todaysEmails.length > 0) {
      return // Already processed today
    }

    // Generate and create emails for today
    const emails = await this.generateEmailsForDay(campaign, campaign.current_day + 1)
    
    for (const emailData of emails) {
      const email = await this.createWarmupEmail(emailData)
      // Send email with random delay
      setTimeout(() => this.sendEmail(email), Math.random() * 3600000) // Random delay up to 1 hour
    }

    // Update campaign progress
    const newDay = campaign.current_day + 1
    const updates: WarmupCampaignUpdate = {
      current_day: newDay
    }

    // Check if campaign is complete
    if (newDay >= campaign.ramp_up_days) {
      updates.status = 'completed'
    }

    await this.updateCampaign(campaign.id, updates)
  }
}
