'use client'

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { LanguageProvider } from "@/lib/language-context"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      refetchInterval={0}           // Disable automatic token refresh
      refetchOnWindowFocus={false}  // Don't refetch on window focus
    >
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SessionProvider>
  )
}