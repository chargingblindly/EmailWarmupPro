/// <reference types="cypress" />

describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should render the main page without errors', () => {
    cy.contains('Email Warmup Pro').should('be.visible')
    // Check that main content loads without critical errors
    cy.get('body').should('not.contain', 'Error')
    // Allow for loading states and minor undefined values during hydration
    cy.wait(1000)
  })

  it('should have responsive design elements', () => {
    // Test desktop view
    cy.viewport(1280, 720)
    cy.contains('Email Warmup Pro').should('be.visible')
    
    // Test mobile view
    cy.viewport(375, 667)
    cy.contains('Email Warmup Pro').should('be.visible')
    
    // Test tablet view
    cy.viewport(768, 1024)
    cy.contains('Email Warmup Pro').should('be.visible')
  })

  it('should display feature cards', () => {
    cy.get('.text-center').should('have.length.at.least', 4)
    cy.contains('MS365 Integration').should('be.visible')
    cy.contains('Gradual Warmup').should('be.visible')
    cy.contains('Reputation Building').should('be.visible')
    cy.contains('Team Management').should('be.visible')
  })
})
