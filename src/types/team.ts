// Team management types
export interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  status: 'active' | 'invited' | 'pending'
  created_at: string
  updated_at: string
  invited_by?: string
  last_active?: string
}

export interface TeamInvitation {
  id: string
  tenant_id: string
  email: string
  role: 'admin' | 'member'
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  token: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface InviteTeamMemberRequest {
  email: string
  role: 'admin' | 'member'
}

export interface TeamAuditLog {
  id: string
  tenant_id: string
  action: 'invite_sent' | 'invite_accepted' | 'invite_declined' | 'member_removed' | 'role_changed' | 'member_joined'
  actor_id: string
  actor_email: string
  target_email?: string
  details: Record<string, unknown>
  created_at: string
}

export interface UpdateMemberRoleRequest {
  memberId: string
  newRole: 'admin' | 'member'
}

export interface TeamStats {
  totalMembers: number
  activeMembers: number
  pendingInvitations: number
  adminCount: number
  memberCount: number
}

export interface TeamMemberWithDetails extends TeamMember {
  invitedBy?: {
    email: string
    name?: string
  }
  lastActivity?: {
    action: string
    timestamp: string
  }
}
