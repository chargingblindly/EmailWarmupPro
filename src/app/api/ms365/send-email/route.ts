import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface SendEmailRequest {
  subject: string
  body: string
  recipients: string[]
  from?: string
}

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
    const emailData: SendEmailRequest = await request.json()
    
    if (!emailData.subject || !emailData.body || !emailData.recipients?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, body, recipients' },
        { status: 400 }
      )
    }

    const message = {
      subject: emailData.subject,
      body: {
        contentType: 'HTML',
        content: emailData.body
      },
      toRecipients: emailData.recipients.map(email => ({
        emailAddress: {
          address: email
        }
      }))
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to send email' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
