'use client'

import { useState } from 'react'
import { 
  Mail, 
  MoreVertical, 
  RefreshCw, 
  Power, 
  PowerOff, 
  Trash2, 
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { useTenant } from '@/contexts/TenantContext'
import { EmailAccountService, type EmailAccountWithStatus } from '@/lib/email-accounts'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface EmailAccountCardProps {
  account: EmailAccountWithStatus
  onRemove: (accountId: string) => void
  onUpdate: (account: EmailAccountWithStatus) => void
}

export const EmailAccountCard = ({ account, onRemove, onUpdate }: EmailAccountCardProps) => {
  const { currentTenant } = useTenant()
  const [loading, setLoading] = useState(false)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const getStatusIcon = () => {
    switch (account.connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'testing':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (account.connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'expired':
        return 'Token Expired'
      case 'error':
        return 'Connection Error'
      case 'testing':
        return 'Testing...'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = () => {
    switch (account.connectionStatus) {
      case 'connected':
        return 'text-green-600 bg-green-50'
      case 'expired':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      case 'testing':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const handleRefreshToken = async () => {
    if (!currentTenant) return
    
    setLoading(true)
    try {
      const success = await EmailAccountService.refreshAccessToken(account.id, currentTenant.id)
      if (success) {
        const updatedAccounts = await EmailAccountService.getEmailAccounts(currentTenant.id)
        const updatedAccount = updatedAccounts.find(acc => acc.id === account.id)
        if (updatedAccount) {
          onUpdate(updatedAccount)
        }
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
    } finally {
      setLoading(false)
      setShowDropdown(false)
    }
  }

  const handleTestConnection = async () => {
    if (!currentTenant) return
    
    setLoading(true)
    onUpdate({ ...account, connectionStatus: 'testing' })
    
    try {
      const isConnected = await EmailAccountService.testConnection(account.id, currentTenant.id)
      onUpdate({
        ...account,
        connectionStatus: isConnected ? 'connected' : 'error',
        lastChecked: new Date().toISOString()
      })
    } catch (error) {
      onUpdate({
        ...account,
        connectionStatus: 'error',
        lastChecked: new Date().toISOString()
      })
    } finally {
      setLoading(false)
      setShowDropdown(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!currentTenant) return
    
    setLoading(true)
    try {
      const updatedAccount = await EmailAccountService.toggleAccountStatus(
        account.id,
        currentTenant.id,
        !account.is_active
      )
      onUpdate({ ...updatedAccount, connectionStatus: account.connectionStatus })
    } catch (err) {
      console.error('Failed to toggle account status:', err)
    } finally {
      setLoading(false)
      setShowDropdown(false)
    }
  }

  const handleRemove = async () => {
    if (!currentTenant) return
    
    setLoading(true)
    try {
      await EmailAccountService.removeEmailAccount(account.id, currentTenant.id)
      onRemove(account.id)
    } catch (error) {
      console.error('Failed to remove account:', error)
    } finally {
      setLoading(false)
      setShowRemoveDialog(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const dropdownItems = [
    {
      label: 'Test Connection',
      icon: TestTube,
      onClick: handleTestConnection,
      disabled: loading
    },
    {
      label: 'Refresh Token',
      icon: RefreshCw,
      onClick: handleRefreshToken,
      disabled: loading || account.connectionStatus === 'connected'
    },
    {
      label: account.is_active ? 'Deactivate' : 'Activate',
      icon: account.is_active ? PowerOff : Power,
      onClick: handleToggleStatus,
      disabled: loading
    },
    {
      label: 'Remove Account',
      icon: Trash2,
      onClick: () => setShowRemoveDialog(true),
      disabled: loading,
      danger: true
    }
  ]

  return (
    <>
      <div className={`bg-white rounded-lg border ${account.is_active ? 'border-gray-200' : 'border-gray-100'} p-6 relative ${!account.is_active ? 'opacity-60' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{account.email}</h3>
              <p className="text-sm text-gray-500">Microsoft 365</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {loading && <LoadingSpinner size="sm" />}
            <DropdownMenu
              isOpen={showDropdown}
              onToggle={() => setShowDropdown(!showDropdown)}
              trigger={
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              }
              items={dropdownItems}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              account.is_active 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-600 bg-gray-50'
            }`}>
              {account.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Added:</span>
            <span>{formatDate(account.created_at)}</span>
          </div>
          
          {account.lastChecked && (
            <div className="flex justify-between">
              <span>Last Checked:</span>
              <span>{formatDate(account.lastChecked)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Provider:</span>
            <span className="font-medium">MS365</span>
          </div>
        </div>

        {/* Connection Issues */}
        {account.connectionStatus === 'expired' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Token Expired</p>
                <p className="text-sm text-yellow-700">Click &quot;Refresh Token&quot; to renew authentication.</p>
              </div>
            </div>
          </div>
        )}

        {account.connectionStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Connection Error</p>
                <p className="text-sm text-red-700">Unable to connect to this account. Try testing the connection.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRemoveDialog}
        onClose={() => setShowRemoveDialog(false)}
        onConfirm={handleRemove}
        title="Remove Email Account"
        message={`Are you sure you want to remove ${account.email}? This action cannot be undone and will affect any active warmup campaigns using this account.`}
        confirmText="Remove Account"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </>
  )
}
