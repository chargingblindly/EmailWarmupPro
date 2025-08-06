'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { supabase } from '@/lib/supabase'
import { CampaignFilters as ICampaignFilters, CampaignSort, CampaignStatus } from '@/types/campaigns'
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react'

interface CampaignFiltersProps {
  filters: ICampaignFilters
  onFiltersChange: (filters: ICampaignFilters) => void
  sort: CampaignSort
  onSortChange: (sort: CampaignSort) => void
}

interface EmailAccount {
  id: string
  email: string
}

export function CampaignFilters({ filters, onFiltersChange, sort, onSortChange }: CampaignFiltersProps) {
  const { currentTenant } = useTenant()
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.search || '')

  useEffect(() => {
    if (currentTenant?.id) {
      loadEmailAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id])

  const loadEmailAccounts = async () => {
    if (!currentTenant?.id) return

    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('id, email')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)

      if (error) throw error
      setEmailAccounts(data || [])
    } catch (err) {
      console.error('Error loading email accounts:', err)
    }
  }

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleStatusChange = (status: CampaignStatus, checked: boolean) => {
    const currentStatuses = filters.status || []
    let newStatuses: CampaignStatus[]

    if (checked) {
      newStatuses = [...currentStatuses, status]
    } else {
      newStatuses = currentStatuses.filter(s => s !== status)
    }

    onFiltersChange({ 
      ...filters, 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    })
  }

  const handleEmailAccountChange = (accountId: string) => {
    onFiltersChange({ 
      ...filters, 
      emailAccountId: accountId || undefined 
    })
  }

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const dateRange = filters.dateRange || { start: new Date(), end: new Date() }
    
    if (type === 'start') {
      dateRange.start = new Date(value)
    } else {
      dateRange.end = new Date(value)
    }

    onFiltersChange({ ...filters, dateRange })
  }

  const clearFilters = () => {
    setLocalSearch('')
    onFiltersChange({})
  }

  const hasActiveFilters = filters.status?.length || filters.emailAccountId || filters.dateRange || filters.search

  const statusOptions: { value: CampaignStatus; label: string; color: string }[] = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'paused', label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' }
  ]

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'status', label: 'Status' },
    { value: 'daily_volume', label: 'Daily Volume' }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center space-x-2">
          <select
            value={sort.sortBy}
            onChange={(e) => onSortChange({ ...sort, sortBy: e.target.value as 'name' | 'created_at' | 'status' | 'daily_volume' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSortChange({ ...sort, order: sort.order === 'asc' ? 'desc' : 'asc' })}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {sort.order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </button>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {statusOptions.map(status => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status.value) || false}
                      onChange={(e) => handleStatusChange(status.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Email Account Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Account
              </label>
              <select
                value={filters.emailAccountId || ''}
                onChange={(e) => handleEmailAccountChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All accounts</option>
                {emailAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange?.start.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={filters.dateRange?.end.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
