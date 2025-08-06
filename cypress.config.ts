import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    
    // Environment variables
    env: {
      SUPABASE_URL: 'https://placeholder.supabase.co',
      SUPABASE_ANON_KEY: 'placeholder-key',
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'testpassword123',
      TEST_ADMIN_EMAIL: 'admin@example.com',
      TEST_ADMIN_PASSWORD: 'adminpassword123'
    },

    setupNodeEvents(on, config) {
      // Node event listeners here
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        table(message) {
          console.table(message)
          return null
        }
      })

      return config
    },

    // Retry configuration
    retries: {
      runMode: 2,
      openMode: 0
    },

    // Test isolation
    testIsolation: true,

    // Request timeout
    requestTimeout: 10000,
    responseTimeout: 10000,
    defaultCommandTimeout: 8000,
    
    // Exclude examples
    excludeSpecPattern: '**/examples/*'
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack'
    },
    specPattern: 'cypress/component/**/*.cy.ts',
    supportFile: 'cypress/support/component.ts'
  }
})
