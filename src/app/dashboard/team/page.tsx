'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { TeamService } from '@/services/teamService'
import { TeamMember, TeamStats, InviteTeamMemberRequest, TeamAuditLog } from '@/types/team'
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  User, 
  Trash2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentTenant, loading: tenantLoading } = useTenant()
  const router = useRouter()
  
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [auditLog, setAuditLog] = useState<TeamAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Invite form state
  const [inviteForm, setInviteForm] = useState<InviteTeamMemberRequest>({
    email: '',
    role: 'member'
  })
  const [inviteError, setInviteError] = useState<string | null>(null)

  const loadTeamData = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return

    try {
      setLoading(true)
      const [membersData, statsData, auditData] = await Promise.all([
        TeamService.getTeamMembers(currentTenant.id, user.id),
        TeamService.getTeamStats(currentTenant.id),
        TeamService.getTeamAuditLog(currentTenant.id)
      ])
      
      setMembers(membersData)
      setStats(statsData)
      setAuditLog(auditData)
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, user?.id])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadTeamData()
  }, [loadTeamData])

  const handleInviteMember = async () => {
    if (!currentTenant?.id || !user?.id) return

    try {
      setActionLoading('invite')
      setInviteError(null)
      
      await TeamService.inviteTeamMember(currentTenant.id, user.id, inviteForm)
      
      setInviteModalOpen(false)
      setInviteForm({ email: '', role: 'member' })
      await loadTeamData()
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!currentTenant?.id || !user?.id) return

    try {
      setActionLoading(`role-${memberId}`)
      await TeamService.updateMemberRole(currentTenant.id, memberId, newRole, user.id)
      await loadTeamData()
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!currentTenant?.id || !user?.id) return
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      setActionLoading(`remove-${memberId}`)
      await TeamService.removeMember(currentTenant.id, memberId, user.id)
      await loadTeamData()
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />
      default: return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </span>
      case 'invited':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Invited
        </span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-3 w-3 mr-1" />
          {status}
        </span>
    }
  }

  const currentUserRole = currentTenant?.role

  if (authLoading || tenantLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user || !currentTenant) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600">
              Manage team members and their permissions for {currentTenant.name}
            </p>
          </div>
          
          {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </button>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingInvitations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.adminCount}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.email}</div>
                          <div className="text-sm text-gray-500">
                            Joined {new Date(member.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(member.role)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{member.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.last_active 
                        ? new Date(member.last_active).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {member.role !== 'owner' && currentUserRole === 'owner' && (
                        <div className="flex items-center space-x-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value as 'admin' | 'member')}
                            disabled={actionLoading === `role-${member.id}`}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                          
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={actionLoading === `remove-${member.id}`}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {member.role === 'owner' && (
                        <span className="text-gray-400">Owner</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          
          <div className="px-6 py-4">
            <div className="space-y-4">
              {auditLog.map((log) => (
                <div key={log.id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.actor_email}</span>
                      {' '}
                      {log.action === 'invite_sent' && `invited ${log.target_email}`}
                      {log.action === 'member_joined' && 'joined the team'}
                      {log.action === 'role_changed' && `changed role for ${log.target_email}`}
                      {log.action === 'member_removed' && `removed ${log.target_email}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {auditLog.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Invite Modal */}
        {inviteModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Team Member</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="colleague@company.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'member' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  {inviteError && (
                    <div className="text-red-600 text-sm">{inviteError}</div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setInviteModalOpen(false)
                      setInviteError(null)
                      setInviteForm({ email: '', role: 'member' })
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInviteMember}
                    disabled={!inviteForm.email || actionLoading === 'invite'}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === 'invite' ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
