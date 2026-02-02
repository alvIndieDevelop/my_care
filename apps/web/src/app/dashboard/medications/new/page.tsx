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

interface MedicationSchedule {
  time: string
  frequency: 'daily' | 'weekly'
  dayOfWeek?: number
}

export default function NewMedicationPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [careRecipients, setCareRecipients] = useState<CareRecipient[]>([])

  // Form state
  const [careRecipientId, setCareRecipientId] = useState('')
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [instructions, setInstructions] = useState('')
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([
    { time: '08:00', frequency: 'daily' }
  ])

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('care_recipients')
        .select('id, name')
        .order('name')
      
      if (data) setCareRecipients(data)
    }
    loadData()
  }, [supabase])

  const addSchedule = () => {
    setSchedules([...schedules, { time: '12:00', frequency: 'daily' }])
  }

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const updateSchedule = (index: number, updates: Partial<MedicationSchedule>) => {
    setSchedules(schedules.map((s, i) => i === index ? { ...s, ...updates } : s))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!careRecipientId || !name || !dosage) {
      setError(t.errors.fillRequired)
      setLoading(false)
      return
    }

    try {
      // Create medication
      const { data: medication, error: medError } = await supabase
        .from('medications')
        .insert({
          care_recipient_id: careRecipientId,
          name: name.trim(),
          dosage: dosage.trim(),
          instructions: instructions.trim() || null,
          is_active: true,
        })
        .select()
        .single()

      if (medError) throw medError

      // Create schedules
      if (schedules.length > 0) {
        const scheduleInserts = schedules.map(s => ({
          medication_id: medication.id,
          scheduled_time: s.time,
          frequency: s.frequency,
          day_of_week: s.frequency === 'weekly' ? (s.dayOfWeek ?? 0) : null,
        }))

        const { error: schedError } = await supabase
          .from('medication_schedules')
          .insert(scheduleInserts)

        if (schedError) throw schedError
      }

      router.push('/dashboard/medications')
      router.refresh()
    } catch (err) {
      console.error('Error creating medication:', err)
      setError(t.errors.failedToCreate)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link 
          href="/dashboard/medications" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          ← {t.common.back} {t.medications.title}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.medications.createTitle}</CardTitle>
          <CardDescription>
            {t.medications.createSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t.medications.name} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.medications.namePlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">{t.medications.dosage} *</Label>
              <Input
                id="dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder={t.medications.dosagePlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">{t.medications.instructions}</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstructions(e.target.value)}
                placeholder={t.medications.instructionsPlaceholder}
                rows={2}
              />
            </div>

            {/* Schedules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t.medications.schedule}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                  {t.medications.addTime}
                </Button>
              </div>
              
              {schedules.map((schedule, index) => (
                <div key={index} className="p-3 rounded-lg border border-border bg-muted space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`time-${index}`} className="text-xs">{t.appointments.time}</Label>
                      <Input
                        id={`time-${index}`}
                        type="time"
                        value={schedule.time}
                        onChange={(e) => updateSchedule(index, { time: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`freq-${index}`} className="text-xs">{t.medications.frequency}</Label>
                      <Select 
                        value={schedule.frequency} 
                        onValueChange={(v: 'daily' | 'weekly') => updateSchedule(index, { frequency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">{t.medications.daily}</SelectItem>
                          <SelectItem value="weekly">{t.medications.weekly}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {schedules.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="mt-5 text-red-600 dark:text-red-400"
                        onClick={() => removeSchedule(index)}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                  
                  {schedule.frequency === 'weekly' && (
                    <div>
                      <Label htmlFor={`day-${index}`} className="text-xs">{t.schedules.dayOfWeek}</Label>
                      <Select 
                        value={schedule.dayOfWeek?.toString() || '0'} 
                        onValueChange={(v) => updateSchedule(index, { dayOfWeek: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {t.days.long.map((day, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t.medications.adding : t.medications.addNew}
              </Button>
              <Link href="/dashboard/medications">
                <Button type="button" variant="outline">
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
