'use client'

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User, Settings } from "lucide-react"

export function Navigation() {
  const { data: session, status } = useSession()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Joury Villa</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/book" className="hover:text-primary transition-colors">
              Book Now
            </Link>
            <Link href="/about" className="hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/policies" className="hover:text-primary transition-colors">
              Policies
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />
          ) : session ? (
            <div className="flex items-center gap-2">
              <Link href="/account">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Account
                </Button>
              </Link>
              
              {session.user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}