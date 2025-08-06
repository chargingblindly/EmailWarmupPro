/// <reference types="cypress" />

describe('Error Handling and Edge Cases', () => {
  beforeEach(() => {
    cy.login()
  })

  describe('Network Errors', () => {
    it('should handle API timeouts gracefully', () => {
      // Mock timeout
      cy.intercept('GET', '**/api/campaigns', { requestTimeout: 1000 }).as('timeoutRequest')

      cy.visit('/dashboard/campaigns')
      cy.wait('@timeoutRequest')

      // Should show timeout error
      cy.getByTestId('error-message').should('contain', 'timeout')
      cy.getByTestId('retry-button').should('be.visible')
    })

    it('should handle 500 server errors', () => {
      // Mock server error
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('serverError')

      cy.visit('/dashboard/campaigns')
      cy.wait('@serverError')

      // Should show generic error message
      cy.getByTestId('error-message').should('contain', 'something went wrong')
      cy.getByTestId('contact-support-link').should('be.visible')
    })

    it('should handle 404 errors', () => {
      // Mock 404 error
      cy.intercept('GET', '**/api/campaigns/nonexistent', {
        statusCode: 404,
        body: { error: 'Campaign not found' }
      }).as('notFoundError')

      cy.visit('/dashboard/campaigns/nonexistent')
      cy.wait('@notFoundError')

      // Should show not found message
      cy.getByTestId('not-found-error').should('be.visible')
      cy.getByTestId('back-to-campaigns-button').should('be.visible')
    })

    it('should handle rate limiting', () => {
      // Mock rate limit error
      cy.intercept('POST', '**/api/campaigns', {
        statusCode: 429,
        body: { error: 'Rate limit exceeded', retryAfter: 60 }
      }).as('rateLimitError')

      cy.visit('/dashboard/campaigns')
      cy.getByTestId('create-campaign-button').click()
      cy.getByTestId('campaign-name-input').type('Test Campaign')
      cy.getByTestId('create-campaign-submit').click()

      cy.wait('@rateLimitError')

      // Should show rate limit message with retry info
      cy.get('[role="alert"]').should('contain', 'rate limit')
      cy.get('[role="alert"]').should('contain', '60')
    })

    it('should handle unauthorized errors', () => {
      // Mock 401 error
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('unauthorizedError')

      cy.visit('/dashboard/campaigns')
      cy.wait('@unauthorizedError')

      // Should redirect to login
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })

    it('should handle network disconnection', () => {
      // Start with working connection
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: [] }
      }).as('workingConnection')

      cy.visit('/dashboard/campaigns')
      cy.wait('@workingConnection')

      // Simulate network failure
      cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkFailure')

      cy.getByTestId('refresh-campaigns-button').click()
      cy.wait('@networkFailure')

      // Should show offline banner
      cy.getByTestId('offline-banner').should('be.visible')
      cy.getByTestId('offline-message').should('contain', 'connection')
    })
  })

  describe('Form Validation Errors', () => {
    it('should handle invalid email formats', () => {
      cy.visit('/dashboard/accounts')
      cy.getByTestId('add-email-account-button').click()

      // Enter invalid emails
      const invalidEmails = ['invalid', 'invalid@', '@domain.com', 'user@']
      
      invalidEmails.forEach((email) => {
        cy.getByTestId('email-account-input').clear().type(email)
        cy.getByTestId('connect-account-button').click()
        
        // Should show validation error
        cy.get('[role="alert"]').should('contain', 'valid email')
        
        // Clear error for next iteration
        cy.getByTestId('email-account-input').clear()
      })
    })

    it('should handle password requirements', () => {
      cy.visit('/')
      cy.getByTestId('auth-mode-toggle').click() // Switch to signup

      const weakPasswords = ['123', 'password', 'abc123']
      
      weakPasswords.forEach((password) => {
        cy.getByTestId('auth-email-input').clear().type('test@example.com')
        cy.getByTestId('auth-password-input').clear().type(password)
        cy.getByTestId('auth-signup-button').click()
        
        // Should show password strength error
        cy.get('[role="alert"]').should('contain', 'password')
      })
    })

    it('should handle required field validation', () => {
      cy.visit('/dashboard/campaigns')
      cy.getByTestId('create-campaign-button').click()

      // Try to submit without required fields
      cy.getByTestId('create-campaign-submit').click()

      // Should show multiple validation errors
      cy.get('[role="alert"]').should('be.visible')
      cy.get('body').should('contain.text', 'required')
    })

    it('should handle numeric field validation', () => {
      cy.visit('/dashboard/campaigns')
      cy.getByTestId('create-campaign-button').click()

      // Enter invalid numeric values
      cy.getByTestId('campaign-name-input').type('Test Campaign')
      cy.getByTestId('emails-per-day-input').type('-5') // Negative number
      cy.getByTestId('campaign-duration-input').type('0') // Zero duration
      cy.getByTestId('create-campaign-submit').click()

      // Should show validation errors
      cy.get('[role="alert"]').should('contain', 'positive')
    })
  })

  describe('Data Integrity Errors', () => {
    it('should handle corrupted response data', () => {
      // Mock corrupted JSON response
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: 'corrupted json response'
      }).as('corruptedResponse')

      cy.visit('/dashboard/campaigns')
      cy.wait('@corruptedResponse')

      // Should show data parsing error
      cy.getByTestId('data-error').should('be.visible')
      cy.getByTestId('error-message').should('contain', 'data')
    })

    it('should handle missing required fields in API response', () => {
      // Mock response with missing fields
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: {
          campaigns: [
            { id: '1' }, // Missing name and other required fields
            { name: 'Campaign 2' } // Missing id and other required fields
          ]
        }
      }).as('incompleteData')

      cy.visit('/dashboard/campaigns')
      cy.wait('@incompleteData')

      // Should handle missing data gracefully
      cy.getByTestId('campaigns-list').should('be.visible')
      cy.getByTestId('data-warning').should('contain', 'incomplete')
    })

    it('should handle unexpected data types', () => {
      // Mock response with wrong data types
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: {
          campaigns: [
            {
              id: 123, // Should be string
              name: null, // Should be string
              emailsPerDay: 'invalid', // Should be number
              status: true // Should be string
            }
          ]
        }
      }).as('wrongDataTypes')

      cy.visit('/dashboard/campaigns')
      cy.wait('@wrongDataTypes')

      // Should handle type mismatches gracefully
      cy.getByTestId('campaigns-list').should('be.visible')
    })
  })

  describe('Resource Limits', () => {
    it('should handle quota exceeded errors', () => {
      // Mock quota exceeded error
      cy.intercept('POST', '**/api/campaigns', {
        statusCode: 403,
        body: { 
          error: 'Campaign limit exceeded',
          limit: 10,
          current: 10
        }
      }).as('quotaExceeded')

      cy.visit('/dashboard/campaigns')
      cy.getByTestId('create-campaign-button').click()
      cy.getByTestId('campaign-name-input').type('Test Campaign')
      cy.getByTestId('create-campaign-submit').click()

      cy.wait('@quotaExceeded')

      // Should show quota error with upgrade option
      cy.get('[role="alert"]').should('contain', 'limit exceeded')
      cy.getByTestId('upgrade-plan-button').should('be.visible')
    })

    it('should handle storage limits', () => {
      // Mock storage limit error
      cy.intercept('POST', '**/api/email-accounts', {
        statusCode: 413,
        body: { error: 'Storage limit exceeded' }
      }).as('storageLimitError')

      cy.visit('/dashboard/accounts')
      cy.getByTestId('add-email-account-button').click()
      cy.getByTestId('email-account-input').type('test@example.com')
      cy.getByTestId('connect-account-button').click()

      cy.wait('@storageLimitError')

      // Should show storage limit message
      cy.get('[role="alert"]').should('contain', 'storage limit')
    })

    it('should handle concurrent user limits', () => {
      // Mock concurrent user limit error
      cy.intercept('POST', '**/api/team/invite', {
        statusCode: 403,
        body: { 
          error: 'Team member limit exceeded',
          limit: 5,
          current: 5
        }
      }).as('teamLimitError')

      cy.visit('/dashboard/team')
      cy.getByTestId('invite-team-member-button').click()
      cy.getByTestId('invite-email-input').type('new@example.com')
      cy.getByTestId('send-invite-button').click()

      cy.wait('@teamLimitError')

      // Should show team limit error
      cy.get('[role="alert"]').should('contain', 'member limit')
    })
  })

  describe('Session and Authentication Errors', () => {
    it('should handle session expiration during operation', () => {
      cy.visit('/dashboard/campaigns')

      // Mock session expiration on action
      cy.intercept('POST', '**/api/campaigns', {
        statusCode: 401,
        body: { error: 'Session expired' }
      }).as('sessionExpired')

      cy.getByTestId('create-campaign-button').click()
      cy.getByTestId('campaign-name-input').type('Test Campaign')
      cy.getByTestId('create-campaign-submit').click()

      cy.wait('@sessionExpired')

      // Should redirect to login with message
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      cy.get('[role="alert"]').should('contain', 'session expired')
    })

    it('should handle permission changes', () => {
      cy.visit('/dashboard/team')

      // Mock permission denied error
      cy.intercept('POST', '**/api/team/invite', {
        statusCode: 403,
        body: { error: 'Insufficient permissions' }
      }).as('permissionDenied')

      cy.getByTestId('invite-team-member-button').click()
      cy.getByTestId('invite-email-input').type('new@example.com')
      cy.getByTestId('send-invite-button').click()

      cy.wait('@permissionDenied')

      // Should show permission error
      cy.get('[role="alert"]').should('contain', 'permission')
    })

    it('should handle account suspension', () => {
      // Mock account suspended error
      cy.intercept('GET', '**/api/**', {
        statusCode: 403,
        body: { error: 'Account suspended' }
      }).as('accountSuspended')

      cy.visit('/dashboard')
      cy.wait('@accountSuspended')

      // Should show suspension notice
      cy.getByTestId('account-suspended-notice').should('be.visible')
      cy.getByTestId('contact-support-button').should('be.visible')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data sets', () => {
      // Mock empty responses for all endpoints
      cy.intercept('GET', '**/api/campaigns', { statusCode: 200, body: { campaigns: [] } })
      cy.intercept('GET', '**/api/email-accounts', { statusCode: 200, body: { accounts: [] } })
      cy.intercept('GET', '**/api/team', { statusCode: 200, body: { members: [] } })

      cy.visit('/dashboard')

      // Should show appropriate empty states
      cy.getByTestId('nav-campaigns').click()
      cy.getByTestId('empty-campaigns-state').should('be.visible')

      cy.getByTestId('nav-accounts').click()
      cy.getByTestId('empty-accounts-state').should('be.visible')

      cy.getByTestId('nav-team').click()
      cy.getByTestId('empty-team-state').should('be.visible')
    })

    it('should handle very large datasets', () => {
      // Mock response with many items
      const largeCampaignList = Array.from({ length: 1000 }, (_, i) => ({
        id: `campaign-${i}`,
        name: `Campaign ${i}`,
        status: 'active',
        emailsPerDay: 50,
        deliveryRate: 92.5
      }))

      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: largeCampaignList }
      }).as('largeCampaignList')

      cy.visit('/dashboard/campaigns')
      cy.wait('@largeCampaignList')

      // Should handle large datasets with pagination or virtualization
      cy.getByTestId('campaigns-list').should('be.visible')
      cy.getByTestId('pagination-controls').should('be.visible')
    })

    it('should handle special characters in data', () => {
      // Mock data with special characters
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: {
          campaigns: [{
            id: 'special-campaign',
            name: 'Campaign with <script>alert("xss")</script>',
            description: 'Description with émojis 🚀 and symbols ©®™'
          }]
        }
      }).as('specialCharacterData')

      cy.visit('/dashboard/campaigns')
      cy.wait('@specialCharacterData')

      // Should properly escape and display special characters
      cy.getByTestId('campaign-name-special-campaign')
        .should('not.contain', '<script>')
        .should('contain', 'Campaign with')
    })

    it('should handle browser storage limits', () => {
      // Fill local storage to near capacity
      const largeData = 'x'.repeat(1024 * 1024) // 1MB of data
      
      for (let i = 0; i < 4; i++) {
        try {
          localStorage.setItem(`large-data-${i}`, largeData)
        } catch (e) {
          // Storage limit reached
          break
        }
      }

      cy.visit('/dashboard')

      // Should handle storage gracefully
      cy.getByTestId('dashboard-overview').should('be.visible')
      
      // Clean up
      for (let i = 0; i < 4; i++) {
        localStorage.removeItem(`large-data-${i}`)
      }
    })

    it('should handle concurrent modifications', () => {
      // Mock optimistic locking error
      cy.intercept('PUT', '**/api/campaigns/campaign-1', {
        statusCode: 409,
        body: { error: 'Resource modified by another user' }
      }).as('concurrencyError')

      cy.visit('/dashboard/campaigns')
      cy.getByTestId('campaign-menu-campaign-1').click()
      cy.getByTestId('edit-campaign-button').click()
      cy.getByTestId('emails-per-day-input').clear().type('75')
      cy.getByTestId('save-campaign-button').click()

      cy.wait('@concurrencyError')

      // Should show conflict resolution options
      cy.get('[role="alert"]').should('contain', 'modified by another user')
      cy.getByTestId('refresh-and-retry-button').should('be.visible')
    })
  })

  describe('Recovery and Retry Mechanisms', () => {
    it('should automatically retry failed requests', () => {
      // Mock failure then success
      let attempts = 0
      cy.intercept('GET', '**/api/campaigns', (req) => {
        attempts++
        if (attempts === 1) {
          req.reply({ statusCode: 500, body: { error: 'Server error' } })
        } else {
          req.reply({ statusCode: 200, body: { campaigns: [] } })
        }
      }).as('retryRequest')

      cy.visit('/dashboard/campaigns')
      
      // Should eventually succeed after retry
      cy.getByTestId('campaigns-list').should('be.visible')
    })

    it('should provide manual retry options', () => {
      // Mock persistent error
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('persistentError')

      cy.visit('/dashboard/campaigns')
      cy.wait('@persistentError')

      // Should show manual retry button
      cy.getByTestId('retry-button').should('be.visible')

      // Mock successful retry
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: [] }
      }).as('successfulRetry')

      cy.getByTestId('retry-button').click()
      cy.wait('@successfulRetry')

      // Should show content after successful retry
      cy.getByTestId('campaigns-list').should('be.visible')
    })

    it('should gracefully degrade functionality', () => {
      // Mock partial service failure
      cy.intercept('GET', '**/api/campaigns', { statusCode: 200, body: { campaigns: [] } })
      cy.intercept('GET', '**/api/team', { statusCode: 500, body: { error: 'Service unavailable' } })

      cy.visit('/dashboard')

      // Main functionality should work
      cy.getByTestId('nav-campaigns').click()
      cy.getByTestId('campaigns-list').should('be.visible')

      // Failed service should show graceful degradation
      cy.getByTestId('nav-team').click()
      cy.getByTestId('service-unavailable-message').should('be.visible')
      cy.getByTestId('limited-functionality-notice').should('be.visible')
    })
  })
})
