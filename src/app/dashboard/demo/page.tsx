'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DemoService } from '@/services/demoService'
import { 
  DemoSimulationState, 
  DemoSettings, 
  DemoEmail,
  DemoReputationFactor,
  DemoInsight,
  DemoChartData
} from '@/types/demo'
import { 
  Play, 
  Pause, 
  RefreshCw,
  Mail,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentTenant, loading: tenantLoading } = useTenant()
  const router = useRouter()
  
  const [simulationState, setSimulationState] = useState<DemoSimulationState>(
    DemoService.initializeDemo()
  )
  const [demoSettings, setDemoSettings] = useState<DemoSettings>(
    DemoService['DEFAULT_SETTINGS']
  )
  const [recentEmails, setRecentEmails] = useState<DemoEmail[]>([])
  const [reputationFactors, setReputationFactors] = useState<DemoReputationFactor[]>([])
  const [insights, setInsights] = useState<DemoInsight[]>([])
  const [chartData, setChartData] = useState<DemoChartData | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const simulationInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const startSimulation = useCallback(async () => {
    const newState = await DemoService.startDemo(simulationState)
    setSimulationState(newState)
    
    // Start the simulation loop
    const updateDelay = DemoService.getUpdateDelay(demoSettings.simulationSpeed)
    
    simulationInterval.current = setInterval(() => {
      setSimulationState(prevState => {
        if (!prevState.isRunning || prevState.currentDay >= prevState.totalDays) {
          if (simulationInterval.current) {
            clearInterval(simulationInterval.current)
            simulationInterval.current = null
          }
          return { ...prevState, isRunning: false }
        }

        const nextDay = prevState.currentDay + 1
        const dayMetrics = DemoService.simulateDay(nextDay, demoSettings)
        const newMetrics = [...prevState.metrics, dayMetrics]
        
        // Generate emails for this day
        const dayEmails = DemoService.generateDemoEmails(nextDay, dayMetrics.volume)
        setRecentEmails(prev => [...dayEmails, ...prev].slice(0, 50))
        
        // Update insights and reputation factors
        setReputationFactors(DemoService.getReputationFactors(newMetrics))
        setInsights(DemoService.generateInsights(newMetrics))
        setChartData(DemoService.generateChartData(newMetrics, demoSettings))
        
        const progress = (nextDay / prevState.totalDays) * 100

        return {
          ...prevState,
          currentDay: nextDay,
          metrics: newMetrics,
          progress,
          account: {
            ...prevState.account,
            reputation: dayMetrics.reputation,
            deliveryRate: dayMetrics.deliveryRate,
            status: nextDay >= prevState.totalDays ? 'complete' : 'warming'
          }
        }
      })
    }, updateDelay)
  }, [simulationState, demoSettings])

  const pauseSimulation = useCallback(async () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current)
      simulationInterval.current = null
    }
    
    const newState = await DemoService.stopDemo(simulationState)
    setSimulationState(newState)
  }, [simulationState])

  const resetSimulation = useCallback(async () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current)
      simulationInterval.current = null
    }
    
    const newState = await DemoService.resetDemo()
    setSimulationState(newState)
    setRecentEmails([])
    setReputationFactors([])
    setInsights([])
    setChartData(null)
  }, [])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info': return <Info className="h-5 w-5 text-blue-500" />
      default: return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'sent': return 'text-blue-600 bg-blue-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current)
      }
    }
  }, [])

  if (authLoading || tenantLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user || !currentTenant) {
    return null
  }

  const progressText = DemoService.getProgressText(simulationState)
  const latestMetrics = simulationState.metrics[simulationState.metrics.length - 1]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Warmup Demo</h1>
            <p className="text-gray-600">
              Experience the email warmup process with real-time simulation
            </p>
          </div>
          
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>

        {/* Demo Account Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Demo Account</h2>
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{simulationState.account.email}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{simulationState.account.reputation}</div>
              <div className="text-sm text-gray-600">Sender Reputation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{simulationState.account.deliveryRate}%</div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 capitalize">{simulationState.account.status}</div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Simulation Control</h2>
            <div className="text-sm text-gray-600">{progressText}</div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${simulationState.progress}%` }}
            ></div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!simulationState.isRunning ? (
              <button
                onClick={startSimulation}
                disabled={simulationState.currentDay >= simulationState.totalDays}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-2" />
                {simulationState.currentDay === 0 ? 'Start Demo' : 'Resume'}
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </button>
            )}
            
            <button
              onClick={resetSimulation}
              disabled={simulationState.isRunning}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </button>
            
            <div className="text-sm text-gray-600">
              Day {simulationState.currentDay} of {simulationState.totalDays}
            </div>
          </div>
        </div>

        {/* Current Metrics */}
        {latestMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Daily Volume</p>
                  <p className="text-2xl font-bold text-gray-900">{latestMetrics.volume}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{latestMetrics.deliveryRate}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reputation</p>
                  <p className="text-2xl font-bold text-gray-900">{latestMetrics.reputation}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">{latestMetrics.emailsDelivered}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Volume Progression</h3>
              <div className="h-64 flex items-end space-x-1">
                {chartData.volumeChart.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-100 relative">
                      <div 
                        className="w-full bg-blue-600" 
                        style={{ height: `${(data.volume / Math.max(...chartData.volumeChart.map(d => d.volume))) * 200}px` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{data.day}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Rate</h3>
              <div className="h-64 flex items-end space-x-1">
                {chartData.deliveryChart.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-green-100 relative">
                      <div 
                        className="w-full bg-green-600" 
                        style={{ height: `${(data.rate / 100) * 200}px` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{data.day}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Insights and Reputation Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Insights */}
          {insights.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Insights</h3>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600">{insight.message}</p>
                      {insight.recommendation && (
                        <p className="text-sm text-blue-600 mt-1">{insight.recommendation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reputation Factors */}
          {reputationFactors.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reputation Factors</h3>
              <div className="space-y-4">
                {reputationFactors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{factor.name}</div>
                      <div className="text-xs text-gray-500">{factor.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{factor.value}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        factor.impact === 'positive' ? 'bg-green-500' :
                        factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Emails */}
        {recentEmails.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Email Activity</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentEmails.slice(0, 10).map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {email.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {email.recipient}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEmailStatusColor(email.status)}`}>
                          {email.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {email.day}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Demo Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Simulation Speed
                    </label>
                    <select
                      value={demoSettings.simulationSpeed}
                      onChange={(e) => setDemoSettings({ 
                        ...demoSettings, 
                        simulationSpeed: e.target.value as DemoSettings['simulationSpeed']
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="slow">Slow (4s per day)</option>
                      <option value="normal">Normal (2s per day)</option>
                      <option value="fast">Fast (1s per day)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Days: {demoSettings.totalDays}
                    </label>
                    <input
                      type="range"
                      min="14"
                      max="60"
                      value={demoSettings.totalDays}
                      onChange={(e) => setDemoSettings({ 
                        ...demoSettings, 
                        totalDays: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Volume: {demoSettings.startingVolume}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={demoSettings.startingVolume}
                      onChange={(e) => setDemoSettings({ 
                        ...demoSettings, 
                        startingVolume: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Volume: {demoSettings.targetVolume}
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={demoSettings.targetVolume}
                      onChange={(e) => setDemoSettings({ 
                        ...demoSettings, 
                        targetVolume: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
