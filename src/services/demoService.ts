import { 
  DemoAccount, 
  DemoMetrics, 
  DemoSimulationState, 
  DemoSettings, 
  DemoEmail,
  DemoReputationFactor,
  DemoInsight,
  DemoChartData
} from '@/types/demo'

export class DemoService {
  private static readonly DEMO_ACCOUNT: DemoAccount = {
    id: 'demo-account-1',
    email: 'demo@warmuppro.com',
    provider: 'ms365',
    reputation: 65,
    deliveryRate: 78,
    status: 'warming'
  }

  private static readonly DEFAULT_SETTINGS: DemoSettings = {
    totalDays: 30,
    startingVolume: 5,
    targetVolume: 50,
    simulationSpeed: 'normal',
    includeWeekends: true
  }

  /**
   * Initialize demo simulation
   */
  static initializeDemo(settings?: Partial<DemoSettings>): DemoSimulationState {
    const demoSettings = { ...this.DEFAULT_SETTINGS, ...settings }
    
    return {
      isRunning: false,
      currentDay: 0,
      totalDays: demoSettings.totalDays,
      startTime: null,
      account: { ...this.DEMO_ACCOUNT },
      metrics: [],
      progress: 0
    }
  }

  /**
   * Start demo simulation
   */
  static async startDemo(state: DemoSimulationState): Promise<DemoSimulationState> {
    return {
      ...state,
      isRunning: true,
      startTime: new Date().toISOString(),
      currentDay: 1
    }
  }

  /**
   * Stop demo simulation
   */
  static async stopDemo(state: DemoSimulationState): Promise<DemoSimulationState> {
    return {
      ...state,
      isRunning: false
    }
  }

  /**
   * Reset demo simulation
   */
  static async resetDemo(): Promise<DemoSimulationState> {
    return this.initializeDemo()
  }

  /**
   * Simulate a day of warmup activity
   */
  static simulateDay(
    day: number, 
    settings: DemoSettings = this.DEFAULT_SETTINGS
  ): DemoMetrics {
    // Calculate volume progression
    const volumeProgress = Math.min(day / settings.totalDays, 1)
    const currentVolume = Math.round(
      settings.startingVolume + 
      (settings.targetVolume - settings.startingVolume) * 
      Math.pow(volumeProgress, 0.7) // Gradual ramp-up curve
    )

    // Simulate delivery rate improvement
    const baseDeliveryRate = 65
    const maxDeliveryRate = 95
    const deliveryProgress = Math.min((day - 1) / (settings.totalDays * 0.8), 1)
    const deliveryRate = Math.round(
      baseDeliveryRate + 
      (maxDeliveryRate - baseDeliveryRate) * 
      Math.pow(deliveryProgress, 0.5)
    )

    // Calculate emails delivered with some randomness
    const deliveredEmails = Math.round(
      currentVolume * (deliveryRate / 100) * (0.9 + Math.random() * 0.2)
    )

    // Calculate reputation score
    const baseReputation = 55
    const maxReputation = 92
    const reputationProgress = Math.min((day - 1) / settings.totalDays, 1)
    const reputation = Math.round(
      baseReputation + 
      (maxReputation - baseReputation) * 
      Math.pow(reputationProgress, 0.6)
    )

    return {
      day,
      emailsSent: currentVolume,
      emailsDelivered: deliveredEmails,
      deliveryRate,
      reputation,
      volume: currentVolume,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Generate demo emails for a specific day
   */
  static generateDemoEmails(day: number, volume: number): DemoEmail[] {
    const emails: DemoEmail[] = []
    const subjects = [
      'Welcome to our newsletter',
      'Important account update',
      'Monthly report is ready',
      'New features available',
      'Security notification',
      'Thank you for your business',
      'Scheduled maintenance notice',
      'Your invoice is ready',
      'Special offer inside',
      'Weekly digest'
    ]

    const domains = [
      'example.com',
      'testdomain.org',
      'samplesite.net',
      'democorp.com',
      'businessmail.io'
    ]

    for (let i = 0; i < volume; i++) {
      const emailId = `${day}-${i + 1}`
      const subject = subjects[Math.floor(Math.random() * subjects.length)]
      const domain = domains[Math.floor(Math.random() * domains.length)]
      const recipient = `user${i + 1}@${domain}`
      
      // Simulate email status progression
      let status: DemoEmail['status'] = 'sent'
      const random = Math.random()
      
      if (random < 0.05) {
        status = 'failed'
      } else if (random < 0.15) {
        status = 'pending'
      } else if (random < 0.85) {
        status = 'delivered'
      }

      emails.push({
        id: emailId,
        subject,
        recipient,
        status,
        sentAt: status !== 'pending' ? new Date().toISOString() : undefined,
        deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
        day
      })
    }

    return emails
  }

  /**
   * Get reputation factors for current state
   */
  static getReputationFactors(metrics: DemoMetrics[]): DemoReputationFactor[] {
    const latestMetrics = metrics[metrics.length - 1]
    if (!latestMetrics) return []

    return [
      {
        name: 'Send Volume',
        value: latestMetrics.volume,
        impact: latestMetrics.volume > 40 ? 'negative' : 'positive',
        description: 'Daily email volume affects sender reputation'
      },
      {
        name: 'Delivery Rate',
        value: latestMetrics.deliveryRate,
        impact: latestMetrics.deliveryRate > 85 ? 'positive' : 'negative',
        description: 'High delivery rates improve sender reputation'
      },
      {
        name: 'Warmup Progress',
        value: Math.round((latestMetrics.day / 30) * 100),
        impact: latestMetrics.day > 15 ? 'positive' : 'neutral',
        description: 'Gradual warmup period builds trust with ISPs'
      },
      {
        name: 'Consistency',
        value: 85,
        impact: 'positive',
        description: 'Consistent sending patterns improve reputation'
      }
    ]
  }

  /**
   * Generate insights based on current metrics
   */
  static generateInsights(metrics: DemoMetrics[]): DemoInsight[] {
    const insights: DemoInsight[] = []
    const latestMetrics = metrics[metrics.length - 1]
    
    if (!latestMetrics) return insights

    if (latestMetrics.deliveryRate > 90) {
      insights.push({
        type: 'success',
        title: 'Excellent Delivery Rate',
        message: `Your delivery rate of ${latestMetrics.deliveryRate}% is excellent!`,
        recommendation: 'Continue current sending patterns to maintain this performance.'
      })
    } else if (latestMetrics.deliveryRate < 75) {
      insights.push({
        type: 'warning',
        title: 'Delivery Rate Needs Improvement',
        message: `Your delivery rate of ${latestMetrics.deliveryRate}% could be better.`,
        recommendation: 'Consider reducing send volume temporarily to improve reputation.'
      })
    }

    if (latestMetrics.day > 20 && latestMetrics.reputation > 85) {
      insights.push({
        type: 'success',
        title: 'Strong Sender Reputation',
        message: 'Your sender reputation has improved significantly during the warmup process.',
        recommendation: 'You can gradually increase your sending volume.'
      })
    }

    if (latestMetrics.volume > latestMetrics.emailsDelivered * 1.3) {
      insights.push({
        type: 'warning',
        title: 'High Volume vs Delivery Gap',
        message: 'There&apos;s a significant gap between sent and delivered emails.',
        recommendation: 'Review your content and recipient list quality.'
      })
    }

    return insights
  }

  /**
   * Generate chart data for visualization
   */
  static generateChartData(metrics: DemoMetrics[], settings: DemoSettings): DemoChartData {
    const volumeChart = metrics.map(m => ({
      day: m.day,
      volume: m.volume,
      target: Math.round(
        settings.startingVolume + 
        (settings.targetVolume - settings.startingVolume) * (m.day / settings.totalDays)
      )
    }))

    const deliveryChart = metrics.map(m => ({
      day: m.day,
      rate: m.deliveryRate,
      average: 85 // Industry average
    }))

    const reputationChart = metrics.map(m => ({
      day: m.day,
      score: m.reputation,
      benchmark: 75 // Good reputation benchmark
    }))

    return {
      volumeChart,
      deliveryChart,
      reputationChart
    }
  }

  /**
   * Get speed multiplier for simulation
   */
  static getSpeedMultiplier(speed: DemoSettings['simulationSpeed']): number {
    switch (speed) {
      case 'slow': return 0.5
      case 'normal': return 1
      case 'fast': return 2
      default: return 1
    }
  }

  /**
   * Calculate time delay for simulation updates
   */
  static getUpdateDelay(speed: DemoSettings['simulationSpeed']): number {
    const baseDelay = 2000 // 2 seconds
    return baseDelay / this.getSpeedMultiplier(speed)
  }

  /**
   * Generate progress text based on current state
   */
  static getProgressText(state: DemoSimulationState): string {
    if (!state.isRunning && state.currentDay === 0) {
      return 'Ready to start warmup simulation'
    }
    
    if (!state.isRunning && state.currentDay > 0) {
      return `Simulation paused on day ${state.currentDay}`
    }
    
    if (state.currentDay >= state.totalDays) {
      return 'Warmup simulation completed successfully!'
    }
    
    return `Day ${state.currentDay} of ${state.totalDays} - Warming up...`
  }
}
