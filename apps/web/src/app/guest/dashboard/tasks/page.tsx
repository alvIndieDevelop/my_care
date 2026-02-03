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

interface Task {
  id: string
  title: string
  description: string | null
  due_time: string | null
  schedule_id: string
  schedule: {
    care_recipients: {
      name: string
    } | null
  } | null
}

interface TaskLog {
  id: string
  task_id: string
  status: string
  notes: string | null
}

export default function GuestTasksPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskLogs, setTaskLogs] = useState<Map<string, TaskLog>>(new Map())
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
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

    // Get today's schedules
    const { data: schedules } = await supabase
      .from('schedules')
      .select('id')
      .eq('caregiver_id', caregiverId)
      .eq('day_of_week', dayOfWeek)

    if (schedules && schedules.length > 0) {
      const scheduleIds = schedules.map(s => s.id)
      
      // Get tasks with schedule info
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          schedule:schedules (
            care_recipients (name)
          )
        `)
        .in('schedule_id', scheduleIds)
        .order('sort_order')
        .order('due_time')

      setTasks(tasksData || [])

      // Get task logs for today
      const { data: logsData } = await supabase
        .from('task_logs')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .eq('log_date', todayStr)

      const logsMap = new Map<string, TaskLog>()
      logsData?.forEach(log => {
        logsMap.set(log.task_id, log)
      })
      setTaskLogs(logsMap)
    }

    setLoading(false)
  }

  const handleUpdateStatus = async (taskId: string, status: 'completed' | 'skipped' | 'unable') => {
    if (!guestSession) return
    
    setUpdating(taskId)
    const todayStr = new Date().toISOString().split('T')[0]
    const existingLog = taskLogs.get(taskId)

    try {
      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('task_logs')
          .update({ 
            status, 
            notes: note || null,
            completed_at: new Date().toISOString()
          })
          .eq('id', existingLog.id)

        if (error) throw error
      } else {
        // Create new log
        const { error } = await supabase
          .from('task_logs')
          .insert({
            task_id: taskId,
            caregiver_id: guestSession.caregiverId,
            status,
            notes: note || null,
            log_date: todayStr,
          })

        if (error) throw error
      }

      // Refresh data
      await loadData(guestSession.caregiverId)
      setExpandedTask(null)
      setNote('')
    } catch (err) {
      console.error('Error updating task:', err)
      alert(t.errors.failedToUpdateTaskStatus)
    } finally {
      setUpdating(null)
    }
  }

  const handleUndo = async (taskId: string) => {
    if (!guestSession) return
    
    const existingLog = taskLogs.get(taskId)
    if (!existingLog) return

    setUpdating(taskId)

    try {
      const { error } = await supabase
        .from('task_logs')
        .delete()
        .eq('id', existingLog.id)

      if (error) throw error

      await loadData(guestSession.caregiverId)
    } catch (err) {
      console.error('Error undoing task:', err)
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

  const pendingTasks = tasks.filter(t => !taskLogs.has(t.id))
  const completedTasks = tasks.filter(t => taskLogs.has(t.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {t.tasks.title}
        </h1>
        <p className="text-muted-foreground">
          {formatDateSpanish(new Date())}
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t.tasks.noTasks}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t.common.pending}
                  <Badge variant="secondary">{pendingTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{task.title}</p>
                        {task.schedule?.care_recipients?.name && (
                          <p className="text-xs text-muted-foreground">
                            {task.schedule.care_recipients.name}
                          </p>
                        )}
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                      {task.due_time && (
                        <Badge variant="outline" className="text-xs">
                          {task.due_time.slice(0, 5)}
                        </Badge>
                      )}
                    </div>

                    {expandedTask === task.id ? (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          placeholder={t.tasks.addNotePlaceholder}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(task.id, 'completed')}
                            disabled={updating === task.id}
                            className="flex-1 min-h-[44px]"
                          >
                            {t.tasks.completed}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateStatus(task.id, 'skipped')}
                            disabled={updating === task.id}
                            className="flex-1 min-h-[44px]"
                          >
                            {t.tasks.skip}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setExpandedTask(null)
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
                        onClick={() => setExpandedTask(task.id)}
                        className="w-full mt-2 min-h-[44px]"
                      >
                        {t.tasks.complete}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {t.common.completed}
                  <Badge variant="default">{completedTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedTasks.map((task) => {
                  const log = taskLogs.get(task.id)
                  return (
                    <div 
                      key={task.id}
                      className={`p-4 rounded-lg border ${
                        log?.status === 'completed' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : log?.status === 'skipped'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground line-through">{task.title}</p>
                          {log?.notes && (
                            <p className="text-sm text-muted-foreground mt-1">📝 {log.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={log?.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {log?.status === 'completed' ? t.tasks.statusCompleted : 
                             log?.status === 'skipped' ? t.tasks.statusSkipped : t.tasks.statusUnable}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUndo(task.id)}
                            disabled={updating === task.id}
                            className="text-xs h-8"
                          >
                            {t.tasks.undo}
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
