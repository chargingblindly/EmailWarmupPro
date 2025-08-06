'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { MS365OAuth, OAuthUtils } from '@/lib/ms365-oauth'
import { EmailAccountService } from '@/lib/email-accounts'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

type Status = 'processing' | 'success' | 'error'

function OAuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentTenant } = useTenant()
  
  const [status, setStatus] = useState<Status>('processing')
  const [error, setError] = useState<string>('')
  const [addedEmail, setAddedEmail] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      if (!currentTenant) {
        setError('No tenant selected')
        setStatus('error')
        return
      }

      try {
        // Parse callback URL parameters
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // Handle OAuth errors
        if (error) {
          setError(errorDescription || error)
          setStatus('error')
          return
        }

        // Validate required parameters
        if (!code || !state) {
          setError('Missing authorization code or state parameter')
          setStatus('error')
          return
        }

        // Verify state for CSRF protection
        if (!OAuthUtils.verifyOAuthState(state)) {
          setError('Invalid state parameter - possible CSRF attack')
          setStatus('error')
          return
        }

        // Exchange code for tokens
        const tokenResponse = await MS365OAuth.exchangeCodeForTokens(code, state)
        
        // Get user information
        const userInfo = await MS365OAuth.getUserInfo(tokenResponse.access_token)
        
        // Add account to database
        await EmailAccountService.addEmailAccount(currentTenant.id, {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          email: userInfo.email,
          expires_in: tokenResponse.expires_in
        })

        setAddedEmail(userInfo.email)
        setStatus('success')

        // Redirect to accounts page after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/accounts')
        }, 3000)

      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(err instanceof Error ? err.message : 'Failed to process OAuth callback')
        setStatus('error')
      }
    }

    handleCallback()
  }, [searchParams, currentTenant, router])

  const handleRetry = () => {
    router.push('/dashboard/accounts')
  }

  const handleContinue = () => {
    router.push('/dashboard/accounts')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        
        {status === 'processing' && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Connecting Your Account
            </h1>
            <p className="text-gray-600">
              Please wait while we securely connect your Microsoft 365 account...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Account Connected Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your Microsoft 365 account <strong>{addedEmail}</strong> has been 
              successfully connected to your warmup campaigns.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full btn-primary"
              >
                Go to Email Accounts
              </button>
              <p className="text-sm text-gray-500">
                Redirecting automatically in 3 seconds...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t connect your Microsoft 365 account. Please try again.
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full btn-secondary"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <LoadingSpinner size="lg" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h1>
            <p className="text-gray-600">
              Please wait while we process your request...
            </p>
          </div>
        </div>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  )
}
