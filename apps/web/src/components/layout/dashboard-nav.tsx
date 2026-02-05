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
  isAdmin: boolean
  isCaregiver: boolean
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

// Hamburger menu icon component
function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {isOpen ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  )
}

export function DashboardNav({ profile, isAdmin, isCaregiver }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

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

  // Flat list for mobile menu
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

  // Determine role label
  const roleLabel = isAdmin && isCaregiver ? 'Admin y Cuidador' : 
                    isAdmin ? 'Administrador' : 'Cuidador'

  // Show admin menu if admin, or if only caregiver show caregiver menu
  const showAdminMenu = isAdmin
  const showCaregiverMobileMenu = isCaregiver && !isAdmin

  return (
    <>
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button - Show for admin or caregiver-only */}
            {(showAdminMenu || showCaregiverMobileMenu) && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Toggle menu"
              >
                <HamburgerIcon isOpen={mobileMenuOpen} />
              </button>
            )}

            {/* Logo */}
            <Link href="/dashboard" className="font-bold text-xl text-blue-600 dark:text-blue-400">
              MyCare
            </Link>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {showAdminMenu ? (
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

                  {/* Add caregiver dropdown if dual role */}
                  {isCaregiver && (
                    <>
                      <div className="h-6 w-px bg-border mx-2" />
                      <NavDropdown
                        label="👤 Mi Turno"
                        items={caregiverLinks.slice(1)}
                        pathname={pathname}
                      />
                    </>
                  )}
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
            <div className="flex items-center space-x-2 sm:space-x-3">
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

          {/* Caregiver Mobile Navigation - Bottom bar style (only for caregiver-only users) */}
          {showCaregiverMobileMenu && (
            <div className="relative md:hidden">
              {/* Left fade indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
              
              {/* Scrollable content */}
              <div className="pb-3 flex overflow-x-auto space-x-1 scrollbar-hide px-8">
                {caregiverLinks.map((link) => (
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
              
              {/* Right fade indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Slide-out Menu - For admin or dual role users */}
      {showAdminMenu && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-out drawer */}
          <div
            className={`fixed top-0 left-0 h-full w-72 bg-background border-r border-border z-50 md:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-bold text-xl text-blue-600 dark:text-blue-400">MyCare</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Close menu"
              >
                <HamburgerIcon isOpen={true} />
              </button>
            </div>

            {/* User info */}
            <div className="p-4 border-b border-border">
              <p className="font-medium text-foreground">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
            </div>

            {/* Admin Navigation links */}
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Administración
              </div>
              {adminLinksMobile.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-base transition-colors ${
                    pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-r-4 border-blue-600'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Caregiver Navigation links (if dual role) */}
            {isCaregiver && (
              <div className="py-2 border-t border-border">
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  Mi Turno
                </div>
                {caregiverLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-base transition-colors ${
                      pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-r-4 border-green-600'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
