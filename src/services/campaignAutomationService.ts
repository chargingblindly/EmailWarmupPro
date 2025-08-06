import { CampaignService } from './campaignService'

export class CampaignAutomationService {
  private static interval: NodeJS.Timeout | null = null
  private static isRunning = false

  /**
   * Start the campaign automation service
   * This would normally run on a server, but for demo purposes we'll run it client-side
   */
  static start(): void {
    if (this.isRunning) {
      console.log('Campaign automation already running')
      return
    }

    console.log('Starting campaign automation service...')
    this.isRunning = true

    // Process campaigns every 30 seconds for demo purposes
    // In production, this would run on a server with proper scheduling
    this.interval = setInterval(async () => {
      try {
        await this.processAllCampaigns()
      } catch (error) {
        console.error('Error processing campaigns:', error)
      }
    }, 30000) // 30 seconds
  }

  /**
   * Stop the campaign automation service
   */
  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    this.isRunning = false
    console.log('Campaign automation service stopped')
  }

  /**
   * Process all active campaigns
   */
  private static async processAllCampaigns(): Promise<void> {
    try {
      await CampaignService.processActiveCampaigns()
      console.log('Processed active campaigns')
    } catch (error) {
      console.error('Error processing active campaigns:', error)
    }
  }

  /**
   * Check if the service is running
   */
  static isServiceRunning(): boolean {
    return this.isRunning
  }

  /**
   * Manual trigger for processing campaigns (for testing)
   */
  static async triggerProcessing(): Promise<void> {
    console.log('Manually triggering campaign processing...')
    await this.processAllCampaigns()
  }
}

// Auto-start the service when the module is loaded (for demo purposes)
// In production, this would be handled by the server
if (typeof window !== 'undefined') {
  // Only run in browser environment
  CampaignAutomationService.start()
  
  // Stop the service when the page is unloaded
  window.addEventListener('beforeunload', () => {
    CampaignAutomationService.stop()
  })
}
