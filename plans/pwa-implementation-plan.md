# PWA Implementation Plan for MyCare

## Overview

This plan outlines the implementation of Progressive Web App (PWA) features for the MyCare care coordination application. The goal is to enable users to install the app on their devices and have a native-like experience.

## Current Status

- ❌ No `manifest.json` in public folder
- ❌ No service worker
- ❌ No PWA-related packages installed
- ✅ App is already mobile-responsive
- ✅ App is deployed on Vercel

## PWA Features to Implement

### Phase 1: Basic PWA Setup (Required)

1. **Web App Manifest** (`manifest.json`)
   - App name and short name
   - App icons (192x192, 512x512)
   - Theme color and background color
   - Display mode (standalone)
   - Start URL

2. **App Icons**
   - Create icons in multiple sizes
   - Include maskable icons for Android
   - Apple touch icons for iOS

3. **Service Worker**
   - Cache static assets
   - Enable offline fallback page
   - Handle network requests

### Phase 2: Enhanced Features (Optional - Future)

- Push notifications (requires backend setup)
- Background sync
- Periodic background sync
- Share target API

## Implementation Approach

### Option A: Using `next-pwa` Package (Recommended)

The `next-pwa` package provides automatic service worker generation and caching strategies.

**Pros:**
- Easy setup with Next.js
- Automatic service worker generation
- Built-in caching strategies
- Works well with Vercel

**Cons:**
- Additional dependency
- Less control over service worker

### Option B: Manual Implementation

Create service worker and manifest manually.

**Pros:**
- Full control
- No additional dependencies

**Cons:**
- More complex setup
- Need to handle caching manually

## Recommended: Option A with `next-pwa`

## Technical Implementation

### 1. Install Dependencies

```bash
npm install next-pwa
```

### 2. Create Web App Manifest

File: `apps/web/public/manifest.json`

```json
{
  "name": "MyCare - Coordinación de Cuidados",
  "short_name": "MyCare",
  "description": "Plataforma de coordinación de cuidados para cuidadores",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 3. Update Next.js Config

File: `apps/web/next.config.ts`

```typescript
import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  // existing config
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

### 4. Add Meta Tags to Layout

File: `apps/web/src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: 'MyCare',
  description: 'Plataforma de coordinación de cuidados',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MyCare',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}
```

### 5. Create App Icons

Create the following icons in `apps/web/public/icons/`:

| File | Size | Purpose |
|------|------|---------|
| `icon-192x192.png` | 192x192 | Standard icon |
| `icon-512x512.png` | 512x512 | Standard icon |
| `icon-maskable-192x192.png` | 192x192 | Maskable (Android) |
| `icon-maskable-512x512.png` | 512x512 | Maskable (Android) |
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `favicon.ico` | 32x32 | Browser tab |

### 6. Create Offline Fallback Page

File: `apps/web/src/app/offline/page.tsx`

```tsx
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sin conexión</h1>
        <p className="text-muted-foreground mb-4">
          No hay conexión a internet. Por favor, verifica tu conexión e intenta de nuevo.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}
```

## Icon Design Guidelines

The MyCare app icon should:

1. **Primary Design**: Blue heart with care/hands motif
2. **Colors**: 
   - Primary: `#2563eb` (blue-600)
   - Background: White or transparent
3. **Style**: Simple, recognizable at small sizes
4. **Maskable Safe Zone**: Keep important content within 80% center area

## Testing PWA

### Chrome DevTools

1. Open DevTools → Application tab
2. Check "Manifest" section for errors
3. Check "Service Workers" for registration
4. Run Lighthouse PWA audit

### Installation Test

1. Visit the deployed site on mobile
2. Look for "Add to Home Screen" prompt
3. Install and verify standalone mode

### Offline Test

1. Install the PWA
2. Enable airplane mode
3. Open the app
4. Verify offline page appears

## Deployment Considerations

### Vercel

- Service workers work automatically on Vercel
- No special configuration needed
- HTTPS is provided by default (required for PWA)

### Cache Invalidation

- Service worker updates automatically on new deployments
- Users may need to refresh to get latest version
- Consider adding "Update available" notification

## Timeline

| Task | Estimated Time |
|------|----------------|
| Install and configure next-pwa | 30 min |
| Create manifest.json | 15 min |
| Create app icons | 1 hour |
| Update layout metadata | 15 min |
| Create offline page | 30 min |
| Testing and debugging | 1 hour |
| **Total** | ~3.5 hours |

## Files to Create/Modify

### New Files

- `apps/web/public/manifest.json`
- `apps/web/public/icons/icon-192x192.png`
- `apps/web/public/icons/icon-512x512.png`
- `apps/web/public/icons/icon-maskable-192x192.png`
- `apps/web/public/icons/icon-maskable-512x512.png`
- `apps/web/public/icons/apple-touch-icon.png`
- `apps/web/src/app/offline/page.tsx`

### Modified Files

- `apps/web/package.json` (add next-pwa)
- `apps/web/next.config.ts` (configure PWA)
- `apps/web/src/app/layout.tsx` (add metadata)

## Success Criteria

- [ ] App can be installed on mobile devices
- [ ] App shows in standalone mode (no browser UI)
- [ ] App icon appears on home screen
- [ ] Offline page displays when no connection
- [ ] Lighthouse PWA score > 90
- [ ] No console errors related to PWA

## Bug Fix: Guest Access Button

Before implementing PWA, we need to fix the guest access button on the login page.

### Issue

The button using `asChild` pattern with Link is not navigating properly.

### Current Code (login/page.tsx lines 92-100)

```tsx
<Button
  asChild
  variant="outline"
  className="w-full min-h-[44px]"
>
  <Link href="/guest">
    🔑 Ingresar con código de acceso
  </Link>
</Button>
```

### Fix

Change to the pattern used elsewhere in the app (Link wrapping Button):

```tsx
<Link href="/guest" className="w-full">
  <Button
    variant="outline"
    className="w-full min-h-[44px]"
  >
    🔑 Ingresar con código de acceso
  </Button>
</Link>
```

This pattern is consistent with other navigation buttons in the app and avoids potential issues with the `asChild` prop.
