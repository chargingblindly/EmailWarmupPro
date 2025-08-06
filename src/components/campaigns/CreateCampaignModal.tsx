'use client'

import { useState, useEffect } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { supabase } from '@/lib/supabase'
import { CampaignService } from '@/services/campaignService'
import { WarmupCampaignInsert, DEFAULT_CAMPAIGN_SETTINGS, CampaignSettings } from '@/types/campaigns'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Mail, 
  Settings, 
  BarChart3,
  AlertCircle
} from 'lucide-react'

interface CreateCampaignModalProps {
  onClose: () => void
  onCampaignCreated: () => void
}

interface EmailAccount {
  id: string
  email: string
}

interface FormData {
  name: string
  email_account_id: string
  daily_volume: number
  ramp_up_days: number
  settings: CampaignSettings
}

const WIZARD_STEPS = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Campaign name and email account',
    icon: Mail
  },
  {
    id: 'settings',
    title: 'Campaign Settings',
    description: 'Volume, timing, and preferences',
    icon: Settings
  },
  {
    id: 'review',
    title: 'Review & Create',
    description: 'Review your campaign settings',
    icon: BarChart3
  }
]

export function CreateCampaignModal({ onClose, onCampaignCreated }: CreateCampaignModalProps) {
  const { currentTenant } = useTenant()
  const [currentStep, setCurrentStep] = useState(0)
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email_account_id: '',
    daily_volume: 10,
    ramp_up_days: 30,
    settings: { ...DEFAULT_CAMPAIGN_SETTINGS }
  })

  useEffect(() => {
    if (currentTenant?.id) {
      loadEmailAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTenant?.id])

  const loadEmailAccounts = async () => {
    if (!currentTenant?.id) return

    try {
      const { data, error } = await supabase
        .from('email_accounts')
        .select('id, email')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)

      if (error) throw error
      setEmailAccounts(data || [])
    } catch (err) {
      console.error('Error loading email accounts:', err)
      setError('Failed to load email accounts')
    }
  }

  const handleSubmit = async () => {
    if (!currentTenant?.id) return

    try {
      setLoading(true)
      setError(null)

      const campaignData: WarmupCampaignInsert = {
        tenant_id: currentTenant.id,
        name: formData.name,
        email_account_id: formData.email_account_id,
        daily_volume: formData.daily_volume,
        ramp_up_days: formData.ramp_up_days,
        settings: formData.settings,
        status: 'draft'
      }

      await CampaignService.createCampaign(campaignData)
      onCampaignCreated()
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError('Failed to create campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() && formData.email_account_id
      case 1:
        return formData.daily_volume > 0 && formData.ramp_up_days > 0
      case 2:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateSettings = (updates: Partial<CampaignSettings>) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }))
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        const Icon = step.icon

        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              isCompleted 
                ? 'bg-green-600 border-green-600 text-white' 
                : isActive 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 text-gray-500'
            }`}>
              {isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div className={`w-16 h-0.5 ${
                isCompleted ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )

  const renderBasicStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Campaign Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData({ name: e.target.value })}
              placeholder="Enter campaign name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Account *
            </label>
            {emailAccounts.length > 0 ? (
              <select
                value={formData.email_account_id}
                onChange={(e) => updateFormData({ email_account_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an email account</option>
                {emailAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.email}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    No email accounts found. Please add an email account first.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettingsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Campaign Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Daily Volume *
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.daily_volume}
              onChange={(e) => updateFormData({ daily_volume: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Maximum emails to send per day at full ramp-up
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ramp-up Period (days) *
            </label>
            <input
              type="number"
              min="7"
              max="90"
              value={formData.ramp_up_days}
              onChange={(e) => updateFormData({ ramp_up_days: parseInt(e.target.value) || 7 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Time to gradually reach target volume
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Hour
            </label>
            <select
              value={formData.settings.startHour}
              onChange={(e) => updateSettings({ startHour: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Hour
            </label>
            <select
              value={formData.settings.endHour}
              onChange={(e) => updateSettings({ endHour: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.enableWeekends}
              onChange={(e) => updateSettings({ enableWeekends: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Send emails on weekends
            </span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Review Campaign Settings
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-700">Campaign Name:</span>
              <p className="text-sm text-gray-900">{formData.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Email Account:</span>
              <p className="text-sm text-gray-900">
                {emailAccounts.find(a => a.id === formData.email_account_id)?.email}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Daily Volume:</span>
              <p className="text-sm text-gray-900">{formData.daily_volume} emails</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Ramp-up Period:</span>
              <p className="text-sm text-gray-900">{formData.ramp_up_days} days</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Sending Hours:</span>
              <p className="text-sm text-gray-900">
                {formData.settings.startHour.toString().padStart(2, '0')}:00 - {formData.settings.endHour.toString().padStart(2, '0')}:00
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Weekends:</span>
              <p className="text-sm text-gray-900">
                {formData.settings.enableWeekends ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Campaign will be created in draft status</li>
            <li>• You can start the campaign when ready</li>
            <li>• Emails will begin sending gradually according to your ramp-up schedule</li>
            <li>• Progress and analytics will be available in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  )

  return (
    <Modal isOpen={true} size="lg" onClose={onClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Warmup Campaign
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 0 && renderBasicStep()}
          {currentStep === 1 && renderSettingsStep()}
          {currentStep === 2 && renderReviewStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-3">
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <LoadingSpinner size="sm" />}
                <span>Create Campaign</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
