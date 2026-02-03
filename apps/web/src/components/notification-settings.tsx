'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function NotificationSettings() {
  const { 
    isSupported, 
    permission, 
    subscription,
    isLoading,
    error,
    subscribe, 
    unsubscribe 
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">🔔 Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Las notificaciones push no están soportadas en este navegador.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Para recibir notificaciones, usa Chrome, Firefox, Edge o Safari en iOS 16.4+.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">🔔 Notificaciones</CardTitle>
        <CardDescription>
          Recibe recordatorios de medicamentos, citas y turnos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {permission === 'granted' && subscription ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span className="text-xl">✓</span>
              <span className="font-medium">Notificaciones activadas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Recibirás recordatorios de medicamentos, citas y turnos en este dispositivo.
            </p>
            <Button 
              variant="outline" 
              onClick={unsubscribe}
              disabled={isLoading}
              className="min-h-[44px]"
            >
              {isLoading ? 'Desactivando...' : 'Desactivar notificaciones'}
            </Button>
          </div>
        ) : permission === 'denied' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="text-xl">✕</span>
              <span className="font-medium">Notificaciones bloqueadas</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Las notificaciones están bloqueadas. Para habilitarlas:
            </p>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Abre la configuración del navegador</li>
              <li>Busca la configuración de sitios</li>
              <li>Encuentra este sitio y permite las notificaciones</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Activa las notificaciones para recibir recordatorios importantes sobre el cuidado.
            </p>
            <Button 
              onClick={subscribe}
              disabled={isLoading}
              className="min-h-[48px] text-base w-full sm:w-auto"
            >
              {isLoading ? 'Activando...' : '🔔 Activar notificaciones'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
