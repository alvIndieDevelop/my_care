import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { t, formatDateSpanish } from '@/lib/translations'
import { MedicationLogForm } from './medication-log-form'

interface MedicationSchedule {
  id: string
  scheduled_time: string
  frequency: string
  day_of_week: number | null
}

interface Medication {
  id: string
  name: string
  dosage: string
  instructions: string | null
  is_active: boolean
  care_recipient_id: string
  care_recipients: { id: string; name: string } | null
  medication_schedules: MedicationSchedule[]
}

interface MedicationLog {
  id: string
  medication_schedule_id: string
  status: string
  notes: string | null
  logged_at: string
}

export default async function MedicationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isAdmin = profile?.role === 'admin'

  if (isAdmin) {
    // Admin view - show all medications grouped by care recipient
    const { data: medications } = await supabase
      .from('medications')
      .select(`
        *,
        care_recipients (id, name),
        medication_schedules (
          id,
          scheduled_time,
          frequency,
          day_of_week
        )
      `)
      .order('name')

    const typedMedications = medications as Medication[] | null

    // Group by care recipient
    const medicationsByRecipient: Record<string, { name: string; medications: Medication[] }> = {}
    
    typedMedications?.forEach((med) => {
      const recipientId = med.care_recipient_id
      const recipientName = med.care_recipients?.name || 'Desconocido'
      if (!medicationsByRecipient[recipientId]) {
        medicationsByRecipient[recipientId] = { name: recipientName, medications: [] }
      }
      medicationsByRecipient[recipientId].medications.push(med)
    })

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.medications.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t.medications.subtitle}</p>
          </div>
          <Link href="/dashboard/medications/new">
            <Button className="w-full sm:w-auto min-h-[44px]">{t.medications.addNew}</Button>
          </Link>
        </div>

        {Object.keys(medicationsByRecipient).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(medicationsByRecipient).map(([recipientId, { name, medications: meds }]) => (
              <Card key={recipientId}>
                <CardHeader>
                  <CardTitle className="text-lg">{name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {meds.map((medication) => (
                      <Link 
                        key={medication.id} 
                        href={`/dashboard/medications/${medication.id}`}
                        className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{medication.name}</p>
                              <Badge variant={medication.is_active ? 'default' : 'secondary'}>
                                {medication.is_active ? t.common.active : t.common.inactive}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                            {medication.instructions && (
                              <p className="text-sm text-muted-foreground/70 mt-1">{medication.instructions}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {medication.medication_schedules && medication.medication_schedules.length > 0 ? (
                              <div className="space-y-1">
                                {medication.medication_schedules.map((schedule) => (
                                  <p key={schedule.id} className="text-sm text-blue-600 dark:text-blue-400">
                                    {schedule.scheduled_time.slice(0, 5)}
                                    {schedule.frequency === 'weekly' && schedule.day_of_week !== null && (
                                      <span className="text-muted-foreground ml-1">
                                        ({t.days.short[schedule.day_of_week]})
                                      </span>
                                    )}
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground/70">{t.medications.noScheduleSet}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
              <p className="text-sm sm:text-base text-muted-foreground mb-4">{t.medications.noMedications}</p>
              <p className="text-xs sm:text-sm text-muted-foreground/70 mb-6">
                {t.medications.noMedicationsHelp}
              </p>
              <Link href="/dashboard/medications/new">
                <Button className="min-h-[44px]">{t.medications.addFirst}</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Caregiver view - show today's medications for their care recipients
  const { data: caregiver } = await supabase
    .from('caregivers')
    .select('id')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .single()

  if (!caregiver) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.medications.caregiverTitle}</h1>
        <Card>
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <p className="text-sm sm:text-base text-muted-foreground">{t.errors.notRegisteredAsCaregiver}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get today's day of week and date
  const today = new Date()
  const dayOfWeek = today.getDay()
  const todayStr = today.toISOString().split('T')[0]

  // Get care recipients this caregiver serves today
  const { data: todaySchedules } = await supabase
    .from('schedules')
    .select('care_recipient_id')
    .eq('caregiver_id', caregiver.id)
    .eq('day_of_week', dayOfWeek)

  const careRecipientIds = [...new Set(todaySchedules?.map(s => s.care_recipient_id) || [])]

  if (careRecipientIds.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.medications.caregiverTitle}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{formatDateSpanish(today)}</p>
        </div>
        <Card>
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <p className="text-sm sm:text-base text-muted-foreground">{t.medications.noMedicationsToday}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get medications for these care recipients
  const { data: medications } = await supabase
    .from('medications')
    .select(`
      *,
      care_recipients (id, name),
      medication_schedules (
        id,
        scheduled_time,
        frequency,
        day_of_week
      )
    `)
    .in('care_recipient_id', careRecipientIds)
    .eq('is_active', true)
    .order('name')

  const typedMedications = medications as Medication[] | null

  // Filter to only show medications scheduled for today
  const todayMedications = typedMedications?.filter(med => {
    return med.medication_schedules?.some(schedule => {
      if (schedule.frequency === 'daily') return true
      if (schedule.frequency === 'weekly' && schedule.day_of_week === dayOfWeek) return true
      return false
    })
  }) || []

  // Get all schedule IDs for today's medications
  const scheduleIds = todayMedications.flatMap(med => 
    med.medication_schedules
      .filter(s => s.frequency === 'daily' || (s.frequency === 'weekly' && s.day_of_week === dayOfWeek))
      .map(s => s.id)
  )

  // Get today's logs
  const { data: logs } = await supabase
    .from('medication_logs')
    .select('*')
    .in('medication_schedule_id', scheduleIds.length > 0 ? scheduleIds : ['none'])
    .eq('log_date', todayStr)

  const logMap = new Map((logs as MedicationLog[] || []).map(log => [log.medication_schedule_id, log]))

  // Group by care recipient
  const medicationsByRecipient: Record<string, { name: string; medications: Medication[] }> = {}
  
  todayMedications.forEach((med) => {
    const recipientId = med.care_recipient_id
    const recipientName = med.care_recipients?.name || 'Desconocido'
    if (!medicationsByRecipient[recipientId]) {
      medicationsByRecipient[recipientId] = { name: recipientName, medications: [] }
    }
    medicationsByRecipient[recipientId].medications.push(med)
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.medications.caregiverTitle}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{formatDateSpanish(today)}</p>
      </div>

      {Object.keys(medicationsByRecipient).length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(medicationsByRecipient).map(([recipientId, { name, medications: meds }]) => (
            <Card key={recipientId}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">{name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {meds.map((medication) => {
                    // Get today's schedules for this medication
                    const todaySchedules = medication.medication_schedules.filter(s => 
                      s.frequency === 'daily' || (s.frequency === 'weekly' && s.day_of_week === dayOfWeek)
                    )

                    return (
                      <div key={medication.id} className="border border-border rounded-lg p-4">
                        <div className="mb-3">
                          <p className="font-medium text-lg text-foreground">{medication.name}</p>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                          {medication.instructions && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">📋 {medication.instructions}</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          {todaySchedules.map((schedule) => {
                            const log = logMap.get(schedule.id)
                            return (
                              <div 
                                key={schedule.id} 
                                className={`p-3 rounded-lg ${
                                  log?.status === 'given' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                                  log?.status === 'skipped' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                                  log?.status === 'refused' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                                  'bg-muted border border-border'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {t.medications.scheduledFor}: {schedule.scheduled_time.slice(0, 5)}
                                  </span>
                                  {log && (
                                    <Badge variant={
                                      log.status === 'given' ? 'default' :
                                      log.status === 'skipped' ? 'secondary' :
                                      'destructive'
                                    }>
                                      {log.status === 'given' ? t.medications.given :
                                       log.status === 'skipped' ? t.medications.skipped :
                                       t.medications.refused}
                                    </Badge>
                                  )}
                                </div>

                                <MedicationLogForm
                                  scheduleId={schedule.id}
                                  caregiverId={caregiver.id}
                                  currentStatus={log?.status || null}
                                  currentNotes={log?.notes || null}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t.medications.noMedicationsToday}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
