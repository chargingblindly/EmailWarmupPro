// Real MS365 OAuth implementation using Microsoft Graph API
// Requires Microsoft App registration in Azure Portal

export interface MS365OAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
}

export interface MS365UserInfo {
  id: string
  email: string
  displayName: string
  givenName: string
  surname: string
}

export interface MS365TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export class MS365OAuth {
  private static readonly CLIENT_ID = process.env.NEXT_PUBLIC_MS365_CLIENT_ID || ''
  private static readonly TENANT_ID = process.env.MS365_TENANT_ID || 'common'
  private static readonly REDIRECT_URI = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/accounts/oauth/callback`
  
  private static readonly DEFAULT_SCOPES = [
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/User.Read',
    'offline_access'
  ]

  static getConfig(): MS365OAuthConfig {
    if (!this.CLIENT_ID) {
      throw new Error('NEXT_PUBLIC_MS365_CLIENT_ID environment variable is required')
    }
    
    return {
      clientId: this.CLIENT_ID,
      redirectUri: this.REDIRECT_URI,
      scopes: this.DEFAULT_SCOPES
    }
  }

  static generateAuthUrl(state?: string): string {
    const config = this.getConfig()
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_mode: 'query',
      state: state || this.generateState()
    })

    return `https://login.microsoftonline.com/${this.TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`
  }

  static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  static async exchangeCodeForTokens(code: string, _state?: string): Promise<MS365TokenResponse> {
    const config = this.getConfig()
    
    try {
      const response = await fetch('/api/auth/ms365/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirectUri: config.redirectUri
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Token exchange failed')
      }

      const tokenData: MS365TokenResponse = await response.json()
      return tokenData
    } catch (error) {
      console.error('Error exchanging code for tokens:', error)
      throw new Error(`Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async getUserInfo(accessToken: string): Promise<MS365UserInfo> {
    try {
      const response = await fetch('/api/ms365/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get user info')
      }

      const userData: MS365UserInfo = await response.json()
      return userData
    } catch (error) {
      console.error('Error getting user info:', error)
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<MS365TokenResponse> {
    try {
      const response = await fetch('/api/auth/ms365/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: refreshToken
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Token refresh failed')
      }

      const tokenData: MS365TokenResponse = await response.json()
      return tokenData
    } catch (error) {
      console.error('Error refreshing access token:', error)
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('/api/ms365/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return false
      }

      const result = await response.json()
      return result.connected
    } catch (error) {
      console.error('Error validating token:', error)
      return false
    }
  }

  static async revokeToken(_accessToken: string): Promise<boolean> {
    try {
      // Microsoft Graph doesn't have a direct revoke endpoint for access tokens
      // Access tokens expire automatically. For a more complete implementation,
      // you could invalidate the token on your server side
      return true
    } catch (error) {
      console.error('Error revoking token:', error)
      return false
    }
  }

  // Additional helper methods for email functionality
  static async sendEmail(accessToken: string, emailData: {
    subject: string
    body: string
    recipients: string[]
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/ms365/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      return true
    } catch (error) {
      console.error('Error sending email:', error)
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async testConnection(accessToken: string): Promise<boolean> {
    return this.validateToken(accessToken)
  }
}

// Utility functions for working with OAuth flow
export const OAuthUtils = {
  // Store state for CSRF protection
  storeOAuthState(state: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state)
    }
  },

  // Verify state for CSRF protection
  verifyOAuthState(state: string): boolean {
    if (typeof window !== 'undefined') {
      const storedState = sessionStorage.getItem('oauth_state')
      sessionStorage.removeItem('oauth_state')
      return storedState === state
    }
    return false
  },

  // Parse OAuth callback URL
  parseCallbackUrl(url: string): { code?: string; state?: string; error?: string; error_description?: string } {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    return {
      code: params.get('code') || undefined,
      state: params.get('state') || undefined,
      error: params.get('error') || undefined,
      error_description: params.get('error_description') || undefined
    }
  }
}
