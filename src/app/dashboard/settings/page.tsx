'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Building2, Users, Trash2, Edit3, Save, X, UserPlus, Crown, Shield, User, AlertTriangle } from 'lucide-react'
import { TenantService } from '@/lib/tenant'

interface TenantMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export default function TenantSettingsPage() {
  const { user } = useAuth()
  const { currentTenant, updateTenant, deleteTenant } = useTenant()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // General settings
  const [isEditing, setIsEditing] = useState(false)
  const [tenantName, setTenantName] = useState('')

  // Members
  const [members, setMembers] = useState<TenantMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const loadMembers = useCallback(async () => {
    if (!currentTenant || !user) return
    
    setMembersLoading(true)
    try {
      const tenantMembers = await TenantService.getTenantMembers(currentTenant.id, user.id)
      setMembers(tenantMembers)
    } catch (err) {
      console.error('Failed to load members:', err)
    } finally {
      setMembersLoading(false)
    }
  }, [currentTenant, user])

  useEffect(() => {
    if (currentTenant) {
      setTenantName(currentTenant.name)
    }
  }, [currentTenant])

  useEffect(() => {
    if (activeTab === 'members' && currentTenant && user) {
      loadMembers()
    }
  }, [activeTab, currentTenant, user, loadMembers])

  const handleUpdateTenant = async () => {
    if (!currentTenant || !tenantName.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateTenant(currentTenant.id, { name: tenantName.trim() })
      setSuccess('Organization name updated successfully')
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTenant = async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      await deleteTenant(currentTenant.id)
      setShowDeleteConfirm(false)
      // User will be redirected to onboarding automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization')
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!currentTenant) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Organization Selected</h3>
          <p className="text-gray-500">Please select or create an organization to access settings.</p>
        </div>
      </DashboardLayout>
    )
  }

  const canManageSettings = currentTenant.role === 'owner' || currentTenant.role === 'admin'
  const canDeleteTenant = currentTenant.role === 'owner'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-600">
            Manage your organization settings and team members
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              General
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Members
            </button>
          </nav>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                {canManageSettings && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  {isEditing ? (
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={tenantName}
                        onChange={(e) => setTenantName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleUpdateTenant}
                        disabled={loading || !tenantName.trim()}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setTenantName(currentTenant.name)
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">{currentTenant.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Role
                  </label>
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(currentTenant.role)}
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(currentTenant.role)}`}>
                      {currentTenant.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created
                  </label>
                  <p className="text-sm text-gray-900">
                    {new Date(currentTenant.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            {canDeleteTenant && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                <div className="border border-red-200 rounded-md p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-900">Delete Organization</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Once you delete an organization, there is no going back. This will permanently delete
                        the organization and all its data including email accounts, campaigns, and member access.
                      </p>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="mt-3 inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Organization
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Team Members</h3>
                {canManageSettings && (
                  <button
                    disabled
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite Member (Coming Soon)
                  </button>
                )}
              </div>

              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.email}</p>
                          <p className="text-xs text-gray-500">
                            Member since {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {members.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No members found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900">Delete Organization</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete &ldquo;{currentTenant.name}&rdquo;? This action cannot be undone and will
                permanently delete all organization data including email accounts, campaigns, and member access.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTenant}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Organization'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
