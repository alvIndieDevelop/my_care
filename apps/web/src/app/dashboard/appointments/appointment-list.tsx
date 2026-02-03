'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { t, formatDateSpanish } from '@/lib/translations'

interface Appointment {
  id: string
  care_recipient_id: string
  caregiver_id: string | null
  appointment_date: string
  appointment_time: string
  type: string
  location: string | null
  notes: string | null
  status: string
  care_recipients: { id: string; name: string } | null
  caregivers: { id: string; profiles: { full_name: string } | null } | null
}

interface AppointmentListProps {
  appointments: Appointment[]
  isAdmin: boolean
}

export function AppointmentList({ appointments, isAdmin }: AppointmentListProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Group appointments by status
  const upcoming = appointments.filter(a => a.status === 'scheduled')
  const completed = appointments.filter(a => a.status === 'completed')
  const cancelled = appointments.filter(a => a.status === 'cancelled')

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-muted text-muted-foreground',
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

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      scheduled: 'Programada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    }
    return labels[status] || status
  }

  return (
    <>
      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {t.appointments.upcoming}
            {upcoming.length > 0 && (
              <Badge variant="secondary">{upcoming.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() => setSelectedAppointment(appointment)}
                  className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{formatAppointmentType(appointment.type)}</p>
                      <p className="text-sm text-muted-foreground">
                        👤 {appointment.care_recipients?.name}
                      </p>
                      {appointment.location && (
                        <p className="text-sm text-muted-foreground/70">📍 {appointment.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        🕐 {appointment.appointment_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">{t.appointments.noUpcoming}</p>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {(completed.length > 0 || cancelled.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.appointments.past}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...completed, ...cancelled].map((appointment) => (
                <button
                  key={appointment.id}
                  onClick={() => setSelectedAppointment(appointment)}
                  className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{formatAppointmentType(appointment.type)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        👤 {appointment.care_recipients?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📅 {selectedAppointment && formatAppointmentType(selectedAppointment.type)}
            </DialogTitle>
            <DialogDescription>
              Detalles de la cita
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedAppointment.status as keyof typeof statusColors]}`}>
                  {getStatusLabel(selectedAppointment.status)}
                </span>
              </div>

              {/* Date and Time */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {new Date(selectedAppointment.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-xl font-semibold text-foreground mt-1">
                  🕐 {selectedAppointment.appointment_time.slice(0, 5)}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Persona</p>
                    <p className="font-medium text-foreground">{selectedAppointment.care_recipients?.name}</p>
                  </div>
                </div>

                {selectedAppointment.location && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Ubicación</p>
                      <p className="font-medium text-foreground">{selectedAppointment.location}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.caregivers?.profiles?.full_name && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-lg">👥</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Cuidador asignado</p>
                      <p className="font-medium text-foreground">{selectedAppointment.caregivers.profiles.full_name}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.notes && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-lg">📝</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Notas</p>
                      <p className="text-foreground">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
