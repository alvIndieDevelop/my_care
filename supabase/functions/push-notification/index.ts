// Supabase Edge Function for sending push notifications
// Deploy with: supabase functions deploy push-notification

import { createClient } from 'npm:@supabase/supabase-js@2'

// Web Push implementation for Deno
// Note: In production, you may want to use a proper web-push library
// For now, we'll use the Web Push protocol directly

interface NotificationPayload {
  user_id: string
  type: 'medication' | 'appointment' | 'shift'
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
  tag?: string
  requireInteraction?: boolean
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload: NotificationPayload = await req.json()

    // Validate required fields
    if (!payload.user_id || !payload.title || !payload.body || !payload.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's push subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_subscription')
      .eq('id', payload.user_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!profile.push_subscription) {
      // Log notification even if no subscription (for history)
      await supabase.from('notifications').insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      })

      return new Response(
        JSON.stringify({ success: false, reason: 'No push subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const subscription = profile.push_subscription as PushSubscription

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      console.error('VAPID keys not configured')
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: payload.url || '/dashboard',
      data: payload.data,
      tag: payload.tag || `${payload.type}-${Date.now()}`,
      requireInteraction: payload.requireInteraction || false,
    })

    // Send push notification using Web Push protocol
    // Note: This is a simplified implementation. For production,
    // consider using a proper web-push library or service
    try {
      const response = await sendWebPush(
        subscription,
        notificationPayload,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      )

      if (response.ok) {
        // Log successful notification
        await supabase.from('notifications').insert({
          user_id: payload.user_id,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data,
        })

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        const errorText = await response.text()
        console.error('Push failed:', response.status, errorText)

        // If subscription is invalid, remove it
        if (response.status === 404 || response.status === 410) {
          await supabase
            .from('profiles')
            .update({ push_subscription: null })
            .eq('id', payload.user_id)
        }

        return new Response(
          JSON.stringify({ success: false, error: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (pushError) {
      console.error('Push error:', pushError)
      return new Response(
        JSON.stringify({ success: false, error: String(pushError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Simplified Web Push implementation
// For production, use a proper library like web-push
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  // This is a placeholder implementation
  // In production, you would use proper VAPID signing and encryption
  // Consider using a service like Firebase Cloud Messaging or a web-push library
  
  const url = new URL(subscription.endpoint)
  
  // For now, we'll make a simple POST request
  // Note: This won't work without proper VAPID authentication
  // You'll need to implement proper JWT signing for VAPID
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aes128gcm',
    'TTL': '86400',
  }

  // Add VAPID authorization header
  // This requires proper JWT signing - simplified for now
  const audience = `${url.protocol}//${url.host}`
  const vapidToken = await createVapidAuthHeader(
    audience,
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )
  
  headers['Authorization'] = `vapid t=${vapidToken}, k=${vapidPublicKey}`

  // Encrypt the payload
  // This requires proper encryption with the subscription keys
  // For now, we'll send unencrypted (won't work in production)
  const encryptedPayload = await encryptPayload(
    payload,
    subscription.keys.p256dh,
    subscription.keys.auth
  )

  return fetch(subscription.endpoint, {
    method: 'POST',
    headers,
    body: encryptedPayload,
  })
}

// Placeholder for VAPID JWT creation
async function createVapidAuthHeader(
  audience: string,
  subject: string,
  publicKey: string,
  privateKey: string
): Promise<string> {
  // In production, implement proper JWT signing
  // For now, return a placeholder
  console.log('Creating VAPID header for:', audience, subject)
  
  // This needs proper implementation with crypto
  // Consider using jose library for JWT
  return 'placeholder-jwt-token'
}

// Placeholder for payload encryption
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<Uint8Array> {
  // In production, implement proper AES-GCM encryption
  // using the subscription's public key and auth secret
  console.log('Encrypting payload with keys')
  
  // This needs proper implementation
  return new TextEncoder().encode(payload)
}
