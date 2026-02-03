import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskCompletionForm } from './task-completion-form'
import { t, formatDateSpanish } from '@/lib/translations'

interface Task {
  id: string
  title: string
  description: string | null
  due_time: string | null
  sort_order: number
}

interface Schedule {
  id: string
  start_time: string
  end_time: string
  care_recipients: { name: string } | null
  tasks: Task[]
}

export default async function TasksPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Redirect admins to the main dashboard
  if (profile?.role === 'admin') {
    redirect('/dashboard')
  }

  // Get caregiver record
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!caregiver) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.tasks.title}</h1>
        <Card>
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <p className="text-muted-foreground text-sm sm:text-base">{t.errors.notRegisteredAsCaregiver}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get today's day of week and date
  const today = new Date()
  const dayOfWeek = today.getDay()
  const todayStr = today.toISOString().split('T')[0]

  // Get caregiver's schedules for today with tasks
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      id,
      start_time,
      end_time,
      care_recipients (name),
      tasks (
        id,
        title,
        description,
        due_time,
        sort_order
      )
    `)
    .eq('caregiver_id', caregiver.id)
    .eq('day_of_week', dayOfWeek)

  const typedSchedules = schedules as Schedule[] | null

  // Get today's task logs
  const { data: taskLogs } = await supabase
    .from('task_logs')
    .select('task_id, status, notes')
    .eq('caregiver_id', caregiver.id)
    .eq('log_date', todayStr)

  const taskLogMap = new Map(taskLogs?.map(log => [log.task_id, log]) || [])

  // Flatten all tasks from all schedules
  const allTasks = typedSchedules?.flatMap(schedule => 
    schedule.tasks.map(task => ({
      ...task,
      scheduleName: schedule.care_recipients?.name || 'Desconocido',
      scheduleTime: `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`,
    }))
  ) || []

  // Sort by due_time, then sort_order
  allTasks.sort((a, b) => {
    if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time)
    if (a.due_time) return -1
    if (b.due_time) return 1
    return a.sort_order - b.sort_order
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.tasks.title}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {formatDateSpanish(today)}
        </p>
      </div>

      {allTasks.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {allTasks.map((task) => {
            const log = taskLogMap.get(task.id)
            return (
              <Card 
                key={task.id}
                className={
                  log?.status === 'completed' 
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                    : log?.status === 'skipped'
                    ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                    : ''
                }
              >
                <CardHeader className="pb-2 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className={`text-base sm:text-lg ${log?.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground">{task.scheduleName}</p>
                    </div>
                    {task.due_time && (
                      <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 shrink-0">
                        {t.tasks.dueTime}: {task.due_time.slice(0, 5)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  {task.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">{task.description}</p>
                  )}
                  
                  <TaskCompletionForm 
                    taskId={task.id}
                    caregiverId={caregiver.id}
                    currentStatus={log?.status || null}
                    currentNotes={log?.notes || null}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <p className="text-muted-foreground text-sm sm:text-base">{t.tasks.noTasks}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
