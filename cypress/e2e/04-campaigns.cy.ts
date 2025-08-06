/// <reference types="cypress" />

describe('Campaign Management', () => {
  let campaigns: any
  let emailAccounts: any

  before(() => {
    cy.fixture('campaigns').then((data) => {
      campaigns = data
    })
    cy.fixture('emailAccounts').then((data) => {
      emailAccounts = data
    })
  })

  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard/campaigns')
  })

  describe('Campaigns List', () => {
    it('should display empty state when no campaigns exist', () => {
      // Mock empty campaigns response
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: [] }
      }).as('getEmptyCampaigns')

      cy.reload()
      cy.wait('@getEmptyCampaigns')

      // Should show empty state
      cy.getByTestId('empty-campaigns-state').should('be.visible')
      cy.getByTestId('create-first-campaign-button').should('be.visible')
    })

    it('should display list of campaigns', () => {
      // Mock campaigns response
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')

      cy.reload()
      cy.wait('@getCampaigns')

      // Should show campaigns list
      campaigns.testCampaigns.forEach((campaign: any) => {
        cy.getByTestId(`campaign-card-${campaign.id}`).should('be.visible')
        cy.getByTestId(`campaign-name-${campaign.id}`).should('contain', campaign.name)
        cy.getByTestId(`campaign-status-${campaign.id}`).should('contain', campaign.status)
      })
    })

    it('should show campaign status indicators correctly', () => {
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')

      cy.reload()
      cy.wait('@getCampaigns')

      // Check active campaign
      cy.getByTestId('campaign-status-campaign-1')
        .should('contain', 'active')
        .and('have.class', 'status-active')

      // Check paused campaign
      cy.getByTestId('campaign-status-campaign-2')
        .should('contain', 'paused')
        .and('have.class', 'status-paused')

      // Check completed campaign
      cy.getByTestId('campaign-status-campaign-3')
        .should('contain', 'completed')
        .and('have.class', 'status-completed')
    })

    it('should display campaign metrics', () => {
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')

      cy.reload()
      cy.wait('@getCampaigns')

      // Check progress
      cy.getByTestId('campaign-progress-campaign-1').should('contain', '35%')
      
      // Check delivery rate
      cy.getByTestId('campaign-delivery-rate-campaign-1').should('contain', '92.5%')
      
      // Check emails per day
      cy.getByTestId('campaign-emails-per-day-campaign-1').should('contain', '25')
    })

    it('should filter campaigns by status', () => {
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')

      cy.reload()
      cy.wait('@getCampaigns')

      // Filter by active status
      cy.getByTestId('campaign-filter-status').select('active')

      // Should show only active campaigns
      cy.getByTestId('campaign-card-campaign-1').should('be.visible')
      cy.getByTestId('campaign-card-campaign-2').should('not.exist')
      cy.getByTestId('campaign-card-campaign-3').should('not.exist')
    })

    it('should sort campaigns', () => {
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')

      cy.reload()
      cy.wait('@getCampaigns')

      // Sort by delivery rate
      cy.getByTestId('campaign-sort-select').select('deliveryRate')

      // Should reorder campaigns
      cy.getByTestId('campaigns-list').within(() => {
        cy.get('[data-testid^="campaign-card-"]').first()
          .should('contain', campaigns.testCampaigns[2].name) // Highest delivery rate
      })
    })
  })

  describe('Creating Campaigns', () => {
    beforeEach(() => {
      // Mock available email accounts
      cy.intercept('GET', '**/api/email-accounts', {
        statusCode: 200,
        body: { accounts: emailAccounts.mockAccounts.filter((a: any) => a.status === 'connected') }
      }).as('getEmailAccounts')
    })

    it('should open create campaign modal', () => {
      cy.getByTestId('create-campaign-button').click()

      // Should show modal
      cy.getByTestId('create-campaign-modal').should('be.visible')
      cy.getByTestId('campaign-name-input').should('be.visible')
      cy.getByTestId('emails-per-day-input').should('be.visible')
      cy.getByTestId('campaign-duration-input').should('be.visible')
    })

    it('should successfully create a basic campaign', () => {
      // Mock campaign creation API
      cy.intercept('POST', '**/api/campaigns', {
        statusCode: 201,
        body: { 
          success: true, 
          campaign: {
            id: 'new-campaign-id',
            ...campaigns.basicCampaign,
            status: 'active'
          }
        }
      }).as('createCampaign')

      cy.createCampaign(campaigns.basicCampaign.name, {
        emailsPerDay: campaigns.basicCampaign.emailsPerDay,
        duration: campaigns.basicCampaign.duration
      })

      cy.wait('@createCampaign')

      // Should close modal and show new campaign
      cy.getByTestId('create-campaign-modal').should('not.exist')
      cy.getByTestId('campaigns-list').should('contain', campaigns.basicCampaign.name)
    })

    it('should validate required fields', () => {
      cy.getByTestId('create-campaign-button').click()
      
      // Try to create without required fields
      cy.getByTestId('create-campaign-submit').click()

      // Should show validation errors
      cy.get('[role="alert"]').should('be.visible')
      cy.get('body').should('contain.text', 'required')
    })

    it('should validate email volume limits', () => {
      cy.getByTestId('create-campaign-button').click()
      
      // Enter invalid email volume
      cy.getByTestId('campaign-name-input').type('Test Campaign')
      cy.getByTestId('emails-per-day-input').type('1000') // Too high
      cy.getByTestId('create-campaign-submit').click()

      // Should show validation error
      cy.get('[role="alert"]').should('contain.text', 'maximum')
    })

    it('should select email accounts for campaign', () => {
      cy.getByTestId('create-campaign-button').click()
      cy.wait('@getEmailAccounts')

      // Should show available email accounts
      cy.getByTestId('email-accounts-selection').should('be.visible')
      
      // Select accounts
      cy.getByTestId('select-account-account-1').click()
      cy.getByTestId('select-account-account-2').click()

      // Should show selected count
      cy.getByTestId('selected-accounts-count').should('contain', '2')
    })

    it('should configure advanced campaign settings', () => {
      cy.getByTestId('create-campaign-button').click()
      
      // Fill basic info
      cy.getByTestId('campaign-name-input').type(campaigns.advancedCampaign.name)
      
      // Toggle advanced settings
      cy.getByTestId('advanced-settings-toggle').click()
      
      // Configure advanced options
      cy.getByTestId('ramp-up-days-input').type(campaigns.advancedCampaign.rampUpDays.toString())
      cy.getByTestId('target-delivery-rate-input').type(campaigns.advancedCampaign.targetDeliveryRate.toString())
      
      // Should save advanced settings
      cy.getByTestId('emails-per-day-input').type(campaigns.advancedCampaign.emailsPerDay.toString())
      cy.getByTestId('campaign-duration-input').type(campaigns.advancedCampaign.duration.toString())
      
      // Mock advanced campaign creation
      cy.intercept('POST', '**/api/campaigns', {
        statusCode: 201,
        body: { success: true, campaign: { id: 'advanced-campaign', ...campaigns.advancedCampaign } }
      }).as('createAdvancedCampaign')

      cy.getByTestId('create-campaign-submit').click()
      cy.wait('@createAdvancedCampaign')
    })

    it('should handle campaign creation errors', () => {
      // Mock creation error
      cy.intercept('POST', '**/api/campaigns', {
        statusCode: 400,
        body: { error: 'Insufficient email accounts' }
      }).as('createCampaignError')

      cy.createCampaign('Error Campaign')
      cy.wait('@createCampaignError')

      // Should show error message
      cy.get('[role="alert"]').should('contain.text', 'Insufficient email accounts')
    })

    it('should close modal when cancelled', () => {
      cy.getByTestId('create-campaign-button').click()
      cy.getByTestId('cancel-campaign-button').click()

      // Should close modal
      cy.getByTestId('create-campaign-modal').should('not.exist')
    })
  })

  describe('Campaign Actions', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')
      
      cy.reload()
      cy.wait('@getCampaigns')
    })

    it('should view campaign details', () => {
      cy.getByTestId('campaign-card-campaign-1').click()

      // Should open campaign details modal
      cy.getByTestId('campaign-details-modal').should('be.visible')
      cy.getByTestId('campaign-details-name').should('contain', campaigns.testCampaigns[0].name)
      cy.getByTestId('campaign-details-chart').should('be.visible')
      cy.getByTestId('campaign-email-history').should('be.visible')
    })

    it('should pause active campaign', () => {
      // Mock pause API
      cy.intercept('POST', '**/api/campaigns/campaign-1/pause', {
        statusCode: 200,
        body: { success: true }
      }).as('pauseCampaign')

      cy.getByTestId('campaign-menu-campaign-1').click()
      cy.getByTestId('pause-campaign-button').click()

      cy.wait('@pauseCampaign')

      // Should update status
      cy.getByTestId('campaign-status-campaign-1').should('contain', 'paused')
    })

    it('should resume paused campaign', () => {
      // Mock resume API
      cy.intercept('POST', '**/api/campaigns/campaign-2/resume', {
        statusCode: 200,
        body: { success: true }
      }).as('resumeCampaign')

      cy.getByTestId('campaign-menu-campaign-2').click()
      cy.getByTestId('resume-campaign-button').click()

      cy.wait('@resumeCampaign')

      // Should update status
      cy.getByTestId('campaign-status-campaign-2').should('contain', 'active')
    })

    it('should edit campaign settings', () => {
      cy.getByTestId('campaign-menu-campaign-1').click()
      cy.getByTestId('edit-campaign-button').click()

      // Should open edit modal
      cy.getByTestId('edit-campaign-modal').should('be.visible')
      
      // Update emails per day
      cy.getByTestId('emails-per-day-input').clear().type('75')
      
      // Mock update API
      cy.intercept('PUT', '**/api/campaigns/campaign-1', {
        statusCode: 200,
        body: { success: true }
      }).as('updateCampaign')

      cy.getByTestId('save-campaign-button').click()
      cy.wait('@updateCampaign')

      // Should close modal and show success
      cy.getByTestId('edit-campaign-modal').should('not.exist')
      cy.get('[role="alert"]').should('contain.text', 'updated')
    })

    it('should delete campaign with confirmation', () => {
      // Mock delete API
      cy.intercept('DELETE', '**/api/campaigns/campaign-1', {
        statusCode: 200,
        body: { success: true }
      }).as('deleteCampaign')

      cy.getByTestId('campaign-menu-campaign-1').click()
      cy.getByTestId('delete-campaign-button').click()

      // Should show confirmation dialog
      cy.getByTestId('confirm-delete-dialog').should('be.visible')
      
      // Confirm deletion
      cy.getByTestId('confirm-delete-button').click()
      cy.wait('@deleteCampaign')

      // Should remove campaign from list
      cy.getByTestId('campaign-card-campaign-1').should('not.exist')
    })

    it('should cancel campaign deletion', () => {
      cy.getByTestId('campaign-menu-campaign-1').click()
      cy.getByTestId('delete-campaign-button').click()
      
      // Cancel deletion
      cy.getByTestId('cancel-delete-button').click()

      // Should close dialog
      cy.getByTestId('confirm-delete-dialog').should('not.exist')
    })

    it('should duplicate campaign', () => {
      // Mock duplicate API
      cy.intercept('POST', '**/api/campaigns/campaign-1/duplicate', {
        statusCode: 201,
        body: { 
          success: true, 
          campaign: { 
            id: 'duplicated-campaign',
            name: campaigns.testCampaigns[0].name + ' (Copy)',
            status: 'draft'
          }
        }
      }).as('duplicateCampaign')

      cy.getByTestId('campaign-menu-campaign-1').click()
      cy.getByTestId('duplicate-campaign-button').click()

      cy.wait('@duplicateCampaign')

      // Should show duplicated campaign
      cy.getByTestId('campaigns-list').should('contain', '(Copy)')
    })
  })

  describe('Campaign Performance', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')
      
      cy.reload()
      cy.wait('@getCampaigns')
    })

    it('should display campaign chart', () => {
      cy.getByTestId('campaign-card-campaign-1').click()

      // Should show performance chart
      cy.getByTestId('campaign-chart').should('be.visible')
      cy.getByTestId('chart-delivery-rate').should('be.visible')
      cy.getByTestId('chart-emails-sent').should('be.visible')
    })

    it('should show email history', () => {
      cy.getByTestId('campaign-card-campaign-1').click()

      // Should show email history table
      cy.getByTestId('email-history-table').should('be.visible')
      cy.getByTestId('email-history-filters').should('be.visible')
    })

    it('should filter email history by date', () => {
      cy.getByTestId('campaign-card-campaign-1').click()

      // Set date filter
      cy.getByTestId('email-history-date-from').type('2024-01-10')
      cy.getByTestId('email-history-date-to').type('2024-01-15')
      cy.getByTestId('apply-date-filter').click()

      // Should filter results
      cy.getByTestId('email-history-table').should('be.visible')
    })

    it('should export campaign data', () => {
      cy.getByTestId('campaign-menu-campaign-1').click()
      cy.getByTestId('export-campaign-button').click()

      // Should trigger download
      cy.readFile('cypress/downloads/campaign-data.csv', { timeout: 10000 })
        .should('exist')
    })
  })

  describe('Campaign Automation', () => {
    it('should show automation status', () => {
      cy.intercept('GET', '**/api/campaigns', {
        statusCode: 200,
        body: { campaigns: campaigns.testCampaigns }
      }).as('getCampaigns')

      cy.reload()
      cy.wait('@getCampaigns')

      // Should show automation indicators
      cy.getByTestId('campaign-automation-campaign-1').should('be.visible')
    })

    it('should handle automation errors', () => {
      // Mock automation error
      cy.intercept('GET', '**/api/campaigns/campaign-1/automation-status', {
        statusCode: 200,
        body: { 
          status: 'error',
          error: 'Rate limit exceeded',
          lastRun: '2024-01-15T10:00:00Z'
        }
      }).as('getAutomationStatus')

      cy.getByTestId('campaign-card-campaign-1').click()
      cy.wait('@getAutomationStatus')

      // Should show error status
      cy.getByTestId('automation-error').should('contain', 'Rate limit exceeded')
    })

    it('should restart failed automation', () => {
      // Mock restart API
      cy.intercept('POST', '**/api/campaigns/campaign-1/restart-automation', {
        statusCode: 200,
        body: { success: true }
      }).as('restartAutomation')

      cy.getByTestId('campaign-card-campaign-1').click()
      cy.getByTestId('restart-automation-button').click()

      cy.wait('@restartAutomation')

      // Should show success message
      cy.get('[role="alert"]').should('contain.text', 'restarted')
    })
  })
})
