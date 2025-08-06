/// <reference types="cypress" />

describe('Basic Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should load the application successfully', () => {
    // Check that the page loads without JavaScript errors
    cy.window().then((win) => {
      expect(win.console.error).to.not.have.been.called
    })

    // Check main content is present
    cy.contains('Email Warmup Pro').should('be.visible')
    cy.contains('Professional email warmup service').should('be.visible')
  })

  it('should display all feature sections', () => {
    // Check that all feature sections are present
    const expectedFeatures = [
      'MS365 Integration',
      'Gradual Warmup', 
      'Reputation Building',
      'Team Management'
    ]

    expectedFeatures.forEach(feature => {
      cy.contains(feature).should('be.visible')
    })
  })

  it('should have accessible form elements', () => {
    // Check form accessibility
    cy.get('form').should('be.visible')
    cy.get('input[type="email"]').should('have.attr', 'type', 'email')
    cy.get('input[type="password"]').should('have.attr', 'type', 'password')
    
    // Check buttons are accessible
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should handle different viewport sizes', () => {
    const viewports = [
      [375, 667],   // Mobile
      [768, 1024],  // Tablet
      [1280, 720],  // Desktop
      [1920, 1080]  // Large desktop
    ]

    viewports.forEach(([width, height]) => {
      cy.viewport(width, height)
      cy.contains('Email Warmup Pro').should('be.visible')
      cy.get('form').should('be.visible')
    })
  })
})
