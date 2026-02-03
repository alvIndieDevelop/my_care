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

export default function GuestLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessCode, setAccessCode] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const code = accessCode.trim()
    if (!code || code.length !== 6) {
      setError(t.guestAccess.invalidCode)
      setLoading(false)
      return
    }

    try {
      // Look up caregiver by access code
      const { data: caregiver, error: lookupError } = await supabase
        .from('caregivers')
        .select('id, full_name, is_active, access_code')
        .eq('access_code', code)
        .single()

      if (lookupError || !caregiver) {
        setError(t.guestAccess.invalidCode)
        setLoading(false)
        return
      }

      if (!caregiver.is_active) {
        setError(t.guestAccess.inactiveCaregiver)
        setLoading(false)
        return
      }

      // Store guest session in localStorage
      const guestSession = {
        caregiverId: caregiver.id,
        caregiverName: caregiver.full_name,
        accessCode: code,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('guestSession', JSON.stringify(guestSession))

      // Redirect to guest dashboard
      router.push('/guest/dashboard')
    } catch (err) {
      console.error('Error logging in as guest:', err)
      setError(t.errors.tryAgain)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t.guestAccess.title}</CardTitle>
          <CardDescription>
            {t.guestAccess.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">{t.guestAccess.accessCode}</Label>
              <Input
                id="accessCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                placeholder={t.guestAccess.accessCodePlaceholder}
                className="text-center text-2xl tracking-widest font-mono"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full min-h-[44px]" 
              disabled={loading || accessCode.length !== 6}
            >
              {loading ? t.guestAccess.entering : t.guestAccess.enterCode}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t.guestAccess.haveAccount}
            </p>
            <Link href="/login">
              <Button variant="outline" className="min-h-[44px]">
                {t.guestAccess.loginWithEmail}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
