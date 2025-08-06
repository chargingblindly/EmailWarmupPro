'use client'

import { useState, useEffect } from 'react'
import { WarmupEmail } from '@/types/campaigns'
import { CampaignService } from '@/services/campaignService'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  Search,
  RefreshCw
} from 'lucide-react'

interface EmailHistoryProps {
  campaignId: string
}

type EmailFilter = 'all' | 'pending' | 'sent' | 'delivered' | 'failed'

export function EmailHistory({ campaignId }: EmailHistoryProps) {
  const [emails, setEmails] = useState<WarmupEmail[]>([])
  const [filteredEmails, setFilteredEmails] = useState<WarmupEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<EmailFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadEmails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  useEffect(() => {
    applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emails, filter, searchTerm])

  const loadEmails = async () => {
    try {
      setLoading(true)
      const data = await CampaignService.getEmailsByCampaign(campaignId)
      setEmails(data)
    } catch (error) {
      console.error('Error loading emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshEmails = async () => {
    try {
      setRefreshing(true)
      const data = await CampaignService.getEmailsByCampaign(campaignId)
      setEmails(data)
    } catch (error) {
      console.error('Error refreshing emails:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const applyFilters = () => {
    let filtered = emails

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(email => email.status === filter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(email => 
        email.recipient_email.toLowerCase().includes(term) ||
        email.subject.toLowerCase().includes(term) ||
        email.sender_email.toLowerCase().includes(term)
      )
    }

    setFilteredEmails(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusCounts = () => {
    return {
      all: emails.length,
      pending: emails.filter(e => e.status === 'pending').length,
      sent: emails.filter(e => e.status === 'sent').length,
      delivered: emails.filter(e => e.status === 'delivered').length,
      failed: emails.filter(e => e.status === 'failed').length
    }
  }

  const statusCounts = getStatusCounts()

  const filterOptions: { value: EmailFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: statusCounts.all },
    { value: 'pending', label: 'Pending', count: statusCounts.pending },
    { value: 'sent', label: 'Sent', count: statusCounts.sent },
    { value: 'delivered', label: 'Delivered', count: statusCounts.delivered },
    { value: 'failed', label: 'Failed', count: statusCounts.failed }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Email History</h3>
          <p className="text-sm text-gray-600">
            {filteredEmails.length} of {emails.length} emails
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          {/* Refresh */}
          <button
            onClick={refreshEmails}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{option.label}</span>
            <span className="bg-white rounded-full px-2 py-0.5 text-xs">
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {/* Email Table */}
      {filteredEmails.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(email.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(email.status)}`}>
                          {email.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{email.recipient_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {email.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(email.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(email.sent_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(email.delivered_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No emails found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Emails will appear here once the campaign starts sending'
            }
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {emails.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{statusCounts.pending}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{statusCounts.sent}</div>
              <div className="text-xs text-gray-600">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{statusCounts.delivered}</div>
              <div className="text-xs text-gray-600">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{statusCounts.failed}</div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
