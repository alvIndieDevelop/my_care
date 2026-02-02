'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { t } from '@/lib/translations'

export default function NewCaregiverPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string

    try {
      // First, check if a profile with this email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (existingProfile) {
        // Profile exists, check if they're already a caregiver
        const { data: existingCaregiver } = await supabase
          .from('caregivers')
          .select('id')
          .eq('profile_id', existingProfile.id)
          .single()

        if (existingCaregiver) {
          setError(t.caregivers.alreadyCaregiver)
          setLoading(false)
          return
        }

        // Add them as a caregiver
        const { error: caregiverError } = await supabase
          .from('caregivers')
          .insert({
            profile_id: existingProfile.id,
            phone: phone || null,
            is_active: true,
          })

        if (caregiverError) throw caregiverError

        setSuccess(true)
        setTimeout(() => router.push('/dashboard/caregivers'), 1500)
        return
      }

      // Profile doesn't exist - we need to invite them
      setError(
        `No se encontró cuenta para ${email}. Pídeles que se registren primero en ${window.location.origin}/signup, luego agrégalos como cuidador.`
      )
      setLoading(false)
      
    } catch (err) {
      console.error('Error adding caregiver:', err)
      setError(t.errors.failedToCreate)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-bold text-foreground mb-2">¡Cuidador Agregado!</h2>
            <p className="text-muted-foreground">Redirigiendo a la lista de cuidadores...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Link 
          href="/dashboard/caregivers" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          ← {t.common.back} {t.caregivers.title}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.caregivers.createTitle}</CardTitle>
          <CardDescription>
            {t.caregivers.createSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cuidador@ejemplo.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t.caregivers.emailUsed}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t.auth.fullName}</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="María García"
              />
              <p className="text-xs text-muted-foreground">
                {t.caregivers.optionalName}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.caregivers.phone}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+507 6123-4567"
              />
              <p className="text-xs text-muted-foreground">
                {t.caregivers.optionalPhone}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t.caregivers.adding : t.caregivers.addNew}
              </Button>
              <Link href="/dashboard/caregivers">
                <Button type="button" variant="outline">
                  {t.common.cancel}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t.caregivers.howItWorks}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. {t.caregivers.step1} <code className="bg-muted px-1 rounded">/signup</code></p>
          <p>2. {t.caregivers.step2}</p>
          <p>3. {t.caregivers.step3}</p>
        </CardContent>
      </Card>
    </div>
  )
}
