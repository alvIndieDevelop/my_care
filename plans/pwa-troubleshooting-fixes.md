# 🔧 PWA Troubleshooting & Fixes

**Issue:** PWA not installable on Android, manifest.json syntax error in console  
**Date:** February 4, 2026  
**Status:** 🔴 Critical - Blocking PWA installation

---

## 🐛 Reported Issues

1. **Manifest Syntax Error**
   - Console shows: "Manifest: Line: 1, column: 1, Syntax error"
   - This typically indicates the manifest is not being served correctly

2. **Android Installation Blocked**
   - App cannot be installed on Android devices
   - No "Add to Home Screen" prompt appears

---

## 🔍 Root Cause Analysis

### Potential Issues

#### 1. **Manifest Not Being Served Correctly**

The manifest.json file itself is valid JSON, but it may not be served with the correct MIME type.

**Expected:** `application/manifest+json` or `application/json`  
**Problem:** Server might be serving it as `text/plain` or another type

#### 2. **Next.js Static File Handling**

Next.js serves files from `/public` at the root, but there might be caching or build issues.

#### 3. **Service Worker Registration Issues**

The service worker might not be registering correctly in production, which blocks PWA installation.

#### 4. **Missing Required Manifest Fields**

While the manifest looks complete, some fields might need adjustment for Android.

---

## ✅ Diagnostic Steps

### Step 1: Check Manifest MIME Type

Open Chrome DevTools → Network tab → Reload page → Find `manifest.json` request

**Expected Response Headers:**

```
Content-Type: application/manifest+json
```

**If incorrect:** This is the root cause.

### Step 2: Validate Manifest

Use Chrome DevTools → Application → Manifest

**Check for:**

- ✅ Manifest loads without errors
- ✅ All icons are accessible
- ✅ Start URL is correct
- ✅ Display mode is "standalone"

### Step 3: Check Service Worker

Chrome DevTools → Application → Service Workers

**Expected:**

- Service worker registered
- Status: "activated and running"
- Scope: "/"

### Step 4: Run Lighthouse PWA Audit

Chrome DevTools → Lighthouse → Progressive Web App

**Required scores:**

- Installable: ✅
- PWA Optimized: ✅

---

## 🛠️ Fixes to Implement

### Fix 1: Ensure Correct MIME Type (Vercel Configuration)

**Problem:** Vercel might not be serving manifest.json with correct MIME type.

**Solution:** Add `vercel.json` configuration file.

**File:** `apps/web/vercel.json`

```json
{
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

### Fix 2: Simplify Manifest (Remove Problematic Fields)

Some fields in the manifest might cause parsing issues on certain browsers.

**Current issues:**

- `categories` field is not widely supported
- `orientation` might be too restrictive

**Simplified manifest.json:**

```json
{
  "name": "MyCare - Coordinación de Cuidados",
  "short_name": "MyCare",
  "description": "Plataforma de coordinación de cuidados para cuidadores y familias",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "scope": "/",
  "lang": "es",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
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

**Changes:**

- ❌ Removed `categories` (not widely supported)
- ❌ Removed `orientation` (too restrictive, let OS decide)

### Fix 3: Verify Icon Files Exist

All icon files referenced in manifest must exist and be accessible.

**Check these files exist:**

```
apps/web/public/icons/icon-72x72.png
apps/web/public/icons/icon-96x96.png
apps/web/public/icons/icon-128x128.png
apps/web/public/icons/icon-144x144.png
apps/web/public/icons/icon-152x152.png
apps/web/public/icons/icon-192x192.png
apps/web/public/icons/icon-384x384.png
apps/web/public/icons/icon-512x512.png
apps/web/public/icons/icon-maskable-192x192.png
apps/web/public/icons/icon-maskable-512x512.png
apps/web/public/icons/apple-touch-icon.png
```

**Test:** Visit each URL directly in browser:

- `https://your-domain.com/icons/icon-192x192.png`
- Should display the icon, not 404

### Fix 4: Update Next.js Config (Ensure Service Worker Generation)

The current config looks correct, but let's ensure it's optimal for production.

**File:** `apps/web/next.config.ts`

```typescript
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  fallbacks: {
    document: "/offline",
  },
  // Ensure manifest is not cached by service worker
  publicExcludes: ["!manifest.json"],
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA(nextConfig);
```

**Key addition:** `publicExcludes: ["!manifest.json"]` ensures manifest is always fetched fresh.

### Fix 5: Add Explicit Manifest Link in HTML Head

While Next.js metadata should handle this, adding an explicit link can help.

**File:** `apps/web/src/app/layout.tsx`

Add to `<head>` section:

```tsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="MyCare" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#2563eb" />
</head>
```

---

## 📋 Implementation Checklist

### Phase 1: Immediate Fixes (Do First)

- [ ] Create `vercel.json` with correct MIME type headers
- [ ] Simplify `manifest.json` (remove `categories` and `orientation`)
- [ ] Verify all icon files exist and are accessible
- [ ] Add explicit `<link rel="manifest">` to layout.tsx
- [ ] Update `next.config.ts` with `publicExcludes`

### Phase 2: Deploy & Test

- [ ] Commit changes
- [ ] Deploy to Vercel
- [ ] Wait for deployment to complete
- [ ] Clear browser cache (hard refresh: Ctrl+Shift+R)
- [ ] Test manifest loads correctly in DevTools
- [ ] Test service worker registers
- [ ] Run Lighthouse PWA audit

### Phase 3: Android Testing

- [ ] Open site on Android Chrome
- [ ] Check for "Add to Home Screen" prompt
- [ ] Install app
- [ ] Verify standalone mode works
- [ ] Test offline functionality

---

## 🧪 Testing Commands

### Check Manifest Accessibility

```bash
curl -I https://your-domain.com/manifest.json
```

**Expected output:**

```
HTTP/2 200
content-type: application/manifest+json
```

### Check Icon Accessibility

```bash
curl -I https://your-domain.com/icons/icon-192x192.png
```

**Expected output:**

```
HTTP/2 200
content-type: image/png
```

---

## 🎯 Success Criteria

After implementing fixes, verify:

1. **Manifest Loads Without Errors**
   - Chrome DevTools → Application → Manifest shows no errors
   - All fields display correctly
   - All icons load

2. **Service Worker Registers**
   - Chrome DevTools → Application → Service Workers shows active worker
   - No registration errors in console

3. **Lighthouse PWA Score**
   - Installable: ✅ Pass
   - PWA Optimized: ✅ Pass
   - Score: > 90

4. **Android Installation**
   - "Add to Home Screen" prompt appears
   - App installs successfully
   - App opens in standalone mode (no browser UI)
   - App icon appears on home screen

5. **iOS Installation** (Bonus)
   - Safari → Share → Add to Home Screen works
   - App opens in standalone mode
   - Status bar styling correct

---

## 🚨 Common Pitfalls

### 1. Browser Cache

**Problem:** Old manifest cached by browser  
**Solution:** Hard refresh (Ctrl+Shift+R) or clear cache

### 2. Service Worker Cache

**Problem:** Old service worker still active  
**Solution:** Unregister service worker in DevTools, then refresh

### 3. HTTPS Required

**Problem:** PWA only works on HTTPS  
**Solution:** Vercel provides HTTPS by default, but check custom domains

### 4. Icon Paths

**Problem:** Icons referenced with wrong paths  
**Solution:** All paths should start with `/icons/` not `./icons/`

### 5. Manifest Not Found

**Problem:** 404 error when loading manifest  
**Solution:** Ensure file is in `public/` folder, not `public/public/`

---

## 📞 If Issues Persist

### Additional Debugging Steps

1. **Check Vercel Build Logs**
   - Look for PWA-related warnings
   - Verify service worker was generated

2. **Test on Different Devices**
   - Android Chrome
   - Android Firefox
   - iOS Safari
   - Desktop Chrome

3. **Validate Manifest Online**
   - Use: https://manifest-validator.appspot.com/
   - Paste manifest.json content

4. **Check Network Tab**
   - Verify manifest.json returns 200 status
   - Check Content-Type header
   - Look for CORS errors

---

## 🎓 Key Learnings

### Why This Happens

1. **MIME Type Issues:** Servers must serve manifest with correct Content-Type
2. **Caching:** Browsers aggressively cache manifests and service workers
3. **Icon Requirements:** Android requires specific icon sizes (192x192, 512x512)
4. **HTTPS Only:** PWAs only work on secure origins

### Best Practices

1. **Always test in production** - PWA features behave differently in dev vs prod
2. **Use Lighthouse** - Automated testing catches most issues
3. **Test on real devices** - Emulators don't always match real behavior
4. **Keep manifest simple** - Only include widely-supported fields

---

## 📝 Next Steps After Fixes

Once PWA is working:

1. **User Testing**
   - Have real caregivers install the app
   - Gather feedback on installation process
   - Test offline functionality in real scenarios

2. **Push Notifications**
   - Implement notification service
   - Add permission request flow
   - Test on Android (iOS has limitations)

3. **Offline Enhancements**
   - Improve offline page design
   - Add offline data caching
   - Implement background sync

4. **Performance Optimization**
   - Optimize service worker caching strategy
   - Reduce initial load time
   - Improve Time to Interactive (TTI)

---

## 🔗 Resources

- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Vercel Headers Configuration](https://vercel.com/docs/projects/project-configuration#headers)
- [Chrome DevTools PWA Testing](https://developer.chrome.com/docs/devtools/progressive-web-apps/)
