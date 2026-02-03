import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CaregiverActions } from './caregiver-actions'
import { t } from '@/lib/translations'

interface CaregiverDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CaregiverDetailPage({ params }: CaregiverDetailPageProps) {
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

  // Get caregiver details
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('id', id)
    .single()

  if (!caregiver) {
    notFound()
  }

  // Get caregiver's schedules
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      *,
      care_recipients (name)
    `)
    .eq('caregiver_id', id)
    .order('day_of_week')

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6">
        <Link 
          href="/dashboard/caregivers" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 min-h-[44px] inline-flex items-center"
        >
          ← {t.common.back} {t.caregivers.title}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
            {caregiver.profiles?.full_name || 'Cuidador Desconocido'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground break-all">{caregiver.profiles?.email}</p>
        </div>
        <Badge variant={caregiver.is_active ? 'default' : 'secondary'} className="text-xs sm:text-sm w-fit shrink-0">
          {caregiver.is_active ? t.common.active : t.common.inactive}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t.caregivers.contactInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.auth.email}</p>
              <p className="font-medium text-foreground text-sm sm:text-base break-all">{caregiver.profiles?.email}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.caregivers.phone}</p>
              <p className="font-medium text-foreground text-sm sm:text-base">{caregiver.phone || 'No proporcionado'}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t.caregivers.added}</p>
              <p className="font-medium text-foreground text-sm sm:text-base">
                {new Date(caregiver.created_at).toLocaleDateString('es-ES')}
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
            <CaregiverActions caregiver={caregiver} />
          </CardContent>
        </Card>
      </div>

      {/* Assigned Schedules */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">{t.caregivers.assignedSchedules}</CardTitle>
            <Link 
              href={`/dashboard/schedules/new?caregiver=${id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 min-h-[44px] inline-flex items-center"
            >
              {t.caregivers.addSchedule}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {schedules && schedules.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {schedules.map((schedule) => (
                <Link 
                  key={schedule.id} 
                  href={`/dashboard/schedules/${schedule.id}`}
                  className="block p-3 sm:p-4 rounded-lg border border-border hover:bg-accent transition-colors min-h-[44px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm sm:text-base truncate">{schedule.care_recipients?.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t.days.long[schedule.day_of_week]} • {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <span className="text-muted-foreground shrink-0">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">{t.caregivers.noSchedules}</p>
              <Link 
                href={`/dashboard/schedules/new?caregiver=${id}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm sm:text-base min-h-[44px] inline-flex items-center"
              >
                {t.caregivers.assignSchedule}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
