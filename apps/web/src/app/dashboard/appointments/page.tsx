import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { t } from '@/lib/translations'
import { AppointmentList } from './appointment-list'

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

export default async function AppointmentsPage() {
  const supabase = await createClient()
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const isAdmin = profile?.role === 'admin'

  let appointments: Appointment[] | null = null

  if (isAdmin) {
    // Admin can see all appointments
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        care_recipients (id, name),
        caregivers (
          id,
          profiles (full_name)
        )
      `)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
    
    appointments = data
  } else {
    // Caregiver can only see appointments for their assigned care recipients
    // First, get the caregiver record for this user
    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!caregiver) {
      // User is not a caregiver, redirect to dashboard
      redirect('/dashboard')
    }

    // Get care recipient IDs from schedules assigned to this caregiver
    const { data: schedules } = await supabase
      .from('schedules')
      .select('care_recipient_id')
      .eq('caregiver_id', caregiver.id)

    const careRecipientIds = [...new Set(schedules?.map(s => s.care_recipient_id) || [])]

    if (careRecipientIds.length === 0) {
      appointments = []
    } else {
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          care_recipients (id, name),
          caregivers (
            id,
            profiles (full_name)
          )
        `)
        .in('care_recipient_id', careRecipientIds)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
      
      appointments = data
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.appointments.title}</h1>
          <p className="text-muted-foreground">
            {isAdmin ? t.appointments.subtitle : 'Citas de las personas a tu cuidado'}
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/appointments/new">
            <Button>{t.appointments.addNew}</Button>
          </Link>
        )}
      </div>

      {appointments && appointments.length > 0 ? (
        <AppointmentList appointments={appointments} isAdmin={isAdmin} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {isAdmin ? t.appointments.noAppointments : 'No hay citas programadas para las personas a tu cuidado'}
            </p>
            {isAdmin && (
              <Link href="/dashboard/appointments/new">
                <Button>{t.appointments.addFirst}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
