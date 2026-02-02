import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/translations'

interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  caregivers: {
    id: string
    profiles: {
      full_name: string
    } | null
  } | null
}

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
  medication_schedules: MedicationSchedule[]
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  type: string
  location: string | null
  status: string
  caregivers: {
    id: string
    profiles: {
      full_name: string
    } | null
  } | null
}

interface CareRecipient {
  id: string
  name: string
  date_of_birth: string | null
  notes: string | null
}

export default async function CareRecipientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  // Get care recipient
  const { data: careRecipient } = await supabase
    .from('care_recipients')
    .select('*')
    .eq('id', id)
    .single()

  if (!careRecipient) {
    notFound()
  }

  // Get schedules for this care recipient
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      id,
      day_of_week,
      start_time,
      end_time,
      caregivers (
        id,
        profiles (full_name)
      )
    `)
    .eq('care_recipient_id', id)
    .order('day_of_week')

  // Get medications for this care recipient
  const { data: medications } = await supabase
    .from('medications')
    .select(`
      id,
      name,
      dosage,
      instructions,
      is_active,
      medication_schedules (
        id,
        scheduled_time,
        frequency,
        day_of_week
      )
    `)
    .eq('care_recipient_id', id)
    .order('name')

  // Get appointments for this care recipient
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      type,
      location,
      status,
      caregivers (
        id,
        profiles (full_name)
      )
    `)
    .eq('care_recipient_id', id)
    .gte('appointment_date', new Date().toISOString().split('T')[0])
    .order('appointment_date')
    .order('appointment_time')

  const typedSchedules = schedules as Schedule[] | null
  const typedMedications = medications as Medication[] | null
  const typedAppointments = appointments as Appointment[] | null

  // Group schedules by day
  const schedulesByDay: Record<number, Schedule[]> = {}
  typedSchedules?.forEach(schedule => {
    if (!schedulesByDay[schedule.day_of_week]) {
      schedulesByDay[schedule.day_of_week] = []
    }
    schedulesByDay[schedule.day_of_week].push(schedule)
  })

  const appointmentTypeLabels: Record<string, string> = {
    doctor_visit: t.appointments.types.doctorVisit,
    specialist: t.appointments.types.specialist,
    lab_work: t.appointments.types.labWork,
    physical_therapy: t.appointments.types.physicalTherapy,
    dental: t.appointments.types.dental,
    eye_exam: t.appointments.types.eyeExam,
    other: t.appointments.types.other,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/care-recipients" className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block">
            ← {t.common.back}
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{careRecipient.name}</h1>
          {careRecipient.date_of_birth && (
            <p className="text-muted-foreground">
              {t.careRecipients.born}: {new Date(careRecipient.date_of_birth).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      {careRecipient.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t.careRecipients.notes}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{careRecipient.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Care Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">📅 {t.careRecipients.careSchedule}</CardTitle>
              <CardDescription>Quién cuida y cuándo</CardDescription>
            </div>
            <Link href={`/dashboard/schedules/new?careRecipientId=${id}`}>
              <Button size="sm" variant="outline">{t.careRecipients.addCareSchedule}</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(schedulesByDay).length > 0 ? (
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5, 6].map(day => {
                const daySchedules = schedulesByDay[day]
                if (!daySchedules || daySchedules.length === 0) return null
                
                return (
                  <div key={day} className="border-b border-border pb-3 last:border-0">
                    <p className="font-medium text-foreground mb-2">{t.days.long[day]}</p>
                    <div className="space-y-2">
                      {daySchedules.map(schedule => (
                        <Link 
                          key={schedule.id} 
                          href={`/dashboard/schedules/${schedule.id}`}
                          className="flex items-center justify-between p-2 rounded hover:bg-accent"
                        >
                          <span className="text-sm text-muted-foreground">
                            {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                          </span>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {schedule.caregivers?.profiles?.full_name || t.schedules.unassigned}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">{t.careRecipients.noCareSchedule}</p>
              <Link href={`/dashboard/schedules/new?careRecipientId=${id}`}>
                <Button size="sm">{t.careRecipients.addCareSchedule}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">💊 {t.careRecipients.medicationsList}</CardTitle>
              <CardDescription>Medicamentos y horarios</CardDescription>
            </div>
            <Link href={`/dashboard/medications/new?careRecipientId=${id}`}>
              <Button size="sm" variant="outline">{t.careRecipients.addMedication}</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {typedMedications && typedMedications.length > 0 ? (
            <div className="space-y-4">
              {typedMedications.map(medication => (
                <div 
                  key={medication.id} 
                  className="p-3 rounded-lg border border-border hover:bg-accent"
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
                          {medication.medication_schedules.map(schedule => (
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">{t.careRecipients.noMedicationsList}</p>
              <Link href={`/dashboard/medications/new?careRecipientId=${id}`}>
                <Button size="sm">{t.careRecipients.addMedication}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">🏥 {t.careRecipients.appointmentsList}</CardTitle>
              <CardDescription>Próximas citas médicas</CardDescription>
            </div>
            <Link href={`/dashboard/appointments/new?careRecipientId=${id}`}>
              <Button size="sm" variant="outline">{t.careRecipients.addAppointment}</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {typedAppointments && typedAppointments.length > 0 ? (
            <div className="space-y-4">
              {typedAppointments.map(appointment => (
                <div 
                  key={appointment.id} 
                  className="p-3 rounded-lg border border-border hover:bg-accent"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {appointmentTypeLabels[appointment.type] || appointment.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })} a las {appointment.appointment_time.slice(0, 5)}
                      </p>
                      {appointment.location && (
                        <p className="text-sm text-muted-foreground/70 mt-1">📍 {appointment.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        appointment.status === 'completed' ? 'default' :
                        appointment.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      }>
                        {t.appointments.status[appointment.status as keyof typeof t.appointments.status] || appointment.status}
                      </Badge>
                      {appointment.caregivers?.profiles?.full_name && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {appointment.caregivers.profiles.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">{t.careRecipients.noAppointmentsList}</p>
              <Link href={`/dashboard/appointments/new?careRecipientId=${id}`}>
                <Button size="sm">{t.careRecipients.addAppointment}</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
