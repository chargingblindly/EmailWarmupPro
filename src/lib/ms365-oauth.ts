// Mock MS365 OAuth implementation for demo purposes
// In a real application, this would integrate with Microsoft Graph API

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
  private static readonly MOCK_CLIENT_ID = 'demo-app-12345'
  private static readonly MOCK_REDIRECT_URI = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/accounts/oauth/callback`
  
  private static readonly DEFAULT_SCOPES = [
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/User.Read',
    'offline_access'
  ]

  static getConfig(): MS365OAuthConfig {
    return {
      clientId: this.MOCK_CLIENT_ID,
      redirectUri: this.MOCK_REDIRECT_URI,
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

    // Mock Microsoft OAuth URL
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  static async exchangeCodeForTokens(_code: string, _state?: string): Promise<MS365TokenResponse> {
    // Mock token exchange - simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation, this would POST to Microsoft's token endpoint
    return {
      access_token: `mock_access_token_${Date.now()}`,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: this.DEFAULT_SCOPES.join(' ')
    }
  }

  static async getUserInfo(_accessToken: string): Promise<MS365UserInfo> {
    // Mock user info retrieval - simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Generate mock user data
    const mockEmails = [
      'john.doe@company.com',
      'jane.smith@business.org',
      'mike.johnson@enterprise.net',
      'sarah.wilson@corporation.com',
      'david.brown@organization.co'
    ]
    
    const mockNames = [
      { first: 'John', last: 'Doe' },
      { first: 'Jane', last: 'Smith' },
      { first: 'Mike', last: 'Johnson' },
      { first: 'Sarah', last: 'Wilson' },
      { first: 'David', last: 'Brown' }
    ]
    
    const randomUser = mockNames[Math.floor(Math.random() * mockNames.length)]
    const randomEmail = mockEmails[Math.floor(Math.random() * mockEmails.length)]
    
    return {
      id: `mock_user_${Date.now()}`,
      email: randomEmail,
      displayName: `${randomUser.first} ${randomUser.last}`,
      givenName: randomUser.first,
      surname: randomUser.last
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<MS365TokenResponse> {
    // Mock token refresh - simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      access_token: `refreshed_access_token_${Date.now()}`,
      refresh_token: refreshToken, // Refresh token typically stays the same
      expires_in: 3600,
      token_type: 'Bearer',
      scope: this.DEFAULT_SCOPES.join(' ')
    }
  }

  static async validateToken(accessToken: string): Promise<boolean> {
    // Mock token validation - simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Mock validation logic
    return !!(accessToken && !accessToken.startsWith('expired_'))
  }

  static async revokeToken(_accessToken: string): Promise<boolean> {
    // Mock token revocation - simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Always return success for mock
    return true
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
