'use client'

import { useState, useEffect, useCallback } from 'react'
import { CampaignWithMetrics, CampaignAnalytics } from '@/types/campaigns'
import { CampaignService } from '@/services/campaignService'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CampaignChart } from './CampaignChart'
import { EmailHistory } from './EmailHistory'
import { 
  X, 
  BarChart3, 
  Mail, 
  TrendingUp, 
  Play,
  Pause,
  Square,
  Settings,
  Activity
} from 'lucide-react'

interface CampaignDetailsModalProps {
  campaign: CampaignWithMetrics
  onClose: () => void
  onCampaignUpdated: () => void
}

type Tab = 'overview' | 'analytics' | 'emails' | 'settings'

export function CampaignDetailsModal({ campaign, onClose, onCampaignUpdated }: CampaignDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const data = await CampaignService.getCampaignAnalytics(campaign.id)
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [campaign.id])

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics()
    }
  }, [activeTab, loadAnalytics])

  const handleAction = async (action: string) => {
    try {
      setActionLoading(true)
      
      switch (action) {
        case 'start':
          await CampaignService.startCampaign(campaign.id)
          break
        case 'pause':
          await CampaignService.pauseCampaign(campaign.id)
          break
        case 'resume':
          await CampaignService.resumeCampaign(campaign.id)
          break
        case 'stop':
          await CampaignService.stopCampaign(campaign.id)
          break
      }
      
      onCampaignUpdated()
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderActionButtons = () => {
    const canStart = campaign.status === 'draft'
    const canPause = campaign.status === 'active'
    const canResume = campaign.status === 'paused'
    const canStop = campaign.status === 'active' || campaign.status === 'paused'

    return (
      <div className="flex items-center space-x-2">
        {canStart && (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading}
            className="btn-primary flex items-center space-x-2"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4" />}
            <span>Start Campaign</span>
          </button>
        )}
        
        {canPause && (
          <button
            onClick={() => handleAction('pause')}
            disabled={actionLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : <Pause className="h-4 w-4" />}
            <span>Pause</span>
          </button>
        )}
        
        {canResume && (
          <button
            onClick={() => handleAction('resume')}
            disabled={actionLoading}
            className="btn-primary flex items-center space-x-2"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : <Play className="h-4 w-4" />}
            <span>Resume</span>
          </button>
        )}
        
        {canStop && (
          <button
            onClick={() => handleAction('stop')}
            disabled={actionLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            {actionLoading ? <LoadingSpinner size="sm" /> : <Square className="h-4 w-4" />}
            <span>Stop</span>
          </button>
        )}
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Campaign Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Email Account:</span>
            <p className="text-sm text-gray-900">{campaign.emailAccountEmail}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
              {campaign.status.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Daily Volume:</span>
            <p className="text-sm text-gray-900">{campaign.daily_volume} emails</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Ramp-up Period:</span>
            <p className="text-sm text-gray-900">{campaign.ramp_up_days} days</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Current Day:</span>
            <p className="text-sm text-gray-900">{campaign.current_day}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">Progress:</span>
            <p className="text-sm text-gray-900">{campaign.progressPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Campaign Progress</span>
          <span className="text-sm text-gray-600">{campaign.progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${campaign.progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Day {campaign.current_day}</span>
          <span>of {campaign.ramp_up_days} days</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.totalEmailsSent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.totalEmailsDelivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.deliveryRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Volume Calculation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-800 mb-2">Today&apos;s Volume</h4>
      <p className="text-sm text-blue-700">
      Based on your ramp-up schedule, today we&apos;ll send approximately{' '}
      <span className="font-semibold">
      {CampaignService.calculateDailyVolume(campaign, campaign.current_day + 1)} emails
      </span>
      </p>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : analytics ? (
        <>
          {/* Reputation Score */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Reputation Score</h3>
                <p className="text-blue-100">Overall sender reputation</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{analytics.reputationScore}</div>
                <div className="text-blue-100">out of 100</div>
              </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
            <CampaignChart analytics={analytics} />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.totalEmails}</div>
              <div className="text-sm text-gray-600">Total Emails</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.sentEmails}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.deliveredEmails}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.failedEmails}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      )}
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'emails', label: 'Email History', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <Modal isOpen={true} size="xl" onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{campaign.name}</h2>
            <p className="text-gray-600">Campaign Details</p>
          </div>
          <div className="flex items-center space-x-4">
            {renderActionButtons()}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'emails' && <EmailHistory campaignId={campaign.id} />}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <p className="text-gray-600">Settings panel coming soon</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
