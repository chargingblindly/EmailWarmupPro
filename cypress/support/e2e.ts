// Cypress E2E support file
import './commands'

// Global configuration
Cypress.config('defaultCommandTimeout', 8000)

// Import custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      login(email?: string, password?: string): Chainable<void>
      logout(): Chainable<void>
      signUp(email: string, password: string, organizationName?: string): Chainable<void>
      
      // Data attribute selectors
      getByTestId(selector: string): Chainable<JQuery<HTMLElement>>
      
      // Tenant management
      createTenant(name: string): Chainable<void>
      switchTenant(tenantName: string): Chainable<void>
      
      // Email account management
      addEmailAccount(email: string): Chainable<void>
      
      // Campaign management
      createCampaign(name: string, options?: any): Chainable<void>
      
      // Team management
      inviteTeamMember(email: string, role?: 'admin' | 'member'): Chainable<void>
      
      // Demo and simulations
      runDemo(): Chainable<void>
      
      // Utility commands
      waitForPageLoad(): Chainable<void>
      interceptApiCalls(): Chainable<void>
    }
  }
}

// Global before hook
beforeEach(() => {
  // Set up API interceptions
  cy.interceptApiCalls()
  
  // Ensure clean state
  cy.clearLocalStorage()
  cy.clearCookies()
})

// Global after hook
afterEach(() => {
  // Take screenshot on failure
  cy.screenshot({ capture: 'runner' })
})
