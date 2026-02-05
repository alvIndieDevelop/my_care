'use server'

import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:noreply@mycare.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  requireInteraction?: boolean
  data?: Record<string, any>
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
) {
  const supabase = await createClient()
  
  // Get all push subscriptions for this user
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching push subscriptions:', error)
    return { success: false, error: error.message }
  }
  
  if (!subscriptions || subscriptions.length === 0) {
    console.log('No push subscriptions found for user:', userId)
    return { success: false, error: 'No subscriptions found' }
  }
  
  // Send notification to all subscriptions
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }
        
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        )
        
        return { success: true, endpoint: sub.endpoint }
      } catch (error: any) {
        console.error('Error sending push notification:', error)
        
        // If subscription is invalid (410 Gone), delete it
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
          console.log('Deleted invalid subscription:', sub.id)
        }
        
        return { success: false, endpoint: sub.endpoint, error: error.message }
      }
    })
  )
  
  const successful = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  
  return {
    success: successful > 0,
    sent: successful,
    failed,
    results,
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
) {
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushNotification(userId, payload))
  )
  
  return results
}
