import { supabase } from './supabase'
import type { Database } from './supabase'

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
      // Mock token refresh - in real implementation, this would call MS365 API
      const newTokenData = await this.mockRefreshToken(account.refresh_token)
      
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

    // Mock connection test - in real implementation, this would test MS365 API
    return this.mockTestConnection(account.access_token)
  }

  private static async checkConnectionStatus(account: EmailAccount): Promise<'connected' | 'expired' | 'error'> {
    if (!account.access_token) {
      return 'error'
    }

    // Mock status check - in real implementation, this would validate with MS365
    const isValid = await this.mockValidateToken(account.access_token)
    return isValid ? 'connected' : 'expired'
  }

  // Mock MS365 API methods for demo purposes
  private static async mockValidateToken(token: string | null): Promise<boolean> {
    if (!token) return false
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Mock validation: tokens starting with 'expired_' are considered expired
    return !token.startsWith('expired_')
  }

  private static async mockRefreshToken(_refreshToken: string): Promise<MS365AuthData> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      access_token: `refreshed_${Date.now()}`,
      refresh_token: `refresh_${Date.now()}`,
      email: 'mock@example.com',
      expires_in: 3600
    }
  }

  private static async mockTestConnection(token: string | null): Promise<boolean> {
    if (!token) return false
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Mock connection test: 90% success rate
    return Math.random() > 0.1
  }
}

export type { EmailAccount, EmailAccountInsert, EmailAccountUpdate }
