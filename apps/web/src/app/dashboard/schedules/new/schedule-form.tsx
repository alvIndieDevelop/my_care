'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { t } from '@/lib/translations'

interface CareRecipient {
  id: string
  name: string
}

interface Caregiver {
  id: string
  full_name: string | null
  profile_id: string | null
  profiles: {
    full_name: string
  } | null
}

interface ScheduleFormProps {
  careRecipients: CareRecipient[]
  caregivers: Caregiver[]
  defaultCaregiverId?: string
  defaultCareRecipientId?: string
}

export function ScheduleForm({ 
  careRecipients, 
  caregivers, 
  defaultCaregiverId,
  defaultCareRecipientId 
}: ScheduleFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [careRecipientId, setCareRecipientId] = useState(defaultCareRecipientId || '')
  const [caregiverId, setCaregiverId] = useState(defaultCaregiverId || '')
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('16:00')

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b)
    )
  }

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6])
  }

  const selectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5])
  }

  const selectWeekends = () => {
    setSelectedDays([0, 6])
  }

  const clearDays = () => {
    setSelectedDays([])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!careRecipientId || !caregiverId || selectedDays.length === 0) {
      setError(t.errors.fillRequired)
      setLoading(false)
      return
    }

    try {
      // Create schedule entries for each selected day
      const scheduleEntries = selectedDays.map(dayOfWeek => ({
        care_recipient_id: careRecipientId,
        caregiver_id: caregiverId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      }))

      const { error: insertError } = await supabase
        .from('schedules')
        .insert(scheduleEntries)

      if (insertError) throw insertError

      router.push('/dashboard/schedules')
      router.refresh()
    } catch (err) {
      console.error('Error creating schedule:', err)
      setError(t.errors.failedToCreate)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="careRecipient">{t.schedules.careRecipient} *</Label>
        <Select value={careRecipientId} onValueChange={setCareRecipientId}>
          <SelectTrigger>
            <SelectValue placeholder={t.schedules.selectCareRecipient} />
          </SelectTrigger>
          <SelectContent>
            {careRecipients.map((recipient) => (
              <SelectItem key={recipient.id} value={recipient.id}>
                {recipient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {careRecipients.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t.schedules.noCareRecipientsYet} <Link href="/dashboard/care-recipients/new" className="underline">{t.schedules.addOneFirst}</Link>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="caregiver">{t.schedules.caregiver} *</Label>
        <Select value={caregiverId} onValueChange={setCaregiverId}>
          <SelectTrigger>
            <SelectValue placeholder={t.schedules.selectCaregiver} />
          </SelectTrigger>
          <SelectContent>
            {caregivers.map((caregiver) => {
              const name = caregiver.profiles?.full_name || caregiver.full_name || 'Desconocido'
              const isGuest = !caregiver.profile_id
              return (
                <SelectItem key={caregiver.id} value={caregiver.id}>
                  {name}{isGuest ? ' (Invitado)' : ''}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {caregivers.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {t.schedules.noCaregiversYet} <Link href="/dashboard/caregivers/new" className="underline">{t.schedules.addOneFirst}</Link>
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label>{t.schedules.daysOfWeek} *</Label>
        
        {/* Quick selection buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={selectWeekdays}
            className="text-xs"
          >
            Lun-Vie
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={selectWeekends}
            className="text-xs"
          >
            Fin de semana
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={selectAllDays}
            className="text-xs"
          >
            Todos
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={clearDays}
            className="text-xs"
          >
            Limpiar
          </Button>
        </div>

        {/* Day checkboxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {t.days.long.map((day, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-2"
            >
              <Checkbox
                id={`day-${index}`}
                checked={selectedDays.includes(index)}
                onCheckedChange={() => toggleDay(index)}
              />
              <label
                htmlFor={`day-${index}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-foreground"
              >
                {day}
              </label>
            </div>
          ))}
        </div>

        {selectedDays.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedDays.length} día{selectedDays.length !== 1 ? 's' : ''} seleccionado{selectedDays.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">{t.schedules.startTime} *</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">{t.schedules.endTime} *</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={loading || careRecipients.length === 0 || caregivers.length === 0 || selectedDays.length === 0} 
          className="flex-1"
        >
          {loading ? t.schedules.creating : t.schedules.addNew}
        </Button>
        <Link href="/dashboard/schedules">
          <Button type="button" variant="outline">
            {t.common.cancel}
          </Button>
        </Link>
      </div>
    </form>
  )
}
