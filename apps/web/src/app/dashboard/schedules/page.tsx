import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { t } from '@/lib/translations'

export default async function SchedulesPage() {
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

  // Get all schedules with related data
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      *,
      care_recipients (id, name),
      caregivers (
        id,
        full_name,
        profile_id,
        profiles (full_name)
      )
    `)
    .order('day_of_week')
    .order('start_time')

  // Helper function to get caregiver name
  const getCaregiverName = (caregiver: { full_name: string | null; profile_id: string | null; profiles: { full_name: string } | null } | null) => {
    if (!caregiver) return t.schedules.unassigned
    if (caregiver.profiles?.full_name) return caregiver.profiles.full_name
    return caregiver.full_name || t.schedules.unassigned
  }

  type ScheduleWithRelations = NonNullable<typeof schedules>[number]

  // Group schedules by day
  const schedulesByDay = schedules?.reduce((acc, schedule) => {
    const day = schedule.day_of_week
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<number, ScheduleWithRelations[]>)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.schedules.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t.schedules.subtitle}</p>
        </div>
        <Link href="/dashboard/schedules/new">
          <Button className="w-full sm:w-auto min-h-[44px]">{t.schedules.addNew}</Button>
        </Link>
      </div>

      {schedules && schedules.length > 0 ? (
        <div className="space-y-6">
          {t.days.long.map((dayName, dayIndex) => {
            const daySchedules: ScheduleWithRelations[] | undefined = schedulesByDay?.[dayIndex]
            if (!daySchedules || daySchedules.length === 0) return null

            return (
              <Card key={dayIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{dayName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {daySchedules.map((schedule) => (
                      <Link
                        key={schedule.id}
                        href={`/dashboard/schedules/${schedule.id}`}
                        className="block p-4 rounded-lg border border-border hover:bg-accent hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Time - prominent on the left */}
                          <div className="flex items-center gap-2 sm:min-w-[120px]">
                            <span className="text-lg">🕐</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </span>
                          </div>
                          
                          {/* Divider - hidden on mobile */}
                          <div className="hidden sm:block w-px h-10 bg-border" />
                          
                          {/* Care recipient and caregiver info */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Care recipient */}
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👤</span>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Persona</p>
                                <p className="font-medium text-foreground">
                                  {schedule.care_recipients?.name}
                                </p>
                              </div>
                            </div>
                            
                            {/* Caregiver */}
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👥</span>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cuidador</p>
                                <p className="font-medium text-foreground">
                                  {getCaregiverName(schedule.caregivers)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow indicator */}
                          <div className="hidden sm:flex items-center text-muted-foreground">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t.schedules.noSchedules}</p>
            <p className="text-sm text-muted-foreground/70 mb-6">
              {t.schedules.noSchedulesHelp}
            </p>
            <Link href="/dashboard/schedules/new">
              <Button>{t.schedules.addFirst}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
