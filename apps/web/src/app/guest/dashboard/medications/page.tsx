'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { t, formatDateSpanish } from '@/lib/translations'

interface GuestSession {
  caregiverId: string
  caregiverName: string
  accessCode: string
  createdAt: string
}

interface MedicationSchedule {
  id: string
  scheduled_time: string
  frequency: string
  day_of_week: number | null
  medications: {
    id: string
    name: string
    dosage: string
    instructions: string | null
    care_recipients: {
      name: string
    } | null
  } | null
}

interface MedicationLog {
  id: string
  medication_schedule_id: string
  status: string
  notes: string | null
}

export default function GuestMedicationsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [logs, setLogs] = useState<Map<string, MedicationLog>>(new Map())
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const sessionData = localStorage.getItem('guestSession')
    if (!sessionData) {
      router.push('/guest')
      return
    }

    try {
      const session = JSON.parse(sessionData) as GuestSession
      setGuestSession(session)
      loadData(session.caregiverId)
    } catch {
      router.push('/guest')
    }
  }, [router])

  const loadData = async (caregiverId: string) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const todayStr = today.toISOString().split('T')[0]

    // Get today's care recipient schedules for this caregiver
    const { data: caregiverSchedules } = await supabase
      .from('schedules')
      .select('care_recipient_id')
      .eq('caregiver_id', caregiverId)
      .eq('day_of_week', dayOfWeek)

    if (caregiverSchedules && caregiverSchedules.length > 0) {
      const careRecipientIds = [...new Set(caregiverSchedules.map(s => s.care_recipient_id))]

      // Get medications for these care recipients
      const { data: medications } = await supabase
        .from('medications')
        .select('id')
        .in('care_recipient_id', careRecipientIds)
        .eq('is_active', true)

      if (medications && medications.length > 0) {
        const medicationIds = medications.map(m => m.id)

        // Get medication schedules for today
        const { data: schedulesData } = await supabase
          .from('medication_schedules')
          .select(`
            id,
            scheduled_time,
            frequency,
            day_of_week,
            medications (
              id,
              name,
              dosage,
              instructions,
              care_recipients (name)
            )
          `)
          .in('medication_id', medicationIds)
          .or(`frequency.eq.daily,and(frequency.eq.weekly,day_of_week.eq.${dayOfWeek})`)
          .order('scheduled_time')

        setSchedules(schedulesData || [])

        // Get medication logs for today
        if (schedulesData && schedulesData.length > 0) {
          const scheduleIds = schedulesData.map(s => s.id)
          
          const { data: logsData } = await supabase
            .from('medication_logs')
            .select('*')
            .in('medication_schedule_id', scheduleIds)
            .eq('log_date', todayStr)

          const logsMap = new Map<string, MedicationLog>()
          logsData?.forEach(log => {
            logsMap.set(log.medication_schedule_id, log)
          })
          setLogs(logsMap)
        }
      }
    }

    setLoading(false)
  }

  const handleLogMedication = async (scheduleId: string, status: 'given' | 'skipped' | 'refused') => {
    if (!guestSession) return
    
    setUpdating(scheduleId)
    const todayStr = new Date().toISOString().split('T')[0]
    const existingLog = logs.get(scheduleId)

    try {
      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('medication_logs')
          .update({ 
            status, 
            notes: note || null,
            logged_at: new Date().toISOString()
          })
          .eq('id', existingLog.id)

        if (error) throw error
      } else {
        // Create new log
        const { error } = await supabase
          .from('medication_logs')
          .insert({
            medication_schedule_id: scheduleId,
            caregiver_id: guestSession.caregiverId,
            status,
            notes: note || null,
            log_date: todayStr,
          })

        if (error) throw error
      }

      // Refresh data
      await loadData(guestSession.caregiverId)
      setExpandedSchedule(null)
      setNote('')
    } catch (err) {
      console.error('Error logging medication:', err)
      alert(t.errors.failedToUpdate)
    } finally {
      setUpdating(null)
    }
  }

  const handleUndo = async (scheduleId: string) => {
    if (!guestSession) return
    
    const existingLog = logs.get(scheduleId)
    if (!existingLog) return

    setUpdating(scheduleId)

    try {
      const { error } = await supabase
        .from('medication_logs')
        .delete()
        .eq('id', existingLog.id)

      if (error) throw error

      await loadData(guestSession.caregiverId)
    } catch (err) {
      console.error('Error undoing medication log:', err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  const pendingSchedules = schedules.filter(s => !logs.has(s.id))
  const loggedSchedules = schedules.filter(s => logs.has(s.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {t.medications.caregiverTitle}
        </h1>
        <p className="text-muted-foreground">
          {formatDateSpanish(new Date())}
        </p>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t.medications.noMedicationsToday}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Medications */}
          {pendingSchedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t.common.pending}
                  <Badge variant="secondary">{pendingSchedules.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingSchedules.map((schedule) => (
                  <div 
                    key={schedule.id}
                    className="p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">
                          💊 {schedule.medications?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {schedule.medications?.dosage}
                        </p>
                        {schedule.medications?.care_recipients?.name && (
                          <p className="text-xs text-muted-foreground">
                            {schedule.medications.care_recipients.name}
                          </p>
                        )}
                        {schedule.medications?.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📝 {schedule.medications.instructions}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                        {schedule.scheduled_time.slice(0, 5)}
                      </Badge>
                    </div>

                    {expandedSchedule === schedule.id ? (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          placeholder={t.medications.logNotePlaceholder}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleLogMedication(schedule.id, 'given')}
                            disabled={updating === schedule.id}
                            className="flex-1 min-h-[44px]"
                          >
                            {t.medications.markAsGiven}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLogMedication(schedule.id, 'skipped')}
                            disabled={updating === schedule.id}
                            className="flex-1 min-h-[44px]"
                          >
                            {t.medications.markAsSkipped}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setExpandedSchedule(null)
                              setNote('')
                            }}
                            className="min-h-[44px]"
                          >
                            {t.common.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedSchedule(schedule.id)}
                        className="w-full mt-2 min-h-[44px]"
                      >
                        {t.medications.logged === 'Registrado' ? 'Registrar' : t.medications.logged}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Logged Medications */}
          {loggedSchedules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t.medications.logged}
                  <Badge variant="default">{loggedSchedules.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loggedSchedules.map((schedule) => {
                  const log = logs.get(schedule.id)
                  return (
                    <div 
                      key={schedule.id}
                      className={`p-4 rounded-lg border ${
                        log?.status === 'given' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : log?.status === 'skipped'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground line-through">
                            💊 {schedule.medications?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.medications?.dosage}
                          </p>
                          {log?.notes && (
                            <p className="text-sm text-muted-foreground mt-1">📝 {log.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={log?.status === 'given' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {log?.status === 'given' ? t.medications.given : 
                             log?.status === 'skipped' ? t.medications.skipped : t.medications.refused}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUndo(schedule.id)}
                            disabled={updating === schedule.id}
                            className="text-xs h-8"
                          >
                            {t.medications.undoLog}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
