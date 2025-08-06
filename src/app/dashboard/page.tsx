'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Mail, TrendingUp, Play, AlertCircle } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const { currentTenant, loading: tenantLoading, needsOnboarding } = useTenant()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeCampaigns: 0,
    emailsSent: 0,
    deliveryRate: 0
  })

  const loadDashboardStats = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      // Load email accounts count
      const { data: accounts, error: accountsError } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)

      if (accountsError) throw accountsError

      // Load campaigns stats
      const { data: campaigns, error: campaignsError } = await supabase
        .from('warmup_campaigns')
        .select('id, status')
        .eq('tenant_id', currentTenant.id)

      if (campaignsError) throw campaignsError

      // Load emails stats
      const { data: emails, error: emailsError } = await supabase
        .from('warmup_emails')
        .select('status, campaign_id')
        .in('campaign_id', (campaigns || []).map(c => c.id))

      if (emailsError) throw emailsError

      const activeCampaigns = (campaigns || []).filter(c => c.status === 'active').length
      const sentEmails = (emails || []).filter(e => ['sent', 'delivered'].includes(e.status)).length
      const deliveredEmails = (emails || []).filter(e => e.status === 'delivered').length
      const deliveryRate = sentEmails > 0 ? Math.round((deliveredEmails / sentEmails) * 100) : 0

      setStats({
        totalAccounts: (accounts || []).length,
        activeCampaigns,
        emailsSent: sentEmails,
        deliveryRate
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }, [currentTenant?.id])

  useEffect(() => {
    if (currentTenant?.id) {
      loadDashboardStats()
    }
  }, [currentTenant?.id, loadDashboardStats])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!authLoading && !tenantLoading && user && needsOnboarding) {
      router.push('/dashboard/onboarding')
    }
  }, [user, authLoading, tenantLoading, needsOnboarding, router])

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (needsOnboarding) {
    return null // Will redirect to onboarding
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here&apos;s an overview of your email warmup activities.
          </p>
        </div>

        {/* Tenant Selection Notice */}
        {!currentTenant && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                No tenant selected
              </h3>
              <p className="text-sm text-yellow-600">
                Please create a tenant or contact your administrator to get started.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.emailsSent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">1</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Connect your MS365 email account</h3>
                <p className="text-sm text-gray-600">Add your Microsoft 365 email account to begin the warmup process</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-green-600">2</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Create a warmup campaign</h3>
                <p className="text-sm text-gray-600">Set up your first email warmup campaign with custom parameters</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600">3</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Monitor your progress</h3>
                <p className="text-sm text-gray-600">Track your sender reputation and email delivery metrics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/accounts')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <Mail className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-medium text-gray-900">Add Email Account</h3>
              <p className="text-sm text-gray-600">Connect your MS365 email</p>
            </button>
            
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <TrendingUp className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-medium text-gray-900">Create Campaign</h3>
              <p className="text-sm text-gray-600">Start email warmup</p>
            </button>
            
            <button
              onClick={() => router.push('/dashboard/demo')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              <Play className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-medium text-gray-900">Try Demo</h3>
              <p className="text-sm text-gray-600">See warmup in action</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
