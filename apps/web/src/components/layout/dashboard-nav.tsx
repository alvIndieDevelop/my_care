'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Tables } from '@/types/database'
import { t } from '@/lib/translations'

interface DashboardNavProps {
  profile: Tables<'profiles'>
}

export function DashboardNav({ profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const adminLinks = [
    { href: '/dashboard', label: t.nav.dashboard },
    { href: '/dashboard/care-recipients', label: t.nav.careRecipients },
    { href: '/dashboard/caregivers', label: t.nav.caregivers },
    { href: '/dashboard/schedules', label: t.nav.schedules },
    { href: '/dashboard/appointments', label: t.nav.appointments },
    { href: '/dashboard/medications', label: t.nav.medications },
  ]

  const caregiverLinks = [
    { href: '/dashboard', label: t.nav.today },
    { href: '/dashboard/tasks', label: t.nav.tasks },
    { href: '/dashboard/medications', label: t.nav.medications },
    { href: '/dashboard/appointments', label: t.nav.appointments },
  ]

  const links = isAdmin ? adminLinks : caregiverLinks

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/dashboard" className="font-bold text-lg sm:text-xl text-blue-600 dark:text-blue-400 shrink-0">
            MyCare
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm">
              {t.auth.signOut}
            </Button>
          </div>
        </div>

        {/* Navigation Links - Desktop only (both admin and caregiver use bottom nav on mobile) */}
        <div className="hidden md:flex pb-3 gap-1 overflow-x-auto scrollbar-hide">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === link.href
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
