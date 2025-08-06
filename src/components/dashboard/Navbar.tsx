'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { LogOut, ChevronDown, Settings, Building2, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export const Navbar = () => {
  const { user, signOut } = useAuth()
  const { currentTenant, tenants, switchTenant } = useTenant()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  const tenantDropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tenantDropdownRef.current && !tenantDropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Email Warmup Pro</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Tenant Selector */}
            <div className="relative" ref={tenantDropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none border border-gray-300 rounded-md"
              >
                <Building2 className="h-4 w-4" />
                <span>{currentTenant?.name || 'Select Organization'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    {tenants.map(tenant => (
                      <button
                        key={tenant.id}
                        onClick={() => {
                          switchTenant(tenant.id)
                          setIsDropdownOpen(false)
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          currentTenant?.id === tenant.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{tenant.name}</span>
                          <span className="text-xs text-gray-500 capitalize">({tenant.role})</span>
                        </div>
                      </button>
                    ))}
                    
                    {tenants.length > 0 && (
                      <div className="border-t border-gray-100 my-1"></div>
                    )}
                    
                    <button
                      onClick={() => {
                        router.push('/dashboard/onboarding')
                        setIsDropdownOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create New Organization</span>
                      </div>
                    </button>
                    
                    {currentTenant && (
                      <button
                        onClick={() => {
                          router.push('/dashboard/settings')
                          setIsDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Organization Settings</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <span>{user?.email}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        signOut()
                        setIsUserMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
