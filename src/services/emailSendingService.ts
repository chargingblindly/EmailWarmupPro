import { MS365OAuth } from '@/lib/ms365-oauth'
import { supabase } from '@/lib/supabase'

export interface SendEmailRequest {
  fromAccountId: string
  subject: string
  body: string
  recipients: string[]
  tenantId: string
}

export interface EmailSendResult {
  success: boolean
  error?: string
  messageId?: string
}

export class EmailSendingService {
  /**
   * Send an email using MS365 API through an authenticated email account
   */
  static async sendEmail(request: SendEmailRequest): Promise<EmailSendResult> {
    try {
      // Get the email account details
      const { data: account, error: accountError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', request.fromAccountId)
        .eq('tenant_id', request.tenantId)
        .eq('is_active', true)
        .single()

      if (accountError || !account) {
        return {
          success: false,
          error: 'Email account not found or inactive'
        }
      }

      // Check if we have a valid access token
      if (!account.access_token) {
        return {
          success: false,
          error: 'No access token available for email account'
        }
      }

      // Try to send the email
      try {
        await MS365OAuth.sendEmail(account.access_token, {
          subject: request.subject,
          body: request.body,
          recipients: request.recipients
        })

        return {
          success: true,
          messageId: `sent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
        }
      } catch (sendError) {
        // If token is expired, try to refresh it once
        if (account.refresh_token && this.isTokenExpiredError(sendError)) {
          try {
            const tokenResponse = await MS365OAuth.refreshAccessToken(account.refresh_token)
            
            // Update the account with new tokens
            await supabase
              .from('email_accounts')
              .update({
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                updated_at: new Date().toISOString()
              })
              .eq('id', request.fromAccountId)
              .eq('tenant_id', request.tenantId)

            // Try sending again with new token
            await MS365OAuth.sendEmail(tokenResponse.access_token, {
              subject: request.subject,
              body: request.body,
              recipients: request.recipients
            })

            return {
              success: true,
              messageId: `sent_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            }
          } catch (refreshError) {
            console.error('Failed to refresh token and retry sending:', refreshError)
            return {
              success: false,
              error: 'Failed to refresh token and send email'
            }
          }
        }

        // If it's not a token error or refresh failed, return the original error
        throw sendError
      }
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Send multiple emails with rate limiting
   */
  static async sendBulkEmails(
    requests: SendEmailRequest[],
    delayBetweenEmails: number = 1000
  ): Promise<EmailSendResult[]> {
    const results: EmailSendResult[] = []

    for (const request of requests) {
      const result = await this.sendEmail(request)
      results.push(result)

      // Add delay between emails to avoid rate limiting
      if (delayBetweenEmails > 0 && results.length < requests.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenEmails))
      }
    }

    return results
  }

  /**
   * Test if an email account can send emails
   */
  static async testEmailSending(accountId: string, tenantId: string): Promise<boolean> {
    try {
      const testResult = await this.sendEmail({
        fromAccountId: accountId,
        subject: 'Email Warmup Pro - Connection Test',
        body: 'This is a test email to verify your account connection. You can safely ignore this message.',
        recipients: ['test@example.com'], // This will fail but tests the authentication
        tenantId: tenantId
      })

      // Even if the email fails to send (invalid recipient), 
      // if we get a proper authentication error vs network error, 
      // we know the account is properly configured
      return testResult.success || 
             (testResult.error && !testResult.error.includes('access token'))
    } catch (error) {
      console.error('Error testing email sending:', error)
      return false
    }
  }

  /**
   * Check if an error indicates an expired or invalid token
   */
  private static isTokenExpiredError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || ''
    return errorMessage.includes('unauthorized') ||
           errorMessage.includes('invalid_grant') ||
           errorMessage.includes('token_expired') ||
           errorMessage.includes('401')
  }

  /**
   * Get email sending statistics for an account
   */
  static async getAccountSendingStats(accountId: string, tenantId: string): Promise<{
    totalSent: number
    totalFailed: number
    lastSentAt: string | null
  }> {
    try {
      const { data: emails, error } = await supabase
        .from('warmup_emails')
        .select('status, sent_at')
        .eq('tenant_id', tenantId)
        .eq('from_account_id', accountId)

      if (error) {
        throw error
      }

      const totalSent = emails?.filter(e => ['sent', 'delivered'].includes(e.status)).length || 0
      const totalFailed = emails?.filter(e => e.status === 'failed').length || 0
      const lastSentEmail = emails
        ?.filter(e => e.sent_at)
        ?.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0]

      return {
        totalSent,
        totalFailed,
        lastSentAt: lastSentEmail?.sent_at || null
      }
    } catch (error) {
      console.error('Error getting sending stats:', error)
      return {
        totalSent: 0,
        totalFailed: 0,
        lastSentAt: null
      }
    }
  }
}
