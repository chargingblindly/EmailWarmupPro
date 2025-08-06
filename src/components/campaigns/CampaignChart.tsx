'use client'

import { useState } from 'react'
import { CampaignAnalytics } from '@/types/campaigns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { BarChart3, TrendingUp, Activity } from 'lucide-react'

interface CampaignChartProps {
  analytics: CampaignAnalytics
}

type ChartType = 'line' | 'bar' | 'area'

export function CampaignChart({ analytics }: CampaignChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')

  const chartData = analytics.dailyStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    sent: stat.emailsSent,
    delivered: stat.emailsDelivered,
    failed: stat.emailsFailed,
    deliveryRate: stat.deliveryRate,
    reputationScore: stat.reputationScore
  }))

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{
      color: string
      name: string
      value: number
      dataKey: string
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'deliveryRate' || entry.dataKey === 'reputationScore' ? '%' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
            <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
            <Bar dataKey="failed" fill="#ef4444" name="Failed" />
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="sent" 
              stackId="1" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.6}
              name="Sent"
            />
            <Area 
              type="monotone" 
              dataKey="delivered" 
              stackId="1" 
              stroke="#10b981" 
              fill="#10b981" 
              fillOpacity={0.6}
              name="Delivered"
            />
          </AreaChart>
        )
      
      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="sent" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              name="Sent"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="delivered" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              name="Delivered"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="deliveryRate" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              name="Delivery Rate (%)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="reputationScore" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              name="Reputation Score (%)"
            />
          </LineChart>
        )
    }
  }

  const chartTypeOptions = [
    { type: 'line' as ChartType, label: 'Line Chart', icon: TrendingUp },
    { type: 'bar' as ChartType, label: 'Bar Chart', icon: BarChart3 },
    { type: 'area' as ChartType, label: 'Area Chart', icon: Activity }
  ]

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {chartTypeOptions.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.type}
                onClick={() => setChartType(option.type)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartType === option.type
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Sent: {analytics.sentEmails}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Delivered: {analytics.deliveredEmails}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Rate: {analytics.deliveryRate}%</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Legend/Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-700">Emails Sent</span>
          </div>
          <div className="text-blue-600">
            Total volume sent over time
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-700">Delivered</span>
          </div>
          <div className="text-green-600">
            Successfully delivered emails
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="font-medium text-purple-700">Delivery Rate</span>
          </div>
          <div className="text-purple-600">
            Percentage successfully delivered
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="font-medium text-yellow-700">Reputation</span>
          </div>
          <div className="text-yellow-600">
            Calculated sender reputation
          </div>
        </div>
      </div>
    </div>
  )
}
