import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const accessToken = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    // Test connection by making multiple API calls
    const [userResponse, foldersResponse] = await Promise.all([
      fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }),
      fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
    ])

    const userOk = userResponse.ok
    const foldersOk = foldersResponse.ok

    if (!userOk || !foldersOk) {
      return NextResponse.json({
        connected: false,
        error: 'Failed to access Microsoft Graph API',
        details: {
          userAPI: userOk,
          mailAPI: foldersOk
        }
      })
    }

    return NextResponse.json({
      connected: true,
      message: 'Connection successful',
      details: {
        userAPI: true,
        mailAPI: true
      }
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      connected: false,
      error: 'Internal server error during connection test'
    })
  }
}
