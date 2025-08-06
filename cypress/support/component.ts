// Cypress Component Testing support file
import './commands'
import { mount } from 'cypress/react18'

// Mount command for React components
Cypress.Commands.add('mount', mount)

// Global component testing configuration
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}
