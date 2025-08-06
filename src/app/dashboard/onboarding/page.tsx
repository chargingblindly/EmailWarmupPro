'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { Building2, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const { user } = useAuth()
  const { createTenant } = useTenant()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tenantName, setTenantName] = useState('')

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantName.trim()) {
      setError('Organization name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await createTenant({ name: tenantName.trim() })
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    router.push('/dashboard')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto pt-8 pb-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Email Warmup Pro
          </h1>
          <p className="text-gray-600">
            Let&apos;s get your organization set up to start warming up your emails
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">Create Organization</span>
            <span className="text-xs text-gray-500">Get Started</span>
          </div>
        </div>

        {/* Step 1: Create Tenant */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Create Your Organization</h2>
              <p className="text-gray-600 mt-2">
                Organizations help you manage team members and email accounts together
              </p>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-6">
              <div>
                <label htmlFor="tenantName" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  id="tenantName"
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Enter your organization name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This could be your company name, team name, or project name
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !tenantName.trim()}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    Create Organization
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Welcome */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Organization Created!</h2>
              <p className="text-gray-600 mt-2">
                Great! You&apos;ve successfully created your organization &ldquo;{tenantName}&rdquo;
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Connect Email Accounts</h4>
                      <p className="text-sm text-gray-600">Add your Microsoft 365 email accounts to start the warmup process</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Create Warmup Campaigns</h4>
                      <p className="text-sm text-gray-600">Set up automated email warmup campaigns for better deliverability</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Invite Team Members</h4>
                      <p className="text-sm text-gray-600">Add colleagues to collaborate on email warmup efforts</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleComplete}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Skip Link */}
        {step === 1 && (
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              I&apos;ll set this up later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
