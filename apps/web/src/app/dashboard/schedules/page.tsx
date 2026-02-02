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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.schedules.title}</h1>
          <p className="text-muted-foreground">{t.schedules.subtitle}</p>
        </div>
        <Link href="/dashboard/schedules/new">
          <Button>{t.schedules.addNew}</Button>
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
                        className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {schedule.care_recipients?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.caregivers?.profiles?.full_name || t.schedules.unassigned}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-blue-600 dark:text-blue-400">
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
