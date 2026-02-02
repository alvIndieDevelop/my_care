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
    <div className="space-y-6">
      <div className="mb-6">
        <Link 
          href="/dashboard/schedules" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          ← {t.common.back} {t.schedules.title}
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {schedule.care_recipients?.name} - {t.days.long[schedule.day_of_week]}
          </h1>
          <p className="text-muted-foreground">
            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Schedule Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.schedules.details}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t.schedules.careRecipient}</p>
              <Link 
                href={`/dashboard/care-recipients/${schedule.care_recipients?.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {schedule.care_recipients?.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.schedules.caregiver}</p>
              <Link 
                href={`/dashboard/caregivers/${schedule.caregivers?.id}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {schedule.caregivers?.profiles?.full_name || 'Desconocido'}
              </Link>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.schedules.day}</p>
              <p className="font-medium text-foreground">{t.days.long[schedule.day_of_week]}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.schedules.time}</p>
              <p className="font-medium text-foreground">
                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.caregivers.actions}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScheduleActions schedule={schedule} />
          </CardContent>
        </Card>
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t.schedules.tasksForShift}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <TaskList scheduleId={id} tasks={tasks || []} />
        </CardContent>
      </Card>
    </div>
  )
}
