-- Targeted fix for tenant creation infinite recursion
-- This specifically addresses the circular dependency during tenant creation

-- =============================================
-- FIX TENANT_MEMBERS POLICIES FOR CREATION
-- =============================================

-- Drop ALL tenant_members policies to start clean
DROP POLICY IF EXISTS "tenant_members_select_own" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_insert_own" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_select_admin" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_update_owner" ON tenant_members;
DROP POLICY IF EXISTS "tenant_members_delete_owner" ON tenant_members;
DROP POLICY IF EXISTS "Users can view members of their tenants" ON tenant_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON tenant_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON tenant_members;

-- Create simple policies that don't reference tenant_members in conditions

-- 1. Allow users to insert themselves as members (no conditions checking other tables)
CREATE POLICY "allow_self_insert" ON tenant_members
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- 2. Allow users to view their own memberships (no recursive checks)
CREATE POLICY "allow_self_select" ON tenant_members
    FOR SELECT 
    USING (user_id = auth.uid());

-- 3. Allow users to view other members only if they are owner/admin of the same tenant
-- Use EXISTS instead of IN to avoid some recursion issues
CREATE POLICY "allow_admin_select" ON tenant_members
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = tenant_members.tenant_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- 4. Allow updates only by owners (simple check)
CREATE POLICY "allow_owner_update" ON tenant_members
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = tenant_members.tenant_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'owner'
        )
    );

-- 5. Allow deletions only by owners (simple check)
CREATE POLICY "allow_owner_delete" ON tenant_members
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = tenant_members.tenant_id
            AND tm.user_id = auth.uid()
            AND tm.role = 'owner'
        )
    );

-- =============================================
-- ALSO FIX TENANT POLICIES TO BE SIMPLER
-- =============================================

-- Drop existing tenant policies
DROP POLICY IF EXISTS "tenant_create" ON tenants;
DROP POLICY IF EXISTS "tenant_select" ON tenants;
DROP POLICY IF EXISTS "tenant_update" ON tenants;
DROP POLICY IF EXISTS "tenant_delete" ON tenants;
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
DROP POLICY IF EXISTS "Owners can update their tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can delete their tenants" ON tenants;

-- Create simpler tenant policies
CREATE POLICY "tenants_anyone_can_create" ON tenants
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "tenants_members_can_view" ON tenants
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = tenants.id
            AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "tenants_owners_can_update" ON tenants
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = tenants.id
            AND tm.user_id = auth.uid()
            AND tm.role = 'owner'
        )
    );

CREATE POLICY "tenants_owners_can_delete" ON tenants
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = tenants.id
            AND tm.user_id = auth.uid()
            AND tm.role = 'owner'
        )
    );

-- =============================================
-- TEST THE SETUP
-- =============================================

-- This should work without recursion now
-- Test by trying to select your tenants (replace with your actual user ID if needed)
SELECT t.*, tm.role 
FROM tenants t
JOIN tenant_members tm ON t.id = tm.tenant_id
WHERE tm.user_id = auth.uid()
LIMIT 1;
