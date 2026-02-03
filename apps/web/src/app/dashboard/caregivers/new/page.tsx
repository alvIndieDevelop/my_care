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
      <div className="max-w-md mx-auto px-4 sm:px-0">
        <Card>
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <div className="text-green-600 dark:text-green-400 text-4xl sm:text-5xl mb-4">✓</div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">¡Cuidador Agregado!</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Redirigiendo a la lista de cuidadores...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <Link 
          href="/dashboard/caregivers" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 min-h-[44px] inline-flex items-center"
        >
          ← {t.common.back} {t.caregivers.title}
        </Link>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">{t.caregivers.createTitle}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t.caregivers.createSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">{t.auth.email} *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="cuidador@ejemplo.com"
                required
                className="min-h-[44px]"
              />
              <p className="text-xs text-muted-foreground">
                {t.caregivers.emailUsed}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm">{t.auth.fullName}</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="María García"
                className="min-h-[44px]"
              />
              <p className="text-xs text-muted-foreground">
                {t.caregivers.optionalName}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">{t.caregivers.phone}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+507 6123-4567"
                className="min-h-[44px]"
              />
              <p className="text-xs text-muted-foreground">
                {t.caregivers.optionalPhone}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 min-h-[44px]">
                {loading ? t.caregivers.adding : t.caregivers.addNew}
              </Button>
              <Link href="/dashboard/caregivers" className="sm:w-auto">
                <Button type="button" variant="outline" className="w-full min-h-[44px]">
                  {t.common.cancel}
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 sm:mt-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base">{t.caregivers.howItWorks}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-muted-foreground space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
          <p>1. {t.caregivers.step1} <code className="bg-muted px-1 rounded text-xs">/signup</code></p>
          <p>2. {t.caregivers.step2}</p>
          <p>3. {t.caregivers.step3}</p>
        </CardContent>
      </Card>
    </div>
  )
}
