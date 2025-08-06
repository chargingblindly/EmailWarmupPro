'use client'

import { useState } from 'react'
import { X, Mail, Lock, ExternalLink, CheckCircle } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { MS365OAuth, OAuthUtils } from '@/lib/ms365-oauth'
import { EmailAccountService } from '@/lib/email-accounts'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface AddAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onAccountAdded: () => void
}

type Step = 'connect' | 'authenticating' | 'success'

export const AddAccountModal = ({ isOpen, onClose, onAccountAdded }: AddAccountModalProps) => {
  const { currentTenant } = useTenant()
  const [step, setStep] = useState<Step>('connect')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedEmail, setAddedEmail] = useState<string>('')

  const handleConnect = async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      setError(null)
      
      // Generate OAuth URL
      const state = MS365OAuth.generateState()
      OAuthUtils.storeOAuthState(state)
      
      // In a real app, this would redirect to Microsoft
      // For demo, we'll simulate the OAuth flow
      setStep('authenticating')
      
      // Simulate OAuth flow delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful OAuth completion
      const mockAuthCode = 'mock_auth_code_12345'
      const tokenResponse = await MS365OAuth.exchangeCodeForTokens(mockAuthCode, state)
      const userInfo = await MS365OAuth.getUserInfo(tokenResponse.access_token)
      
      // Add the account to database
      await EmailAccountService.addEmailAccount(currentTenant.id, {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        email: userInfo.email,
        expires_in: tokenResponse.expires_in
      })
      
      setAddedEmail(userInfo.email)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account')
      setStep('connect')
    } finally {
      setLoading(false)
    }
  }

  const handleRealOAuthFlow = () => {
    // This would be used for real OAuth integration
    const state = MS365OAuth.generateState()
    OAuthUtils.storeOAuthState(state)
    const authUrl = MS365OAuth.generateAuthUrl(state)
    
    // Open OAuth URL in popup or redirect
    window.open(authUrl, 'ms365-oauth', 'width=600,height=700')
  }

  const handleClose = () => {
    setStep('connect')
    setError(null)
    setAddedEmail('')
    onClose()
  }

  const handleSuccess = () => {
    handleClose()
    onAccountAdded()
  }



  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'success' ? 'Account Added Successfully' : 'Add MS365 Email Account'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'connect' && (
          <>
            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Connect Your Microsoft 365 Account</h3>
                  <p className="text-blue-800 text-sm mt-1">
                    Securely connect your MS365 email account to start email warmup campaigns. 
                    We&apos;ll only access what&apos;s needed for email management.
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Required Permissions</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Read and write access to your mail</span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Send emails on your behalf</span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Access your basic profile information</span>
                </div>
              </div>
            </div>

            {/* Demo Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Demo Mode</h4>
              <p className="text-yellow-800 text-sm">
                This is a demonstration of the OAuth flow. In a real application, 
                you would be redirected to Microsoft&apos;s authentication page.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleConnect}
                disabled={loading}
                className="btn-primary flex items-center gap-2 flex-1"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {loading ? 'Connecting...' : 'Connect with Microsoft 365'}
              </button>
              
              <button
                onClick={handleClose}
                disabled={loading}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>

            {/* Real OAuth Button (for reference) */}
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-3">
                For real integration, use this button (opens Microsoft OAuth):
              </p>
              <button
                onClick={handleRealOAuthFlow}
                className="btn-outline text-sm"
              >
                Real OAuth Flow (Demo)
              </button>
            </div>
          </>
        )}

        {step === 'authenticating' && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <LoadingSpinner size="lg" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connecting Account</h3>
            <p className="text-gray-600">
              Please wait while we securely connect your Microsoft 365 account...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Connected!</h3>
            <p className="text-gray-600 mb-6">
              Successfully added <strong>{addedEmail}</strong> to your email accounts.
            </p>
            <button
              onClick={handleSuccess}
              className="btn-primary"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
