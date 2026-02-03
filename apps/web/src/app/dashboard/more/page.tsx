import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { t } from '@/lib/translations'

export default async function MorePage() {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get counts
  const [
    { count: appointmentCount },
    { count: medicationCount }
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }).gte('appointment_date', new Date().toISOString().split('T')[0]),
    supabase.from('medications').select('*', { count: 'exact', head: true }).eq('is_active', true)
  ])

  const moreLinks = [
    { 
      href: '/dashboard/appointments', 
      label: t.nav.appointments, 
      description: t.dashboard.upcomingAppointments,
      icon: '🏥',
      count: appointmentCount || 0,
      color: 'text-purple-600 dark:text-purple-400'
    },
    { 
      href: '/dashboard/medications', 
      label: t.nav.medications, 
      description: t.dashboard.activeMedications,
      icon: '💊',
      count: medicationCount || 0,
      color: 'text-orange-600 dark:text-orange-400'
    },
    { 
      href: '/dashboard/settings', 
      label: 'Ajustes', 
      description: 'Configuración de la cuenta',
      icon: '⚙️',
      count: null,
      color: 'text-gray-600 dark:text-gray-400'
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">Más Opciones</h1>
        <p className="text-xs sm:text-base text-muted-foreground">Accede a más funciones de administración</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {moreLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">{link.icon}</span>
                  <span>{link.label}</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{link.description}</CardDescription>
              </CardHeader>
              {link.count !== null && (
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <p className={`text-2xl sm:text-3xl font-bold ${link.color}`}>{link.count}</p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
