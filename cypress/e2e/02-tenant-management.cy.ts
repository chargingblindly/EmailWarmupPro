/// <reference types="cypress" />

describe('Tenant Management', () => {
  let tenants: any
  let users: any

  before(() => {
    cy.fixture('tenants').then((data) => {
      tenants = data
    })
    cy.fixture('users').then((data) => {
      users = data
    })
  })

  beforeEach(() => {
    cy.login()
  })

  describe('Tenant Onboarding', () => {
    it('should complete tenant onboarding for new user', () => {
      // Visit onboarding page
      cy.visit('/dashboard/onboarding')

      // Fill organization details
      cy.getByTestId('organization-name-input').type(tenants.testTenant.name)
      cy.getByTestId('organization-description-input').type(tenants.testTenant.description)
      
      // Continue to next step
      cy.getByTestId('onboarding-continue-button').click()

      // Should proceed to account setup
      cy.getByTestId('onboarding-step-accounts').should('be.visible')
      
      // Skip account setup for now
      cy.getByTestId('skip-accounts-button').click()

      // Should complete onboarding
      cy.url().should('include', '/dashboard')
      cy.getByTestId('tenant-selector').should('contain', tenants.testTenant.name)
    })

    it('should validate required fields in onboarding', () => {
      cy.visit('/dashboard/onboarding')

      // Try to continue without filling required fields
      cy.getByTestId('onboarding-continue-button').click()

      // Should show validation errors
      cy.get('[role="alert"]').should('be.visible')
      cy.get('body').should('contain.text', 'required')
    })

    it('should allow user to go back in onboarding steps', () => {
      cy.visit('/dashboard/onboarding')

      // Fill and continue to next step
      cy.getByTestId('organization-name-input').type(tenants.testTenant.name)
      cy.getByTestId('onboarding-continue-button').click()

      // Go back to previous step
      cy.getByTestId('onboarding-back-button').click()

      // Should be back at organization setup
      cy.getByTestId('organization-name-input').should('have.value', tenants.testTenant.name)
    })
  })

  describe('Tenant Switching', () => {
    beforeEach(() => {
      // Mock multiple tenants for the user
      cy.intercept('GET', '**/api/tenants', {
        statusCode: 200,
        body: { tenants: tenants.mockTenants }
      }).as('getTenants')
    })

    it('should display tenant selector with available tenants', () => {
      cy.visit('/dashboard')
      cy.wait('@getTenants')

      cy.getByTestId('tenant-selector').click()
      
      // Should show available tenants
      tenants.mockTenants.forEach((tenant: any) => {
        cy.getByTestId(`tenant-option-${tenant.name}`).should('be.visible')
      })
    })

    it('should switch between tenants successfully', () => {
      cy.visit('/dashboard')
      cy.wait('@getTenants')

      const targetTenant = tenants.mockTenants[1]

      // Mock tenant switch API
      cy.intercept('POST', '**/api/tenants/switch', {
        statusCode: 200,
        body: { success: true, tenant: targetTenant }
      }).as('switchTenant')

      // Switch to different tenant
      cy.switchTenant(targetTenant.name)
      cy.wait('@switchTenant')

      // Should update UI with new tenant
      cy.getByTestId('tenant-selector').should('contain', targetTenant.name)
    })

    it('should reload data when switching tenants', () => {
      cy.visit('/dashboard/campaigns')

      // Mock campaigns for different tenants
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: [] }
      }).as('getCampaignsAfterSwitch')

      cy.switchTenant(tenants.mockTenants[1].name)
      
      // Should reload campaigns data
      cy.wait('@getCampaignsAfterSwitch')
    })

    it('should handle tenant switch errors gracefully', () => {
      cy.visit('/dashboard')

      // Mock tenant switch error
      cy.intercept('POST', '**/api/tenants/switch', {
        statusCode: 403,
        body: { error: 'Access denied' }
      }).as('switchTenantError')

      cy.getByTestId('tenant-selector').click()
      cy.getByTestId(`tenant-option-${tenants.mockTenants[1].name}`).click()
      
      cy.wait('@switchTenantError')
      
      // Should show error message
      cy.get('[role="alert"]').should('contain.text', 'Access denied')
    })
  })

  describe('Tenant Settings', () => {
    it('should display current tenant settings', () => {
      cy.visit('/dashboard/settings')

      // Should show tenant information
      cy.getByTestId('tenant-name-display').should('be.visible')
      cy.getByTestId('tenant-created-date').should('be.visible')
      cy.getByTestId('tenant-member-count').should('be.visible')
    })

    it('should allow updating tenant settings', () => {
      cy.visit('/dashboard/settings')

      const newTenantName = 'Updated Organization Name'

      // Mock update API
      cy.intercept('PUT', '**/api/tenants/current', {
        statusCode: 200,
        body: { success: true }
      }).as('updateTenant')

      // Update tenant name
      cy.getByTestId('edit-tenant-button').click()
      cy.getByTestId('tenant-name-input').clear().type(newTenantName)
      cy.getByTestId('save-tenant-button').click()

      cy.wait('@updateTenant')

      // Should update tenant selector
      cy.getByTestId('tenant-selector').should('contain', newTenantName)
    })

    it('should validate tenant settings updates', () => {
      cy.visit('/dashboard/settings')

      cy.getByTestId('edit-tenant-button').click()
      
      // Try to save with empty name
      cy.getByTestId('tenant-name-input').clear()
      cy.getByTestId('save-tenant-button').click()

      // Should show validation error
      cy.get('[role="alert"]').should('be.visible')
    })

    it('should allow tenant deletion with confirmation', () => {
      cy.visit('/dashboard/settings')

      // Mock delete API
      cy.intercept('DELETE', '**/api/tenants/current', {
        statusCode: 200,
        body: { success: true }
      }).as('deleteTenant')

      // Initiate tenant deletion
      cy.getByTestId('delete-tenant-button').click()

      // Should show confirmation dialog
      cy.getByTestId('confirm-delete-dialog').should('be.visible')
      
      // Confirm deletion
      cy.getByTestId('confirm-delete-button').click()
      cy.wait('@deleteTenant')

      // Should redirect appropriately
      cy.url().should('match', /\/(dashboard|onboarding)/)
    })

    it('should cancel tenant deletion', () => {
      cy.visit('/dashboard/settings')

      cy.getByTestId('delete-tenant-button').click()
      
      // Cancel deletion
      cy.getByTestId('cancel-delete-button').click()

      // Should close dialog and stay on settings
      cy.getByTestId('confirm-delete-dialog').should('not.exist')
      cy.url().should('include', '/dashboard/settings')
    })
  })

  describe('Tenant Access Control', () => {
    it('should restrict access based on tenant membership', () => {
      // Mock user with no tenant access
      cy.intercept('GET', '**/api/tenants/current', {
        statusCode: 403,
        body: { error: 'No access to tenant' }
      }).as('noTenantAccess')

      cy.visit('/dashboard')
      cy.wait('@noTenantAccess')

      // Should redirect to onboarding or show error
      cy.url().should('match', /\/(onboarding|error)/)
    })

    it('should handle tenant-specific data isolation', () => {
      const tenant1Data = { campaigns: [{ id: '1', name: 'Tenant 1 Campaign' }] }
      const tenant2Data = { campaigns: [{ id: '2', name: 'Tenant 2 Campaign' }] }

      // Mock data for first tenant
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: tenant1Data
      }).as('getTenant1Data')

      cy.visit('/dashboard/campaigns')
      cy.wait('@getTenant1Data')

      // Should show tenant 1 data
      cy.getByTestId('campaigns-list').should('contain', 'Tenant 1 Campaign')

      // Switch tenant and mock different data
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: tenant2Data
      }).as('getTenant2Data')

      cy.switchTenant(tenants.mockTenants[1].name)
      cy.wait('@getTenant2Data')

      // Should show tenant 2 data
      cy.getByTestId('campaigns-list').should('contain', 'Tenant 2 Campaign')
      cy.getByTestId('campaigns-list').should('not.contain', 'Tenant 1 Campaign')
    })
  })
})
