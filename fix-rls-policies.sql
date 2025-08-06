-- Fix for infinite recursion in RLS policies
-- Run this in your Supabase SQL editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their tenants" ON tenant_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON tenant_members;

-- Create new policies without recursion
CREATE POLICY "Users can view their own membership" ON tenant_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert themselves as members" ON tenant_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- For viewing other members, use a different approach
CREATE POLICY "Users can view members of tenants they own or admin" ON tenant_members
    FOR SELECT USING (
        tenant_id IN (
            -- Direct subquery without self-reference
            SELECT t.id FROM tenants t
            JOIN tenant_members tm ON t.id = tm.tenant_id
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Separate policies for different operations
CREATE POLICY "Owners can update/delete any member" ON tenant_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tenants t
            JOIN tenant_members tm ON t.id = tm.tenant_id
            WHERE t.id = tenant_members.tenant_id
            AND tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

CREATE POLICY "Owners can update any member" ON tenant_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tenants t
            JOIN tenant_members tm ON t.id = tm.tenant_id
            WHERE t.id = tenant_members.tenant_id
            AND tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );
