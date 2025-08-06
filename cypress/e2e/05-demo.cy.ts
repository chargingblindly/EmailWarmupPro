/// <reference types="cypress" />

describe('Demo Simulation', () => {
  let demoData: any

  before(() => {
    cy.fixture('demoData').then((data) => {
      demoData = data
    })
  })

  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard/demo')
  })

  describe('Demo Interface', () => {
    it('should display demo introduction', () => {
      // Should show demo description
      cy.getByTestId('demo-introduction').should('be.visible')
      cy.getByTestId('demo-description').should('contain', 'simulation')
      
      // Should show start demo button
      cy.getByTestId('start-demo-button').should('be.visible')
      cy.getByTestId('start-demo-button').should('contain', 'Start Demo')
    })

    it('should show demo features explanation', () => {
      // Should display what the demo covers
      cy.getByTestId('demo-features').should('be.visible')
      cy.getByTestId('demo-feature-warmup').should('contain', 'email warmup')
      cy.getByTestId('demo-feature-metrics').should('contain', 'metrics')
      cy.getByTestId('demo-feature-automation').should('contain', 'automation')
    })

    it('should display demo duration information', () => {
      // Should show estimated demo time
      cy.getByTestId('demo-duration').should('be.visible')
      cy.getByTestId('demo-duration').should('contain', 'minutes')
    })
  })

  describe('Starting Demo', () => {
    it('should successfully start demo simulation', () => {
      // Mock demo start API
      cy.intercept('POST', '**/api/demo/start', {
        statusCode: 200,
        body: { 
          success: true, 
          demoId: 'demo-123',
          status: 'running'
        }
      }).as('startDemo')

      cy.runDemo()
      cy.wait('@startDemo')

      // Should show demo is running
      cy.getByTestId('demo-status').should('contain', 'Running')
      cy.getByTestId('demo-progress').should('be.visible')
    })

    it('should show loading state when starting demo', () => {
      // Mock delayed response
      cy.intercept('POST', '**/api/demo/start', (req) => {
        req.reply((res) => {
          setTimeout(() => {
            res.send({
              statusCode: 200,
              body: { success: true, demoId: 'demo-123' }
            })
          }, 2000)
        })
      }).as('startDemoDelayed')

      cy.getByTestId('start-demo-button').click()

      // Should show loading state
      cy.getByTestId('demo-loading').should('be.visible')
      cy.getByTestId('start-demo-button').should('be.disabled')

      cy.wait('@startDemoDelayed')
    })

    it('should handle demo start errors', () => {
      // Mock demo start error
      cy.intercept('POST', '**/api/demo/start', {
        statusCode: 500,
        body: { error: 'Demo service unavailable' }
      }).as('startDemoError')

      cy.getByTestId('start-demo-button').click()
      cy.wait('@startDemoError')

      // Should show error message
      cy.get('[role="alert"]').should('contain.text', 'unavailable')
      
      // Should re-enable start button
      cy.getByTestId('start-demo-button').should('not.be.disabled')
    })

    it('should prevent multiple demo instances', () => {
      // Mock active demo check
      cy.intercept('GET', '**/api/demo/status', {
        statusCode: 200,
        body: { 
          isRunning: true,
          demoId: 'existing-demo',
          status: 'running'
        }
      }).as('checkDemoStatus')

      cy.reload()
      cy.wait('@checkDemoStatus')

      // Should show demo already running
      cy.getByTestId('demo-already-running').should('be.visible')
      cy.getByTestId('start-demo-button').should('be.disabled')
    })
  })

  describe('Demo Progress and Metrics', () => {
    beforeEach(() => {
      // Start demo for each test
      cy.intercept('POST', '**/api/demo/start', {
        statusCode: 200,
        body: { success: true, demoId: 'demo-123' }
      }).as('startDemo')

      cy.runDemo()
      cy.wait('@startDemo')
    })

    it('should display real-time demo metrics', () => {
      // Mock metrics updates
      cy.intercept('GET', '**/api/demo/demo-123/metrics', {
        statusCode: 200,
        body: demoData.demoMetrics
      }).as('getDemoMetrics')

      cy.wait('@getDemoMetrics')

      // Should show all key metrics
      cy.getByTestId('demo-total-emails').should('contain', '1,250')
      cy.getByTestId('demo-delivery-rate').should('contain', '92.5%')
      cy.getByTestId('demo-open-rate').should('contain', '18.3%')
      cy.getByTestId('demo-click-rate').should('contain', '2.7%')
      cy.getByTestId('demo-spam-rate').should('contain', '1.2%')
      cy.getByTestId('demo-warmup-score').should('contain', '78')
    })

    it('should show demo progress timeline', () => {
      // Mock timeline data
      cy.intercept('GET', '**/api/demo/demo-123/timeline', {
        statusCode: 200,
        body: { timeline: demoData.demoTimeline }
      }).as('getDemoTimeline')

      cy.wait('@getDemoTimeline')

      // Should show timeline chart
      cy.getByTestId('demo-timeline-chart').should('be.visible')
      
      // Should show progression over days
      demoData.demoTimeline.forEach((point: any) => {
        cy.getByTestId(`timeline-day-${point.day}`).should('be.visible')
      })
    })

    it('should update metrics in real-time', () => {
      // Mock initial metrics
      cy.intercept('GET', '**/api/demo/demo-123/metrics', {
        statusCode: 200,
        body: demoData.demoMetrics
      }).as('getInitialMetrics')

      cy.wait('@getInitialMetrics')

      // Mock updated metrics
      const updatedMetrics = {
        ...demoData.demoMetrics,
        totalEmails: 1500,
        deliveryRate: 93.2,
        warmupScore: 82
      }

      cy.intercept('GET', '**/api/demo/demo-123/metrics', {
        statusCode: 200,
        body: updatedMetrics
      }).as('getUpdatedMetrics')

      // Trigger metrics refresh (simulate real-time update)
      cy.wait(5000) // Wait for auto-refresh
      cy.wait('@getUpdatedMetrics')

      // Should show updated values
      cy.getByTestId('demo-total-emails').should('contain', '1,500')
      cy.getByTestId('demo-delivery-rate').should('contain', '93.2%')
      cy.getByTestId('demo-warmup-score').should('contain', '82')
    })

    it('should display email activity feed', () => {
      // Mock email activity
      cy.intercept('GET', '**/api/demo/demo-123/activity', {
        statusCode: 200,
        body: {
          activities: [
            {
              timestamp: '2024-01-15T10:30:00Z',
              type: 'email_sent',
              details: 'Email sent to example@domain.com'
            },
            {
              timestamp: '2024-01-15T10:32:00Z',
              type: 'email_delivered',
              details: 'Email delivered successfully'
            },
            {
              timestamp: '2024-01-15T10:35:00Z',
              type: 'email_opened',
              details: 'Email opened by recipient'
            }
          ]
        }
      }).as('getDemoActivity')

      cy.wait('@getDemoActivity')

      // Should show activity feed
      cy.getByTestId('demo-activity-feed').should('be.visible')
      cy.getByTestId('activity-email_sent').should('contain', 'Email sent')
      cy.getByTestId('activity-email_delivered').should('contain', 'delivered')
      cy.getByTestId('activity-email_opened').should('contain', 'opened')
    })

    it('should show demo performance charts', () => {
      // Mock chart data
      cy.intercept('GET', '**/api/demo/demo-123/charts', {
        statusCode: 200,
        body: {
          deliveryRateChart: demoData.demoTimeline.map((p: any) => ({
            day: p.day,
            rate: p.deliveryRate
          })),
          warmupScoreChart: demoData.demoTimeline.map((p: any) => ({
            day: p.day,
            score: p.warmupScore
          }))
        }
      }).as('getDemoCharts')

      cy.wait('@getDemoCharts')

      // Should display charts
      cy.getByTestId('demo-delivery-chart').should('be.visible')
      cy.getByTestId('demo-warmup-chart').should('be.visible')
    })
  })

  describe('Demo Controls', () => {
    beforeEach(() => {
      cy.intercept('POST', '**/api/demo/start', {
        statusCode: 200,
        body: { success: true, demoId: 'demo-123' }
      }).as('startDemo')

      cy.runDemo()
      cy.wait('@startDemo')
    })

    it('should pause demo simulation', () => {
      // Mock pause API
      cy.intercept('POST', '**/api/demo/demo-123/pause', {
        statusCode: 200,
        body: { success: true, status: 'paused' }
      }).as('pauseDemo')

      cy.getByTestId('pause-demo-button').click()
      cy.wait('@pauseDemo')

      // Should show paused state
      cy.getByTestId('demo-status').should('contain', 'Paused')
      cy.getByTestId('resume-demo-button').should('be.visible')
    })

    it('should resume paused demo', () => {
      // First pause the demo
      cy.intercept('POST', '**/api/demo/demo-123/pause', {
        statusCode: 200,
        body: { success: true, status: 'paused' }
      }).as('pauseDemo')

      cy.getByTestId('pause-demo-button').click()
      cy.wait('@pauseDemo')

      // Mock resume API
      cy.intercept('POST', '**/api/demo/demo-123/resume', {
        statusCode: 200,
        body: { success: true, status: 'running' }
      }).as('resumeDemo')

      cy.getByTestId('resume-demo-button').click()
      cy.wait('@resumeDemo')

      // Should show running state
      cy.getByTestId('demo-status').should('contain', 'Running')
      cy.getByTestId('pause-demo-button').should('be.visible')
    })

    it('should stop demo simulation', () => {
      // Mock stop API
      cy.intercept('POST', '**/api/demo/demo-123/stop', {
        statusCode: 200,
        body: { success: true, status: 'stopped' }
      }).as('stopDemo')

      cy.getByTestId('stop-demo-button').click()
      
      // Should show confirmation dialog
      cy.getByTestId('confirm-stop-dialog').should('be.visible')
      cy.getByTestId('confirm-stop-button').click()
      
      cy.wait('@stopDemo')

      // Should return to initial state
      cy.getByTestId('start-demo-button').should('be.visible')
      cy.getByTestId('demo-status').should('not.exist')
    })

    it('should speed up demo simulation', () => {
      // Mock speed change API
      cy.intercept('POST', '**/api/demo/demo-123/speed', {
        statusCode: 200,
        body: { success: true, speed: '2x' }
      }).as('changeDemoSpeed')

      cy.getByTestId('demo-speed-control').select('2x')
      cy.wait('@changeDemoSpeed')

      // Should show updated speed
      cy.getByTestId('demo-current-speed').should('contain', '2x')
    })

    it('should reset demo to beginning', () => {
      // Mock reset API
      cy.intercept('POST', '**/api/demo/demo-123/reset', {
        statusCode: 200,
        body: { success: true }
      }).as('resetDemo')

      cy.getByTestId('reset-demo-button').click()
      
      // Should show confirmation
      cy.getByTestId('confirm-reset-dialog').should('be.visible')
      cy.getByTestId('confirm-reset-button').click()
      
      cy.wait('@resetDemo')

      // Should reset all metrics
      cy.getByTestId('demo-total-emails').should('contain', '0')
    })
  })

  describe('Demo Completion', () => {
    it('should handle demo completion', () => {
      // Mock demo completion
      cy.intercept('GET', '**/api/demo/demo-123/status', {
        statusCode: 200,
        body: { 
          status: 'completed',
          completedAt: '2024-01-15T11:00:00Z'
        }
      }).as('getDemoStatus')

      cy.visit('/dashboard/demo')
      cy.wait('@getDemoStatus')

      // Should show completion state
      cy.getByTestId('demo-completed').should('be.visible')
      cy.getByTestId('demo-completion-message').should('contain', 'completed')
      cy.getByTestId('start-new-demo-button').should('be.visible')
    })

    it('should show demo summary on completion', () => {
      // Mock completed demo data
      cy.intercept('GET', '**/api/demo/demo-123/summary', {
        statusCode: 200,
        body: {
          ...demoData.demoMetrics,
          duration: '30 minutes',
          emailsSent: 1500,
          finalWarmupScore: 88
        }
      }).as('getDemoSummary')

      cy.visit('/dashboard/demo')
      cy.wait('@getDemoSummary')

      // Should show summary metrics
      cy.getByTestId('demo-summary').should('be.visible')
      cy.getByTestId('demo-final-score').should('contain', '88')
      cy.getByTestId('demo-duration').should('contain', '30 minutes')
    })

    it('should export demo results', () => {
      cy.intercept('GET', '**/api/demo/demo-123/status', {
        statusCode: 200,
        body: { status: 'completed' }
      }).as('getDemoStatus')

      cy.visit('/dashboard/demo')
      cy.wait('@getDemoStatus')

      // Mock export API
      cy.intercept('GET', '**/api/demo/demo-123/export', {
        statusCode: 200,
        headers: {
          'content-disposition': 'attachment; filename=demo-results.pdf'
        },
        body: 'mock-pdf-content'
      }).as('exportDemo')

      cy.getByTestId('export-demo-button').click()
      cy.wait('@exportDemo')

      // Should trigger download
      cy.readFile('cypress/downloads/demo-results.pdf', { timeout: 10000 })
        .should('exist')
    })

    it('should start new demo after completion', () => {
      cy.intercept('GET', '**/api/demo/demo-123/status', {
        statusCode: 200,
        body: { status: 'completed' }
      }).as('getDemoStatus')

      cy.visit('/dashboard/demo')
      cy.wait('@getDemoStatus')

      // Mock new demo start
      cy.intercept('POST', '**/api/demo/start', {
        statusCode: 200,
        body: { success: true, demoId: 'demo-456' }
      }).as('startNewDemo')

      cy.getByTestId('start-new-demo-button').click()
      cy.wait('@startNewDemo')

      // Should start fresh demo
      cy.getByTestId('demo-status').should('contain', 'Running')
    })
  })

  describe('Demo Error Handling', () => {
    it('should handle demo service errors', () => {
      // Mock service error
      cy.intercept('GET', '**/api/demo/demo-123/metrics', {
        statusCode: 500,
        body: { error: 'Demo service error' }
      }).as('getDemoError')

      cy.runDemo()
      cy.wait('@getDemoError')

      // Should show error state
      cy.getByTestId('demo-error').should('be.visible')
      cy.getByTestId('demo-error-message').should('contain', 'service error')
      cy.getByTestId('retry-demo-button').should('be.visible')
    })

    it('should retry failed demo operations', () => {
      // Mock initial error then success
      cy.intercept('GET', '**/api/demo/demo-123/metrics', {
        statusCode: 500,
        body: { error: 'Temporary error' }
      }).as('getDemoErrorFirst')

      cy.runDemo()
      cy.wait('@getDemoErrorFirst')

      // Mock successful retry
      cy.intercept('GET', '**/api/demo/demo-123/metrics', {
        statusCode: 200,
        body: demoData.demoMetrics
      }).as('getDemoRetrySuccess')

      cy.getByTestId('retry-demo-button').click()
      cy.wait('@getDemoRetrySuccess')

      // Should show metrics
      cy.getByTestId('demo-metrics').should('be.visible')
    })

    it('should handle demo timeout', () => {
      // Mock timeout scenario
      cy.intercept('GET', '**/api/demo/demo-123/status', {
        statusCode: 200,
        body: { 
          status: 'error',
          error: 'Demo timed out'
        }
      }).as('getDemoTimeout')

      cy.visit('/dashboard/demo')
      cy.wait('@getDemoTimeout')

      // Should show timeout error
      cy.getByTestId('demo-timeout-error').should('be.visible')
      cy.getByTestId('start-new-demo-button').should('be.visible')
    })
  })
})
