import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { t } from '@/lib/translations'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    // Admin dashboard
    const [
      { count: careRecipientCount },
      { count: caregiverCount },
      { count: scheduleCount },
      { count: appointmentCount },
      { count: medicationCount }
    ] = await Promise.all([
      supabase.from('care_recipients').select('*', { count: 'exact', head: true }),
      supabase.from('caregivers').select('*', { count: 'exact', head: true }),
      supabase.from('schedules').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', new Date().toISOString().split('T')[0]),
      supabase.from('medications').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ])

    return (
      <div className="space-y-3 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
          <p className="text-xs sm:text-base text-muted-foreground">{t.dashboard.welcomeAdmin}, {profile?.full_name}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Care Recipients - First and most important */}
          <Link href="/dashboard/care-recipients">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full min-h-[100px] sm:min-h-[140px]">
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5">
                  <span className="text-base sm:text-xl">❤️</span>
                  <span className="truncate">{t.nav.careRecipients}</span>
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-sm line-clamp-1 hidden sm:block">{t.dashboard.manageCareRecipients}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{careRecipientCount || 0}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/caregivers">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full min-h-[100px] sm:min-h-[140px]">
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5">
                  <span className="text-base sm:text-xl">👥</span>
                  <span className="truncate">{t.nav.caregivers}</span>
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-sm line-clamp-1 hidden sm:block">{t.dashboard.manageCaregivers}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{caregiverCount || 0}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/schedules">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full min-h-[100px] sm:min-h-[140px]">
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5">
                  <span className="text-base sm:text-xl">📅</span>
                  <span className="truncate">{t.nav.schedules}</span>
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-sm line-clamp-1 hidden sm:block">{t.dashboard.manageSchedules}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{scheduleCount || 0}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/appointments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full min-h-[100px] sm:min-h-[140px]">
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5">
                  <span className="text-base sm:text-xl">🏥</span>
                  <span className="truncate">{t.nav.appointments}</span>
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-sm line-clamp-1 hidden sm:block">{t.dashboard.upcomingAppointments}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{appointmentCount || 0}</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/medications" className="col-span-2">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-6">
                <CardTitle className="text-sm sm:text-lg flex items-center gap-1.5">
                  <span className="text-base sm:text-xl">💊</span>
                  <span className="truncate">{t.nav.medications}</span>
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-sm line-clamp-1">{t.dashboard.activeMedications}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <p className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">{medicationCount || 0}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    )
  }

  // Caregiver dashboard
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('*')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!caregiver) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t.dashboard.welcomeCaregiver}, {profile?.full_name}</p>
        </div>
        <Card>
          <CardContent className="pt-6 p-4 sm:p-6">
            <p className="text-muted-foreground">{t.dashboard.notAssigned}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get today's schedules for this caregiver (using day_of_week)
  const today = new Date()
  const todayDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const todayStr = today.toISOString().split('T')[0]
  
  const { data: todaySchedules } = await supabase
    .from('schedules')
    .select(`
      *,
      care_recipients (name),
      tasks (id, title)
    `)
    .eq('caregiver_id', caregiver.id)
    .eq('day_of_week', todayDayOfWeek)

  // Get today's task logs to count completed tasks
  const { data: taskLogs } = await supabase
    .from('task_logs')
    .select('task_id, status')
    .eq('caregiver_id', caregiver.id)
    .eq('log_date', todayStr)
    .eq('status', 'completed')

  const completedTaskIds = new Set(taskLogs?.map(log => log.task_id) || [])
  const totalTasks = todaySchedules?.reduce((acc, s) => acc + (s.tasks?.length || 0), 0) || 0
  const completedTasks = todaySchedules?.reduce((acc, s) => 
    acc + (s.tasks?.filter((t: { id: string }) => completedTaskIds.has(t.id))?.length || 0), 0) || 0

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t.dashboard.welcomeCaregiver}, {profile?.full_name}</p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{t.dashboard.todaySchedule}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {todaySchedules && todaySchedules.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {todaySchedules.map((schedule) => {
                const scheduleTaskIds = schedule.tasks?.map((task: { id: string }) => task.id) || []
                const scheduleCompletedCount = scheduleTaskIds.filter((id: string) => completedTaskIds.has(id)).length
                const scheduleTotalCount = schedule.tasks?.length || 0
                const allCompleted = scheduleTotalCount > 0 && scheduleCompletedCount === scheduleTotalCount
                const someCompleted = scheduleCompletedCount > 0 && scheduleCompletedCount < scheduleTotalCount
                
                return (
                  <div key={schedule.id} className="border border-border rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{schedule.care_recipients?.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs whitespace-nowrap shrink-0 ${
                        allCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        someCompleted ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {allCompleted ? t.common.completed :
                         someCompleted ? t.common.inProgress :
                         t.common.pending}
                      </span>
                    </div>
                    {schedule.tasks && schedule.tasks.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {t.dashboard.tasks}: {scheduleCompletedCount}/{scheduleTotalCount} {t.common.completed.toLowerCase()}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm sm:text-base">{t.dashboard.noSchedulesToday}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link href="/dashboard/tasks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{t.nav.tasks}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t.dashboard.todayTasks}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{completedTasks}/{totalTasks}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/medications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{t.nav.medications}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t.dashboard.medicationLogs}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">{t.dashboard.viewAndLog}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
