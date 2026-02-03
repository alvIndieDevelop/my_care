import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/translations'

interface CaregiverHours {
  caregiver_id: string
  caregiver_name: string
  is_active: boolean
  total_weekly_hours: number
  shifts_per_week: number
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get caregiver hours data
  const { data: caregivers } = await supabase
    .from('caregivers')
    .select(`
      id,
      full_name,
      is_active,
      profile_id,
      profiles (full_name)
    `)

  const { data: schedules } = await supabase
    .from('schedules')
    .select('caregiver_id, start_time, end_time')

  // Calculate hours per caregiver
  const caregiverHours: CaregiverHours[] = (caregivers || []).map(caregiver => {
    const caregiverSchedules = (schedules || []).filter(s => s.caregiver_id === caregiver.id)
    
    let totalHours = 0
    caregiverSchedules.forEach(schedule => {
      const start = schedule.start_time.split(':').map(Number)
      const end = schedule.end_time.split(':').map(Number)
      const startMinutes = start[0] * 60 + start[1]
      const endMinutes = end[0] * 60 + end[1]
      const hours = (endMinutes - startMinutes) / 60
      totalHours += hours
    })

    const name = caregiver.full_name || 
      (caregiver.profiles as { full_name: string } | null)?.full_name || 
      'Sin nombre'

    return {
      caregiver_id: caregiver.id,
      caregiver_name: name,
      is_active: caregiver.is_active,
      total_weekly_hours: totalHours,
      shifts_per_week: caregiverSchedules.length,
    }
  })

  // Sort by hours (descending)
  caregiverHours.sort((a, b) => b.total_weekly_hours - a.total_weekly_hours)

  // Calculate stats
  const activeCaregivers = caregiverHours.filter(c => c.is_active)
  const totalCaregivers = activeCaregivers.length
  const totalWeeklyHours = activeCaregivers.reduce((sum, c) => sum + c.total_weekly_hours, 0)
  const averageHours = totalCaregivers > 0 ? totalWeeklyHours / totalCaregivers : 0

  // Find most and least hours (among active caregivers with schedules)
  const caregiversWithSchedules = activeCaregivers.filter(c => c.shifts_per_week > 0)
  const mostHours = caregiversWithSchedules.length > 0 ? caregiversWithSchedules[0] : null
  const leastHours = caregiversWithSchedules.length > 0 ? caregiversWithSchedules[caregiversWithSchedules.length - 1] : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          📊 {t.analytics.title}
        </h1>
        <p className="text-muted-foreground">
          {t.analytics.subtitle}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-foreground">{totalCaregivers}</p>
            <p className="text-sm text-muted-foreground">{t.analytics.totalCaregivers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-blue-600">{totalWeeklyHours.toFixed(0)}</p>
            <p className="text-sm text-muted-foreground">{t.analytics.totalWeeklyHours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-green-600">{averageHours.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">{t.analytics.averageHours}</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {caregiversWithSchedules.length > 1 && mostHours && leastHours && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">💡 {t.analytics.insights}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mostHours.total_weekly_hours !== leastHours.total_weekly_hours ? (
              <>
                <p className="text-sm">
                  <span className="font-semibold text-green-600">⬆️ {mostHours.caregiver_name}</span>{' '}
                  {t.analytics.insightMostHours} ({mostHours.total_weekly_hours} {t.analytics.hoursUnit})
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-orange-600">⬇️ {leastHours.caregiver_name}</span>{' '}
                  {t.analytics.insightLeastHours} ({leastHours.total_weekly_hours} {t.analytics.hoursUnit})
                </p>
              </>
            ) : (
              <p className="text-sm text-green-600">✓ {t.analytics.insightBalanced}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Caregiver Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t.caregivers.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {caregiverHours.length > 0 ? (
            <div className="space-y-3">
              {/* Header row - hidden on mobile */}
              <div className="hidden sm:grid sm:grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div>{t.analytics.caregiverName}</div>
                <div className="text-center">{t.analytics.weeklyHours}</div>
                <div className="text-center">{t.analytics.shiftsPerWeek}</div>
                <div className="text-center">{t.analytics.status}</div>
              </div>

              {/* Data rows */}
              {caregiverHours.map((caregiver, index) => {
                const isMost = mostHours && caregiver.caregiver_id === mostHours.caregiver_id && caregiver.shifts_per_week > 0
                const isLeast = leastHours && caregiver.caregiver_id === leastHours.caregiver_id && caregiver.shifts_per_week > 0 && caregiversWithSchedules.length > 1 && mostHours?.total_weekly_hours !== leastHours?.total_weekly_hours

                return (
                  <div 
                    key={caregiver.caregiver_id}
                    className={`p-3 rounded-lg border ${
                      isMost 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : isLeast 
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                          : 'border-border'
                    }`}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{caregiver.caregiver_name}</span>
                        <Badge variant={caregiver.is_active ? 'default' : 'secondary'}>
                          {caregiver.is_active ? t.common.active : t.common.inactive}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{caregiver.total_weekly_hours} {t.analytics.hoursUnit}</span>
                        <span>{caregiver.shifts_per_week} {t.analytics.shiftsUnit}</span>
                      </div>
                      {(isMost || isLeast) && (
                        <Badge variant="outline" className={isMost ? 'text-green-600' : 'text-orange-600'}>
                          {isMost ? `⬆️ ${t.analytics.mostHours}` : `⬇️ ${t.analytics.leastHours}`}
                        </Badge>
                      )}
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:grid sm:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{caregiver.caregiver_name}</span>
                        {isMost && (
                          <Badge variant="outline" className="text-green-600 text-xs">
                            ⬆️ {t.analytics.mostHours}
                          </Badge>
                        )}
                        {isLeast && (
                          <Badge variant="outline" className="text-orange-600 text-xs">
                            ⬇️ {t.analytics.leastHours}
                          </Badge>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg">{caregiver.total_weekly_hours}</span>
                        <span className="text-sm text-muted-foreground ml-1">{t.analytics.hoursUnit}</span>
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg">{caregiver.shifts_per_week}</span>
                        <span className="text-sm text-muted-foreground ml-1">{t.analytics.shiftsUnit}</span>
                      </div>
                      <div className="text-center">
                        <Badge variant={caregiver.is_active ? 'default' : 'secondary'}>
                          {caregiver.is_active ? t.common.active : t.common.inactive}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t.caregivers.noCaregivers}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
