# Supabase Database Setup

This directory contains the database schema and setup instructions for the Email Warmup Pro application.

## Quick Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Execute the schema** in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of schema.sql into the Supabase SQL editor
   ```

3. **Update your environment variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Database Schema Overview

### Core Tables

- **`tenants`** - Organizations/companies using the service
- **`tenant_members`** - User memberships with roles (owner/admin/member)
- **`email_accounts`** - Connected MS365 email accounts
- **`warmup_campaigns`** - Email warmup campaign configurations
- **`warmup_emails`** - Individual email records and tracking
- **`team_invitations`** - Pending team member invitations
- **`activity_logs`** - Audit trail of user actions

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Multi-tenant data isolation** - users can only access their tenant's data
- **Role-based permissions** (Owner > Admin > Member)
- **Automatic audit logging** for all significant actions

### Key Features

- **Automatic tenant ownership** - user who creates tenant becomes owner
- **Cascading deletes** - removing tenant cleans up all related data
- **Optimized indexes** for performance
- **Views for common queries** (campaign_stats, tenant_stats)
- **Helper functions** for permission checking

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization and project name
4. Select a region close to your users
5. Generate a strong database password

### 2. Execute Schema

1. Go to your project dashboard
2. Click on "SQL Editor" in the sidebar
3. Create a new query
4. Copy and paste the entire contents of `schema.sql`
5. Click "Run" to execute

### 3. Verify Setup

Check that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- activity_logs
- email_accounts
- team_invitations
- tenant_members
- tenants
- warmup_campaigns
- warmup_emails

### 4. Test Permissions

Create a test user and verify RLS is working:

```sql
-- This should only return tenants the user belongs to
SELECT * FROM tenants;
```

## Environment Configuration

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: for development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** (use as `NEXT_PUBLIC_SUPABASE_URL`)
3. Copy the **anon/public key** (use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Database Migrations

For future schema changes, create migration files in this directory:

```
supabase/
├── schema.sql          # Initial schema
├── migrations/
│   ├── 001_add_feature.sql
│   └── 002_update_schema.sql
└── README.md
```

## Common Operations

### Add a New User to Tenant

```sql
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES ('tenant-uuid', 'user-uuid', 'member');
```

### Check User Permissions

```sql
SELECT is_tenant_owner('tenant-uuid');
SELECT is_tenant_admin('tenant-uuid');
```

### View Campaign Statistics

```sql
SELECT * FROM campaign_stats WHERE tenant_id = 'your-tenant-id';
```

### View Activity Logs

```sql
SELECT * FROM activity_logs 
WHERE tenant_id = 'your-tenant-id' 
ORDER BY created_at DESC 
LIMIT 50;
```

## Troubleshooting

### Common Issues

1. **RLS blocking queries**: Ensure user is properly authenticated and belongs to tenant
2. **Permission denied**: Check that user has appropriate role for the operation
3. **Foreign key violations**: Ensure parent records exist before creating child records

### Debug Queries

Check user's tenant memberships:
```sql
SELECT * FROM get_user_tenants();
```

Check current user:
```sql
SELECT auth.uid(), auth.email();
```

View all policies:
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## Backup and Restore

### Backup
```bash
pg_dump "postgresql://user:pass@host:port/database" > backup.sql
```

### Restore
```bash
psql "postgresql://user:pass@host:port/database" < backup.sql
```

Or use Supabase's built-in backup features in the dashboard.

## Performance Optimization

The schema includes optimized indexes for common queries:

- Tenant-based lookups
- Campaign filtering
- Email status queries
- Activity log searches

Monitor query performance in the Supabase dashboard and add additional indexes as needed.

## Security Considerations

1. **Never expose service_role key** in client-side code
2. **Use RLS policies** instead of application-level filtering
3. **Validate all inputs** in your application code
4. **Audit sensitive operations** using the activity_logs table
5. **Regularly review user permissions** and remove inactive members

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Review the RLS policies for the affected table
3. Verify user authentication state
4. Check the application error logs

For additional help, refer to the [Supabase documentation](https://supabase.com/docs).
