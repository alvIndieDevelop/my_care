'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { t } from '@/lib/translations'

interface TaskCompletionFormProps {
  taskId: string
  caregiverId: string
  currentStatus: string | null
  currentNotes: string | null
}

export function TaskCompletionForm({ 
  taskId, 
  caregiverId, 
  currentStatus, 
  currentNotes 
}: TaskCompletionFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(currentNotes || '')

  const handleComplete = async (status: 'completed' | 'skipped' | 'unable') => {
    setLoading(true)
    try {
      const todayStr = new Date().toISOString().split('T')[0]

      // Check if log exists
      const { data: existingLog } = await supabase
        .from('task_logs')
        .select('id')
        .eq('task_id', taskId)
        .eq('caregiver_id', caregiverId)
        .eq('log_date', todayStr)
        .single()

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('task_logs')
          .update({
            status,
            notes: notes || null,
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingLog.id)

        if (error) throw error
      } else {
        // Create new log
        const { error } = await supabase
          .from('task_logs')
          .insert({
            task_id: taskId,
            caregiver_id: caregiverId,
            status,
            notes: notes || null,
            log_date: todayStr,
          })

        if (error) throw error
      }

      router.refresh()
    } catch (err) {
      console.error('Error logging task:', err)
      alert(t.errors.failedToUpdateTaskStatus)
    } finally {
      setLoading(false)
      setShowNotes(false)
    }
  }

  if (currentStatus) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm px-3 py-1.5 rounded-full ${
            currentStatus === 'completed'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : currentStatus === 'skipped'
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {currentStatus === 'completed' ? `✓ ${t.tasks.statusCompleted}` :
             currentStatus === 'skipped' ? `⏭ ${t.tasks.statusSkipped}` : `✕ ${t.tasks.statusUnable}`}
          </span>
          {currentNotes && (
            <span className="text-sm text-muted-foreground">- {currentNotes}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] self-start sm:self-auto"
          onClick={() => handleComplete('completed')}
          disabled={loading}
        >
          {t.tasks.undo}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showNotes ? (
        <div className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder={t.tasks.addNotePlaceholder}
            rows={3}
            className="text-base"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              className="flex-1 min-h-[48px] text-base"
              onClick={() => handleComplete('completed')}
              disabled={loading}
            >
              ✓ {t.tasks.complete}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 min-h-[48px] text-base"
              onClick={() => handleComplete('skipped')}
              disabled={loading}
            >
              ⏭ {t.tasks.skip}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 min-h-[48px] text-base text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
              onClick={() => handleComplete('unable')}
              disabled={loading}
            >
              ✕ {t.tasks.unable}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="min-h-[48px] text-base"
              onClick={() => setShowNotes(false)}
            >
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="lg"
            className="flex-1 min-h-[48px] text-base font-medium"
            onClick={() => handleComplete('completed')}
            disabled={loading}
          >
            ✓ {t.tasks.markComplete}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-h-[48px] text-base"
            onClick={() => setShowNotes(true)}
          >
            + {t.tasks.note}
          </Button>
        </div>
      )}
    </div>
  )
}
