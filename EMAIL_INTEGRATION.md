# MS365 Email Integration System

This document describes the comprehensive MS365 email integration system for the Email Warmup Pro application.

## Overview

The email integration system provides a complete solution for managing MS365 email accounts within the Email Warmup Pro platform. It includes OAuth authentication, account management, connection monitoring, and a demo-friendly implementation.

## Features

### 1. Email Accounts Management Page (`/dashboard/accounts`)

- **View All Accounts**: Display all connected MS365 email accounts for the current tenant
- **Account Status**: Real-time connection status monitoring (Connected, Expired, Error, Testing)
- **Statistics Dashboard**: Overview cards showing total accounts, connected accounts, and active accounts
- **Account Actions**: Add, remove, activate/deactivate, test connections, and refresh tokens
- **Bulk Operations**: Manage multiple accounts simultaneously

### 2. MS365 OAuth Integration

#### Mock OAuth Flow (Demo Mode)
- Simulates the complete MS365 OAuth flow for demonstration
- Realistic-looking OAuth consent experience
- Mock token exchange and user information retrieval
- Stores simulated connection data in the database

#### Real OAuth Integration Ready
- Complete OAuth implementation ready for production
- CSRF protection with state validation
- Secure token handling and storage
- OAuth callback page with proper error handling

### 3. Account Management Utilities

#### EmailAccountService Class
- **Account CRUD Operations**: Create, read, update, delete email accounts
- **Status Monitoring**: Check connection health and token validity
- **Token Management**: Refresh expired tokens automatically
- **Connection Testing**: Verify account connectivity
- **Tenant Isolation**: All operations are scoped to the current tenant

#### MS365OAuth Class
- **OAuth URL Generation**: Create properly formatted OAuth URLs
- **Token Exchange**: Handle authorization code to token exchange
- **User Information**: Retrieve user profile from MS365
- **Token Validation**: Verify token validity
- **Token Refresh**: Renew expired access tokens

### 4. UI Components

#### EmailAccountCard
- **Account Overview**: Display email, provider, and status
- **Status Indicators**: Visual status with appropriate colors and icons
- **Action Menu**: Dropdown with connection testing, token refresh, and removal options
- **Error Handling**: Display connection issues and suggested actions
- **Real-time Updates**: Reflect status changes immediately

#### AddAccountModal
- **OAuth Flow**: Guided MS365 account connection process
- **Permission Display**: Show required permissions clearly
- **Demo Notice**: Indicate demo mode vs real integration
- **Success Feedback**: Confirm successful account addition

#### OAuth Callback Page
- **OAuth Processing**: Handle authorization codes and errors
- **State Validation**: CSRF protection
- **User Feedback**: Clear success/error messages
- **Auto-redirect**: Automatic navigation after completion

## Database Schema

### email_accounts Table

```sql
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'ms365',
    access_token TEXT,
    refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## File Structure

```
src/
├── app/dashboard/accounts/
│   ├── page.tsx                           # Main accounts management page
│   └── oauth/callback/
│       └── page.tsx                       # OAuth callback handler
├── components/email-accounts/
│   ├── EmailAccountCard.tsx               # Individual account display
│   └── AddAccountModal.tsx                # Account addition modal
├── components/ui/
│   ├── Modal.tsx                          # Reusable modal component
│   ├── DropdownMenu.tsx                   # Dropdown menu component
│   ├── ConfirmDialog.tsx                  # Confirmation dialog
│   └── LoadingSpinner.tsx                 # Loading spinner
├── lib/
│   ├── email-accounts.ts                  # Email account service
│   ├── ms365-oauth.ts                     # MS365 OAuth implementation
│   └── supabase.ts                        # Database client and types
└── types/
    └── email-accounts.ts                  # TypeScript type definitions
```

## Key Features Explained

### Multi-Tenant Support

All email accounts are automatically scoped to the current tenant using the `useTenant()` hook. This ensures complete data isolation between different organizations.

```typescript
const { currentTenant } = useTenant()
const accounts = await EmailAccountService.getEmailAccounts(currentTenant.id)
```

### Connection Status Monitoring

The system provides real-time connection status monitoring with four states:

- **Connected**: Account is properly authenticated and accessible
- **Expired**: Access token has expired and needs refresh
- **Error**: Connection failed or authentication invalid
- **Testing**: Currently testing the connection

### Token Management

Automatic token refresh handling:

```typescript
const success = await EmailAccountService.refreshAccessToken(accountId, tenantId)
if (success) {
    // Token refreshed successfully
}
```

### Demo Mode vs Production

The system is designed to work in both demo and production modes:

- **Demo Mode**: Mock OAuth flow with simulated data
- **Production Mode**: Real MS365 OAuth integration

## Security Considerations

1. **CSRF Protection**: OAuth state parameter validation
2. **Token Storage**: Secure storage in database with encryption
3. **Tenant Isolation**: All operations scoped to current tenant
4. **Error Handling**: Secure error messages without exposing sensitive data

## Configuration

### Environment Variables

```env
# MS365 OAuth Configuration (for production)
MS365_CLIENT_ID=your_client_id
MS365_CLIENT_SECRET=your_client_secret
MS365_REDIRECT_URI=https://yourdomain.com/dashboard/accounts/oauth/callback

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### MS365 App Registration

For production use, register an application in Azure AD with:

- **Redirect URI**: `https://yourdomain.com/dashboard/accounts/oauth/callback`
- **Permissions**:
  - `Mail.ReadWrite`
  - `Mail.Send`
  - `User.Read`
  - `offline_access`

## Usage Examples

### Adding an Email Account

1. Navigate to `/dashboard/accounts`
2. Click "Add Account"
3. Follow the OAuth flow (mock or real)
4. Account is automatically added and appears in the list

### Testing Account Connection

1. Click the three-dot menu on any account card
2. Select "Test Connection"
3. System verifies connectivity and updates status

### Refreshing Expired Tokens

1. Expired accounts show a warning message
2. Click "Refresh Token" from the dropdown menu
3. System automatically refreshes the token

## API Integration Points

The system is designed to easily integrate with real MS365 APIs:

```typescript
// Replace mock implementations with real API calls
static async exchangeCodeForTokens(code: string, state?: string): Promise<MS365TokenResponse> {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.MS365_CLIENT_ID!,
            client_secret: process.env.MS365_CLIENT_SECRET!,
            code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.MS365_REDIRECT_URI!
        })
    })
    return response.json()
}
```

## Error Handling

The system provides comprehensive error handling:

- **Network Errors**: Graceful degradation with retry options
- **Authentication Errors**: Clear messages with resolution steps
- **Permission Errors**: Specific guidance for permission issues
- **Rate Limiting**: Automatic backoff and retry logic

## Future Enhancements

1. **Bulk Account Import**: CSV/Excel import functionality
2. **Account Health Dashboard**: Detailed connection analytics
3. **Automated Token Refresh**: Background token renewal
4. **Multiple Provider Support**: Gmail, Outlook.com integration
5. **Account Synchronization**: Real-time sync with MS365 changes

## Troubleshooting

### Common Issues

1. **OAuth Callback 404**: Ensure redirect URI matches exactly
2. **Token Expired**: Use refresh token functionality
3. **Permission Denied**: Check MS365 app permissions
4. **Database Errors**: Verify Supabase connection and RLS policies

### Debug Mode

Enable debug logging by setting:

```typescript
localStorage.setItem('email-accounts-debug', 'true')
```

This provides detailed console logging for troubleshooting.
