'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Mail, 
  Settings, 
  Users, 
  TrendingUp,
  Play
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Email Accounts', href: '/dashboard/accounts', icon: Mail },
  { name: 'Warmup Campaigns', href: '/dashboard/campaigns', icon: TrendingUp },
  { name: 'Demo Simulation', href: '/dashboard/demo', icon: Play },
  { name: 'Team Members', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-gray-50 min-h-screen border-r border-gray-200">
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
