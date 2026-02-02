'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { t } from '@/lib/translations'

interface MedicationLogFormProps {
  scheduleId: string
  caregiverId: string
  currentStatus: string | null
  currentNotes: string | null
}

export function MedicationLogForm({ 
  scheduleId, 
  caregiverId, 
  currentStatus, 
  currentNotes 
}: MedicationLogFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(!!currentNotes)
  const [notes, setNotes] = useState(currentNotes || '')

  const handleLog = async (status: 'given' | 'skipped' | 'refused') => {
    setLoading(true)
    
    const today = new Date().toISOString().split('T')[0]
    
    try {
      if (currentStatus) {
        // Update existing log
        const { error } = await supabase
          .from('medication_logs')
          .update({
            status,
            notes: notes || null,
            logged_at: new Date().toISOString(),
          })
          .eq('medication_schedule_id', scheduleId)
          .eq('log_date', today)
        
        if (error) throw error
      } else {
        // Create new log
        const { error } = await supabase
          .from('medication_logs')
          .insert({
            medication_schedule_id: scheduleId,
            caregiver_id: caregiverId,
            status,
            notes: notes || null,
            log_date: today,
          })
        
        if (error) throw error
      }
      
      router.refresh()
    } catch (err) {
      console.error('Error logging medication:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    setLoading(true)
    
    const today = new Date().toISOString().split('T')[0]
    
    try {
      const { error } = await supabase
        .from('medication_logs')
        .delete()
        .eq('medication_schedule_id', scheduleId)
        .eq('log_date', today)
      
      if (error) throw error
      
      setNotes('')
      setShowNotes(false)
      router.refresh()
    } catch (err) {
      console.error('Error undoing medication log:', err)
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus) {
    // Already logged - show status and undo option
    return (
      <div className="space-y-2">
        {currentNotes && (
          <p className="text-sm text-muted-foreground italic">"{currentNotes}"</p>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleUndo}
          disabled={loading}
          className="text-xs"
        >
          {t.medications.undoLog}
        </Button>
      </div>
    )
  }

  // Not logged yet - show action buttons
  return (
    <div className="space-y-3">
      {showNotes && (
        <Textarea
          placeholder={t.medications.logNotePlaceholder}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="text-sm"
          rows={2}
        />
      )}
      
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => handleLog('given')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
        >
          {t.medications.markAsGiven}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleLog('skipped')}
          disabled={loading}
          className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
        >
          {t.medications.markAsSkipped}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleLog('refused')}
          disabled={loading}
          className="border-red-500 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {t.medications.markAsRefused}
        </Button>
        {!showNotes && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNotes(true)}
            className="text-xs"
          >
            + {t.tasks.note}
          </Button>
        )}
      </div>
    </div>
  )
}
