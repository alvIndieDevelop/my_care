'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/database'
import { t } from '@/lib/translations'

interface ScheduleActionsProps {
  schedule: Tables<'schedules'> & {
    care_recipients: { id: string; name: string } | null
    caregivers: {
      id: string
      profiles: { full_name: string; email: string } | null
    } | null
  }
}

export function ScheduleActions({ schedule }: ScheduleActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm(t.schedules.deleteConfirm)) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id)

      if (error) throw error
      router.push('/dashboard/schedules')
    } catch (err) {
      console.error('Error deleting schedule:', err)
      alert(t.errors.failedToDelete)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button 
        variant="outline" 
        className="w-full justify-start min-h-[44px] text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
        onClick={handleDelete}
        disabled={loading}
      >
        {t.schedules.deleteSchedule}
      </Button>
    </div>
  )
}
