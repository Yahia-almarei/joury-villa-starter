import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/database'
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = 'jouryvillaa@gmail.com'

export async function requireAdmin() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      throw new Error('Authentication required')
    }
    
    // Check if user is the designated admin
    if (session.user.email !== ADMIN_EMAIL || session.user.role !== 'ADMIN') {
      throw new Error('Admin access required')
    }
    
    // Check if account is blocked
    if (session.user.state === 'blocked') {
      throw new Error('Admin account is blocked')
    }
    
    return session.user
  } catch (error) {
    console.error('Admin authentication error:', error)
    throw error
  }
}

export async function createAdminIfNotExists() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.findUserByEmail(ADMIN_EMAIL)
    
    if (existingAdmin && existingAdmin.role === 'ADMIN') {
      return existingAdmin
    }
    
    // Hash the default password
    const passwordHash = await bcrypt.hash('AdminJoury2024!', 12)
    
    // Create admin user in database
    const adminUser = await db.createUser({
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      role: 'ADMIN',
      state: 'active',
      email_verified: new Date().toISOString()
    })
    
    console.log('Admin user created successfully')
    return adminUser
  } catch (error) {
    console.error('Error creating admin user:', error)
    return null
  }
}

export function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL
}