/// <reference types="cypress" />

describe('End-to-End Integration Tests', () => {
  let users: any
  let campaigns: any
  let emailAccounts: any
  let teamMembers: any

  before(() => {
    cy.fixture('users').then((data) => users = data)
    cy.fixture('campaigns').then((data) => campaigns = data)
    cy.fixture('emailAccounts').then((data) => emailAccounts = data)
    cy.fixture('teamMembers').then((data) => teamMembers = data)
  })

  describe('Complete User Journey: Signup to Campaign Launch', () => {
    it('should complete the entire onboarding and setup flow', () => {
      // 1. User signs up
      cy.signUp(users.newUser.email, users.newUser.password, users.newUser.organization)

      // 2. Complete onboarding
      cy.url().should('match', /\/(dashboard|onboarding)/)
      
      if (cy.url().should('include', '/onboarding')) {
        cy.getByTestId('organization-name-input').should('have.value', users.newUser.organization)
        cy.getByTestId('onboarding-continue-button').click()
        
        // Skip initial account setup
        cy.getByTestId('skip-accounts-button').click()
      }

      // 3. Should be on dashboard
      cy.url().should('include', '/dashboard')
      cy.getByTestId('dashboard-overview').should('be.visible')

      // 4. Add email account
      cy.visit('/dashboard/accounts')
      cy.addEmailAccount(emailAccounts.testAccount.email)

      // 5. Create first campaign
      cy.visit('/dashboard/campaigns')
      cy.createCampaign(campaigns.basicCampaign.name, {
        emailsPerDay: campaigns.basicCampaign.emailsPerDay,
        duration: campaigns.basicCampaign.duration
      })

      // 6. Verify campaign is created and active
      cy.getByTestId('campaigns-list').should('contain', campaigns.basicCampaign.name)
      cy.getByTestId('campaign-status-new-campaign-id').should('contain', 'active')

      // 7. Invite team member
      cy.visit('/dashboard/team')
      cy.inviteTeamMember(teamMembers.newMember.email)

      // 8. Verify complete setup
      cy.visit('/dashboard')
      cy.getByTestId('total-campaigns-widget').should('contain', '1')
      cy.getByTestId('active-accounts-widget').should('contain', '1')
    })
  })

  describe('Multi-Tenant Workflow', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should handle complete multi-tenant scenario', () => {
      // 1. Create first tenant with data
      cy.visit('/dashboard/onboarding')
      cy.getByTestId('organization-name-input').type('Tenant One')
      cy.getByTestId('onboarding-continue-button').click()
      cy.getByTestId('skip-accounts-button').click()

      // Add data to first tenant
      cy.visit('/dashboard/accounts')
      cy.addEmailAccount('tenant1@example.com')
      
      cy.visit('/dashboard/campaigns')
      cy.createCampaign('Tenant 1 Campaign')

      // 2. Create second tenant
      cy.createTenant('Tenant Two')

      // 3. Verify tenant isolation
      cy.visit('/dashboard/campaigns')
      cy.getByTestId('campaigns-list').should('not.contain', 'Tenant 1 Campaign')
      cy.getByTestId('empty-campaigns-state').should('be.visible')

      cy.visit('/dashboard/accounts')
      cy.getByTestId('email-accounts-list').should('not.contain', 'tenant1@example.com')

      // 4. Add data to second tenant
      cy.addEmailAccount('tenant2@example.com')
      cy.visit('/dashboard/campaigns')
      cy.createCampaign('Tenant 2 Campaign')

      // 5. Switch back to first tenant
      cy.switchTenant('Tenant One')

      // 6. Verify first tenant data is restored
      cy.visit('/dashboard/campaigns')
      cy.getByTestId('campaigns-list').should('contain', 'Tenant 1 Campaign')
      cy.getByTestId('campaigns-list').should('not.contain', 'Tenant 2 Campaign')

      cy.visit('/dashboard/accounts')
      cy.getByTestId('email-accounts-list').should('contain', 'tenant1@example.com')
      cy.getByTestId('email-accounts-list').should('not.contain', 'tenant2@example.com')
    })
  })

  describe('Campaign Lifecycle Management', () => {
    beforeEach(() => {
      cy.login()
      
      // Setup prerequisites
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts.filter(a => a.status === 'connected') }
      }).as('getEmailAccounts')
    })

    it('should manage complete campaign lifecycle', () => {
      cy.visit('/dashboard/campaigns')

      // 1. Create campaign
      cy.createCampaign(campaigns.advancedCampaign.name, {
        emailsPerDay: campaigns.advancedCampaign.emailsPerDay,
        duration: campaigns.advancedCampaign.duration
      })

      // 2. Verify campaign is active
      cy.getByTestId('campaign-status-new-campaign-id').should('contain', 'active')

      // 3. Monitor campaign progress
      cy.getByTestId('campaign-card-new-campaign-id').click()
      cy.getByTestId('campaign-details-modal').should('be.visible')
      cy.getByTestId('campaign-details-chart').should('be.visible')

      // 4. Pause campaign
      cy.getByTestId('campaign-menu-new-campaign-id').click()
      cy.getByTestId('pause-campaign-button').click()
      cy.getByTestId('campaign-status-new-campaign-id').should('contain', 'paused')

      // 5. Edit campaign settings
      cy.getByTestId('campaign-menu-new-campaign-id').click()
      cy.getByTestId('edit-campaign-button').click()
      cy.getByTestId('emails-per-day-input').clear().type('150')
      cy.getByTestId('save-campaign-button').click()

      // 6. Resume campaign
      cy.getByTestId('campaign-menu-new-campaign-id').click()
      cy.getByTestId('resume-campaign-button').click()
      cy.getByTestId('campaign-status-new-campaign-id').should('contain', 'active')

      // 7. View performance analytics
      cy.getByTestId('campaign-card-new-campaign-id').click()
      cy.getByTestId('email-history-table').should('be.visible')
      cy.getByTestId('campaign-chart').should('be.visible')

      // 8. Export campaign data
      cy.getByTestId('campaign-menu-new-campaign-id').click()
      cy.getByTestId('export-campaign-button').click()
      
      // Verify download (would need proper file download handling in real scenario)
      cy.readFile('cypress/downloads/campaign-data.csv', { timeout: 10000 }).should('exist')
    })
  })

  describe('Team Collaboration Workflow', () => {
    beforeEach(() => {
      cy.login(users.adminUser.email, users.adminUser.password)
    })

    it('should handle complete team collaboration scenario', () => {
      cy.visit('/dashboard/team')

      // 1. Admin invites team members
      cy.inviteTeamMember(teamMembers.newMember.email, 'member')
      cy.inviteTeamMember(teamMembers.newAdmin.email, 'admin')

      // 2. Verify invitations sent
      cy.getByTestId('team-members-list').should('contain', teamMembers.newMember.email)
      cy.getByTestId('team-members-list').should('contain', teamMembers.newAdmin.email)

      // 3. Create shared resources (campaigns, accounts)
      cy.visit('/dashboard/accounts')
      cy.addEmailAccount('shared@company.com')

      cy.visit('/dashboard/campaigns')
      cy.createCampaign('Shared Campaign')

      // 4. Simulate member login (would need actual auth in real scenario)
      // For testing, we'll mock the member's perspective
      cy.intercept('GET', '**/api/user/current', {
        statusCode: 200,
        body: { user: { id: 'member-id', role: 'member', email: teamMembers.newMember.email } }
      }).as('getMemberUser')

      cy.reload()
      cy.wait('@getMemberUser')

      // 5. Verify member can see shared resources
      cy.visit('/dashboard/campaigns')
      cy.getByTestId('campaigns-list').should('contain', 'Shared Campaign')

      // 6. Verify member cannot perform admin actions
      cy.visit('/dashboard/team')
      cy.getByTestId('invite-team-member-button').should('not.exist')

      // 7. Switch back to admin view
      cy.intercept('GET', '**/api/user/current', {
        statusCode: 200,
        body: { user: { id: 'admin-id', role: 'admin', email: users.adminUser.email } }
      }).as('getAdminUser')

      cy.reload()
      cy.wait('@getAdminUser')

      // 8. Admin manages team member roles
      cy.visit('/dashboard/team')
      cy.getByTestId('member-menu-member-id').click()
      cy.getByTestId('change-role-button').click()
      cy.getByTestId('new-role-select').select('admin')
      cy.getByTestId('confirm-role-change').click()

      // 9. Verify role change
      cy.getByTestId('member-role-member-id').should('contain', 'admin')
    })
  })

  describe('Demo to Production Workflow', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should complete demo to production journey', () => {
      // 1. Run demo simulation
      cy.visit('/dashboard/demo')
      cy.runDemo()

      // 2. Wait for demo metrics
      cy.getByTestId('demo-metrics', { timeout: 10000 }).should('be.visible')
      cy.getByTestId('demo-total-emails').should('not.contain', '0')

      // 3. Complete demo
      cy.intercept('GET', '**/api/demo/demo-123/status', {
        statusCode: 200,
        body: { status: 'completed' }
      }).as('demoCompleted')

      cy.reload()
      cy.wait('@demoCompleted')

      cy.getByTestId('demo-completed').should('be.visible')

      // 4. Export demo results
      cy.getByTestId('export-demo-button').click()

      // 5. Move to production setup
      cy.visit('/dashboard/accounts')
      cy.addEmailAccount('production@company.com')

      // 6. Create production campaigns based on demo learnings
      cy.visit('/dashboard/campaigns')
      cy.createCampaign('Production Campaign', {
        emailsPerDay: 50, // Conservative start based on demo
        duration: 30
      })

      // 7. Setup team for production
      cy.visit('/dashboard/team')
      cy.inviteTeamMember('production-manager@company.com', 'admin')

      // 8. Configure production settings
      cy.visit('/dashboard/settings')
      cy.getByTestId('production-mode-toggle').click()
      cy.getByTestId('save-settings-button').click()

      // 9. Verify production setup
      cy.visit('/dashboard')
      cy.getByTestId('production-mode-indicator').should('be.visible')
      cy.getByTestId('total-campaigns-widget').should('contain', '1')
      cy.getByTestId('active-accounts-widget').should('contain', '1')
    })
  })

  describe('Error Recovery and Data Consistency', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should maintain data consistency through failures', () => {
      cy.visit('/dashboard/campaigns')

      // 1. Start creating campaign
      cy.getByTestId('create-campaign-button').click()
      cy.getByTestId('campaign-name-input').type('Resilient Campaign')
      cy.getByTestId('emails-per-day-input').type('50')

      // 2. Simulate network failure during creation
      cy.intercept('POST', '**/api/campaigns', { forceNetworkError: true }).as('networkError')
      cy.getByTestId('create-campaign-submit').click()
      cy.wait('@networkError')

      // 3. Should show error and maintain form state
      cy.get('[role="alert"]').should('be.visible')
      cy.getByTestId('campaign-name-input').should('have.value', 'Resilient Campaign')

      // 4. Retry with successful network
      cy.intercept('POST', '**/api/campaigns', {
        statusCode: 201,
        body: { success: true, campaign: { id: 'resilient-campaign', name: 'Resilient Campaign' } }
      }).as('successfulCreate')

      cy.getByTestId('create-campaign-submit').click()
      cy.wait('@successfulCreate')

      // 5. Verify campaign was created
      cy.getByTestId('create-campaign-modal').should('not.exist')
      cy.getByTestId('campaigns-list').should('contain', 'Resilient Campaign')

      // 6. Test partial failure scenario
      cy.intercept('PUT', '**/api/campaigns/resilient-campaign', {
        statusCode: 409,
        body: { error: 'Resource modified by another user' }
      }).as('conflictError')

      cy.getByTestId('campaign-menu-resilient-campaign').click()
      cy.getByTestId('edit-campaign-button').click()
      cy.getByTestId('emails-per-day-input').clear().type('75')
      cy.getByTestId('save-campaign-button').click()

      cy.wait('@conflictError')

      // 7. Should show conflict resolution
      cy.get('[role="alert"]').should('contain', 'modified by another user')
      cy.getByTestId('refresh-and-retry-button').should('be.visible')

      // 8. Resolve conflict
      cy.intercept('GET', '**/api/campaigns/resilient-campaign', {
        statusCode: 200,
        body: { campaign: { id: 'resilient-campaign', name: 'Resilient Campaign', emailsPerDay: 60 } }
      }).as('refreshCampaign')

      cy.intercept('PUT', '**/api/campaigns/resilient-campaign', {
        statusCode: 200,
        body: { success: true }
      }).as('resolveConflict')

      cy.getByTestId('refresh-and-retry-button').click()
      cy.wait('@refreshCampaign')
      
      // Should show updated values
      cy.getByTestId('emails-per-day-input').should('have.value', '60')
      
      // Update again
      cy.getByTestId('emails-per-day-input').clear().type('75')
      cy.getByTestId('save-campaign-button').click()
      cy.wait('@resolveConflict')

      // 9. Verify final state
      cy.getByTestId('edit-campaign-modal').should('not.exist')
      cy.get('[role="alert"]').should('contain', 'updated')
    })
  })

  describe('Performance and Scalability', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should handle large datasets efficiently', () => {
      // Mock large dataset
      const largeCampaignSet = Array.from({ length: 100 }, (_, i) => ({
        id: `campaign-${i}`,
        name: `Campaign ${i}`,
        status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'paused' : 'completed',
        emailsPerDay: 50 + (i % 50),
        deliveryRate: 85 + (i % 15),
        progress: i % 101
      }))

      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: largeCampaignSet }
      }).as('getLargeCampaignSet')

      cy.visit('/dashboard/campaigns')
      cy.wait('@getLargeCampaignSet')

      // 1. Should load efficiently
      cy.getByTestId('campaigns-list').should('be.visible')

      // 2. Should implement pagination or virtualization
      cy.getByTestId('pagination-controls').should('be.visible')

      // 3. Should filter efficiently
      cy.getByTestId('campaign-filter-status').select('active')
      cy.getByTestId('campaigns-list').within(() => {
        cy.get('[data-testid*="campaign-card"]').should('have.length.lessThan', 100)
      })

      // 4. Should search efficiently
      cy.getByTestId('campaign-search-input').type('Campaign 1')
      cy.getByTestId('campaigns-list').within(() => {
        cy.get('[data-testid*="campaign-card"]').should('have.length.lessThan', 20)
      })

      // 5. Should sort efficiently
      cy.getByTestId('campaign-sort-select').select('deliveryRate')
      // First item should have high delivery rate
      cy.getByTestId('campaigns-list').within(() => {
        cy.get('[data-testid*="campaign-card"]').first()
          .find('[data-testid*="delivery-rate"]')
          .should('contain', '99')
      })
    })
  })

  describe('Cross-Browser Compatibility', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should work consistently across different viewport sizes', () => {
      const viewports = [
        { width: 320, height: 568 },  // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1280, height: 720 }, // Desktop
        { width: 1920, height: 1080 } // Large Desktop
      ]

      viewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height)
        cy.visit('/dashboard')

        // Should be responsive at all sizes
        cy.getByTestId('dashboard-overview').should('be.visible')

        // Navigation should work
        if (viewport.width < 768) {
          cy.getByTestId('mobile-nav-toggle').should('be.visible').click()
          cy.getByTestId('mobile-nav-menu').should('be.visible')
          cy.getByTestId('nav-campaigns').click()
        } else {
          cy.getByTestId('nav-campaigns').click()
        }

        cy.url().should('include', '/campaigns')
        cy.getByTestId('campaigns-list').should('be.visible')
      })
    })
  })

  describe('Data Export and Import', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should handle complete data export/import cycle', () => {
      // Setup initial data
      cy.visit('/dashboard/campaigns')
      cy.createCampaign('Export Test Campaign')

      cy.visit('/dashboard/accounts')
      cy.addEmailAccount('export-test@example.com')

      // 1. Export all data
      cy.visit('/dashboard/settings')
      cy.getByTestId('export-all-data-button').click()
      cy.getByTestId('confirm-export-button').click()

      // Should download export file
      cy.readFile('cypress/downloads/email-warmup-export.json', { timeout: 15000 })
        .should('exist')
        .should('contain', 'Export Test Campaign')

      // 2. Clear existing data (for testing import)
      cy.visit('/dashboard/campaigns')
      cy.getByTestId('campaign-menu-new-campaign-id').click()
      cy.getByTestId('delete-campaign-button').click()
      cy.getByTestId('confirm-delete-button').click()

      // 3. Import data back
      cy.visit('/dashboard/settings')
      cy.getByTestId('import-data-button').click()
      cy.getByTestId('import-file-input').selectFile('cypress/downloads/email-warmup-export.json')
      cy.getByTestId('confirm-import-button').click()

      // 4. Verify imported data
      cy.visit('/dashboard/campaigns')
      cy.getByTestId('campaigns-list').should('contain', 'Export Test Campaign')

      cy.visit('/dashboard/accounts')
      cy.getByTestId('email-accounts-list').should('contain', 'export-test@example.com')
    })
  })
})
