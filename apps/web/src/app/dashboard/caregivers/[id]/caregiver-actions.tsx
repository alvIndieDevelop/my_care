'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Tables } from '@/types/database'
import { t } from '@/lib/translations'

interface CaregiverActionsProps {
  caregiver: Tables<'caregivers'> & {
    profiles: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email'> | null
  }
}

export function CaregiverActions({ caregiver }: CaregiverActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(caregiver.phone || '')

  const handleToggleActive = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('caregivers')
        .update({ is_active: !caregiver.is_active })
        .eq('id', caregiver.id)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Error updating caregiver:', err)
      alert(t.errors.failedToUpdate)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePhone = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('caregivers')
        .update({ phone: phone || null })
        .eq('id', caregiver.id)

      if (error) throw error
      setEditing(false)
      router.refresh()
    } catch (err) {
      console.error('Error updating phone:', err)
      alert(t.errors.failedToUpdate)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t.caregivers.removeConfirm)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('caregivers')
        .delete()
        .eq('id', caregiver.id)

      if (error) throw error
      router.push('/dashboard/caregivers')
    } catch (err) {
      console.error('Error deleting caregiver:', err)
      alert(t.errors.failedToDelete)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Edit Phone */}
      {editing ? (
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm">{t.caregivers.phone}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+507 6123-4567"
            className="min-h-[44px]"
          />
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleUpdatePhone} 
              disabled={loading}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {t.common.save}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setEditing(false)
                setPhone(caregiver.phone || '')
              }}
              className="min-h-[44px] flex-1 sm:flex-none"
            >
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          className="w-full justify-start min-h-[44px] text-sm"
          onClick={() => setEditing(true)}
        >
          {t.caregivers.editPhone}
        </Button>
      )}

      {/* Toggle Active Status */}
      <Button 
        variant="outline" 
        className="w-full justify-start min-h-[44px] text-sm"
        onClick={handleToggleActive}
        disabled={loading}
      >
        {caregiver.is_active ? t.caregivers.deactivate : t.caregivers.activate}
      </Button>

      {/* Delete */}
      <Button 
        variant="outline" 
        className="w-full justify-start min-h-[44px] text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={handleDelete}
        disabled={loading}
      >
        {t.caregivers.remove}
      </Button>
    </div>
  )
}
