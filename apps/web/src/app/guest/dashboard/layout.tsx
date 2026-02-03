'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/translations'
import Link from 'next/link'

interface GuestSession {
  caregiverId: string
  caregiverName: string
  accessCode: string
  createdAt: string
}

export default function GuestDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for guest session
    const sessionData = localStorage.getItem('guestSession')
    if (!sessionData) {
      router.push('/guest')
      return
    }

    try {
      const session = JSON.parse(sessionData) as GuestSession
      // Check if session is still valid (24 hours)
      const createdAt = new Date(session.createdAt)
      const now = new Date()
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        // Session expired
        localStorage.removeItem('guestSession')
        router.push('/guest')
        return
      }

      setGuestSession(session)
    } catch {
      localStorage.removeItem('guestSession')
      router.push('/guest')
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('guestSession')
    router.push('/guest')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t.common.loading}</p>
      </div>
    )
  }

  if (!guestSession) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Guest Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-amber-50 dark:bg-amber-900/20">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
              {t.guestAccess.guestSession}
            </span>
            <span className="text-sm font-medium text-foreground">
              {guestSession.caregiverName}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
          >
            {t.guestAccess.exitGuestSession}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation for Guest */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around h-16">
          <Link 
            href="/guest/dashboard" 
            className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-xl">📋</span>
            <span className="text-xs mt-1">{t.nav.today}</span>
          </Link>
          <Link 
            href="/guest/dashboard/tasks" 
            className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-xl">✓</span>
            <span className="text-xs mt-1">{t.nav.tasks}</span>
          </Link>
          <Link 
            href="/guest/dashboard/medications" 
            className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-xl">💊</span>
            <span className="text-xs mt-1">{t.nav.medications}</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
