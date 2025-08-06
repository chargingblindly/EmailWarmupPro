'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { AuthForm } from '@/components/auth/AuthForm'
import { Mail, TrendingUp, Shield, Users } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Email Warmup Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional email warmup service to improve your email deliverability. 
            Gradually build your sender reputation with our automated warmup process.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">MS365 Integration</h3>
            <p className="text-gray-600">Connect your Microsoft 365 email accounts seamlessly</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gradual Warmup</h3>
            <p className="text-gray-600">Smart algorithm to gradually increase email volume</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Reputation Building</h3>
            <p className="text-gray-600">Build and maintain a strong sender reputation</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Team Management</h3>
            <p className="text-gray-600">Multi-tenant architecture with team collaboration</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="max-w-md mx-auto">
          <AuthForm />
        </div>
      </div>
    </div>
  )
}
