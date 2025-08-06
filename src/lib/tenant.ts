import { supabase } from './supabase'

// type Tenant = Database['public']['Tables']['tenants']['Row']
// type TenantInsert = Database['public']['Tables']['tenants']['Insert']
// type TenantMember = Database['public']['Tables']['tenant_members']['Row']
// type TenantMemberInsert = Database['public']['Tables']['tenant_members']['Insert']

export interface TenantWithRole {
  id: string
  name: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface CreateTenantRequest {
  name: string
}

export interface InviteMemberRequest {
  email: string
  role: 'admin' | 'member'
}

export class TenantService {
  /**
   * Create a new tenant and make the current user the owner
   */
  static async createTenant(data: CreateTenantRequest, userId: string): Promise<TenantWithRole> {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.name,
      })
      .select()
      .single()

    if (tenantError) {
      throw new Error(`Failed to create tenant: ${tenantError.message}`)
    }

    // Add the creator as owner
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: userId,
        role: 'owner',
      })

    if (memberError) {
      // Cleanup: delete the tenant if member creation failed
      await supabase.from('tenants').delete().eq('id', tenant.id)
      throw new Error(`Failed to add user as tenant owner: ${memberError.message}`)
    }

    return {
      ...tenant,
      role: 'owner',
    }
  }

  /**
   * Get all tenants for a user
   */
  static async getUserTenants(userId: string): Promise<TenantWithRole[]> {
    const { data, error } = await supabase
      .from('tenant_members')
      .select(`
        role,
        tenants (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch user tenants: ${error.message}`)
    }

    return data.map(item => {
      const tenant = item.tenants as unknown as { id: string; name: string; created_at: string; updated_at: string }
      return {
        id: tenant.id,
        name: tenant.name,
        created_at: tenant.created_at,
        updated_at: tenant.updated_at,
        role: item.role as 'owner' | 'admin' | 'member',
      }
    })
  }

  /**
   * Get tenant details by ID (with permission check)
   */
  static async getTenant(tenantId: string, userId: string): Promise<TenantWithRole | null> {
    const { data, error } = await supabase
      .from('tenant_members')
      .select(`
        role,
        tenants (
          id,
          name,
          created_at,
          updated_at
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      throw new Error(`Failed to fetch tenant: ${error.message}`)
    }

    const tenant = data.tenants as unknown as { id: string; name: string; created_at: string; updated_at: string }
    return {
      id: tenant.id,
      name: tenant.name,
      created_at: tenant.created_at,
      updated_at: tenant.updated_at,
      role: data.role as 'owner' | 'admin' | 'member',
    }
  }

  /**
   * Update tenant details (owner/admin only)
   */
  static async updateTenant(
    tenantId: string,
    userId: string,
    updates: { name?: string }
  ): Promise<void> {
    // Check if user has permission
    const userRole = await this.getUserRoleInTenant(tenantId, userId)
    if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
      throw new Error('Insufficient permissions to update tenant')
    }

    const { error } = await supabase
      .from('tenants')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId)

    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`)
    }
  }

  /**
   * Get all members of a tenant (admin/owner only)
   */
  static async getTenantMembers(tenantId: string, userId: string): Promise<Array<{
    id: string
    email: string
    role: 'owner' | 'admin' | 'member'
    created_at: string
  }>> {
    // Check if user has permission
    const userRole = await this.getUserRoleInTenant(tenantId, userId)
    if (!userRole || (userRole !== 'owner' && userRole !== 'admin')) {
      throw new Error('Insufficient permissions to view tenant members')
    }

    const { data, error } = await supabase
      .from('tenant_members')
      .select(`
        id,
        role,
        created_at,
        user_id
      `)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(`Failed to fetch tenant members: ${error.message}`)
    }

    // Get user emails (this would need to be done through auth.users if we had access)
    // For now, we'll return user_id as email placeholder
    return data.map(member => ({
      id: member.id,
      email: member.user_id, // This would need to be resolved to actual email
      role: member.role as 'owner' | 'admin' | 'member',
      created_at: member.created_at,
    }))
  }

  /**
   * Update member role (owner only)
   */
  static async updateMemberRole(
    tenantId: string,
    memberId: string,
    newRole: 'admin' | 'member',
    userId: string
  ): Promise<void> {
    // Check if user is owner
    const userRole = await this.getUserRoleInTenant(tenantId, userId)
    if (userRole !== 'owner') {
      throw new Error('Only tenant owners can update member roles')
    }

    const { error } = await supabase
      .from('tenant_members')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`)
    }
  }

  /**
   * Remove member from tenant (owner only, cannot remove owner)
   */
  static async removeMember(
    tenantId: string,
    memberId: string,
    userId: string
  ): Promise<void> {
    // Check if user is owner
    const userRole = await this.getUserRoleInTenant(tenantId, userId)
    if (userRole !== 'owner') {
      throw new Error('Only tenant owners can remove members')
    }

    // Check if trying to remove owner
    const { data: memberData, error: memberError } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('id', memberId)
      .eq('tenant_id', tenantId)
      .single()

    if (memberError || memberData.role === 'owner') {
      throw new Error('Cannot remove tenant owner')
    }

    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('id', memberId)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`)
    }
  }

  /**
   * Get user's role in a specific tenant
   */
  static async getUserRoleInTenant(
    tenantId: string,
    userId: string
  ): Promise<'owner' | 'admin' | 'member' | null> {
    const { data, error } = await supabase
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (error) {
      return null
    }

    return data.role as 'owner' | 'admin' | 'member'
  }

  /**
   * Check if user has access to tenant
   */
  static async hasAccessToTenant(tenantId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRoleInTenant(tenantId, userId)
    return role !== null
  }

  /**
   * Delete tenant (owner only)
   */
  static async deleteTenant(tenantId: string, userId: string): Promise<void> {
    // Check if user is owner
    const userRole = await this.getUserRoleInTenant(tenantId, userId)
    if (userRole !== 'owner') {
      throw new Error('Only tenant owners can delete the tenant')
    }

    // Delete tenant (this will cascade delete members due to foreign key constraints)
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) {
      throw new Error(`Failed to delete tenant: ${error.message}`)
    }
  }
}
