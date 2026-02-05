'use server'

import { createClient } from '@/lib/supabase/server'
import { sendPushNotification, sendPushNotificationToUsers } from '@/lib/push/server'

/**
 * Save push subscription to database
 */
export async function savePushSubscription(subscription: PushSubscription) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  const subscriptionData = subscription.toJSON()
  
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscriptionData.keys?.p256dh || '',
      auth: subscriptionData.keys?.auth || '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    },
    {
      onConflict: 'endpoint',
    }
  )
  
  if (error) {
    console.error('Error saving push subscription:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Delete push subscription from database
 */
export async function deletePushSubscription(endpoint: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
  
  if (error) {
    console.error('Error deleting push subscription:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Send medication reminder notification
 */
export async function sendMedicationReminderPush(medicationScheduleId: string) {
  const supabase = await createClient()
  
  // Get medication schedule with related data
  const { data: schedule, error } = await supabase
    .from('medication_schedules')
    .select(`
      *,
      medications (
        name,
        dosage,
        care_recipient_id,
        care_recipients (name)
      )
    `)
    .eq('id', medicationScheduleId)
    .single()
  
  if (error || !schedule) {
    return { success: false, error: 'Medication schedule not found' }
  }
  
  // Get caregivers assigned to this care recipient
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      caregivers (
        profile_id
      )
    `)
    .eq('care_recipient_id', schedule.medications.care_recipient_id)
  
  if (!schedules || schedules.length === 0) {
    return { success: false, error: 'No caregivers found' }
  }
  
  // Get unique caregiver profile IDs
  const caregiverIds = [
    ...new Set(
      schedules
        .map((s) => s.caregivers?.profile_id)
        .filter((id): id is string => !!id)
    ),
  ]
  
  // Send push notification to all caregivers
  const results = await sendPushNotificationToUsers(caregiverIds, {
    title: '💊 Recordatorio de Medicamento',
    body: `${schedule.medications.name} - ${schedule.medications.dosage} para ${schedule.medications.care_recipients.name}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `medication-${medicationScheduleId}`,
    url: '/dashboard/medications',
    requireInteraction: true,
    data: {
      type: 'medication',
      medicationScheduleId,
    },
  })
  
  return { success: true, results }
}

/**
 * Send shift reminder notification
 */
export async function sendShiftReminderPush(scheduleId: string, shiftDate: string) {
  const supabase = await createClient()
  
  // Get schedule with related data
  const { data: schedule, error } = await supabase
    .from('schedules')
    .select(`
      *,
      care_recipients (name),
      caregivers (profile_id)
    `)
    .eq('id', scheduleId)
    .single()
  
  if (error || !schedule) {
    return { success: false, error: 'Schedule not found' }
  }
  
  if (!schedule.caregivers?.profile_id) {
    return { success: false, error: 'Caregiver not found' }
  }
  
  // Send push notification
  const result = await sendPushNotification(schedule.caregivers.profile_id, {
    title: '📅 Recordatorio de Turno',
    body: `Turno con ${schedule.care_recipients.name} - ${schedule.start_time} a ${schedule.end_time}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `shift-${scheduleId}-${shiftDate}`,
    url: '/dashboard/schedules',
    data: {
      type: 'shift',
      scheduleId,
      shiftDate,
    },
  })
  
  return result
}

/**
 * Send appointment reminder notification
 */
export async function sendAppointmentReminderPush(appointmentId: string) {
  const supabase = await createClient()
  
  // Get appointment with related data
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      care_recipients (name),
      caregivers (profile_id)
    `)
    .eq('id', appointmentId)
    .single()
  
  if (error || !appointment) {
    return { success: false, error: 'Appointment not found' }
  }
  
  if (!appointment.caregivers?.profile_id) {
    return { success: false, error: 'Caregiver not found' }
  }
  
  // Send push notification
  const result = await sendPushNotification(appointment.caregivers.profile_id, {
    title: '🏥 Recordatorio de Cita',
    body: `${appointment.type} - ${appointment.care_recipients.name} - ${appointment.appointment_time}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `appointment-${appointmentId}`,
    url: '/dashboard/appointments',
    requireInteraction: true,
    data: {
      type: 'appointment',
      appointmentId,
    },
  })
  
  return result
}

/**
 * Send urgent shift note notification
 */
export async function sendUrgentShiftNotePush(shiftNoteId: string) {
  const supabase = await createClient()
  
  // Get shift note with related data
  const { data: note, error } = await supabase
    .from('shift_notes')
    .select(`
      *,
      schedules (
        care_recipient_id,
        care_recipients (name)
      )
    `)
    .eq('id', shiftNoteId)
    .single()
  
  if (error || !note) {
    return { success: false, error: 'Shift note not found' }
  }
  
  // Get all caregivers for this care recipient (except the one who wrote the note)
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      caregivers (profile_id)
    `)
    .eq('care_recipient_id', note.schedules.care_recipient_id)
    .neq('caregiver_id', note.caregiver_id)
  
  if (!schedules || schedules.length === 0) {
    return { success: false, error: 'No other caregivers found' }
  }
  
  // Get unique caregiver profile IDs
  const caregiverIds = [
    ...new Set(
      schedules
        .map((s) => s.caregivers?.profile_id)
        .filter((id): id is string => !!id)
    ),
  ]
  
  // Send push notification to all other caregivers
  const results = await sendPushNotificationToUsers(caregiverIds, {
    title: '⚠️ Nota Urgente',
    body: `Nueva nota urgente sobre ${note.schedules.care_recipients.name}`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `urgent-note-${shiftNoteId}`,
    url: '/dashboard',
    requireInteraction: true,
    data: {
      type: 'urgent-note',
      shiftNoteId,
    },
  })
  
  return { success: true, results }
}

/**
 * Test push notification
 */
export async function sendTestPushNotification() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }
  
  const result = await sendPushNotification(user.id, {
    title: '🔔 Notificación de Prueba',
    body: 'Si ves esto, las notificaciones push están funcionando correctamente! ✅',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'test-notification',
    url: '/dashboard',
  })
  
  return result
}
