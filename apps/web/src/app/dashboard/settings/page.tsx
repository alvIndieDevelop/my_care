import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationSettings } from '@/components/notification-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Personaliza tu experiencia en MyCare</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">👤 Perfil</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Tu información de cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Nombre</p>
            <p className="font-medium text-sm sm:text-base">{profile?.full_name}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Email</p>
            <p className="font-medium text-sm sm:text-base break-all">{profile?.email}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Rol</p>
            <p className="font-medium text-sm sm:text-base capitalize">{profile?.role === 'admin' ? 'Administrador' : 'Cuidador'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <NotificationSettings />

      {/* Theme */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">🎨 Apariencia</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Personaliza el tema de la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm sm:text-base">Tema</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Cambia entre modo claro y oscuro</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">ℹ️ Acerca de</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0 sm:p-6 sm:pt-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            MyCare - Coordinación de Cuidado
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Versión 1.0.0
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
