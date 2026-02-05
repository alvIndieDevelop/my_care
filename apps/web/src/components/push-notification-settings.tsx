'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from '@/lib/push/client'
import {
  savePushSubscription,
  deletePushSubscription,
  sendTestPushNotification,
} from '@/app/actions/push-notifications'

export function PushNotificationSettings() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    // Check if push notifications are supported
    setIsSupported(isPushSupported())
    setPermission(getNotificationPermission())
    
    // Check if already subscribed
    checkSubscription()
  }, [])
  
  async function checkSubscription() {
    const subscription = await getPushSubscription()
    setIsSubscribed(!!subscription)
  }
  
  async function handleEnableNotifications() {
    setIsLoading(true)
    
    try {
      // Request permission
      const permission = await requestNotificationPermission()
      setPermission(permission)
      
      if (permission !== 'granted') {
        toast.error('Permiso de notificaciones denegado')
        return
      }
      
      // Subscribe to push notifications
      const subscription = await subscribeToPush()
      
      if (!subscription) {
        toast.error('Error al suscribirse a notificaciones')
        return
      }
      
      // Save subscription to database
      const result = await savePushSubscription(subscription)
      
      if (result.success) {
        setIsSubscribed(true)
        toast.success('Notificaciones activadas correctamente')
      } else {
        toast.error('Error al guardar suscripción')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      toast.error('Error al activar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleDisableNotifications() {
    setIsLoading(true)
    
    try {
      const subscription = await getPushSubscription()
      
      if (subscription) {
        // Unsubscribe from push notifications
        await unsubscribeFromPush()
        
        // Delete subscription from database
        await deletePushSubscription(subscription.endpoint)
      }
      
      setIsSubscribed(false)
      toast.success('Notificaciones desactivadas')
    } catch (error) {
      console.error('Error disabling notifications:', error)
      toast.error('Error al desactivar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleTestNotification() {
    setIsLoading(true)
    
    try {
      const result = await sendTestPushNotification()
      
      if (result.success) {
        toast.success('Notificación de prueba enviada')
      } else {
        toast.error('Error al enviar notificación de prueba')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Error al enviar notificación')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones Push</CardTitle>
          <CardDescription>
            Las notificaciones push no están disponibles en este navegador
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones Push</CardTitle>
        <CardDescription>
          Recibe notificaciones sobre medicamentos, turnos y citas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Estado: {isSubscribed ? '✅ Activadas' : '❌ Desactivadas'}
            </p>
            <p className="text-sm text-muted-foreground">
              Permiso: {permission === 'granted' ? 'Concedido' : permission === 'denied' ? 'Denegado' : 'No solicitado'}
            </p>
          </div>
          
          {!isSubscribed ? (
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading || permission === 'denied'}
            >
              {isLoading ? 'Activando...' : 'Activar Notificaciones'}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleDisableNotifications}
              disabled={isLoading}
            >
              {isLoading ? 'Desactivando...' : 'Desactivar'}
            </Button>
          )}
        </div>
        
        {isSubscribed && (
          <Button
            variant="secondary"
            onClick={handleTestNotification}
            disabled={isLoading}
            className="w-full"
          >
            Enviar Notificación de Prueba
          </Button>
        )}
        
        {permission === 'denied' && (
          <p className="text-sm text-destructive">
            Has denegado el permiso de notificaciones. Para activarlas, debes cambiar la configuración en tu navegador.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
