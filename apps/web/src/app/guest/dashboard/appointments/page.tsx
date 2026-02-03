'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { t, formatDateSpanish, formatDateShortSpanish } from '@/lib/translations'

interface GuestSession {
  caregiverId: string
  caregiverName: string
  accessCode: string
  createdAt: string
}

interface Appointment {
  id: string
  care_recipient_id: string
  appointment_date: string
  appointment_time: string
  type: string
  location: string | null
  notes: string | null
  status: string
  care_recipients: { name: string } | null
}

export default function GuestAppointmentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    const sessionData = localStorage.getItem('guestSession')
    if (!sessionData) {
      router.push('/guest')
      return
    }

    try {
      const session = JSON.parse(sessionData) as GuestSession
      loadAppointments(session.caregiverId)
    } catch {
      router.push('/guest')
    }
  }, [router])

  const loadAppointments = async (caregiverId: string) => {
    const todayStr = new Date().toISOString().split('T')[0]

    // Get schedules to find care recipient IDs
    const { data: schedules } = await supabase
      .from('schedules')
      .select('care_recipients (id)')
      .eq('caregiver_id', caregiverId)

    const careRecipientIds = [...new Set(
      schedules?.map(s => s.care_recipients?.id).filter(Boolean) || []
    )]

    if (careRecipientIds.length === 0) {
      setLoading(false)
      return
    }

    // Get upcoming appointments
    const { data: upcomingData } = await supabase
      .from('appointments')
      .select(`
        id,
        care_recipient_id,
        appointment_date,
        appointment_time,
        type,
        location,
        notes,
        status,
        care_recipients (name)
      `)
      .in('care_recipient_id', careRecipientIds)
      .gte('appointment_date', todayStr)
      .order('appointment_date')
      .order('appointment_time')

    setAppointments(upcomingData || [])

    // Get past appointments (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: pastData } = await supabase
      .from('appointments')
      .select(`
        id,
        care_recipient_id,
        appointment_date,
        appointment_time,
        type,
        location,
        notes,
        status,
        care_recipients (name)
      `)
      .in('care_recipient_id', careRecipientIds)
      .lt('appointment_date', todayStr)
      .gte('appointment_date', thirtyDaysAgoStr)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })

    setPastAppointments(pastData || [])
    setLoading(false)
  }

  const formatAppointmentType = (type: string) => {
    const types: { [key: string]: string } = {
      'Doctor Visit': 'Visita al Doctor',
      'Specialist': 'Especialista',
      'Lab Work': 'Laboratorio',
      'Physical Therapy': 'Fisioterapia',
      'Dental': 'Dental',
      'Eye Exam': 'Examen de Vista',
      'Other': 'Otro',
    }
    return types[type] || type
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-600 dark:text-blue-400">Programada</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completada</Badge>
      case 'cancelled':
        return <Badge variant="secondary">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          📅 {t.appointments.title}
        </h1>
        <p className="text-muted-foreground">
          Citas médicas de las personas a tu cuidado
        </p>
      </div>

      {/* Upcoming Appointments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Próximas citas
        </h2>

        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const aptDate = new Date(apt.appointment_date + 'T00:00:00')
              const isToday = apt.appointment_date === todayStr

              return (
                <Card 
                  key={apt.id} 
                  className={isToday ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10' : ''}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">
                          {formatAppointmentType(apt.type)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          👤 {apt.care_recipients?.name}
                        </p>
                        {apt.location && (
                          <p className="text-sm text-muted-foreground">
                            📍 {apt.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <Badge 
                          variant={isToday ? 'default' : 'outline'} 
                          className={isToday ? 'bg-orange-500' : ''}
                        >
                          {isToday ? '¡Hoy!' : formatDateShortSpanish(aptDate)}
                        </Badge>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          🕐 {apt.appointment_time.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                    {apt.notes && (
                      <p className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        📝 {apt.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No hay citas programadas</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground text-muted-foreground">
            Citas pasadas (últimos 30 días)
          </h2>

          <div className="space-y-3">
            {pastAppointments.map((apt) => {
              const aptDate = new Date(apt.appointment_date + 'T00:00:00')

              return (
                <Card key={apt.id} className="opacity-75">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-foreground">
                          {formatAppointmentType(apt.type)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          👤 {apt.care_recipients?.name}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {formatDateShortSpanish(aptDate)}
                        </p>
                        {getStatusBadge(apt.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
