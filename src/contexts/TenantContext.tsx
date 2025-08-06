'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
// import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { TenantService, type TenantWithRole, type CreateTenantRequest } from '@/lib/tenant'

interface TenantContextType {
  currentTenant: TenantWithRole | null
  tenants: TenantWithRole[]
  loading: boolean
  needsOnboarding: boolean
  switchTenant: (tenantId: string) => void
  refreshTenants: () => Promise<void>
  createTenant: (data: CreateTenantRequest) => Promise<TenantWithRole>
  updateTenant: (tenantId: string, updates: { name?: string }) => Promise<void>
  deleteTenant: (tenantId: string) => Promise<void>
}

const TenantContext = createContext<TenantContextType>({
  currentTenant: null,
  tenants: [],
  loading: true,
  needsOnboarding: false,
  switchTenant: () => {},
  refreshTenants: async () => {},
  createTenant: async () => { throw new Error('Not implemented') },
  updateTenant: async () => {},
  deleteTenant: async () => {},
})

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

interface TenantProviderProps {
  children: ReactNode
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const { user } = useAuth()
  const [currentTenant, setCurrentTenant] = useState<TenantWithRole | null>(null)
  const [tenants, setTenants] = useState<TenantWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  const fetchTenants = useCallback(async () => {
    if (!user) {
      setTenants([])
      setCurrentTenant(null)
      setNeedsOnboarding(false)
      setLoading(false)
      return
    }

    try {
      const userTenants = await TenantService.getUserTenants(user.id)
      setTenants(userTenants)
      
      // Check if user needs onboarding (no tenants)
      if (userTenants.length === 0) {
        setNeedsOnboarding(true)
        setCurrentTenant(null)
      } else {
        setNeedsOnboarding(false)
        // Set current tenant to first one if none selected
        if (!currentTenant) {
          setCurrentTenant(userTenants[0])
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
      setNeedsOnboarding(true)
    } finally {
      setLoading(false)
    }
  }, [user, currentTenant])

  useEffect(() => {
    fetchTenants()
  }, [user, fetchTenants])

  const switchTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId)
    if (tenant) {
      setCurrentTenant(tenant)
      localStorage.setItem('selectedTenantId', tenantId)
    }
  }

  const refreshTenants = async () => {
    await fetchTenants()
  }

  const createTenant = async (data: CreateTenantRequest): Promise<TenantWithRole> => {
    if (!user) {
      throw new Error('User must be authenticated to create tenant')
    }

    const newTenant = await TenantService.createTenant(data, user.id)
    
    // Refresh tenants list
    await fetchTenants()
    
    // Set the new tenant as current
    setCurrentTenant(newTenant)
    setNeedsOnboarding(false)
    localStorage.setItem('selectedTenantId', newTenant.id)
    
    return newTenant
  }

  const updateTenant = async (tenantId: string, updates: { name?: string }): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update tenant')
    }

    await TenantService.updateTenant(tenantId, user.id, updates)
    
    // Refresh tenants list
    await fetchTenants()
    
    // Update current tenant if it was the one being updated
    if (currentTenant?.id === tenantId) {
      const updatedTenant = tenants.find(t => t.id === tenantId)
      if (updatedTenant) {
        setCurrentTenant(updatedTenant)
      }
    }
  }

  const deleteTenant = async (tenantId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete tenant')
    }

    await TenantService.deleteTenant(tenantId, user.id)
    
    // If we deleted the current tenant, clear it
    if (currentTenant?.id === tenantId) {
      setCurrentTenant(null)
      localStorage.removeItem('selectedTenantId')
    }
    
    // Refresh tenants list
    await fetchTenants()
  }

  // Restore selected tenant from localStorage on mount
  useEffect(() => {
    const savedTenantId = localStorage.getItem('selectedTenantId')
    if (savedTenantId && tenants.length > 0) {
      const savedTenant = tenants.find(t => t.id === savedTenantId)
      if (savedTenant) {
        setCurrentTenant(savedTenant)
      }
    }
  }, [tenants])

  const value = {
    currentTenant,
    tenants,
    loading,
    needsOnboarding,
    switchTenant,
    refreshTenants,
    createTenant,
    updateTenant,
    deleteTenant,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}
