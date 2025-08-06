/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the landing page correctly', () => {
    // Check main heading
    cy.contains('Email Warmup Pro').should('be.visible')
    
    // Check features section
    cy.contains('MS365 Integration').should('be.visible')
    cy.contains('Gradual Warmup').should('be.visible')
    cy.contains('Reputation Building').should('be.visible')
    cy.contains('Team Management').should('be.visible')
    
    // Check auth form is present
    cy.get('form').should('be.visible')
  })

  it('should display authentication form', () => {
    // Check that auth form elements are present
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should handle form submission', () => {
    // Fill out the form with test data
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('testpassword123')
    
    // Mock the authentication request
    cy.intercept('POST', '**/auth/**', {
      statusCode: 200,
      body: { user: { id: '123', email: 'test@example.com' } }
    }).as('authRequest')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
  })
})
