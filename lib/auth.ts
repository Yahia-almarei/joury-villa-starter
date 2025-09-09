import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "./database"

// Extend the default types
declare module "next-auth" {
  interface User {
    role: "ADMIN" | "CUSTOMER"
    state: "active" | "blocked"
    emailVerified?: Date | null
    hasPhone?: boolean
  }
  
  interface Session {
    user: {
      id: string
      email: string
      role: "ADMIN" | "CUSTOMER"
      state: "active" | "blocked"
      emailVerified?: Date | null
      hasPhone?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "CUSTOMER"
    state: "active" | "blocked"
    emailVerified?: Date | null
    hasPhone?: boolean
  }
}


export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // experimental: {
  //   enableWebCrypto: true,
  // },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }: any) {
      console.log('🚀 Redirect callback - URL:', url, 'Base URL:', baseUrl)
      
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      
      // Always redirect to callback handler to determine user role
      console.log('🚀 Redirect callback - Going to callback handler')
      return `${baseUrl}/auth/callback-handler`
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
        token.state = user.state
        token.emailVerified = user.emailVerified
      }
      
      // Refresh user data on each request to catch account blocks and phone status
      if (token.email) {
        const dbUser = await db.findUserByEmail(token.email)
        
        if (dbUser) {
          token.role = dbUser.role
          token.state = dbUser.state
          token.emailVerified = dbUser.email_verified ? new Date(dbUser.email_verified) : null
          
          // Add phone status to token for customers (always refresh this)
          if (dbUser.role === 'CUSTOMER') {
            // Always do a fresh query for customer profiles to avoid caching issues
            const { data: profiles } = await db.supabase
              .from('customer_profiles')
              .select('*')
              .eq('user_id', dbUser.id)
            
            console.log('🔍 JWT Callback - Fresh customer profiles found:', profiles?.length || 0)
            
            if (profiles && profiles.length > 0) {
              const profile = profiles[0]
              const hasPhone = !!(profile.phone && profile.phone.trim())
              token.hasPhone = hasPhone
              console.log('🔍 JWT Callback - Customer phone status:', hasPhone ? 'HAS PHONE' : 'NO PHONE', 'Phone value:', profile.phone)
            } else {
              token.hasPhone = false
              console.log('🔍 JWT Callback - Customer has no profile, no phone')
            }
          } else {
            // Admins don't need phone verification
            token.hasPhone = true
          }
        } else {
          console.log('🔍 JWT Callback - No user found in database for:', token.email)
        }
      }
      
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.state = token.state
        session.user.emailVerified = token.emailVerified
        session.user.hasPhone = token.hasPhone
      }
      
      return session
    },
    async signIn({ user, account, profile }: any) {
      // Additional check for blocked users
      if (user.state === "blocked") {
        return false
      }

      // Handle Google OAuth sign-in
      if (account?.provider === "google" && user?.email) {
        console.log("🔍 Google OAuth sign-in detected for:", user.email)
        try {
          // Check if user already exists in database
          let dbUser = await db.findUserByEmail(user.email.toLowerCase())
          console.log("🔍 Existing user in database:", dbUser ? "Found" : "Not found")
          
          if (!dbUser) {
            // Check if this is the admin email
            const ADMIN_EMAIL = 'jouryvillaa@gmail.com'
            const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
            console.log("🔍 Email check - Is admin?", isAdmin, "Email:", user.email.toLowerCase(), "Admin email:", ADMIN_EMAIL.toLowerCase())
            
            // Create new user with appropriate role
            const newUser = await db.createUser({
              email: user.email.toLowerCase(),
              role: isAdmin ? 'ADMIN' : 'CUSTOMER',
              state: 'active',
              email_verified: new Date().toISOString(),
              password_hash: '', // OAuth users don't need password
            })
            console.log("✅ Created new user with role:", newUser.role)

            // If it's a customer, create customer profile
            if (!isAdmin) {
              console.log("📝 Creating customer profile")
              await db.createCustomerProfile({
                user_id: newUser.id,
                full_name: user.name || user.email,
                phone: '',
                country: '',
              })
            }

            // Refresh the user data
            dbUser = await db.findUserByEmail(user.email.toLowerCase())
            console.log("🔄 Refreshed user data:", dbUser?.role)
          }

          if (dbUser) {
            // Update user object with database info
            console.log("🔧 Updating user object with role:", dbUser.role)
            user.id = dbUser.id
            user.role = dbUser.role
            user.state = dbUser.state
            user.emailVerified = dbUser.email_verified ? new Date(dbUser.email_verified) : null
            user.name = dbUser.customer_profiles?.[0]?.full_name || user.name || user.email
            console.log("✅ Final user object role:", user.role)
            
            // User successfully authenticated
            console.log("✅ User authenticated successfully")
          }
        } catch (error) {
          console.error("❌ Error handling Google OAuth sign-in:", error)
          return false
        }
      }
      
      return true
    }
  },
  events: {
    async signIn({ user, isNewUser }: any) {
      // Log successful sign in - only after user is fully created
      if (user?.id) {
        try {
          // Double check user exists in database before creating audit log
          const dbUser = await db.findUserByEmail(user.email)
          if (dbUser) {
            await db.createAuditLog({
              actor_user_id: user.id,
              action: "USER_SIGNIN",
              target_type: "User",
              target_id: user.id,
              payload: {
                email: user.email,
                isNewUser,
                timestamp: new Date().toISOString()
              }
            })
          }
        } catch (error) {
          console.error('Failed to create signin audit log:', error)
        }
      }
    },
    async signOut({ token }: any) {
      // Log sign out
      if (token?.sub) {
        try {
          await db.createAuditLog({
            actor_user_id: token.sub,
            action: "USER_SIGNOUT",
            target_type: "User",
            target_id: token.sub,
            payload: {
              timestamp: new Date().toISOString()
            }
          })
        } catch (error) {
          console.error('Failed to create signout audit log:', error)
        }
      }
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)