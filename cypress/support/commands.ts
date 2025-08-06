// Custom Cypress commands for Email Warmup Pro

// Data-testid selector helper
Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`)
})

// Authentication commands
Cypress.Commands.add('login', (email?: string, password?: string) => {
  const testEmail = email || Cypress.env('TEST_USER_EMAIL')
  const testPassword = password || Cypress.env('TEST_USER_PASSWORD')
  
  cy.visit('/')
  cy.getByTestId('auth-email-input').type(testEmail)
  cy.getByTestId('auth-password-input').type(testPassword)
  cy.getByTestId('auth-login-button').click()
  
  // Wait for successful login
  cy.url().should('include', '/dashboard')
  cy.waitForPageLoad()
})

Cypress.Commands.add('signUp', (email: string, password: string, organizationName?: string) => {
  cy.visit('/')
  
  // Switch to signup mode
  cy.getByTestId('auth-mode-toggle').click()
  
  // Fill signup form
  cy.getByTestId('auth-email-input').type(email)
  cy.getByTestId('auth-password-input').type(password)
  
  if (organizationName) {
    cy.getByTestId('auth-organization-input').type(organizationName)
  }
  
  cy.getByTestId('auth-signup-button').click()
  
  // Wait for redirect to onboarding or dashboard
  cy.url().should('match', /\/(dashboard|onboarding)/)
  cy.waitForPageLoad()
})

Cypress.Commands.add('logout', () => {
  cy.getByTestId('user-menu-trigger').click()
  cy.getByTestId('logout-button').click()
  
  // Confirm we're back at login page
  cy.url().should('eq', Cypress.config().baseUrl + '/')
})

// Tenant management commands
Cypress.Commands.add('createTenant', (name: string) => {
  cy.getByTestId('tenant-selector').click()
  cy.getByTestId('create-tenant-button').click()
  cy.getByTestId('tenant-name-input').type(name)
  cy.getByTestId('create-tenant-submit').click()
  
  // Wait for tenant creation
  cy.getByTestId('tenant-selector').should('contain', name)
})

Cypress.Commands.add('switchTenant', (tenantName: string) => {
  cy.getByTestId('tenant-selector').click()
  cy.getByTestId(`tenant-option-${tenantName}`).click()
  
  // Wait for tenant switch
  cy.waitForPageLoad()
})

// Email account management
Cypress.Commands.add('addEmailAccount', (email: string) => {
  cy.getByTestId('add-email-account-button').click()
  cy.getByTestId('email-account-input').type(email)
  
  // Mock OAuth flow for testing
  cy.intercept('POST', '**/api/oauth/microsoft', {
    statusCode: 200,
    body: { success: true, accountId: 'test-account-id' }
  }).as('oauthSuccess')
  
  cy.getByTestId('connect-account-button').click()
  cy.wait('@oauthSuccess')
  
  // Verify account was added
  cy.getByTestId('email-accounts-list').should('contain', email)
})

// Campaign management
Cypress.Commands.add('createCampaign', (name: string, options = {}) => {
  cy.getByTestId('create-campaign-button').click()
  cy.getByTestId('campaign-name-input').type(name)
  
  // Set campaign options if provided
  if (options.emailsPerDay) {
    cy.getByTestId('emails-per-day-input').clear().type(options.emailsPerDay.toString())
  }
  
  if (options.duration) {
    cy.getByTestId('campaign-duration-input').clear().type(options.duration.toString())
  }
  
  cy.getByTestId('create-campaign-submit').click()
  
  // Wait for campaign creation
  cy.getByTestId('campaigns-list').should('contain', name)
})

// Team management
Cypress.Commands.add('inviteTeamMember', (email: string, role = 'member') => {
  cy.getByTestId('invite-team-member-button').click()
  cy.getByTestId('invite-email-input').type(email)
  cy.getByTestId('invite-role-select').select(role)
  cy.getByTestId('send-invite-button').click()
  
  // Wait for invitation to be sent
  cy.getByTestId('team-members-list').should('contain', email)
})

// Demo simulation
Cypress.Commands.add('runDemo', () => {
  cy.getByTestId('start-demo-button').click()
  
  // Wait for demo to initialize
  cy.getByTestId('demo-status').should('contain', 'Running')
  
  // Wait for demo metrics to appear
  cy.getByTestId('demo-metrics', { timeout: 10000 }).should('be.visible')
})

// Utility commands
Cypress.Commands.add('waitForPageLoad', () => {
  // Wait for loading spinners to disappear
  cy.get('[data-testid*="loading"]', { timeout: 10000 }).should('not.exist')
  
  // Wait for main content to be visible
  cy.get('main', { timeout: 10000 }).should('be.visible')
})

Cypress.Commands.add('interceptApiCalls', () => {
  // Mock Supabase API calls
  cy.intercept('POST', '**/auth/v1/token**', {
    statusCode: 200,
    body: {
      access_token: 'mock-access-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    }
  }).as('authToken')
  
  // Mock campaigns API
  cy.intercept('GET', '**/api/campaigns', {
    statusCode: 200,
    body: { campaigns: [] }
  }).as('getCampaigns')
  
  // Mock email accounts API
  cy.intercept('GET', '**/api/email-accounts', {
    statusCode: 200,
    body: { accounts: [] }
  }).as('getEmailAccounts')
  
  // Mock team members API
  cy.intercept('GET', '**/api/team', {
    statusCode: 200,
    body: { members: [] }
  }).as('getTeamMembers')
  
  // Mock demo API
  cy.intercept('POST', '**/api/demo/start', {
    statusCode: 200,
    body: { success: true, demoId: 'test-demo-id' }
  }).as('startDemo')
})
