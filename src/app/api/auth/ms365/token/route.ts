import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface TokenRequest {
  code: string
  redirectUri: string
}

interface RefreshTokenRequest {
  refreshToken: string
}

const CLIENT_ID = process.env.NEXT_PUBLIC_MS365_CLIENT_ID
const CLIENT_SECRET = process.env.MS365_CLIENT_SECRET
const TENANT_ID = process.env.MS365_TENANT_ID || 'common'

const DEFAULT_SCOPES = [
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send',
  'https://graph.microsoft.com/User.Read',
  'offline_access'
]

export async function POST(request: NextRequest) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Microsoft OAuth credentials not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { code, redirectUri, refreshToken } = body

    let params: URLSearchParams

    if (refreshToken) {
      // Handle refresh token request
      params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: DEFAULT_SCOPES.join(' ')
      })
    } else if (code && redirectUri) {
      // Handle authorization code exchange
      params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: DEFAULT_SCOPES.join(' ')
      })
    } else {
      return NextResponse.json(
        { error: 'Either code+redirectUri or refreshToken is required' },
        { status: 400 }
      )
    }

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      return NextResponse.json(
        { error: errorData.error_description || errorData.error || 'Token exchange failed' },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()
    
    // Return token data (access_token, refresh_token, expires_in, etc.)
    return NextResponse.json(tokenData)

  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error during token exchange' },
      { status: 500 }
    )
  }
}
