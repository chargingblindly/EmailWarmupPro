/// <reference types="cypress" />

describe('Navigation and General UI', () => {
  beforeEach(() => {
    cy.login()
  })

  describe('Dashboard Navigation', () => {
    it('should navigate to dashboard from any page', () => {
      cy.visit('/dashboard/campaigns')
      
      // Click dashboard nav link
      cy.getByTestId('nav-dashboard').click()
      
      // Should navigate to dashboard
      cy.url().should('include', '/dashboard')
      cy.getByTestId('dashboard-overview').should('be.visible')
    })

    it('should display dashboard overview widgets', () => {
      cy.visit('/dashboard')

      // Should show overview widgets
      cy.getByTestId('total-campaigns-widget').should('be.visible')
      cy.getByTestId('active-accounts-widget').should('be.visible')
      cy.getByTestId('delivery-rate-widget').should('be.visible')
      cy.getByTestId('warmup-score-widget').should('be.visible')
    })

    it('should show recent activity on dashboard', () => {
      // Mock recent activity
      cy.intercept('GET', '**/api/dashboard/recent-activity', {
        statusCode: 200,
        body: {
          activities: [
            {
              id: 'activity-1',
              type: 'campaign_created',
              description: 'New campaign "Test Campaign" created',
              timestamp: '2024-01-15T10:30:00Z'
            },
            {
              id: 'activity-2',
              type: 'account_connected',
              description: 'Email account connected',
              timestamp: '2024-01-15T09:15:00Z'
            }
          ]
        }
      }).as('getRecentActivity')

      cy.visit('/dashboard')
      cy.wait('@getRecentActivity')

      // Should show recent activity
      cy.getByTestId('recent-activity-widget').should('be.visible')
      cy.getByTestId('activity-campaign_created').should('contain', 'Test Campaign')
      cy.getByTestId('activity-account_connected').should('contain', 'account connected')
    })

    it('should display quick action buttons', () => {
      cy.visit('/dashboard')

      // Should show quick actions
      cy.getByTestId('quick-actions').should('be.visible')
      cy.getByTestId('quick-create-campaign').should('be.visible')
      cy.getByTestId('quick-add-account').should('be.visible')
      cy.getByTestId('quick-invite-member').should('be.visible')
    })

    it('should navigate via quick action buttons', () => {
      cy.visit('/dashboard')

      // Click quick create campaign
      cy.getByTestId('quick-create-campaign').click()
      
      // Should open create campaign modal or navigate to campaigns
      cy.get('[data-testid*="campaign"]').should('be.visible')
    })
  })

  describe('Sidebar Navigation', () => {
    const navigationItems = [
      { testId: 'nav-dashboard', url: '/dashboard', title: 'Dashboard' },
      { testId: 'nav-accounts', url: '/dashboard/accounts', title: 'Email Accounts' },
      { testId: 'nav-campaigns', url: '/dashboard/campaigns', title: 'Campaigns' },
      { testId: 'nav-team', url: '/dashboard/team', title: 'Team' },
      { testId: 'nav-demo', url: '/dashboard/demo', title: 'Demo' },
      { testId: 'nav-settings', url: '/dashboard/settings', title: 'Settings' }
    ]

    navigationItems.forEach((item) => {
      it(`should navigate to ${item.title}`, () => {
        cy.visit('/dashboard')
        
        // Click navigation item
        cy.getByTestId(item.testId).click()
        
        // Should navigate to correct page
        cy.url().should('include', item.url)
        
        // Should highlight active nav item
        cy.getByTestId(item.testId).should('have.class', 'active')
      })
    })

    it('should show navigation item descriptions on hover', () => {
      cy.visit('/dashboard')

      // Hover over navigation items
      cy.getByTestId('nav-campaigns').trigger('mouseover')
      cy.get('[role="tooltip"]').should('contain', 'Manage warmup campaigns')
    })

    it('should collapse and expand sidebar', () => {
      cy.visit('/dashboard')

      // Collapse sidebar
      cy.getByTestId('sidebar-toggle').click()
      
      // Should collapse
      cy.getByTestId('sidebar').should('have.class', 'collapsed')
      
      // Expand sidebar
      cy.getByTestId('sidebar-toggle').click()
      
      // Should expand
      cy.getByTestId('sidebar').should('not.have.class', 'collapsed')
    })

    it('should remember sidebar state', () => {
      cy.visit('/dashboard')

      // Collapse sidebar
      cy.getByTestId('sidebar-toggle').click()
      
      // Navigate to different page
      cy.getByTestId('nav-campaigns').click()
      
      // Should maintain collapsed state
      cy.getByTestId('sidebar').should('have.class', 'collapsed')
    })

    it('should show badge notifications on nav items', () => {
      // Mock pending invitations
      cy.intercept('GET', '**/api/team/pending-count', {
        statusCode: 200,
        body: { count: 3 }
      }).as('getPendingCount')

      cy.visit('/dashboard')
      cy.wait('@getPendingCount')

      // Should show notification badge
      cy.getByTestId('nav-team-badge').should('contain', '3')
    })
  })

  describe('Top Navigation Bar', () => {
    it('should display organization/tenant selector', () => {
      cy.visit('/dashboard')

      // Should show tenant selector
      cy.getByTestId('tenant-selector').should('be.visible')
      cy.getByTestId('tenant-selector').should('contain.text', 'Organization')
    })

    it('should display user menu', () => {
      cy.visit('/dashboard')

      // Click user menu
      cy.getByTestId('user-menu-trigger').click()
      
      // Should show user menu options
      cy.getByTestId('user-menu').should('be.visible')
      cy.getByTestId('user-profile-link').should('be.visible')
      cy.getByTestId('user-settings-link').should('be.visible')
      cy.getByTestId('logout-button').should('be.visible')
    })

    it('should show notifications dropdown', () => {
      // Mock notifications
      cy.intercept('GET', '**/api/notifications', {
        statusCode: 200,
        body: {
          notifications: [
            {
              id: 'notif-1',
              type: 'campaign_completed',
              message: 'Campaign "Test Campaign" completed successfully',
              timestamp: '2024-01-15T10:00:00Z',
              read: false
            }
          ]
        }
      }).as('getNotifications')

      cy.visit('/dashboard')

      // Click notifications bell
      cy.getByTestId('notifications-trigger').click()
      cy.wait('@getNotifications')
      
      // Should show notifications
      cy.getByTestId('notifications-dropdown').should('be.visible')
      cy.getByTestId('notification-campaign_completed').should('be.visible')
    })

    it('should mark notifications as read', () => {
      cy.intercept('GET', '**/api/notifications', {
        statusCode: 200,
        body: {
          notifications: [{
            id: 'notif-1',
            type: 'campaign_completed',
            message: 'Test notification',
            read: false
          }]
        }
      }).as('getNotifications')

      // Mock mark as read API
      cy.intercept('PUT', '**/api/notifications/notif-1/read', {
        statusCode: 200,
        body: { success: true }
      }).as('markAsRead')

      cy.visit('/dashboard')
      cy.getByTestId('notifications-trigger').click()
      cy.wait('@getNotifications')

      // Click notification
      cy.getByTestId('notification-notif-1').click()
      cy.wait('@markAsRead')

      // Should mark as read
      cy.getByTestId('notification-notif-1').should('have.class', 'read')
    })

    it('should display search functionality', () => {
      cy.visit('/dashboard')

      // Should show search input
      cy.getByTestId('global-search').should('be.visible')
      
      // Type in search
      cy.getByTestId('global-search').type('test campaign')
      
      // Should show search results
      cy.getByTestId('search-results').should('be.visible')
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt to mobile viewport', () => {
      cy.viewport(375, 667) // iPhone SE
      cy.visit('/dashboard')

      // Should show mobile navigation
      cy.getByTestId('mobile-nav-toggle').should('be.visible')
      cy.getByTestId('sidebar').should('have.class', 'mobile-hidden')
    })

    it('should open mobile navigation menu', () => {
      cy.viewport(375, 667)
      cy.visit('/dashboard')

      // Open mobile menu
      cy.getByTestId('mobile-nav-toggle').click()
      
      // Should show mobile menu
      cy.getByTestId('mobile-nav-menu').should('be.visible')
      cy.getByTestId('nav-dashboard').should('be.visible')
    })

    it('should adapt to tablet viewport', () => {
      cy.viewport(768, 1024) // iPad
      cy.visit('/dashboard')

      // Should show condensed navigation
      cy.getByTestId('sidebar').should('have.class', 'tablet-mode')
    })

    it('should handle desktop viewport correctly', () => {
      cy.viewport(1280, 720) // Desktop
      cy.visit('/dashboard')

      // Should show full navigation
      cy.getByTestId('sidebar').should('be.visible')
      cy.getByTestId('mobile-nav-toggle').should('not.be.visible')
    })

    it('should maintain functionality across viewports', () => {
      // Test mobile first
      cy.viewport(375, 667)
      cy.visit('/dashboard/campaigns')
      cy.url().should('include', '/campaigns')

      // Switch to desktop
      cy.viewport(1280, 720)
      cy.getByTestId('nav-team').click()
      cy.url().should('include', '/team')

      // Switch back to mobile
      cy.viewport(375, 667)
      cy.getByTestId('mobile-nav-toggle').click()
      cy.getByTestId('nav-settings').click()
      cy.url().should('include', '/settings')
    })
  })

  describe('Breadcrumb Navigation', () => {
    it('should display breadcrumbs on deep pages', () => {
      cy.visit('/dashboard/campaigns')

      // Should show breadcrumbs
      cy.getByTestId('breadcrumbs').should('be.visible')
      cy.getByTestId('breadcrumb-dashboard').should('contain', 'Dashboard')
      cy.getByTestId('breadcrumb-campaigns').should('contain', 'Campaigns')
    })

    it('should navigate via breadcrumb links', () => {
      cy.visit('/dashboard/team')

      // Click dashboard breadcrumb
      cy.getByTestId('breadcrumb-dashboard').click()
      
      // Should navigate to dashboard
      cy.url().should('include', '/dashboard')
      cy.url().should('not.include', '/team')
    })

    it('should update breadcrumbs on navigation', () => {
      cy.visit('/dashboard')
      
      // Navigate to different section
      cy.getByTestId('nav-accounts').click()
      
      // Should update breadcrumbs
      cy.getByTestId('breadcrumb-accounts').should('be.visible')
    })
  })

  describe('Page Loading and Error States', () => {
    it('should show loading state during navigation', () => {
      // Mock slow response
      cy.intercept('GET', '**/api/campaigns', (req) => {
        req.reply((res) => {
          setTimeout(() => {
            res.send({ statusCode: 200, body: { campaigns: [] } })
          }, 2000)
        })
      }).as('slowCampaigns')

      cy.visit('/dashboard')
      cy.getByTestId('nav-campaigns').click()

      // Should show loading state
      cy.getByTestId('page-loading').should('be.visible')
      
      cy.wait('@slowCampaigns')
      cy.getByTestId('page-loading').should('not.exist')
    })

    it('should handle navigation errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '**/api/team', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('teamError')

      cy.visit('/dashboard')
      cy.getByTestId('nav-team').click()
      cy.wait('@teamError')

      // Should show error state
      cy.getByTestId('page-error').should('be.visible')
      cy.getByTestId('error-message').should('contain', 'error')
      cy.getByTestId('retry-button').should('be.visible')
    })

    it('should retry failed page loads', () => {
      // Mock initial error then success
      cy.intercept('GET', '**/api/team', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('teamErrorFirst')

      cy.visit('/dashboard/team')
      cy.wait('@teamErrorFirst')

      // Mock successful retry
      cy.intercept('GET', '**/api/team', {
        statusCode: 200,
        body: { members: [] }
      }).as('teamRetrySuccess')

      cy.getByTestId('retry-button').click()
      cy.wait('@teamRetrySuccess')

      // Should show page content
      cy.getByTestId('team-page').should('be.visible')
    })

    it('should show offline state when network is unavailable', () => {
      // Simulate offline
      cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError')

      cy.visit('/dashboard/campaigns')
      cy.wait('@networkError')

      // Should show offline message
      cy.getByTestId('offline-banner').should('be.visible')
      cy.getByTestId('offline-message').should('contain', 'offline')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in sidebar', () => {
      cy.visit('/dashboard')

      // Focus on first nav item
      cy.getByTestId('nav-dashboard').focus()
      
      // Navigate with arrow keys
      cy.get('body').type('{downarrow}')
      cy.getByTestId('nav-accounts').should('be.focused')
      
      // Activate with enter
      cy.get('body').type('{enter}')
      cy.url().should('include', '/accounts')
    })

    it('should support tab navigation', () => {
      cy.visit('/dashboard')

      // Tab through interactive elements
      cy.get('body').tab()
      cy.getByTestId('tenant-selector').should('be.focused')
      
      cy.get('body').tab()
      cy.getByTestId('global-search').should('be.focused')
    })

    it('should support keyboard shortcuts', () => {
      cy.visit('/dashboard')

      // Test keyboard shortcuts
      cy.get('body').type('{ctrl+k}') // Open search
      cy.getByTestId('search-modal').should('be.visible')
      
      cy.get('body').type('{esc}') // Close modal
      cy.getByTestId('search-modal').should('not.exist')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.visit('/dashboard')

      // Check navigation has proper labels
      cy.getByTestId('sidebar').should('have.attr', 'role', 'navigation')
      cy.getByTestId('user-menu-trigger').should('have.attr', 'aria-label')
    })

    it('should support screen readers', () => {
      cy.visit('/dashboard')

      // Check for screen reader content
      cy.get('[aria-live="polite"]').should('exist')
      cy.get('[role="main"]').should('exist')
    })

    it('should have sufficient color contrast', () => {
      cy.visit('/dashboard')

      // This would typically use an accessibility testing plugin
      // For now, check that text is readable
      cy.getByTestId('nav-dashboard').should('be.visible')
      cy.getByTestId('nav-dashboard').should('have.css', 'color')
    })
  })
})
