import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const accessToken = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to get user info' },
        { status: response.status }
      )
    }

    const userData = await response.json()
    
    // Return standardized user info
    return NextResponse.json({
      id: userData.id,
      email: userData.mail || userData.userPrincipalName,
      displayName: userData.displayName,
      givenName: userData.givenName,
      surname: userData.surname
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
