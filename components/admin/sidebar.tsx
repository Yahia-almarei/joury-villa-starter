'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/use-translation'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  DollarSign,
  Ticket,
  Shield,
  Users,
  BarChart3,
  Settings,
  Home,
  LogOut,
  MessageSquare,
  FileText,
  Clipboard
} from 'lucide-react'


export function AdminSidebar() {
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { t } = useTranslation('admin')
  
  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      // Clear the session using custom endpoint
      await fetch('/api/signout', { method: 'POST' })
      // Force redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback: force redirect anyway
      window.location.href = '/'
    }
  }
  
  const navigation = [
    { name: t('sidebar.dashboard'), href: '/admin', icon: LayoutDashboard },
    { name: t('sidebar.calendar'), href: '/admin/calendar', icon: Calendar },
    { name: t('sidebar.reservations'), href: '/admin/reservations', icon: ClipboardList },
    { name: t('sidebar.pricing'), href: '/admin/pricing', icon: DollarSign },
    { name: t('sidebar.coupons'), href: '/admin/coupons', icon: Ticket },
    { name: 'Security Deposit', href: '/admin/security-deposit', icon: Shield },
    { name: t('sidebar.policies'), href: '/admin/policies', icon: Clipboard },
    { name: t('sidebar.bookingPolicies'), href: '/admin/booking-policies', icon: FileText },
    { name: t('sidebar.users'), href: '/admin/users', icon: Users },
    { name: t('sidebar.reviews'), href: '/admin/reviews', icon: MessageSquare },
    { name: t('sidebar.reports'), href: '/admin/reports', icon: BarChart3 },
  ]
  
  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-coral rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">Joury Villa</div>
              <div className="text-xs text-gray-500">Admin Portal</div>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-coral text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 mr-3" />
            {isSigningOut ? 'Signing out...' : t('header.signOut')}
          </button>
        </div>
      </div>
    </div>
  )
}