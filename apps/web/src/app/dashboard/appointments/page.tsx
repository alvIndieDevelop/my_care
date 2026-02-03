import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/translations'

export default async function AppointmentsPage() {
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

  // Get all appointments with related data
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      care_recipients (id, name),
      caregivers (
        id,
        profiles (full_name)
      )
    `)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  // Group appointments by status
  const upcoming = appointments?.filter(a => a.status === 'scheduled') || []
  const completed = appointments?.filter(a => a.status === 'completed') || []
  const cancelled = appointments?.filter(a => a.status === 'cancelled') || []

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.appointments.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t.appointments.subtitle}</p>
        </div>
        <Link href="/dashboard/appointments/new">
          <Button className="w-full sm:w-auto min-h-[44px]">{t.appointments.addNew}</Button>
        </Link>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            {t.appointments.upcoming}
            {upcoming.length > 0 && (
              <Badge variant="secondary">{upcoming.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {upcoming.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {upcoming.map((appointment) => (
                <Link 
                  key={appointment.id} 
                  href={`/dashboard/appointments/${appointment.id}`}
                  className="block p-3 sm:p-4 rounded-lg border border-border hover:bg-accent transition-colors min-h-[44px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{appointment.type}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {appointment.care_recipients?.name}
                      </p>
                      {appointment.location && (
                        <p className="text-xs sm:text-sm text-muted-foreground/70 truncate">📍 {appointment.location}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium text-blue-600 dark:text-blue-400 text-xs sm:text-sm whitespace-nowrap">
                        {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {appointment.appointment_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4 text-sm sm:text-base">{t.appointments.noUpcoming}</p>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {(completed.length > 0 || cancelled.length > 0) && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t.appointments.past}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-2 sm:space-y-3">
              {[...completed, ...cancelled].map((appointment) => (
                <Link 
                  key={appointment.id} 
                  href={`/dashboard/appointments/${appointment.id}`}
                  className="block p-3 sm:p-4 rounded-lg border border-border hover:bg-accent transition-colors opacity-75 min-h-[44px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">{appointment.type}</p>
                        <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                          {t.appointments.status[appointment.status as keyof typeof t.appointments.status]}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {appointment.care_recipients?.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(appointment.appointment_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {appointments?.length === 0 && (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">{t.appointments.noAppointments}</p>
            <Link href="/dashboard/appointments/new">
              <Button className="min-h-[44px]">{t.appointments.addFirst}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
