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
  
  try {
    // Get the session for auth header
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, error: 'No hay sesión activa' }
    }
    
    // Use direct REST API call to bypass PostgREST schema cache
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const response = await fetch(
      `${supabaseUrl}/rest/v1/caregivers?id=eq.${caregiverId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${session.access_token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ access_code: newCode })
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('REST API error:', response.status, errorText)
      
      // If schema cache error, provide helpful message
      if (errorText.includes('schema cache')) {
        return { 
          success: false, 
          error: 'La columna access_code no está en el cache. Por favor, recarga el schema cache en Supabase Dashboard > Settings > API > Reload schema cache' 
        }
      }
      
      return { success: false, error: `Error ${response.status}: ${errorText}` }
    }
    
    revalidatePath(`/dashboard/caregivers/${caregiverId}`)
    return { success: true, code: newCode }
  } catch (e) {
    console.error('Error in generateAccessCode:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
