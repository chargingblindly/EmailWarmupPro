import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,

    setupNodeEvents(on, config) {
      return config
    },

    // Retry configuration
    retries: {
      runMode: 1,
      openMode: 0
    },

    // Request timeout
    requestTimeout: 10000,
    responseTimeout: 10000,
    defaultCommandTimeout: 8000
  }
})
