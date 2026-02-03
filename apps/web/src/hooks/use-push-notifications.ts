'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PushNotificationState {
  isSupported: boolean
  permission: NotificationPermission
  subscription: PushSubscription | null
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    subscription: null,
    isLoading: false,
    error: null,
  })

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 
        'serviceWorker' in navigator && 
        'PushManager' in window &&
        'Notification' in window

      if (isSupported) {
        const permission = Notification.permission
        
        // Try to get existing subscription
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          
          setState(prev => ({
            ...prev,
            isSupported: true,
            permission,
            subscription,
          }))
        } catch {
          setState(prev => ({
            ...prev,
            isSupported: true,
            permission,
          }))
        }
      } else {
        setState(prev => ({
          ...prev,
          isSupported: false,
        }))
      }
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }))
      return null
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      setState(prev => ({ ...prev, permission }))

      if (permission !== 'granted') {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Notification permission denied' 
        }))
        return null
      }

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'VAPID public key not configured' 
        }))
        return null
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })

      // Save subscription to database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Convert PushSubscriptionJSON to a plain object for storage
        const subscriptionData = JSON.parse(JSON.stringify(subscription.toJSON()))
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ push_subscription: subscriptionData })
          .eq('id', user.id)

        if (dbError) {
          console.error('Error saving push subscription:', dbError)
        }
      }

      setState(prev => ({
        ...prev,
        subscription,
        isLoading: false,
      }))

      return subscription
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      return null
    }
  }, [state.isSupported])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      await state.subscription.unsubscribe()

      // Remove subscription from database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({ push_subscription: null })
          .eq('id', user.id)
      }

      setState(prev => ({
        ...prev,
        subscription: null,
        isLoading: false,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
    }
  }, [state.subscription])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
