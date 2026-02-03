'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { t, formatDateSpanish } from '@/lib/translations'

interface GuestSession {
  caregiverId: string
  caregiverName: string
  accessCode: string
  createdAt: string
}

interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  care_recipients: {
    id: string
    name: string
  } | null
}

interface Task {
  id: string
  title: string
  description: string | null
  due_time: string | null
  schedule_id: string
}

interface TaskLog {
  task_id: string
  status: string
}

export default function GuestDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([])

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
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        care_recipients (id, name)
      `)
      .eq('caregiver_id', caregiverId)
      .eq('day_of_week', dayOfWeek)
      .order('start_time')

    setTodaySchedules(schedules || [])

    // Get tasks for today's schedules
    if (schedules && schedules.length > 0) {
      const scheduleIds = schedules.map(s => s.id)
      
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('schedule_id', scheduleIds)
        .order('sort_order')
        .order('due_time')

      setTasks(tasksData || [])

      // Get task logs for today
      const { data: logsData } = await supabase
        .from('task_logs')
        .select('task_id, status')
        .eq('caregiver_id', caregiverId)
        .eq('log_date', todayStr)

      setTaskLogs(logsData || [])
    }

    setLoading(false)
  }

  const getTaskStatus = (taskId: string) => {
    const log = taskLogs.find(l => l.task_id === taskId)
    return log?.status || null
  }

  const getCompletedCount = () => {
    return taskLogs.filter(l => l.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {t.dashboard.todaySchedule}
        </h1>
        <p className="text-muted-foreground">
          {formatDateSpanish(new Date())}
        </p>
      </div>

      {/* Today's Schedules */}
      {todaySchedules.length > 0 ? (
        <div className="space-y-4">
          {todaySchedules.map((schedule) => {
            const scheduleTasks = tasks.filter(t => t.schedule_id === schedule.id)
            const completedTasks = scheduleTasks.filter(t => getTaskStatus(t.id) === 'completed').length
            
            return (
              <Card key={schedule.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {schedule.care_recipients?.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                      {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {scheduleTasks.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>{t.tasks.title}</span>
                        <span>{completedTasks}/{scheduleTasks.length} {t.common.completed.toLowerCase()}</span>
                      </div>
                      {scheduleTasks.slice(0, 3).map((task) => {
                        const status = getTaskStatus(task.id)
                        return (
                          <div 
                            key={task.id}
                            className={`p-3 rounded-lg border ${
                              status === 'completed' 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}>
                                {task.title}
                              </span>
                              {status && (
                                <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                  {status === 'completed' ? '✓' : status === 'skipped' ? '⏭' : '✕'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {scheduleTasks.length > 3 && (
                        <Link 
                          href="/guest/dashboard/tasks"
                          className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
                        >
                          Ver todas las tareas ({scheduleTasks.length})
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t.tasks.noTasksForShift}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t.dashboard.noSchedulesToday}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{getCompletedCount()}</p>
              <p className="text-sm text-muted-foreground">{t.tasks.statusCompleted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{tasks.length - getCompletedCount()}</p>
              <p className="text-sm text-muted-foreground">{t.common.pending}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
