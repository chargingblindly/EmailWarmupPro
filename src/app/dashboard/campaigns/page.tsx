'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { CampaignsList } from '@/components/campaigns/CampaignsList'
import { CampaignFilters } from '@/components/campaigns/CampaignFilters'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { CampaignService } from '@/services/campaignService'
import { CampaignWithMetrics, CampaignFilters as ICampaignFilters, CampaignSort } from '@/types/campaigns'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, AlertCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function CampaignsPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentTenant, loading: tenantLoading, needsOnboarding } = useTenant()
  const router = useRouter()
  
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState<ICampaignFilters>({})
  const [sort, setSort] = useState<CampaignSort>({ sortBy: 'created_at', order: 'desc' })

  const loadCampaigns = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await CampaignService.getCampaignsByTenant(currentTenant.id, filters, sort)
      setCampaigns(data)
    } catch (err) {
      console.error('Error loading campaigns:', err)
      setError('Failed to load campaigns. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, filters, sort])

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

  useEffect(() => {
    if (currentTenant?.id) {
      loadCampaigns()
    }
  }, [currentTenant?.id, loadCampaigns])

  const handleCampaignCreated = () => {
    setShowCreateModal(false)
    loadCampaigns()
  }

  const handleCampaignUpdated = () => {
    loadCampaigns()
  }

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (needsOnboarding) {
    return null // Will redirect to onboarding
  }

  if (!currentTenant) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warmup Campaigns</h1>
            <p className="text-gray-600">
              Manage your email warmup campaigns to improve sender reputation
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </button>
        </div>

        {/* Filters */}
        <CampaignFilters
          filters={filters}
          onFiltersChange={setFilters}
          sort={sort}
          onSortChange={setSort}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Campaigns List */}
        {!loading && !error && (
          <CampaignsList
            campaigns={campaigns}
            onCampaignUpdated={handleCampaignUpdated}
          />
        )}

        {/* Empty State */}
        {!loading && !error && campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No campaigns found
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by creating your first warmup campaign
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Your First Campaign
              </button>
            </div>
          </div>
        )}

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onCampaignCreated={handleCampaignCreated}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
