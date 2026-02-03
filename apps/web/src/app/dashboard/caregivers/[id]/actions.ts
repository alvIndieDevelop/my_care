'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateAccessCode(caregiverId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    return { success: false, error: 'No autorizado' }
  }
  
  // Generate a random 6-digit code
  const newCode = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Try to update using raw SQL via RPC if available
  try {
    // First try the RPC function
    const { error: rpcError } = await supabase.rpc('update_caregiver_access_code' as never, {
      p_caregiver_id: caregiverId,
      p_access_code: newCode
    } as never)
    
    if (!rpcError) {
      revalidatePath(`/dashboard/caregivers/${caregiverId}`)
      return { success: true, code: newCode }
    }
    
    console.log('RPC failed, trying direct update:', rpcError)
  } catch (e) {
    console.log('RPC not available:', e)
  }
  
  // Fallback: Try direct update
  const { error: updateError } = await supabase
    .from('caregivers')
    .update({ access_code: newCode } as never)
    .eq('id', caregiverId)
  
  if (updateError) {
    console.error('Update error:', updateError)
    return { success: false, error: updateError.message || 'Error al actualizar' }
  }
  
  revalidatePath(`/dashboard/caregivers/${caregiverId}`)
  return { success: true, code: newCode }
}
