'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { t } from '@/lib/translations'

interface CareRecipient {
  id: string
  name: string
}

interface Caregiver {
  id: string
  profiles: {
    full_name: string
  } | null
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [careRecipients, setCareRecipients] = useState<CareRecipient[]>([])
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])

  // Form state
  const [careRecipientId, setCareRecipientId] = useState('')
  const [caregiverId, setCaregiverId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('09:00')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadData() {
      const [recipientsRes, caregiversRes] = await Promise.all([
        supabase.from('care_recipients').select('id, name').order('name'),
        supabase.from('caregivers').select('id, profiles(full_name)').eq('is_active', true),
      ])
      
      if (recipientsRes.data) setCareRecipients(recipientsRes.data)
      if (caregiversRes.data) setCaregivers(caregiversRes.data as Caregiver[])
    }
    loadData()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!careRecipientId || !appointmentDate || !type) {
      setError(t.errors.fillRequired)
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          care_recipient_id: careRecipientId,
          caregiver_id: caregiverId || null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          type: type,
          location: location || null,
          notes: notes || null,
          status: 'scheduled',
        })

      if (insertError) throw insertError

      router.push('/dashboard/appointments')
      router.refresh()
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError(t.errors.failedToCreate)
    } finally {
      setLoading(false)
    }
  }

  const appointmentTypes = [
    { value: 'Doctor Visit', label: t.appointments.types.doctorVisit },
    { value: 'Specialist', label: t.appointments.types.specialist },
    { value: 'Lab Work', label: t.appointments.types.labWork },
    { value: 'Physical Therapy', label: t.appointments.types.physicalTherapy },
    { value: 'Dental', label: t.appointments.types.dental },
    { value: 'Eye Exam', label: t.appointments.types.eyeExam },
    { value: 'Other', label: t.appointments.types.other },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <Link 
          href="/dashboard/appointments" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 min-h-[44px] inline-flex items-center"
        >
          ← {t.common.back} {t.appointments.title}
        </Link>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">{t.appointments.createTitle}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t.appointments.createSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="careRecipient" className="text-sm">{t.schedules.careRecipient} *</Label>
              <Select value={careRecipientId} onValueChange={setCareRecipientId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder={t.schedules.selectCareRecipient} />
                </SelectTrigger>
                <SelectContent>
                  {careRecipients.map((recipient) => (
                    <SelectItem key={recipient.id} value={recipient.id} className="min-h-[44px]">
                      {recipient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm">{t.appointments.type} *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((apptType) => (
                    <SelectItem key={apptType.value} value={apptType.value} className="min-h-[44px]">
                      {apptType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentDate" className="text-sm">{t.appointments.date} *</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentTime" className="text-sm">{t.appointments.time} *</Label>
                <Input
                  id="appointmentTime"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm">{t.appointments.location}</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.appointments.locationPlaceholder}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caregiver" className="text-sm">{t.appointments.assignedCaregiver}</Label>
              <Select value={caregiverId} onValueChange={setCaregiverId}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder={t.appointments.selectCaregiverOptional} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="min-h-[44px]">{t.common.none}</SelectItem>
                  {caregivers.map((caregiver) => (
                    <SelectItem key={caregiver.id} value={caregiver.id} className="min-h-[44px]">
                      {caregiver.profiles?.full_name || 'Desconocido'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t.appointments.caregiverHelp}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">{t.appointments.notes}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder={t.appointments.notesPlaceholder}
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 min-h-[44px]">
                {loading ? t.appointments.scheduling : t.appointments.addNew}
              </Button>
              <Link href="/dashboard/appointments" className="sm:w-auto">
                <Button type="button" variant="outline" className="w-full min-h-[44px]">
                  {t.common.cancel}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
