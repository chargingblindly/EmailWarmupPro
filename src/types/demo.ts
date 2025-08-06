// Demo simulation types
export interface DemoAccount {
  id: string
  email: string
  provider: 'ms365'
  reputation: number
  deliveryRate: number
  status: 'warming' | 'active' | 'complete'
}

export interface DemoMetrics {
  day: number
  emailsSent: number
  emailsDelivered: number
  deliveryRate: number
  reputation: number
  volume: number
  timestamp: string
}

export interface DemoSimulationState {
  isRunning: boolean
  currentDay: number
  totalDays: number
  startTime: string | null
  account: DemoAccount
  metrics: DemoMetrics[]
  progress: number
}

export interface DemoSettings {
  totalDays: number
  startingVolume: number
  targetVolume: number
  simulationSpeed: 'slow' | 'normal' | 'fast'
  includeWeekends: boolean
}

export interface DemoEmail {
  id: string
  subject: string
  recipient: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  sentAt?: string
  deliveredAt?: string
  day: number
}

export interface DemoReputationFactor {
  name: string
  value: number
  impact: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface DemoInsight {
  type: 'warning' | 'success' | 'info'
  title: string
  message: string
  recommendation?: string
}

export interface DemoChartData {
  volumeChart: Array<{ day: number; volume: number; target: number }>
  deliveryChart: Array<{ day: number; rate: number; average: number }>
  reputationChart: Array<{ day: number; score: number; benchmark: number }>
}
