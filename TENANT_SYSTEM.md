# Multi-Tenant System Documentation

## Overview

The Email Warmup Pro application now includes a comprehensive multi-tenant system that allows users to create and manage organizations, with role-based access control and team collaboration features.

## Key Features

### 1. Automatic Tenant Onboarding
- New users are automatically redirected to `/dashboard/onboarding` if they don't belong to any tenant
- Guided 2-step onboarding process:
  1. Create organization
  2. Welcome screen with next steps

### 2. Tenant Management
- **Create Organizations**: Users can create multiple organizations
- **Switch Between Tenants**: Easy tenant switching via navbar dropdown
- **Organization Settings**: Update organization details and manage team members
- **Role-based Access**: Owner, Admin, and Member roles with different permissions

### 3. User Roles & Permissions

#### Owner
- Full access to organization settings
- Can update organization details
- Can manage team members (invite, remove, change roles)
- Can delete the organization
- Cannot be removed from the organization

#### Admin  
- Can update organization details
- Can view team members
- Cannot delete the organization or manage other members

#### Member
- Read-only access to organization
- Cannot modify settings or manage members

## File Structure

```
src/
├── lib/
│   ├── tenant.ts                 # Tenant service with CRUD operations
│   └── supabase.ts              # Database schema and Supabase client
├── contexts/
│   └── TenantContext.tsx        # React context for tenant management
├── app/
│   └── dashboard/
│       ├── onboarding/
│       │   └── page.tsx         # Tenant onboarding flow
│       ├── settings/
│       │   └── page.tsx         # Tenant settings and management
│       └── page.tsx             # Main dashboard (auto-redirects to onboarding)
└── components/
    └── dashboard/
        └── Navbar.tsx           # Navigation with tenant switching
```

## Database Schema

### Tables

#### `tenants`
- `id` (uuid, primary key)
- `name` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `tenant_members`
- `id` (uuid, primary key)
- `tenant_id` (uuid, foreign key → tenants.id)
- `user_id` (uuid, foreign key → auth.users.id)
- `role` (enum: 'owner' | 'admin' | 'member')
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Multi-tenant Data Tables
All business data tables include `tenant_id` for proper data isolation:
- `email_accounts`
- `warmup_campaigns`
- `warmup_emails`

## API Services

### TenantService Class

Located in `src/lib/tenant.ts`, provides methods for:

- `createTenant(data, userId)` - Create new organization
- `getUserTenants(userId)` - Get all user's organizations
- `getTenant(tenantId, userId)` - Get specific tenant details
- `updateTenant(tenantId, userId, updates)` - Update organization
- `deleteTenant(tenantId, userId)` - Delete organization
- `getTenantMembers(tenantId, userId)` - Get team members
- `updateMemberRole(tenantId, memberId, newRole, userId)` - Update member role
- `removeMember(tenantId, memberId, userId)` - Remove team member
- `getUserRoleInTenant(tenantId, userId)` - Check user permissions
- `hasAccessToTenant(tenantId, userId)` - Verify access

## Context Providers

### TenantContext

Provides global state management for:
- Current active tenant
- List of user's tenants
- Loading states
- Onboarding status
- Tenant CRUD operations

## User Flow

### New User Journey
1. User signs up/logs in
2. Redirected to `/dashboard`
3. TenantContext detects no tenants → sets `needsOnboarding = true`
4. Dashboard redirects to `/dashboard/onboarding`
5. User creates their first organization
6. Redirected back to dashboard with active tenant

### Existing User Journey
1. User logs in
2. TenantContext loads their tenants
3. Sets first tenant as active (or restores from localStorage)
4. User can switch tenants via navbar dropdown
5. Access tenant settings via navbar or direct navigation

## Security Features

- **Data Isolation**: All queries filtered by tenant_id
- **Permission Checks**: Role verification before any operations
- **Owner Protection**: Owners cannot be removed or demoted
- **Access Control**: Users can only access their tenant data

## Future Enhancements

The system is designed to support:
- Team member invitations via email
- Billing and subscription management per tenant
- Advanced role permissions (custom roles)
- Tenant-level settings and preferences
- Audit logs for tenant operations
- Bulk operations for tenant management

## Error Handling

The system includes comprehensive error handling:
- Database operation failures
- Permission denied scenarios
- Invalid tenant access attempts
- Network connectivity issues
- User-friendly error messages

## Performance Considerations

- **Efficient Queries**: Optimized database queries with proper indexing
- **Caching**: Tenant data cached in React context
- **Lazy Loading**: Members loaded only when viewing the members tab
- **Pagination Ready**: Services support pagination for large datasets
