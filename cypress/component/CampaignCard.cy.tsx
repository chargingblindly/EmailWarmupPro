/// <reference types="cypress" />

import React from 'react'
import { CampaignCard } from '../../src/components/campaigns/CampaignCard'

describe('CampaignCard Component', () => {
  const mockCampaign = {
    id: 'test-campaign-1',
    name: 'Test Campaign',
    status: 'active' as const,
    emailsPerDay: 50,
    duration: 30,
    progress: 65,
    deliveryRate: 92.5,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
  }

  const mockHandlers = {
    onEdit: cy.stub().as('onEdit'),
    onPause: cy.stub().as('onPause'),
    onResume: cy.stub().as('onResume'),
    onDelete: cy.stub().as('onDelete'),
    onClick: cy.stub().as('onClick')
  }

  beforeEach(() => {
    // Reset stubs before each test
    Object.values(mockHandlers).forEach(stub => stub.reset())
  })

  it('should render campaign information correctly', () => {
    cy.mount(
      <CampaignCard 
        campaign={mockCampaign} 
        {...mockHandlers}
      />
    )

    // Verify campaign details are displayed
    cy.getByTestId('campaign-name').should('contain', mockCampaign.name)
    cy.getByTestId('campaign-status').should('contain', mockCampaign.status)
    cy.getByTestId('emails-per-day').should('contain', mockCampaign.emailsPerDay.toString())
    cy.getByTestId('delivery-rate').should('contain', '92.5%')
    cy.getByTestId('campaign-progress').should('contain', '65%')
  })

  it('should display correct status styling', () => {
    // Test active status
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)
    cy.getByTestId('campaign-status-badge').should('have.class', 'status-active')

    // Test paused status
    const pausedCampaign = { ...mockCampaign, status: 'paused' as const }
    cy.mount(<CampaignCard campaign={pausedCampaign} {...mockHandlers} />)
    cy.getByTestId('campaign-status-badge').should('have.class', 'status-paused')

    // Test completed status
    const completedCampaign = { ...mockCampaign, status: 'completed' as const }
    cy.mount(<CampaignCard campaign={completedCampaign} {...mockHandlers} />)
    cy.getByTestId('campaign-status-badge').should('have.class', 'status-completed')
  })

  it('should handle click events correctly', () => {
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)

    // Click on card should trigger onClick handler
    cy.getByTestId('campaign-card').click()
    cy.get('@onClick').should('have.been.calledWith', mockCampaign)
  })

  it('should show correct action buttons based on status', () => {
    // Active campaign should show pause and edit buttons
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)
    
    cy.getByTestId('campaign-menu-trigger').click()
    cy.getByTestId('pause-campaign-action').should('be.visible')
    cy.getByTestId('edit-campaign-action').should('be.visible')
    cy.getByTestId('delete-campaign-action').should('be.visible')
    cy.getByTestId('resume-campaign-action').should('not.exist')

    // Paused campaign should show resume button
    const pausedCampaign = { ...mockCampaign, status: 'paused' as const }
    cy.mount(<CampaignCard campaign={pausedCampaign} {...mockHandlers} />)
    
    cy.getByTestId('campaign-menu-trigger').click()
    cy.getByTestId('resume-campaign-action').should('be.visible')
    cy.getByTestId('pause-campaign-action').should('not.exist')
  })

  it('should trigger action handlers correctly', () => {
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)

    // Test pause action
    cy.getByTestId('campaign-menu-trigger').click()
    cy.getByTestId('pause-campaign-action').click()
    cy.get('@onPause').should('have.been.calledWith', mockCampaign.id)

    // Test edit action
    cy.getByTestId('campaign-menu-trigger').click()
    cy.getByTestId('edit-campaign-action').click()
    cy.get('@onEdit').should('have.been.calledWith', mockCampaign.id)

    // Test delete action
    cy.getByTestId('campaign-menu-trigger').click()
    cy.getByTestId('delete-campaign-action').click()
    cy.get('@onDelete').should('have.been.calledWith', mockCampaign.id)
  })

  it('should display progress bar correctly', () => {
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)

    // Progress bar should have correct width
    cy.getByTestId('campaign-progress-bar')
      .should('have.css', 'width')
      .and('match', /65%|65\.[\d]+%/)

    // Test different progress values
    const highProgressCampaign = { ...mockCampaign, progress: 90 }
    cy.mount(<CampaignCard campaign={highProgressCampaign} {...mockHandlers} />)
    
    cy.getByTestId('campaign-progress-bar')
      .should('have.css', 'width')
      .and('match', /90%|90\.[\d]+%/)
  })

  it('should handle loading states', () => {
    cy.mount(
      <CampaignCard 
        campaign={mockCampaign} 
        {...mockHandlers}
        isLoading={true}
      />
    )

    // Should show loading indicators
    cy.getByTestId('campaign-card').should('have.class', 'loading')
    cy.getByTestId('campaign-menu-trigger').should('be.disabled')
  })

  it('should handle error states', () => {
    const errorCampaign = {
      ...mockCampaign,
      error: 'Failed to sync campaign data'
    }

    cy.mount(<CampaignCard campaign={errorCampaign} {...mockHandlers} />)

    // Should show error indicator
    cy.getByTestId('campaign-error-indicator').should('be.visible')
    cy.getByTestId('campaign-error-message').should('contain', 'Failed to sync')
  })

  it('should be accessible', () => {
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)

    // Check accessibility attributes
    cy.getByTestId('campaign-card').should('have.attr', 'role', 'button')
    cy.getByTestId('campaign-card').should('have.attr', 'tabindex', '0')
    cy.getByTestId('campaign-menu-trigger').should('have.attr', 'aria-label')

    // Test keyboard navigation
    cy.getByTestId('campaign-card').focus()
    cy.getByTestId('campaign-card').should('be.focused')
    
    // Enter key should trigger click
    cy.getByTestId('campaign-card').type('{enter}')
    cy.get('@onClick').should('have.been.called')
  })

  it('should handle different delivery rate ranges', () => {
    // High delivery rate (green)
    const highDeliveryRateCampaign = { ...mockCampaign, deliveryRate: 95 }
    cy.mount(<CampaignCard campaign={highDeliveryRateCampaign} {...mockHandlers} />)
    cy.getByTestId('delivery-rate-indicator').should('have.class', 'high')

    // Medium delivery rate (yellow)
    const mediumDeliveryRateCampaign = { ...mockCampaign, deliveryRate: 80 }
    cy.mount(<CampaignCard campaign={mediumDeliveryRateCampaign} {...mockHandlers} />)
    cy.getByTestId('delivery-rate-indicator').should('have.class', 'medium')

    // Low delivery rate (red)
    const lowDeliveryRateCampaign = { ...mockCampaign, deliveryRate: 60 }
    cy.mount(<CampaignCard campaign={lowDeliveryRateCampaign} {...mockHandlers} />)
    cy.getByTestId('delivery-rate-indicator').should('have.class', 'low')
  })

  it('should format dates correctly', () => {
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)

    // Should display formatted creation date
    cy.getByTestId('campaign-created-date').should('be.visible')
    cy.getByTestId('campaign-updated-date').should('be.visible')
  })

  it('should handle menu interactions', () => {
    cy.mount(<CampaignCard campaign={mockCampaign} {...mockHandlers} />)

    // Menu should be initially closed
    cy.getByTestId('campaign-menu').should('not.exist')

    // Click to open menu
    cy.getByTestId('campaign-menu-trigger').click()
    cy.getByTestId('campaign-menu').should('be.visible')

    // Click outside should close menu
    cy.get('body').click()
    cy.getByTestId('campaign-menu').should('not.exist')

    // Escape key should close menu
    cy.getByTestId('campaign-menu-trigger').click()
    cy.getByTestId('campaign-menu').should('be.visible')
    cy.get('body').type('{esc}')
    cy.getByTestId('campaign-menu').should('not.exist')
  })

  it('should prevent actions when disabled', () => {
    cy.mount(
      <CampaignCard 
        campaign={mockCampaign} 
        {...mockHandlers}
        disabled={true}
      />
    )

    // Card should not be clickable when disabled
    cy.getByTestId('campaign-card').should('have.class', 'disabled')
    cy.getByTestId('campaign-card').click({ force: true })
    cy.get('@onClick').should('not.have.been.called')

    // Menu should be disabled
    cy.getByTestId('campaign-menu-trigger').should('be.disabled')
  })
})
