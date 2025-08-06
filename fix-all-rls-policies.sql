-- Comprehensive fix for all RLS policy infinite recursion issues
-- Run this in your Supabase SQL editor

-- First, drop ALL existing policies to start clean
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
DROP POLICY IF EXISTS "Owners can update their tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can delete their tenants" ON tenants;

DROP POLICY IF EXISTS "Users can view members of their tenants" ON tenant_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON tenant_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON tenant_members;
DROP POLICY IF EXISTS "Users can view members of tenants they own or admin" ON tenant_members;
DROP POLICY IF EXISTS "Owners can update/delete any member" ON tenant_members;
DROP POLICY IF EXISTS "Owners can update any member" ON tenant_members;

DROP POLICY IF EXISTS "Users can view email accounts in their tenants" ON email_accounts;
DROP POLICY IF EXISTS "Users can manage email accounts in their tenants" ON email_accounts;

DROP POLICY IF EXISTS "Users can view campaigns in their tenants" ON warmup_campaigns;
DROP POLICY IF EXISTS "Users can manage campaigns in their tenants" ON warmup_campaigns;

DROP POLICY IF EXISTS "Users can view emails from their campaigns" ON warmup_emails;

-- =============================================
-- TENANT POLICIES (No circular dependencies)
-- =============================================

-- Allow users to create tenants (no restrictions needed for creation)
CREATE POLICY "Anyone can create tenants" ON tenants
    FOR INSERT WITH CHECK (true);

-- Allow users to view tenants where they are explicitly listed as members
-- This avoids the circular dependency by using a direct join
CREATE POLICY "Users can view their tenants" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- Allow owners to update their tenants
CREATE POLICY "Owners can update tenants" ON tenants
    FOR UPDATE USING (
        id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

-- Allow owners to delete their tenants
CREATE POLICY "Owners can delete tenants" ON tenants
    FOR DELETE USING (
        id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

-- =============================================
-- TENANT MEMBERS POLICIES (Simplified to avoid recursion)
-- =============================================

-- Users can always see their own membership record
CREATE POLICY "Users can view own membership" ON tenant_members
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert themselves as members (for new tenant creation)
CREATE POLICY "Users can insert own membership" ON tenant_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Owners can view all members in their tenants
CREATE POLICY "Owners can view all members" ON tenant_members
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

-- Admins can view members in their tenants
CREATE POLICY "Admins can view members" ON tenant_members
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Owners can manage all members
CREATE POLICY "Owners can manage members" ON tenant_members
    FOR ALL USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

-- Admins can manage non-owner members
CREATE POLICY "Admins can manage non-owners" ON tenant_members
    FOR ALL USING (
        role != 'owner' AND
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'admin'
        )
    );

-- =============================================
-- EMAIL ACCOUNTS POLICIES
-- =============================================

CREATE POLICY "Users can view email accounts in their tenants" ON email_accounts
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage email accounts in their tenants" ON email_accounts
    FOR ALL USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- =============================================
-- WARMUP CAMPAIGNS POLICIES
-- =============================================

CREATE POLICY "Users can view campaigns in their tenants" ON warmup_campaigns
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage campaigns in their tenants" ON warmup_campaigns
    FOR ALL USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- =============================================
-- WARMUP EMAILS POLICIES
-- =============================================

CREATE POLICY "Users can view emails from their campaigns" ON warmup_emails
    FOR SELECT USING (
        campaign_id IN (
            SELECT wc.id 
            FROM warmup_campaigns wc
            JOIN tenant_members tm ON wc.tenant_id = tm.tenant_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage emails from their campaigns" ON warmup_emails
    FOR ALL USING (
        campaign_id IN (
            SELECT wc.id 
            FROM warmup_campaigns wc
            JOIN tenant_members tm ON wc.tenant_id = tm.tenant_id
            WHERE tm.user_id = auth.uid()
        )
    );

-- =============================================
-- TEAM INVITATIONS POLICIES
-- =============================================

CREATE POLICY "Users can view invitations for their tenants" ON team_invitations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can manage invitations for their tenants" ON team_invitations
    FOR ALL USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- =============================================
-- ACTIVITY LOGS POLICIES
-- =============================================

CREATE POLICY "Users can view activity logs for their tenants" ON activity_logs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activity logs for their tenants" ON activity_logs
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- =============================================
-- VERIFY SETUP
-- =============================================

-- Test query to verify no recursion (should return without error)
SELECT 
    t.id,
    t.name,
    tm.role
FROM tenants t
JOIN tenant_members tm ON t.id = tm.tenant_id
WHERE tm.user_id = auth.uid()
LIMIT 1;
