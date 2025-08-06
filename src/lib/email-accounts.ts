import { supabase } from './supabase'
import type { Database } from './supabase'
import { MS365OAuth } from './ms365-oauth'

type EmailAccount = Database['public']['Tables']['email_accounts']['Row']
type EmailAccountInsert = Database['public']['Tables']['email_accounts']['Insert']
type EmailAccountUpdate = Database['public']['Tables']['email_accounts']['Update']

export interface EmailAccountWithStatus extends EmailAccount {
  connectionStatus: 'connected' | 'expired' | 'error' | 'testing'
  lastChecked?: string
}

export interface MS365AuthData {
  access_token: string
  refresh_token: string
  email: string
  expires_in: number
}

export class EmailAccountService {
  static async getEmailAccounts(tenantId: string): Promise<EmailAccountWithStatus[]> {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch email accounts: ${error.message}`)
    }

    // Add status checking for each account
    const accountsWithStatus = await Promise.all(
      data.map(async (account) => {
        const status = await this.checkConnectionStatus(account)
        return {
          ...account,
          connectionStatus: status,
          lastChecked: new Date().toISOString()
        }
      })
    )

    return accountsWithStatus
  }

  static async addEmailAccount(tenantId: string, authData: MS365AuthData): Promise<EmailAccount> {
    const accountData: EmailAccountInsert = {
      tenant_id: tenantId,
      email: authData.email,
      provider: 'ms365',
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      is_active: true
    }

    const { data, error } = await supabase
      .from('email_accounts')
      .insert(accountData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add email account: ${error.message}`)
    }

    return data
  }

  static async removeEmailAccount(accountId: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(`Failed to remove email account: ${error.message}`)
    }
  }

  static async updateEmailAccount(
    accountId: string, 
    tenantId: string, 
    updates: EmailAccountUpdate
  ): Promise<EmailAccount> {
    const { data, error } = await supabase
      .from('email_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update email account: ${error.message}`)
    }

    return data
  }

  static async toggleAccountStatus(
    accountId: string, 
    tenantId: string, 
    isActive: boolean
  ): Promise<EmailAccount> {
    return this.updateEmailAccount(accountId, tenantId, { is_active: isActive })
  }

  static async refreshAccessToken(accountId: string, tenantId: string): Promise<boolean> {
    // Get the account
    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !account?.refresh_token) {
      return false
    }

    try {
      // Refresh token using real MS365 API
      const newTokenData = await this.refreshMSToken(account.refresh_token)
      
      await this.updateEmailAccount(accountId, tenantId, {
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token
      })

      return true
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return false
    }
  }

  static async testConnection(accountId: string, tenantId: string): Promise<boolean> {
    const { data: account, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !account) {
      return false
    }

    // Test real MS365 API connection
    return this.testMSConnection(account.access_token)
  }

  private static async checkConnectionStatus(account: EmailAccount): Promise<'connected' | 'expired' | 'error'> {
    if (!account.access_token) {
      return 'error'
    }

    // Check status with real MS365 API
    const isValid = await MS365OAuth.validateToken(account.access_token)
    return isValid ? 'connected' : 'expired'
  }

  // MS365 API validation is now handled through MS365OAuth.validateToken

  private static async refreshMSToken(refreshToken: string): Promise<MS365AuthData> {
    try {
      const tokenResponse = await MS365OAuth.refreshAccessToken(refreshToken)
      const userInfo = await MS365OAuth.getUserInfo(tokenResponse.access_token)
      
      return {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        email: userInfo.email,
        expires_in: tokenResponse.expires_in
      }
    } catch (error) {
      console.error('Error refreshing MS365 token:', error)
      throw new Error('Failed to refresh MS365 token')
    }
  }

  private static async testMSConnection(token: string | null): Promise<boolean> {
    if (!token) return false
    
    try {
      return await MS365OAuth.testConnection(token)
    } catch (error) {
      console.error('Error testing MS365 connection:', error)
      return false
    }
  }
}

export type { EmailAccount, EmailAccountInsert, EmailAccountUpdate }
