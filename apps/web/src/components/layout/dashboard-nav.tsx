'use client'

import { useState, useRef, useEffect } from 'react'
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

interface NavDropdownProps {
  label: string
  items: { href: string; label: string }[]
  pathname: string
}

function NavDropdown({ label, items, pathname }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check if any item in this dropdown is active
  const isActive = items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
          isActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        {label}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg py-1 min-w-[180px] z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 text-sm transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function DashboardNav({ profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = profile.role === 'admin'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Admin navigation structure with dropdowns
  const adminNavGroups = {
    main: { href: '/dashboard', label: '🏠 ' + t.nav.dashboard },
    gestion: {
      label: '👥 Gestión',
      items: [
        { href: '/dashboard/care-recipients', label: '👤 ' + t.nav.careRecipients },
        { href: '/dashboard/caregivers', label: '👥 ' + t.nav.caregivers },
        { href: '/dashboard/schedules', label: '📅 ' + t.nav.schedules },
      ]
    },
    salud: {
      label: '💊 Salud',
      items: [
        { href: '/dashboard/appointments', label: '📋 ' + t.nav.appointments },
        { href: '/dashboard/medications', label: '💊 ' + t.nav.medications },
      ]
    },
    analytics: { href: '/dashboard/analytics', label: '📊 ' + t.nav.analytics },
  }

  // Flat list for mobile
  const adminLinksMobile = [
    { href: '/dashboard', label: '🏠 ' + t.nav.dashboard },
    { href: '/dashboard/care-recipients', label: '👤 ' + t.nav.careRecipients },
    { href: '/dashboard/caregivers', label: '👥 ' + t.nav.caregivers },
    { href: '/dashboard/schedules', label: '📅 ' + t.nav.schedules },
    { href: '/dashboard/appointments', label: '📋 ' + t.nav.appointments },
    { href: '/dashboard/medications', label: '💊 ' + t.nav.medications },
    { href: '/dashboard/analytics', label: '📊 ' + t.nav.analytics },
  ]

  const caregiverLinks = [
    { href: '/dashboard', label: t.nav.today },
    { href: '/dashboard/tasks', label: t.nav.tasks },
    { href: '/dashboard/medications', label: t.nav.medications },
    { href: '/dashboard/appointments', label: t.nav.appointments },
  ]

  const roleLabel = profile.role === 'admin' ? 'Administrador' : 'Cuidador'

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="font-bold text-xl text-blue-600 dark:text-blue-400">
            MyCare
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {isAdmin ? (
              <>
                {/* Dashboard link */}
                <Link
                  href={adminNavGroups.main.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === adminNavGroups.main.href
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {adminNavGroups.main.label}
                </Link>

                {/* Gestión dropdown */}
                <NavDropdown
                  label={adminNavGroups.gestion.label}
                  items={adminNavGroups.gestion.items}
                  pathname={pathname}
                />

                {/* Salud dropdown */}
                <NavDropdown
                  label={adminNavGroups.salud.label}
                  items={adminNavGroups.salud.items}
                  pathname={pathname}
                />

                {/* Analytics link */}
                <Link
                  href={adminNavGroups.analytics.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === adminNavGroups.analytics.href
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {adminNavGroups.analytics.label}
                </Link>
              </>
            ) : (
              caregiverLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              {t.auth.signOut}
            </Button>
          </div>
        </div>

        {/* Navigation Links - Mobile */}
        <div className="md:hidden relative pb-3">
          {/* Left scroll indicator */}
          <div className="absolute left-0 top-0 bottom-3 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          
          {/* Scrollable navigation */}
          <div className="flex overflow-x-auto space-x-1 scrollbar-hide px-4">
            {(isAdmin ? adminLinksMobile : caregiverLinks).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Right scroll indicator */}
          <div className="absolute right-0 top-0 bottom-3 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </nav>
  )
}
