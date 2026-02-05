'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserRoles } from '@/lib/auth/roles'
import { revalidatePath } from 'next/cache'

/**
 * Add current user as a caregiver
 */
export async function addSelfAsCaregiver() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Check if user is admin
  const { isAdmin, isCaregiver } = await getUserRoles(user.id)
  
  if (!isAdmin) {
    return { success: false, error: 'Only admins can add themselves as caregivers' }
  }
  
  if (isCaregiver) {
    return { success: false, error: 'You are already a caregiver' }
  }
  
  // Get profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()
  
  // Create caregiver record
  const { error } = await supabase
    .from('caregivers')
    .insert({
      profile_id: user.id,
      full_name: profile?.full_name || null,
      email: profile?.email || null,
      is_active: true
    })
  
  if (error) {
    console.error('Error adding self as caregiver:', error)
    return { success: false, error: error.message }
  }
  
  // Revalidate dashboard
  revalidatePath('/dashboard')
  
  return { success: true }
}

/**
 * Remove self as caregiver
 */
export async function removeSelfAsCaregiver() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  // Get caregiver record
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('id')
    .eq('profile_id', user.id)
    .single()
  
  if (!caregiver) {
    return { success: false, error: 'You are not a caregiver' }
  }
  
  // Check if caregiver has any schedules
  const { data: schedules } = await supabase
    .from('schedules')
    .select('id')
    .eq('caregiver_id', caregiver.id)
    .limit(1)
  
  if (schedules && schedules.length > 0) {
    return { 
      success: false, 
      error: 'Cannot remove caregiver role while you have assigned schedules' 
    }
  }
  
  // Delete caregiver record
  const { error } = await supabase
    .from('caregivers')
    .delete()
    .eq('id', caregiver.id)
  
  if (error) {
    console.error('Error removing self as caregiver:', error)
    return { success: false, error: error.message }
  }
  
  // Revalidate dashboard
  revalidatePath('/dashboard')
  
  return { success: true }
}
