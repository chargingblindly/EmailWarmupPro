'use client'

import { CampaignWithMetrics } from '@/types/campaigns'
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Mail, 
  TrendingUp, 
  Calendar,
  MoreVertical,
  Edit,
  BarChart3
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface CampaignCardProps {
  campaign: CampaignWithMetrics
  loading: boolean
  onClick: () => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onDelete: () => void
}

export function CampaignCard({
  campaign,
  loading,
  onClick,
  onStart,
  onPause,
  onResume,
  onStop,
  onDelete
}: CampaignCardProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />
      case 'paused':
        return <Pause className="h-3 w-3" />
      case 'completed':
        return <Square className="h-3 w-3" />
      case 'draft':
      default:
        return <Edit className="h-3 w-3" />
    }
  }

  const canStart = campaign.status === 'draft'
  const canPause = campaign.status === 'active'
  const canResume = campaign.status === 'paused'
  const canStop = campaign.status === 'active' || campaign.status === 'paused'
  const canDelete = campaign.status !== 'active'

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0" onClick={onClick}>
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {campaign.name}
          </h3>
          <p className="text-sm text-gray-600 truncate">
            {campaign.emailAccountEmail}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
            {getStatusIcon(campaign.status)}
            <span className="capitalize">{campaign.status}</span>
          </span>
          
          {/* Actions Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowDropdown(!showDropdown)
              }}
              className="p-1 rounded-full hover:bg-gray-100"
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <MoreVertical className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClick()
                      setShowDropdown(false)
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  
                  {canStart && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStart()
                        setShowDropdown(false)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start Campaign</span>
                    </button>
                  )}
                  
                  {canPause && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPause()
                        setShowDropdown(false)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pause className="h-4 w-4" />
                      <span>Pause Campaign</span>
                    </button>
                  )}
                  
                  {canResume && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onResume()
                        setShowDropdown(false)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Play className="h-4 w-4" />
                      <span>Resume Campaign</span>
                    </button>
                  )}
                  
                  {canStop && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStop()
                        setShowDropdown(false)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Square className="h-4 w-4" />
                      <span>Stop Campaign</span>
                    </button>
                  )}
                  
                  {canDelete && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete()
                          setShowDropdown(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Campaign</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4" onClick={onClick}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-600">{campaign.progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${campaign.progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Day {campaign.current_day}</span>
          <span>of {campaign.ramp_up_days} days</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4" onClick={onClick}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{campaign.totalEmailsSent}</div>
          <div className="text-xs text-gray-600">Sent</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{campaign.deliveryRate}%</div>
          <div className="text-xs text-gray-600">Delivered</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{campaign.daily_volume}</div>
          <div className="text-xs text-gray-600">Daily Vol.</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3" onClick={onClick}>
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>Created {formatDate(campaign.created_at)}</span>
        </div>
        {campaign.status === 'active' && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Active</span>
          </div>
        )}
      </div>
    </div>
  )
}
