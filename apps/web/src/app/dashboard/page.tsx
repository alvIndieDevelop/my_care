import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { t } from '@/lib/translations'
import { PushNotificationSettings } from '@/components/push-notification-settings'
import { AddSelfAsCaregiver } from '@/components/add-self-as-caregiver'
import { getUserRoles } from '@/lib/auth/roles'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user roles
  const { isAdmin, isCaregiver, caregiverId, profile } = await getUserRoles(user.id)

  // If no roles assigned
  if (!isAdmin && !isCaregiver) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
          <p className="text-muted-foreground">Bienvenido, {profile?.full_name}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No tienes roles asignados. Contacta al administrador.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch admin data if admin
  let adminData = null
  if (isAdmin) {
    const [
      { count: caregiverCount },
      { count: scheduleCount },
      { count: appointmentCount },
      { count: medicationCount }
    ] = await Promise.all([
      supabase.from('caregivers').select('*', { count: 'exact', head: true }),
      supabase.from('schedules').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', new Date().toISOString().split('T')[0]),
      supabase.from('medications').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ])
    
    adminData = { caregiverCount, scheduleCount, appointmentCount, medicationCount }
  }

  // Fetch caregiver data if caregiver
  let caregiverData = null
  if (isCaregiver && caregiverId) {
    const today = new Date()
    const todayDayOfWeek = today.getDay()
    const todayStr = today.toISOString().split('T')[0]
    
    const { data: todaySchedules } = await supabase
      .from('schedules')
      .select(`
        *,
        care_recipients (name),
        tasks (id, title)
      `)
      .eq('caregiver_id', caregiverId)
      .eq('day_of_week', todayDayOfWeek)

    const { data: taskLogs } = await supabase
      .from('task_logs')
      .select('task_id, status')
      .eq('caregiver_id', caregiverId)
      .eq('log_date', todayStr)
      .eq('status', 'completed')

    const completedTaskIds = new Set(taskLogs?.map(log => log.task_id) || [])
    const totalTasks = todaySchedules?.reduce((acc, s) => acc + (s.tasks?.length || 0), 0) || 0
    const completedTasks = todaySchedules?.reduce((acc, s) => 
      acc + (s.tasks?.filter((t: { id: string }) => completedTaskIds.has(t.id))?.length || 0), 0) || 0

    caregiverData = { todaySchedules, completedTaskIds, totalTasks, completedTasks }
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t.dashboard.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {isAdmin && isCaregiver ? t.dashboard.welcomeAdmin : 
             isAdmin ? t.dashboard.welcomeAdmin : 
             t.dashboard.welcomeCaregiver}, {profile?.full_name}
          </p>
        </div>
        
        {/* Role indicator for dual role users */}
        {isAdmin && isCaregiver && (
          <Badge variant="outline" className="self-start sm:self-center">
            Administrador y Cuidador
          </Badge>
        )}
      </div>

      {/* Push Notification Settings */}
      <PushNotificationSettings />

      {/* Admin Dashboard */}
      {isAdmin && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Panel de Administración</h2>
          
          {/* Add self as caregiver card (only if not already caregiver) */}
          {!isCaregiver && (
            <div className="mb-6">
              <AddSelfAsCaregiver />
            </div>
          )}
          
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/caregivers">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{t.nav.caregivers}</CardTitle>
                  <CardDescription>{t.dashboard.manageCaregivers}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{adminData?.caregiverCount || 0}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/schedules">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{t.nav.schedules}</CardTitle>
                  <CardDescription>{t.dashboard.manageSchedules}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{adminData?.scheduleCount || 0}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/appointments">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{t.nav.appointments}</CardTitle>
                  <CardDescription>{t.dashboard.upcomingAppointments}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{adminData?.appointmentCount || 0}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/medications">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{t.nav.medications}</CardTitle>
                  <CardDescription>{t.dashboard.activeMedications}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{adminData?.medicationCount || 0}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Caregiver Dashboard */}
      {isCaregiver && caregiverData && (
        <section className={isAdmin ? 'mt-8' : ''}>
          <h2 className="text-xl font-semibold mb-4">Mi Turno de Hoy</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t.dashboard.todaySchedule}</CardTitle>
              <CardDescription>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              {caregiverData.todaySchedules && caregiverData.todaySchedules.length > 0 ? (
                <div className="space-y-4">
                  {caregiverData.todaySchedules.map((schedule) => {
                    const scheduleTaskIds = schedule.tasks?.map((task: { id: string }) => task.id) || []
                    const scheduleCompletedCount = scheduleTaskIds.filter((id: string) => caregiverData.completedTaskIds.has(id)).length
                    const scheduleTotalCount = schedule.tasks?.length || 0
                    const allCompleted = scheduleTotalCount > 0 && scheduleCompletedCount === scheduleTotalCount
                    const someCompleted = scheduleCompletedCount > 0 && scheduleCompletedCount < scheduleTotalCount
                    
                    return (
                      <div key={schedule.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-foreground">{schedule.care_recipients?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
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
                            <p className="text-sm text-muted-foreground">
                              {t.dashboard.tasks}: {scheduleCompletedCount}/{scheduleTotalCount} {t.common.completed.toLowerCase()}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">{t.dashboard.noSchedulesToday}</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/tasks">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{t.nav.tasks}</CardTitle>
                  <CardDescription>{t.dashboard.todayTasks}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{caregiverData.completedTasks}/{caregiverData.totalTasks}</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/medications">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{t.nav.medications}</CardTitle>
                  <CardDescription>{t.dashboard.medicationLogs}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t.dashboard.viewAndLog}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
