import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScheduleActions } from './schedule-actions'
import { TaskList } from './task-list'
import { t } from '@/lib/translations'

interface ScheduleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get schedule details
  const { data: schedule } = await supabase
    .from('schedules')
    .select(`
      *,
      care_recipients (id, name),
      caregivers (
        id,
        profiles (full_name, email)
      )
    `)
    .eq('id', id)
    .single()

  if (!schedule) {
    notFound()
  }

  // Get tasks for this schedule
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('schedule_id', id)
    .order('sort_order')
    .order('due_time')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <Link 
          href="/dashboard/schedules" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 min-h-[44px] inline-flex items-center"
        >
          ← {t.common.back} {t.schedules.title}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
            {schedule.care_recipients?.name} - {t.days.long[schedule.day_of_week]}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Schedule Info */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t.schedules.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.schedules.careRecipient}</p>
              <Link 
                href={`/dashboard/care-recipients/${schedule.care_recipients?.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm sm:text-base min-h-[44px] inline-flex items-center"
              >
                {schedule.care_recipients?.name}
              </Link>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.schedules.caregiver}</p>
              <Link 
                href={`/dashboard/caregivers/${schedule.caregivers?.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm sm:text-base min-h-[44px] inline-flex items-center"
              >
                {schedule.caregivers?.profiles?.full_name || 'Desconocido'}
              </Link>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.schedules.day}</p>
              <p className="font-medium text-foreground text-sm sm:text-base">{t.days.long[schedule.day_of_week]}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.schedules.time}</p>
              <p className="font-medium text-foreground text-sm sm:text-base">
                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t.caregivers.actions}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ScheduleActions schedule={schedule} />
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">{t.schedules.tasksForShift}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <TaskList scheduleId={id} tasks={tasks || []} />
        </CardContent>
      </Card>
    </div>
  )
}
