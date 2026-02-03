'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileBottomNavProps {
  isAdmin: boolean
}

const caregiverLinks = [
  { href: '/dashboard', label: 'Hoy', icon: '🏠' },
  { href: '/dashboard/tasks', label: 'Tareas', icon: '✓' },
  { href: '/dashboard/medications', label: 'Medicinas', icon: '💊' },
  { href: '/dashboard/settings', label: 'Ajustes', icon: '⚙️' },
]

const adminLinks = [
  { href: '/dashboard', label: 'Panel', icon: '🏠' },
  { href: '/dashboard/care-recipients', label: 'Personas', icon: '❤️' },
  { href: '/dashboard/caregivers', label: 'Equipo', icon: '👥' },
  { href: '/dashboard/schedules', label: 'Horarios', icon: '📅' },
  { href: '/dashboard/more', label: 'Más', icon: '•••' },
]

export function MobileBottomNav({ isAdmin }: MobileBottomNavProps) {
  const pathname = usePathname()
  
  const links = isAdmin ? adminLinks : caregiverLinks
  
  // Check if current path matches or starts with the link href
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (href === '/dashboard/more') {
      // "More" is active when on appointments or medications (admin)
      return pathname.startsWith('/dashboard/appointments') || 
             pathname.startsWith('/dashboard/medications')
    }
    return pathname.startsWith(href)
  }
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center w-full h-full touch-target transition-colors ${
              isActive(link.href)
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-2xl" role="img" aria-label={link.label}>
              {link.icon}
            </span>
            <span className="text-xs mt-1 font-medium">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
