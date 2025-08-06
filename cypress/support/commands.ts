// Custom Cypress commands for Email Warmup Pro

// Simple test helpers
Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`)
})

// Basic page load wait
Cypress.Commands.add('waitForPageLoad', () => {
  // Wait for main content to be visible
  cy.get('body', { timeout: 10000 }).should('be.visible')
})

// Declare the commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(selector: string): Chainable<JQuery<HTMLElement>>
      waitForPageLoad(): Chainable<void>
    }
  }
}
