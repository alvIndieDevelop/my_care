'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { t } from '@/lib/translations'

export default function NewCareRecipientPage() {
  const [name, setName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase
        .from('care_recipients')
        .insert({
          name,
          date_of_birth: dateOfBirth || null,
          notes: notes || null,
        })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard/care-recipients')
      router.refresh()
    } catch {
      setError(t.errors.failedToCreate)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <Link href="/dashboard/care-recipients" className="text-blue-600 dark:text-blue-400 hover:underline text-sm min-h-[44px] inline-flex items-center">
          ← {t.common.back} {t.careRecipients.title}
        </Link>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">{t.careRecipients.createTitle}</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">{t.careRecipients.createSubtitle}</p>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">{t.careRecipients.name} *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm">{t.careRecipients.dateOfBirth}</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={loading}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">{t.careRecipients.notes}</Label>
              <textarea
                id="notes"
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
                placeholder="Condiciones médicas, preferencias, información importante..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" disabled={loading} className="min-h-[44px]">
                {loading ? t.careRecipients.creating : t.careRecipients.addNew}
              </Button>
              <Link href="/dashboard/care-recipients" className="sm:w-auto">
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
