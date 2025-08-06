/// <reference types="cypress" />

describe('Email Account Management', () => {
  let emailAccounts: any
  let users: any

  before(() => {
    cy.fixture('emailAccounts').then((data) => {
      emailAccounts = data
    })
    cy.fixture('users').then((data) => {
      users = data
    })
  })

  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard/accounts')
  })

  describe('Email Accounts List', () => {
    it('should display empty state when no accounts exist', () => {
      // Mock empty accounts response
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: [] }
      }).as('getEmptyAccounts')

      cy.reload()
      cy.wait('@getEmptyAccounts')

      // Should show empty state
      cy.getByTestId('empty-accounts-state').should('be.visible')
      cy.getByTestId('add-first-account-button').should('be.visible')
    })

    it('should display list of email accounts', () => {
      // Mock accounts response
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')

      cy.reload()
      cy.wait('@getAccounts')

      // Should show accounts list
      emailAccounts.mockAccounts.forEach((account: any) => {
        cy.getByTestId(`account-card-${account.id}`).should('be.visible')
        cy.getByTestId(`account-email-${account.id}`).should('contain', account.email)
        cy.getByTestId(`account-status-${account.id}`).should('contain', account.status)
      })
    })

    it('should show account status indicators correctly', () => {
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')

      cy.reload()
      cy.wait('@getAccounts')

      // Check connected account
      cy.getByTestId('account-status-account-1')
        .should('contain', 'connected')
        .and('have.class', 'status-connected')

      // Check syncing account
      cy.getByTestId('account-status-account-2')
        .should('contain', 'syncing')
        .and('have.class', 'status-syncing')

      // Check error account
      cy.getByTestId('account-status-account-3')
        .should('contain', 'error')
        .and('have.class', 'status-error')
    })

    it('should display account metrics', () => {
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')

      cy.reload()
      cy.wait('@getAccounts')

      // Check warmup score
      cy.getByTestId('warmup-score-account-1').should('contain', '85')
      
      // Check daily limit
      cy.getByTestId('daily-limit-account-1').should('contain', '50')
      
      // Check last sync
      cy.getByTestId('last-sync-account-1').should('be.visible')
    })
  })

  describe('Adding Email Accounts', () => {
    it('should open add account modal', () => {
      cy.getByTestId('add-email-account-button').click()

      // Should show modal
      cy.getByTestId('add-account-modal').should('be.visible')
      cy.getByTestId('email-account-input').should('be.visible')
      cy.getByTestId('connect-account-button').should('be.visible')
    })

    it('should successfully add Microsoft 365 account', () => {
      // Mock successful OAuth flow
      cy.intercept('POST', '**/api/oauth/microsoft', {
        statusCode: 200,
        body: { 
          success: true, 
          accountId: 'new-account-id',
          email: emailAccounts.testAccount.email
        }
      }).as('oauthSuccess')

      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { 
          accounts: [...emailAccounts.mockAccounts, {
            id: 'new-account-id',
            email: emailAccounts.testAccount.email,
            provider: 'microsoft',
            status: 'connected'
          }]
        }
      }).as('getUpdatedAccounts')

      cy.addEmailAccount(emailAccounts.testAccount.email)
      
      cy.wait('@oauthSuccess')
      cy.wait('@getUpdatedAccounts')

      // Should close modal and show new account
      cy.getByTestId('add-account-modal').should('not.exist')
      cy.getByTestId('email-accounts-list').should('contain', emailAccounts.testAccount.email)
    })

    it('should handle OAuth authorization errors', () => {
      // Mock OAuth error
      cy.intercept('POST', '**/api/oauth/microsoft', {
        statusCode: 400,
        body: { error: 'OAuth authorization failed' }
      }).as('oauthError')

      cy.getByTestId('add-email-account-button').click()
      cy.getByTestId('email-account-input').type(emailAccounts.testAccount.email)
      cy.getByTestId('connect-account-button').click()

      cy.wait('@oauthError')

      // Should show error message
      cy.get('[role="alert"]').should('contain.text', 'authorization failed')
    })

    it('should validate email format', () => {
      cy.getByTestId('add-email-account-button').click()
      
      // Enter invalid email
      cy.getByTestId('email-account-input').type('invalid-email')
      cy.getByTestId('connect-account-button').click()

      // Should show validation error
      cy.get('[role="alert"]').should('contain.text', 'valid email')
    })

    it('should prevent duplicate account addition', () => {
      // Mock duplicate account error
      cy.intercept('POST', '**/api/oauth/microsoft', {
        statusCode: 409,
        body: { error: 'Account already exists' }
      }).as('duplicateAccount')

      cy.addEmailAccount(emailAccounts.mockAccounts[0].email)
      
      cy.wait('@duplicateAccount')
      cy.get('[role="alert"]').should('contain.text', 'already exists')
    })

    it('should close modal when cancelled', () => {
      cy.getByTestId('add-email-account-button').click()
      cy.getByTestId('cancel-add-account-button').click()

      // Should close modal
      cy.getByTestId('add-account-modal').should('not.exist')
    })
  })

  describe('Account Actions', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')
      
      cy.reload()
      cy.wait('@getAccounts')
    })

    it('should sync account manually', () => {
      // Mock sync API
      cy.intercept('POST', '**/api/email-accounts/account-1/sync', {
        statusCode: 200,
        body: { success: true }
      }).as('syncAccount')

      cy.getByTestId('account-menu-account-1').click()
      cy.getByTestId('sync-account-button').click()

      cy.wait('@syncAccount')

      // Should show success message
      cy.get('[role="alert"]').should('contain.text', 'sync')
    })

    it('should view account details', () => {
      cy.getByTestId('account-card-account-1').click()

      // Should open account details modal
      cy.getByTestId('account-details-modal').should('be.visible')
      cy.getByTestId('account-details-email').should('contain', emailAccounts.mockAccounts[0].email)
      cy.getByTestId('account-details-warmup-score').should('be.visible')
      cy.getByTestId('account-details-metrics').should('be.visible')
    })

    it('should edit account settings', () => {
      cy.getByTestId('account-menu-account-1').click()
      cy.getByTestId('edit-account-button').click()

      // Should open edit modal
      cy.getByTestId('edit-account-modal').should('be.visible')
      
      // Update daily limit
      cy.getByTestId('daily-limit-input').clear().type('100')
      
      // Mock update API
      cy.intercept('PUT', '**/api/email-accounts/account-1', {
        statusCode: 200,
        body: { success: true }
      }).as('updateAccount')

      cy.getByTestId('save-account-button').click()
      cy.wait('@updateAccount')

      // Should close modal and show success
      cy.getByTestId('edit-account-modal').should('not.exist')
      cy.get('[role="alert"]').should('contain.text', 'updated')
    })

    it('should remove email account with confirmation', () => {
      // Mock delete API
      cy.intercept('DELETE', '**/api/email-accounts/account-1', {
        statusCode: 200,
        body: { success: true }
      }).as('deleteAccount')

      cy.getByTestId('account-menu-account-1').click()
      cy.getByTestId('remove-account-button').click()

      // Should show confirmation dialog
      cy.getByTestId('confirm-remove-dialog').should('be.visible')
      
      // Confirm removal
      cy.getByTestId('confirm-remove-button').click()
      cy.wait('@deleteAccount')

      // Should show success message
      cy.get('[role="alert"]').should('contain.text', 'removed')
    })

    it('should cancel account removal', () => {
      cy.getByTestId('account-menu-account-1').click()
      cy.getByTestId('remove-account-button').click()
      
      // Cancel removal
      cy.getByTestId('cancel-remove-button').click()

      // Should close dialog
      cy.getByTestId('confirm-remove-dialog').should('not.exist')
    })
  })

  describe('Account Status Monitoring', () => {
    it('should show real-time status updates', () => {
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')

      cy.reload()
      cy.wait('@getAccounts')

      // Mock status update via WebSocket or polling
      cy.intercept('GET', '**/api/email-accounts/account-2/status', {
        statusCode: 200,
        body: { status: 'connected', lastSync: new Date().toISOString() }
      }).as('statusUpdate')

      // Trigger status refresh
      cy.getByTestId('refresh-accounts-button').click()
      cy.wait('@statusUpdate')

      // Should update status display
      cy.getByTestId('account-status-account-2').should('contain', 'connected')
    })

    it('should handle connection errors gracefully', () => {
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')

      cy.reload()
      cy.wait('@getAccounts')

      // Should show error status with error message
      cy.getByTestId('account-status-account-3').should('contain', 'error')
      cy.getByTestId('account-error-account-3').should('contain', 'Authentication failed')
    })

    it('should retry failed connections', () => {
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')

      cy.reload()
      cy.wait('@getAccounts')

      // Mock retry API
      cy.intercept('POST', '**/api/email-accounts/account-3/retry', {
        statusCode: 200,
        body: { success: true }
      }).as('retryConnection')

      cy.getByTestId('retry-connection-account-3').click()
      cy.wait('@retryConnection')

      // Should show retry in progress
      cy.getByTestId('account-status-account-3').should('contain', 'connecting')
    })
  })

  describe('Bulk Account Operations', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts }
      }).as('getAccounts')
      
      cy.reload()
      cy.wait('@getAccounts')
    })

    it('should select multiple accounts', () => {
      // Select accounts
      cy.getByTestId('select-account-account-1').click()
      cy.getByTestId('select-account-account-2').click()

      // Should show bulk actions toolbar
      cy.getByTestId('bulk-actions-toolbar').should('be.visible')
      cy.getByTestId('selected-count').should('contain', '2')
    })

    it('should sync multiple accounts', () => {
      // Mock bulk sync API
      cy.intercept('POST', '**/api/email-accounts/bulk-sync', {
        statusCode: 200,
        body: { success: true }
      }).as('bulkSync')

      // Select accounts
      cy.getByTestId('select-account-account-1').click()
      cy.getByTestId('select-account-account-2').click()

      // Perform bulk sync
      cy.getByTestId('bulk-sync-button').click()
      cy.wait('@bulkSync')

      // Should show success message
      cy.get('[role="alert"]').should('contain.text', 'synced')
    })

    it('should select all accounts', () => {
      cy.getByTestId('select-all-accounts').click()

      // Should select all visible accounts
      emailAccounts.mockAccounts.forEach((account: any) => {
        cy.getByTestId(`select-account-${account.id}`).should('be.checked')
      })
    })
  })
})
