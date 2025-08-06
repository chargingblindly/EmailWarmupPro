# Microsoft App Registration Setup

To use real MS365 OAuth integration, you need to create a Microsoft App registration in Azure Portal.

## Steps to create Microsoft App Registration:

### 1. Go to Azure Portal
- Visit https://portal.azure.com
- Sign in with your Microsoft account

### 2. Navigate to App Registrations
- Search for "App registrations" in the search bar
- Click on "App registrations"

### 3. Create New Registration
- Click "New registration"
- Fill in the details:
  - **Name**: Email Warmup Pro
  - **Supported account types**: Select "Accounts in any organizational directory and personal Microsoft accounts"
  - **Redirect URI**: 
    - Platform: Web
    - URI: `https://your-domain.netlify.app/dashboard/accounts/oauth/callback`
    - For local development: `http://localhost:3000/dashboard/accounts/oauth/callback`

### 4. Configure API Permissions
After creating the app, go to "API permissions":
- Click "Add a permission"
- Select "Microsoft Graph"
- Select "Delegated permissions"
- Add these permissions:
  - `Mail.ReadWrite` - Read and write access to user mail
  - `Mail.Send` - Send mail as a user
  - `User.Read` - Sign in and read user profile
  - `offline_access` - Maintain access to data you have given it access to

### 5. Create Client Secret
- Go to "Certificates & secrets"
- Click "New client secret"
- Add description: "Email Warmup Pro Secret"
- Set expiration (recommended: 24 months)
- **Copy the secret value immediately** (you won't be able to see it again)

### 6. Get Application Details
From the "Overview" page, copy:
- **Application (client) ID**
- **Directory (tenant) ID** (optional, can use 'common' for multi-tenant)

## Environment Variables

Add these to your environment variables:

```env
NEXT_PUBLIC_MS365_CLIENT_ID=your-client-id-here
MS365_CLIENT_SECRET=your-client-secret-here
MS365_TENANT_ID=common
```

## Important Notes

- **Never commit client secrets to git**
- Use `common` as tenant ID for multi-tenant apps
- The redirect URI must exactly match what's configured in Azure
- In production, make sure to use HTTPS redirect URIs
- Test the OAuth flow in incognito/private browsing to avoid cached tokens
