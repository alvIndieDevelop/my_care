'use server'

import { createClient } from '@/lib/supabase/server'

export interface UserRoles {
  isAdmin: boolean
  isCaregiver: boolean
  caregiverId: string | null
  profile: {
    id: string
    role: string
    full_name: string
    email: string
    created_at: string
  } | null
}

/**
 * Get user's roles and permissions
 */
export async function getUserRoles(userId?: string): Promise<UserRoles> {
  const supabase = await createClient()
  
  // Get current user if userId not provided
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        isAdmin: false,
        isCaregiver: false,
        caregiverId: null,
        profile: null
      }
    }
    userId = user.id
  }
  
  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, created_at')
    .eq('id', userId)
    .single()
  
  // Check if has caregiver record
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('id, is_active')
    .eq('profile_id', userId)
    .single()
  
  return {
    isAdmin: profile?.role === 'admin',
    isCaregiver: !!caregiver && caregiver.is_active,
    caregiverId: caregiver?.id || null,
    profile
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.isAdmin
}

/**
 * Check if user can act as caregiver
 */
export async function isCaregiver(userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.isCaregiver
}

/**
 * Require admin access (throws if not admin)
 */
export async function requireAdmin(userId?: string): Promise<void> {
  const admin = await isAdmin(userId)
  if (!admin) {
    throw new Error('Admin access required')
  }
}

/**
 * Require caregiver access (throws if not caregiver)
 */
export async function requireCaregiver(userId?: string): Promise<void> {
  const caregiver = await isCaregiver(userId)
  if (!caregiver) {
    throw new Error('Caregiver access required')
  }
}
