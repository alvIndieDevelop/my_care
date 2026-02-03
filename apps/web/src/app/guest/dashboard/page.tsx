'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { t, formatDateSpanish, formatDateShortSpanish } from '@/lib/translations'

interface GuestSession {
  caregiverId: string
  caregiverName: string
  accessCode: string
  createdAt: string
}

interface CareRecipient {
  id: string
  name: string
  notes: string | null
  date_of_birth: string | null
}

interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  care_recipients: CareRecipient | null
}

interface Task {
  id: string
  title: string
  description: string | null
  due_time: string | null
  schedule_id: string
}

interface TaskLog {
  task_id: string
  status: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  instructions: string | null
  care_recipient_id: string
  medication_schedules: MedicationSchedule[]
}

interface MedicationSchedule {
  id: string
  scheduled_time: string
  frequency: string
  day_of_week: number | null
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

export default function GuestDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([])
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([])
  const [careRecipients, setCareRecipients] = useState<CareRecipient[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    const sessionData = localStorage.getItem('guestSession')
    if (!sessionData) {
      router.push('/guest')
      return
    }

    try {
      const session = JSON.parse(sessionData) as GuestSession
      setGuestSession(session)
      loadData(session.caregiverId)
    } catch {
      router.push('/guest')
    }
  }, [router])

  const loadData = async (caregiverId: string) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const todayStr = today.toISOString().split('T')[0]

    // Get ALL schedules for this caregiver with care recipient info
    const { data: schedules } = await supabase
      .from('schedules')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        care_recipients (id, name, notes, date_of_birth)
      `)
      .eq('caregiver_id', caregiverId)
      .order('day_of_week')
      .order('start_time')

    // Filter today's schedules
    const todaySchedulesData = (schedules || []).filter(s => s.day_of_week === dayOfWeek)
    setTodaySchedules(todaySchedulesData)
    setAllSchedules(schedules || [])

    // Extract unique care recipients
    const uniqueRecipients = new Map<string, CareRecipient>()
    schedules?.forEach(s => {
      if (s.care_recipients) {
        uniqueRecipients.set(s.care_recipients.id, s.care_recipients)
      }
    })
    setCareRecipients(Array.from(uniqueRecipients.values()))

    // Get tasks for today's schedules
    if (todaySchedulesData.length > 0) {
      const scheduleIds = todaySchedulesData.map(s => s.id)
      
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .in('schedule_id', scheduleIds)
        .order('sort_order')
        .order('due_time')

      setTasks(tasksData || [])

      // Get task logs for today
      const { data: logsData } = await supabase
        .from('task_logs')
        .select('task_id, status')
        .eq('caregiver_id', caregiverId)
        .eq('log_date', todayStr)

      setTaskLogs(logsData || [])
    }

    // Get medications for assigned care recipients
    const careRecipientIds = Array.from(uniqueRecipients.keys())
    if (careRecipientIds.length > 0) {
      const { data: medsData } = await supabase
        .from('medications')
        .select(`
          id,
          name,
          dosage,
          instructions,
          care_recipient_id,
          medication_schedules (id, scheduled_time, frequency, day_of_week)
        `)
        .in('care_recipient_id', careRecipientIds)
        .eq('is_active', true)

      setMedications(medsData || [])

      // Get upcoming appointments
      const { data: appointmentsData } = await supabase
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
        .eq('status', 'scheduled')
        .order('appointment_date')
        .order('appointment_time')
        .limit(5)

      setUpcomingAppointments(appointmentsData || [])
    }

    setLoading(false)
  }

  const getTaskStatus = (taskId: string) => {
    const log = taskLogs.find(l => l.task_id === taskId)
    return log?.status || null
  }

  const getCompletedCount = () => {
    return taskLogs.filter(l => l.status === 'completed').length
  }

  // Group schedules by day of week, starting from today
  const getSchedulesByDay = () => {
    const today = new Date().getDay()
    const grouped: { [key: number]: Schedule[] } = {}
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      grouped[i] = []
    }
    
    // Group schedules
    allSchedules.forEach(schedule => {
      grouped[schedule.day_of_week].push(schedule)
    })
    
    // Sort days starting from today
    const sortedDays: number[] = []
    for (let i = 0; i < 7; i++) {
      sortedDays.push((today + i) % 7)
    }
    
    return { grouped, sortedDays }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatAppointmentType = (type: string) => {
    const types: { [key: string]: string } = {
      doctorVisit: 'Visita al Doctor',
      specialist: 'Especialista',
      labWork: 'Laboratorio',
      physicalTherapy: 'Fisioterapia',
      dental: 'Dental',
      eyeExam: 'Examen de Vista',
      other: 'Otro',
    }
    return types[type] || type
  }

  const { grouped: schedulesByDay, sortedDays } = getSchedulesByDay()
  const today = new Date().getDay()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {t.dashboard.todaySchedule}
        </h1>
        <p className="text-muted-foreground">
          {formatDateSpanish(new Date())}
        </p>
      </div>

      {/* Care Recipients Info */}
      {careRecipients.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            👤 Personas a mi cuidado
          </h2>
          {careRecipients.map((recipient) => (
            <Card key={recipient.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{recipient.name}</h3>
                    {recipient.date_of_birth && (
                      <p className="text-sm text-muted-foreground">
                        {calculateAge(recipient.date_of_birth)} años
                      </p>
                    )}
                  </div>
                </div>
                {recipient.notes && (
                  <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    📝 {recipient.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Today's Schedules with Tasks */}
      {todaySchedules.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="text-green-600">●</span> Hoy - {t.days.long[today]}
          </h2>
          {todaySchedules.map((schedule) => {
            const scheduleTasks = tasks.filter(t => t.schedule_id === schedule.id)
            const completedTasks = scheduleTasks.filter(t => getTaskStatus(t.id) === 'completed').length
            
            return (
              <Card key={schedule.id} className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {schedule.care_recipients?.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                      {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {scheduleTasks.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>{t.tasks.title}</span>
                        <span>{completedTasks}/{scheduleTasks.length} {t.common.completed.toLowerCase()}</span>
                      </div>
                      {scheduleTasks.slice(0, 3).map((task) => {
                        const status = getTaskStatus(task.id)
                        return (
                          <div 
                            key={task.id}
                            className={`p-3 rounded-lg border ${
                              status === 'completed' 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}>
                                {task.title}
                              </span>
                              {status && (
                                <Badge variant={status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                  {status === 'completed' ? '✓' : status === 'skipped' ? '⏭' : '✕'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {scheduleTasks.length > 3 && (
                        <Link 
                          href="/guest/dashboard/tasks"
                          className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
                        >
                          Ver todas las tareas ({scheduleTasks.length})
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t.tasks.noTasksForShift}
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
            <p className="text-muted-foreground">{t.dashboard.noSchedulesToday}</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{getCompletedCount()}</p>
              <p className="text-sm text-muted-foreground">{t.tasks.statusCompleted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-foreground">{tasks.length - getCompletedCount()}</p>
              <p className="text-sm text-muted-foreground">{t.common.pending}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Today's Medications */}
      {medications.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            💊 Medicamentos de hoy
          </h2>
          {medications.map((med) => {
            // Filter schedules for today (daily or matching day_of_week)
            const todaySchedules = med.medication_schedules.filter(
              ms => ms.frequency === 'daily' || ms.day_of_week === today
            )
            
            if (todaySchedules.length === 0) return null
            
            return (
              <Card key={med.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{med.name}</h3>
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                    </div>
                    <div className="text-right">
                      {todaySchedules.map((ms) => (
                        <Badge key={ms.id} variant="outline" className="ml-1">
                          {ms.scheduled_time.slice(0, 5)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {med.instructions && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      📋 {med.instructions}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
          <Link 
            href="/guest/dashboard/medications"
            className="block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
          >
            Ver todos los medicamentos →
          </Link>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            📅 Próximas citas
          </h2>
          {upcomingAppointments.map((apt) => {
            const aptDate = new Date(apt.appointment_date + 'T00:00:00')
            const isToday = apt.appointment_date === new Date().toISOString().split('T')[0]
            
            return (
              <Card key={apt.id} className={isToday ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {formatAppointmentType(apt.type)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {apt.care_recipients?.name}
                      </p>
                      {apt.location && (
                        <p className="text-sm text-muted-foreground">
                          📍 {apt.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={isToday ? 'default' : 'outline'} className={isToday ? 'bg-orange-500' : ''}>
                        {isToday ? 'Hoy' : formatDateShortSpanish(aptDate)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {apt.appointment_time.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  {apt.notes && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      {apt.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* All Assigned Schedules */}
      {allSchedules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-t pt-6">
            🗓️ Todos mis horarios asignados
          </h2>
          
          {sortedDays.map((dayIndex) => {
            const daySchedules = schedulesByDay[dayIndex]
            if (daySchedules.length === 0) return null
            
            const isToday = dayIndex === today
            
            return (
              <div key={dayIndex} className="space-y-2">
                <h3 className={`text-sm font-medium ${isToday ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {isToday && '● '}{t.days.long[dayIndex]}
                  {isToday && ' (Hoy)'}
                </h3>
                {daySchedules.map((schedule) => (
                  <Card key={schedule.id} className={isToday ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' : ''}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {schedule.care_recipients?.name}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                          {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* No schedules at all */}
      {allSchedules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tienes horarios asignados</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
