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
    <div className="space-y-6">
      <div className="mb-6">
        <Link 
          href="/dashboard/caregivers" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          ← {t.common.back} {t.caregivers.title}
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {caregiver.profiles?.full_name || 'Cuidador Desconocido'}
          </h1>
          <p className="text-muted-foreground">{caregiver.profiles?.email}</p>
        </div>
        <Badge variant={caregiver.is_active ? 'default' : 'secondary'} className="text-sm">
          {caregiver.is_active ? t.common.active : t.common.inactive}
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.caregivers.contactInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t.auth.email}</p>
              <p className="font-medium text-foreground">{caregiver.profiles?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.caregivers.phone}</p>
              <p className="font-medium text-foreground">{caregiver.phone || 'No proporcionado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.caregivers.added}</p>
              <p className="font-medium text-foreground">
                {new Date(caregiver.created_at).toLocaleDateString('es-ES')}
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
            <CaregiverActions caregiver={caregiver} />
          </CardContent>
        </Card>
      </div>

      {/* Assigned Schedules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t.caregivers.assignedSchedules}</CardTitle>
            <Link 
              href={`/dashboard/schedules/new?caregiver=${id}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {t.caregivers.addSchedule}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {schedules && schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <Link 
                  key={schedule.id} 
                  href={`/dashboard/schedules/${schedule.id}`}
                  className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{schedule.care_recipients?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.days.long[schedule.day_of_week]} • {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{t.caregivers.noSchedules}</p>
              <Link 
                href={`/dashboard/schedules/new?caregiver=${id}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
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
