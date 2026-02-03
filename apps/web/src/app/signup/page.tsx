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

export default function SignupPage() {
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
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'caregiver', // Default role, admin can change later
        },
      },
    })

    if (error) {
      setError(t.auth.signupError)
      setLoading(false)
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-4xl sm:text-5xl font-bold text-green-600 dark:text-green-400">✓</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t.auth.checkEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center p-4 pt-0 sm:p-6 sm:pt-0">
            <Link href="/login">
              <Button variant="outline" className="min-h-[44px]">{t.auth.login}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">MyCare</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t.auth.signupTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm">{t.auth.fullName}</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Juan Pérez"
                required
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">{t.auth.email}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">{t.auth.password}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                minLength={6}
                required
                className="min-h-[44px]"
              />
            </div>
            {error && (
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
              {loading ? t.auth.signingUp : t.auth.signup}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
            {t.auth.hasAccount}{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] inline-flex items-center">
              {t.auth.login}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
