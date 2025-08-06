-- Email Warmup Pro Database Schema
-- This file contains all the SQL commands needed to set up the database in Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE email_provider AS ENUM ('ms365');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE email_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- =============================================
-- TENANTS TABLE
-- =============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TENANT MEMBERS TABLE
-- =============================================
CREATE TABLE tenant_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- =============================================
-- EMAIL ACCOUNTS TABLE
-- =============================================
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    provider email_provider NOT NULL DEFAULT 'ms365',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_health_check TIMESTAMP WITH TIME ZONE,
    health_status VARCHAR(50) DEFAULT 'unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- =============================================
-- WARMUP CAMPAIGNS TABLE
-- =============================================
CREATE TABLE warmup_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status campaign_status NOT NULL DEFAULT 'draft',
    daily_volume INTEGER NOT NULL DEFAULT 5,
    ramp_up_days INTEGER NOT NULL DEFAULT 30,
    current_day INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- WARMUP EMAILS TABLE
-- =============================================
CREATE TABLE warmup_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES warmup_campaigns(id) ON DELETE CASCADE,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT,
    status email_status NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    bounce_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEAM INVITATIONS TABLE
-- =============================================
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- =============================================
-- ACTIVITY LOGS TABLE
-- =============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Tenant members indexes
CREATE INDEX idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id ON tenant_members(user_id);

-- Email accounts indexes
CREATE INDEX idx_email_accounts_tenant_id ON email_accounts(tenant_id);
CREATE INDEX idx_email_accounts_email ON email_accounts(email);
CREATE INDEX idx_email_accounts_is_active ON email_accounts(is_active);

-- Warmup campaigns indexes
CREATE INDEX idx_warmup_campaigns_tenant_id ON warmup_campaigns(tenant_id);
CREATE INDEX idx_warmup_campaigns_email_account_id ON warmup_campaigns(email_account_id);
CREATE INDEX idx_warmup_campaigns_status ON warmup_campaigns(status);

-- Warmup emails indexes
CREATE INDEX idx_warmup_emails_campaign_id ON warmup_emails(campaign_id);
CREATE INDEX idx_warmup_emails_status ON warmup_emails(status);
CREATE INDEX idx_warmup_emails_sent_at ON warmup_emails(sent_at);

-- Team invitations indexes
CREATE INDEX idx_team_invitations_tenant_id ON team_invitations(tenant_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(token);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_tenant_id ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmup_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE warmup_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Users can view tenants they belong to" ON tenants
    FOR SELECT USING (
        id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their tenants" ON tenants
    FOR UPDATE USING (
        id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

CREATE POLICY "Users can create tenants" ON tenants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can delete their tenants" ON tenants
    FOR DELETE USING (
        id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Tenant members policies
CREATE POLICY "Users can view members of their tenants" ON tenant_members
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Owners and admins can manage members" ON tenant_members
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can insert themselves as members" ON tenant_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Email accounts policies
CREATE POLICY "Users can view email accounts in their tenants" ON email_accounts
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage email accounts in their tenants" ON email_accounts
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Warmup campaigns policies
CREATE POLICY "Users can view campaigns in their tenants" ON warmup_campaigns
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage campaigns in their tenants" ON warmup_campaigns
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

-- Warmup emails policies
CREATE POLICY "Users can view emails from their campaigns" ON warmup_emails
    FOR SELECT USING (
        campaign_id IN (
            SELECT wc.id FROM warmup_campaigns wc
            JOIN tenant_members tm ON wc.tenant_id = tm.tenant_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage emails from their campaigns" ON warmup_emails
    FOR ALL USING (
        campaign_id IN (
            SELECT wc.id FROM warmup_campaigns wc
            JOIN tenant_members tm ON wc.tenant_id = tm.tenant_id
            WHERE tm.user_id = auth.uid()
        )
    );

-- Team invitations policies
CREATE POLICY "Users can view invitations for their tenants" ON team_invitations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners and admins can manage invitations" ON team_invitations
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Activity logs policies
CREATE POLICY "Users can view activity logs for their tenants" ON activity_logs
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables that need it
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_members_updated_at 
    BEFORE UPDATE ON tenant_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at 
    BEFORE UPDATE ON email_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warmup_campaigns_updated_at 
    BEFORE UPDATE ON warmup_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create tenant membership when tenant is created
CREATE OR REPLACE FUNCTION create_tenant_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tenant_members (tenant_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically add creator as owner
CREATE TRIGGER create_tenant_owner_membership_trigger
    AFTER INSERT ON tenants
    FOR EACH ROW EXECUTE FUNCTION create_tenant_owner_membership();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_tenant_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activity_logs (tenant_id, user_id, action, resource_type, resource_id, details)
    VALUES (p_tenant_id, auth.uid(), p_action, p_resource_type, p_resource_id, p_details);
END;
$$ language 'plpgsql';

-- =============================================
-- SAMPLE DATA (OPTIONAL - FOR DEVELOPMENT)
-- =============================================

-- Uncomment the following lines if you want to insert sample data for development

/*
-- Insert sample tenant (you'll need to replace with actual user IDs)
INSERT INTO tenants (id, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Acme Corporation');

-- Insert sample email account
INSERT INTO email_accounts (tenant_id, email, provider, is_active) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'john@acme.com', 'ms365', true);
*/

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for campaign statistics
CREATE VIEW campaign_stats AS
SELECT 
    wc.id,
    wc.name,
    wc.status,
    wc.tenant_id,
    COUNT(we.id) as total_emails,
    COUNT(CASE WHEN we.status = 'sent' THEN 1 END) as emails_sent,
    COUNT(CASE WHEN we.status = 'delivered' THEN 1 END) as emails_delivered,
    COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as emails_failed,
    CASE 
        WHEN COUNT(we.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN we.status = 'delivered' THEN 1 END)::decimal / COUNT(we.id)) * 100, 2)
        ELSE 0 
    END as delivery_rate
FROM warmup_campaigns wc
LEFT JOIN warmup_emails we ON wc.id = we.campaign_id
GROUP BY wc.id, wc.name, wc.status, wc.tenant_id;

-- View for tenant statistics
CREATE VIEW tenant_stats AS
SELECT 
    t.id,
    t.name,
    COUNT(DISTINCT tm.user_id) as member_count,
    COUNT(DISTINCT ea.id) as email_account_count,
    COUNT(DISTINCT wc.id) as campaign_count,
    COUNT(DISTINCT CASE WHEN wc.status = 'active' THEN wc.id END) as active_campaigns
FROM tenants t
LEFT JOIN tenant_members tm ON t.id = tm.tenant_id
LEFT JOIN email_accounts ea ON t.id = ea.tenant_id
LEFT JOIN warmup_campaigns wc ON t.id = wc.tenant_id
GROUP BY t.id, t.name;

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to check if user is tenant owner
CREATE OR REPLACE FUNCTION is_tenant_owner(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_members 
        WHERE tenant_id = tenant_uuid 
        AND user_id = auth.uid() 
        AND role = 'owner'
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if user is tenant admin or owner
CREATE OR REPLACE FUNCTION is_tenant_admin(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tenant_members 
        WHERE tenant_id = tenant_uuid 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get user's tenant memberships
CREATE OR REPLACE FUNCTION get_user_tenants()
RETURNS TABLE (
    tenant_id UUID,
    tenant_name VARCHAR,
    user_role user_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, tm.role
    FROM tenants t
    JOIN tenant_members tm ON t.id = tm.tenant_id
    WHERE tm.user_id = auth.uid();
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
