'use client'

import { useState } from 'react'
import { CampaignWithMetrics } from '@/types/campaigns'
import { CampaignCard } from './CampaignCard'
import { CampaignDetailsModal } from './CampaignDetailsModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CampaignService } from '@/services/campaignService'

interface CampaignsListProps {
  campaigns: CampaignWithMetrics[]
  onCampaignUpdated: () => void
}

export function CampaignsList({ campaigns, onCampaignUpdated }: CampaignsListProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithMetrics | null>(null)
  const [deletingCampaign, setDeletingCampaign] = useState<CampaignWithMetrics | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleCampaignClick = (campaign: CampaignWithMetrics) => {
    setSelectedCampaign(campaign)
  }

  const handleStartCampaign = async (campaign: CampaignWithMetrics) => {
    try {
      setLoading(campaign.id)
      await CampaignService.startCampaign(campaign.id)
      onCampaignUpdated()
    } catch (error) {
      console.error('Error starting campaign:', error)
    } finally {
      setLoading(null)
    }
  }

  const handlePauseCampaign = async (campaign: CampaignWithMetrics) => {
    try {
      setLoading(campaign.id)
      await CampaignService.pauseCampaign(campaign.id)
      onCampaignUpdated()
    } catch (error) {
      console.error('Error pausing campaign:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleResumeCampaign = async (campaign: CampaignWithMetrics) => {
    try {
      setLoading(campaign.id)
      await CampaignService.resumeCampaign(campaign.id)
      onCampaignUpdated()
    } catch (error) {
      console.error('Error resuming campaign:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleStopCampaign = async (campaign: CampaignWithMetrics) => {
    try {
      setLoading(campaign.id)
      await CampaignService.stopCampaign(campaign.id)
      onCampaignUpdated()
    } catch (error) {
      console.error('Error stopping campaign:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteCampaign = async () => {
    if (!deletingCampaign) return

    try {
      setLoading(deletingCampaign.id)
      await CampaignService.deleteCampaign(deletingCampaign.id)
      setDeletingCampaign(null)
      onCampaignUpdated()
    } catch (error) {
      console.error('Error deleting campaign:', error)
    } finally {
      setLoading(null)
    }
  }

  if (campaigns.length === 0) {
    return null
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            loading={loading === campaign.id}
            onClick={() => handleCampaignClick(campaign)}
            onStart={() => handleStartCampaign(campaign)}
            onPause={() => handlePauseCampaign(campaign)}
            onResume={() => handleResumeCampaign(campaign)}
            onStop={() => handleStopCampaign(campaign)}
            onDelete={() => setDeletingCampaign(campaign)}
          />
        ))}
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onCampaignUpdated={onCampaignUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCampaign && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Campaign"
          message={`Are you sure you want to delete "${deletingCampaign.name}"? This action cannot be undone and will delete all associated emails.`}
          type="danger"
          confirmText="Delete Campaign"
          onConfirm={handleDeleteCampaign}
          onClose={() => setDeletingCampaign(null)}
          loading={loading === deletingCampaign.id}
        />
      )}
    </>
  )
}
