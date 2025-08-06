/// <reference types="cypress" />

describe('Authentication Flow', () => {
  let users: any

  before(() => {
    cy.fixture('users').then((data) => {
      users = data
    })
  })

  beforeEach(() => {
    cy.visit('/')
  })

  describe('User Signup', () => {
    it('should successfully sign up a new user', () => {
      // Test new user signup
      cy.signUp(
        users.newUser.email,
        users.newUser.password,
        users.newUser.organization
      )

      // Should redirect to onboarding or dashboard
      cy.url().should('match', /\/(dashboard|onboarding)/)
      
      // Should show welcome message or onboarding content
      cy.get('body').should('contain.text', 'Welcome')
    })

    it('should show validation errors for invalid signup data', () => {
      cy.getByTestId('auth-mode-toggle').click()

      // Test invalid email
      cy.getByTestId('auth-email-input').type('invalid-email')
      cy.getByTestId('auth-password-input').type('short')
      cy.getByTestId('auth-signup-button').click()

      // Should show validation errors
      cy.get('[role="alert"]').should('be.visible')
      cy.get('body').should('contain.text', 'email')
    })

    it('should show error for duplicate email signup', () => {
      // Mock duplicate email error
      cy.intercept('POST', '**/auth/v1/signup', {
        statusCode: 400,
        body: { error: 'User already registered' }
      }).as('duplicateSignup')

      cy.signUp(users.testUser.email, users.testUser.password)
      
      cy.wait('@duplicateSignup')
      cy.get('[role="alert"]').should('contain.text', 'already registered')
    })
  })

  describe('User Login', () => {
    it('should successfully log in with valid credentials', () => {
      cy.login(users.testUser.email, users.testUser.password)

      // Should be redirected to dashboard
      cy.url().should('include', '/dashboard')
      
      // Should show user menu
      cy.getByTestId('user-menu-trigger').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      // Mock invalid credentials error
      cy.intercept('POST', '**/auth/v1/token**', {
        statusCode: 400,
        body: { error: 'Invalid login credentials' }
      }).as('invalidLogin')

      cy.getByTestId('auth-email-input').type('wrong@example.com')
      cy.getByTestId('auth-password-input').type('wrongpassword')
      cy.getByTestId('auth-login-button').click()

      cy.wait('@invalidLogin')
      cy.get('[role="alert"]').should('contain.text', 'Invalid')
    })

    it('should show validation errors for empty fields', () => {
      cy.getByTestId('auth-login-button').click()

      // Should show validation errors
      cy.get('[role="alert"]').should('be.visible')
    })

    it('should toggle between login and signup modes', () => {
      // Should start in login mode
      cy.getByTestId('auth-login-button').should('be.visible')
      cy.getByTestId('auth-signup-button').should('not.exist')

      // Toggle to signup mode
      cy.getByTestId('auth-mode-toggle').click()
      cy.getByTestId('auth-signup-button').should('be.visible')
      cy.getByTestId('auth-login-button').should('not.exist')

      // Toggle back to login mode
      cy.getByTestId('auth-mode-toggle').click()
      cy.getByTestId('auth-login-button').should('be.visible')
    })
  })

  describe('User Logout', () => {
    beforeEach(() => {
      cy.login()
    })

    it('should successfully log out user', () => {
      cy.logout()

      // Should redirect to login page
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      
      // Should show login form
      cy.getByTestId('auth-login-button').should('be.visible')
    })

    it('should clear user session data on logout', () => {
      cy.logout()

      // Attempt to visit protected route
      cy.visit('/dashboard')
      
      // Should redirect back to login
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })

  describe('Protected Routes', () => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/accounts',
      '/dashboard/campaigns',
      '/dashboard/team',
      '/dashboard/settings',
      '/dashboard/demo'
    ]

    protectedRoutes.forEach((route) => {
      it(`should redirect unauthenticated user from ${route}`, () => {
        cy.visit(route)
        
        // Should redirect to login
        cy.url().should('eq', Cypress.config().baseUrl + '/')
        cy.getByTestId('auth-login-button').should('be.visible')
      })
    })

    it('should allow authenticated user to access protected routes', () => {
      cy.login()

      protectedRoutes.forEach((route) => {
        cy.visit(route)
        cy.url().should('include', route)
        cy.getByTestId('user-menu-trigger').should('be.visible')
      })
    })
  })

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      cy.login()
      
      // Refresh the page
      cy.reload()
      
      // Should still be logged in
      cy.url().should('include', '/dashboard')
      cy.getByTestId('user-menu-trigger').should('be.visible')
    })

    it('should handle expired session gracefully', () => {
      cy.login()

      // Mock expired session
      cy.intercept('GET', '**/auth/v1/user**', {
        statusCode: 401,
        body: { error: 'Session expired' }
      }).as('expiredSession')

      cy.visit('/dashboard/campaigns')
      cy.wait('@expiredSession')
      
      // Should redirect to login
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })
})
