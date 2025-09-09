'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { useTranslation } from '@/lib/use-translation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, User, LogOut, Settings, Home, Globe } from 'lucide-react'

export function AdminHeader() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation('admin')
  
  const handleSignOut = async () => {
    setLoading(true)
    try {
      // Sign out without redirect first
      await signOut({ redirect: false })
      // Then manually redirect and refresh to clear session
      router.push('/')
      router.refresh()
      // Force a full page reload to clear any cached auth state
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback: force redirect to home page
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        {/* Search removed */}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Language Switcher */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center space-x-1"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">{language === 'en' ? 'العربية' : 'English'}</span>
        </Button>
        
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </Button>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-coral rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium">{t('header.adminProfile')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <div className="font-medium">{t('header.adminProfile')}</div>
                <div className="text-xs text-gray-500">{t('header.email')}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/admin/settings" className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                {t('header.settings')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={loading}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {loading ? t('header.signingOut') : t('header.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}