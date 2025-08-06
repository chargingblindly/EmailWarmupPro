// import { supabase } from '@/lib/supabase' // Currently not used in mock implementation
import { TeamMember, TeamInvitation, InviteTeamMemberRequest, TeamAuditLog, TeamStats } from '@/types/team'

export class TeamService {
  /**
   * Get all team members for a tenant
   */
  static async getTeamMembers(tenantId: string, userId: string): Promise<TeamMember[]> {
    // For demo purposes, we'll return mock data since we don't have access to auth.users
    // In a real implementation, this would join with auth.users to get email addresses
    
    const mockMembers: TeamMember[] = [
      {
        id: '1',
        email: 'owner@company.com',
        role: 'owner',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_active: '2024-01-15T12:00:00Z'
      },
      {
        id: '2',
        email: 'admin@company.com',
        role: 'admin',
        status: 'active',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        last_active: '2024-01-14T15:30:00Z'
      },
      {
        id: '3',
        email: 'member@company.com',
        role: 'member',
        status: 'active',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        last_active: '2024-01-13T09:15:00Z'
      },
      {
        id: '4',
        email: 'invited@company.com',
        role: 'member',
        status: 'invited',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-10T00:00:00Z',
        invited_by: userId
      }
    ]

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return mockMembers
  }

  /**
   * Get team statistics
   */
  static async getTeamStats(_tenantId: string): Promise<TeamStats> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      totalMembers: 4,
      activeMembers: 3,
      pendingInvitations: 1,
      adminCount: 2,
      memberCount: 2
    }
  }

  /**
   * Send team invitation
   */
  static async inviteTeamMember(
    tenantId: string, 
    userId: string, 
    invitation: InviteTeamMemberRequest
  ): Promise<TeamInvitation> {
    // Mock implementation - in real app would send email
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockInvitation: TeamInvitation = {
      id: Date.now().toString(),
      tenant_id: tenantId,
      email: invitation.email,
      role: invitation.role,
      invited_by: userId,
      status: 'pending',
      token: Math.random().toString(36).substring(7),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Log the action
    await this.logTeamAction(tenantId, userId, 'invite_sent', {
      targetEmail: invitation.email,
      role: invitation.role
    })
    
    return mockInvitation
  }

  /**
   * Update team member role
   */
  static async updateMemberRole(
    tenantId: string,
    memberId: string,
    newRole: 'admin' | 'member',
    userId: string
  ): Promise<void> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Log the action
    await this.logTeamAction(tenantId, userId, 'role_changed', {
      memberId,
      newRole
    })
  }

  /**
   * Remove team member
   */
  static async removeMember(
    tenantId: string,
    memberId: string,
    userId: string
  ): Promise<void> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Log the action
    await this.logTeamAction(tenantId, userId, 'member_removed', {
      memberId
    })
  }

  /**
   * Accept invitation
   */
  static async acceptInvitation(_token: string, _userId: string): Promise<void> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Decline invitation
   */
  static async declineInvitation(_token: string): Promise<void> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  /**
   * Get team audit log
   */
  static async getTeamAuditLog(tenantId: string): Promise<TeamAuditLog[]> {
    // Mock audit log data
    await new Promise(resolve => setTimeout(resolve, 400))
    
    const mockAuditLog: TeamAuditLog[] = [
      {
        id: '1',
        tenant_id: tenantId,
        action: 'invite_sent',
        actor_id: 'user1',
        actor_email: 'owner@company.com',
        target_email: 'invited@company.com',
        details: { role: 'member' },
        created_at: '2024-01-10T10:00:00Z'
      },
      {
        id: '2',
        tenant_id: tenantId,
        action: 'member_joined',
        actor_id: 'user2',
        actor_email: 'admin@company.com',
        details: { role: 'admin' },
        created_at: '2024-01-02T09:00:00Z'
      },
      {
        id: '3',
        tenant_id: tenantId,
        action: 'role_changed',
        actor_id: 'user1',
        actor_email: 'owner@company.com',
        target_email: 'admin@company.com',
        details: { oldRole: 'member', newRole: 'admin' },
        created_at: '2024-01-05T14:30:00Z'
      }
    ]
    
    return mockAuditLog
  }

  /**
   * Log team action for audit trail
   */
  private static async logTeamAction(
    tenantId: string,
    userId: string,
    action: TeamAuditLog['action'],
    details: Record<string, unknown>
  ): Promise<void> {
    // Mock implementation - in real app would insert into audit log table
    console.log('Team action logged:', { tenantId, userId, action, details })
  }

  /**
   * Resend invitation
   */
  static async resendInvitation(_invitationId: string, _userId: string): Promise<void> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(_invitationId: string, _userId: string): Promise<void> {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 600))
  }
}
