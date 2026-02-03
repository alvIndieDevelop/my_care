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
        profiles (full_name)
      )
    `)
    .order('day_of_week')
    .order('start_time')

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.schedules.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t.schedules.subtitle}</p>
        </div>
        <Link href="/dashboard/schedules/new">
          <Button className="w-full sm:w-auto min-h-[44px]">{t.schedules.addNew}</Button>
        </Link>
      </div>

      {schedules && schedules.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {t.days.long.map((dayName, dayIndex) => {
            const daySchedules: ScheduleWithRelations[] | undefined = schedulesByDay?.[dayIndex]
            if (!daySchedules || daySchedules.length === 0) return null

            return (
              <Card key={dayIndex}>
                <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">{dayName}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {daySchedules.map((schedule) => (
                      <Link 
                        key={schedule.id} 
                        href={`/dashboard/schedules/${schedule.id}`}
                        className="block p-3 sm:p-4 rounded-lg border border-border hover:bg-accent transition-colors min-h-[44px]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground text-sm sm:text-base truncate">
                              {schedule.care_recipients?.name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {schedule.caregivers?.profiles?.full_name || t.schedules.unassigned}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-medium text-blue-600 dark:text-blue-400 text-sm sm:text-base whitespace-nowrap">
                              {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                            </p>
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
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">{t.schedules.noSchedules}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/70 mb-6">
              {t.schedules.noSchedulesHelp}
            </p>
            <Link href="/dashboard/schedules/new">
              <Button className="min-h-[44px]">{t.schedules.addFirst}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
