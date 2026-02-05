'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox

      // Add event listeners to handle PWA lifecycle events
      wb.addEventListener('installed', (event: any) => {
        console.log(`[SW] Service worker installed:`, event)
      })

      wb.addEventListener('controlling', (event: any) => {
        console.log(`[SW] Service worker is controlling:`, event)
      })

      wb.addEventListener('activated', (event: any) => {
        console.log(`[SW] Service worker activated:`, event)
      })

      // Register the service worker
      wb.register()
    } else if ('serviceWorker' in navigator) {
      // Fallback manual registration if workbox is not available
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[SW] Service worker registered:', registration)
        })
        .catch((error) => {
          console.error('[SW] Service worker registration failed:', error)
        })
    }
  }, [])

  return null
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    workbox: any
  }
}
