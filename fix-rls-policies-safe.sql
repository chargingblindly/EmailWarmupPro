-- Safe RLS policy fix that handles existing policies
-- Run this in your Supabase SQL editor

-- =============================================
-- DROP ALL EXISTING POLICIES SAFELY
-- =============================================

-- Drop tenant policies
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;
DROP POLICY IF EXISTS "Owners can update their tenants" ON tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can delete their tenants" ON tenants;
DROP POLICY IF EXISTS "Anyone can create tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can update tenants" ON tenants;
DROP POLICY IF EXISTS "Owners can delete tenants" ON tenants;

-- Drop tenant_members policies
DROP POLICY IF EXISTS "Users can view members of their tenants" ON tenant_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON tenant_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON tenant_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON tenant_members;
DROP POLICY IF EXISTS "Users can view members of tenants they own or admin" ON tenant_members;
DROP POLICY IF EXISTS "Owners can update/delete any member" ON tenant_members;
DROP POLICY IF EXISTS "Owners can update any member" ON tenant_members;
DROP POLICY IF EXISTS "Users can view own membership" ON tenant_members;
DROP POLICY IF EXISTS "Users can insert own membership" ON tenant_members;
DROP POLICY IF EXISTS "Owners can view all members" ON tenant_members;
DROP POLICY IF EXISTS "Admins can view members" ON tenant_members;
DROP POLICY IF EXISTS "Owners can manage members" ON tenant_members;
DROP POLICY IF EXISTS "Admins can manage non-owners" ON tenant_members;

-- Drop email_accounts policies
DROP POLICY IF EXISTS "Users can view email accounts in their tenants" ON email_accounts;
DROP POLICY IF EXISTS "Users can manage email accounts in their tenants" ON email_accounts;

-- Drop warmup_campaigns policies
DROP POLICY IF EXISTS "Users can view campaigns in their tenants" ON warmup_campaigns;
DROP POLICY IF EXISTS "Users can manage campaigns in their tenants" ON warmup_campaigns;

-- Drop warmup_emails policies
DROP POLICY IF EXISTS "Users can view emails from their campaigns" ON warmup_emails;
DROP POLICY IF EXISTS "Users can manage emails from their campaigns" ON warmup_emails;

-- Drop team_invitations policies
DROP POLICY IF EXISTS "Users can view invitations for their tenants" ON team_invitations;
DROP POLICY IF EXISTS "Users can manage invitations for their tenants" ON team_invitations;

-- Drop activity_logs policies
DROP POLICY IF EXISTS "Users can view activity logs for their tenants" ON activity_logs;
DROP POLICY IF EXISTS "Users can create activity logs for their tenants" ON activity_logs;

-- =============================================
-- CREATE NEW NON-RECURSIVE POLICIES
-- =============================================

-- TENANT POLICIES
CREATE POLICY "tenant_create" ON tenants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "tenant_select" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "tenant_update" ON tenants
    FOR UPDATE USING (
        id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

CREATE POLICY "tenant_delete" ON tenants
    FOR DELETE USING (
        id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

-- TENANT MEMBERS POLICIES
CREATE POLICY "tenant_members_select_own" ON tenant_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tenant_members_insert_own" ON tenant_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tenant_members_select_admin" ON tenant_members
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "tenant_members_update_owner" ON tenant_members
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

CREATE POLICY "tenant_members_delete_owner" ON tenant_members
    FOR DELETE USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid() 
            AND tm.role = 'owner'
        )
    );

-- EMAIL ACCOUNTS POLICIES
CREATE POLICY "email_accounts_select" ON email_accounts
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "email_accounts_all" ON email_accounts
    FOR ALL USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- WARMUP CAMPAIGNS POLICIES
CREATE POLICY "warmup_campaigns_select" ON warmup_campaigns
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "warmup_campaigns_all" ON warmup_campaigns
    FOR ALL USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

-- WARMUP EMAILS POLICIES
CREATE POLICY "warmup_emails_select" ON warmup_emails
    FOR SELECT USING (
        campaign_id IN (
            SELECT wc.id 
            FROM warmup_campaigns wc
            JOIN tenant_members tm ON wc.tenant_id = tm.tenant_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "warmup_emails_all" ON warmup_emails
    FOR ALL USING (
        campaign_id IN (
            SELECT wc.id 
            FROM warmup_campaigns wc
            JOIN tenant_members tm ON wc.tenant_id = tm.tenant_id
            WHERE tm.user_id = auth.uid()
        )
    );

-- TEAM INVITATIONS POLICIES
CREATE POLICY "team_invitations_select" ON team_invitations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "team_invitations_all" ON team_invitations
    FOR ALL USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- ACTIVITY LOGS POLICIES
CREATE POLICY "activity_logs_select" ON activity_logs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "activity_logs_insert" ON activity_logs
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tm.tenant_id 
            FROM tenant_members tm 
            WHERE tm.user_id = auth.uid()
        )
    );
