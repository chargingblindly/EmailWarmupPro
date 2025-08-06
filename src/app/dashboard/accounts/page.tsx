'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Plus, RefreshCw, Settings, AlertCircle } from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { EmailAccountService, type EmailAccountWithStatus } from '@/lib/email-accounts'
import { EmailAccountCard } from '@/components/email-accounts/EmailAccountCard'
import { AddAccountModal } from '@/components/email-accounts/AddAccountModal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function EmailAccountsPage() {
  const { currentTenant } = useTenant()
  const [accounts, setAccounts] = useState<EmailAccountWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAccounts = async () => {
    if (!currentTenant) return

    try {
      setError(null)
      const data = await EmailAccountService.getEmailAccounts(currentTenant.id)
      setAccounts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email accounts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAccounts()
  }

  const handleAccountAdded = () => {
    setShowAddModal(false)
    loadAccounts()
  }

  const handleAccountRemoved = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId))
  }

  const handleAccountUpdated = (updatedAccount: EmailAccountWithStatus) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      )
    )
  }

  useEffect(() => {
    loadAccounts()
  }, [currentTenant]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const activeAccounts = accounts.filter(account => account.is_active)
  const inactiveAccounts = accounts.filter(account => !account.is_active)
  const connectedCount = accounts.filter(account => account.connectionStatus === 'connected').length
  const totalCount = accounts.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Accounts</h1>
          <p className="text-gray-600 mt-1">
            Manage your MS365 email accounts for warmup campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
            </div>
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">{activeAccounts.length}</p>
            </div>
            <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      {totalCount === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
            <Settings className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No email accounts</h3>
          <p className="mt-2 text-gray-500">
            Get started by adding your first MS365 email account.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Your First Account
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Accounts */}
          {activeAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Active Accounts ({activeAccounts.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeAccounts.map((account) => (
                  <EmailAccountCard
                    key={account.id}
                    account={account}
                    onRemove={handleAccountRemoved}
                    onUpdate={handleAccountUpdated}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Accounts */}
          {inactiveAccounts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-500 mb-4">
                Inactive Accounts ({inactiveAccounts.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {inactiveAccounts.map((account) => (
                  <EmailAccountCard
                    key={account.id}
                    account={account}
                    onRemove={handleAccountRemoved}
                    onUpdate={handleAccountUpdated}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAccountAdded={handleAccountAdded}
      />
    </div>
  )
}
