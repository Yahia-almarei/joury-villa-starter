'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState } from "react";
import { Users, Globe, User, LogOut, ChevronDown, Settings } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useTranslation } from "@/lib/use-translation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation('header');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // For Google OAuth, ensure proper sign out and redirect
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback: force page reload
      window.location.href = '/';
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    const baseClasses = "font-medium transition-colors";
    if (isActive(path)) {
      return `${baseClasses} text-coral border-b-2 border-coral pb-1`;
    }
    return `${baseClasses} text-gray-700 hover:text-coral`;
  };

  return (
    <header className="w-full bg-white shadow-lg border-b border-gray-200">
      <div className="w-full px-8 py-4">
        <div className="flex items-center justify-between h-16 max-w-none">
          {/* Logo - Far Left */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-coral transition-colors">
              {t('brand.title')}
            </Link>
          </div>

          {/* Everything Else - Far Right */}
          <div className="flex items-center space-x-6">
            {/* Main Navigation */}
            <nav className="hidden lg:flex space-x-6">
              <Link href="/" className={getLinkClasses("/")}>{t('navigation.home')}</Link>
              <Link href="/overview" className={getLinkClasses("/overview")}>{t('navigation.overview')}</Link>
              <Link href="/map" className={getLinkClasses("/map")}>{t('navigation.map')}</Link>
              <Link href="/gallery" className={getLinkClasses("/gallery")}>{t('navigation.gallery')}</Link>
              <Link href="/reviews" className={getLinkClasses("/reviews")}>{t('navigation.reviews')}</Link>
              <Link href="/availability" className={getLinkClasses("/availability")}>{t('navigation.availability')}</Link>
              <Link href="/contact" className={getLinkClasses("/contact")}>{t('navigation.contact')}</Link>
            </nav>

            {/* Language Switcher */}
            <div className="hidden md:flex items-center">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="flex items-center space-x-1 text-gray-700 hover:text-coral transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t('actions.language')}
                </span>
              </button>
            </div>

            {/* User Authentication */}
            {status === 'loading' ? (
              <div className="hidden md:flex items-center space-x-1 text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex items-center space-x-1 text-gray-700 hover:text-coral transition-colors">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {session.user?.name || session.user?.email || 'Profile'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <div className="font-medium">{session.user?.name || 'Customer'}</div>
                      <div className="text-xs text-gray-500">{session.user?.email}</div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    {isSigningOut ? 'Signing out...' : 'Sign out'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button 
                onClick={() => signIn('google')}
                className="hidden md:flex items-center space-x-1 text-gray-700 hover:text-coral transition-colors"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{t('actions.signIn')}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 text-gray-700 hover:text-coral transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
