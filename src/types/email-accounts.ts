// Email account related types
export type EmailProvider = 'ms365'

export type ConnectionStatus = 'connected' | 'expired' | 'error' | 'testing' | 'disconnected'

export interface EmailAccount {
  id: string
  tenant_id: string
  email: string
  provider: EmailProvider
  access_token: string | null
  refresh_token: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailAccountWithStatus extends EmailAccount {
  connectionStatus: ConnectionStatus
  lastChecked?: string
  lastError?: string
}

export interface EmailAccountCreate {
  email: string
  provider: EmailProvider
  access_token: string
  refresh_token: string
}

export interface EmailAccountUpdate {
  email?: string
  access_token?: string | null
  refresh_token?: string | null
  is_active?: boolean
}

// MS365 OAuth related types
export interface MS365OAuthConfig {
  clientId: string
  redirectUri: string
  scopes: string[]
  authority?: string
}

export interface MS365TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  id_token?: string
}

export interface MS365UserInfo {
  id: string
  email: string
  displayName: string
  givenName: string
  surname: string
  userPrincipalName: string
}

export interface MS365AuthError {
  error: string
  error_description?: string
  error_codes?: number[]
  timestamp?: string
  trace_id?: string
  correlation_id?: string
}

// API Response types
export interface EmailAccountResponse {
  data: EmailAccountWithStatus[]
  total: number
  page: number
  limit: number
}

export interface ConnectionTestResult {
  success: boolean
  status: ConnectionStatus
  message?: string
  lastChecked: string
}

export interface TokenRefreshResult {
  success: boolean
  newToken?: string
  expiresIn?: number
  error?: string
}

// Form types
export interface AddAccountFormData {
  email: string
  provider: EmailProvider
}

export interface AccountSettingsFormData {
  is_active: boolean
  email: string
}

// OAuth flow types
export interface OAuthState {
  tenantId: string
  redirectPath?: string
  nonce: string
  timestamp: number
}

export interface OAuthCallbackParams {
  code?: string
  state?: string
  error?: string
  error_description?: string
  session_state?: string
}

// Email account statistics
export interface EmailAccountStats {
  total: number
  active: number
  connected: number
  expired: number
  errors: number
  lastUpdated: string
}

// Warmup campaign integration
export interface CampaignEmailAccount {
  id: string
  email: string
  provider: EmailProvider
  isActive: boolean
  connectionStatus: ConnectionStatus
  dailyLimit?: number
  currentUsage?: number
}

// Permissions and scopes
export interface EmailAccountPermissions {
  canRead: boolean
  canSend: boolean
  canDelete: boolean
  canManageFolders: boolean
  scopes: string[]
}

// Health check types
export interface HealthCheckResult {
  accountId: string
  email: string
  status: ConnectionStatus
  lastChecked: string
  responseTime?: number
  errorCount: number
  lastError?: string
}

// Bulk operations
export interface BulkOperation {
  action: 'activate' | 'deactivate' | 'test' | 'refresh' | 'remove'
  accountIds: string[]
}

export interface BulkOperationResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    accountId: string
    email: string
    error: string
  }>
}

// Event types for real-time updates
export interface EmailAccountEvent {
  type: 'status_changed' | 'token_refreshed' | 'account_added' | 'account_removed'
  accountId: string
  email: string
  newStatus?: ConnectionStatus
  timestamp: string
  tenantId: string
}

// Filter and search types
export interface EmailAccountFilters {
  provider?: EmailProvider
  status?: ConnectionStatus
  isActive?: boolean
  search?: string
  dateRange?: {
    start: string
    end: string
  }
}

export interface EmailAccountSort {
  field: 'email' | 'created_at' | 'updated_at' | 'status'
  direction: 'asc' | 'desc'
}

// Export helper types
export type EmailAccountEventHandler = (event: EmailAccountEvent) => void
export type ConnectionStatusCheck = (account: EmailAccount) => Promise<ConnectionStatus>
export type TokenRefreshHandler = (account: EmailAccount) => Promise<TokenRefreshResult>
