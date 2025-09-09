'use client'

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { LanguageProvider } from "@/lib/language-context"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </SessionProvider>
  )
}