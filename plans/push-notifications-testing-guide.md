# 🧪 Push Notifications Testing Guide

## Prerequisites

Before testing, make sure you've completed:

- ✅ Run database migration in Supabase SQL Editor
- ✅ Add Supabase credentials to `.env.local`
- ✅ Start dev server: `npm run dev`

## Step-by-Step Testing

### 1. Enable Notifications

1. **Open the app** in your browser (http://localhost:3000)
2. **Log in** to your account
3. **Go to Dashboard** - You should see "Notificaciones Push" card
4. **Click "Activar Notificaciones"** button
5. **Grant permission** when browser prompts you

**Expected Result:**

- Status changes to "✅ Activadas"
- "Enviar Notificación de Prueba" button appears
- No errors in console

### 2. Send Test Notification

1. **Click "Enviar Notificación de Prueba"** button
2. **Wait 1-2 seconds**

**Expected Result:**

- You should see a notification appear on your screen
- Notification should say: "🔔 Notificación de Prueba"
- Body text: "Si ves esto, las notificaciones push están funcionando correctamente! ✅"

### 3. Test Notification Click

1. **Click on the notification**

**Expected Result:**

- Browser should focus/open the app
- Should navigate to `/dashboard`

### 4. Test with App Closed

1. **Close the browser tab** (or minimize it)
2. **Send another test notification** (you'll need to open the app again to click the button)
3. **Close the tab again**

**Expected Result:**

- Notification should still appear even with app closed
- Clicking notification should reopen the app

### 5. Test on Mobile (Android)

1. **Install the PWA** on your Android device
2. **Enable notifications** in the app
3. **Send test notification**
4. **Close the app completely**
5. **Send another notification** (from another device or browser)

**Expected Result:**

- Notification appears on Android even when app is closed
- Clicking opens the app

## Troubleshooting

### Issue: "Activar Notificaciones" button doesn't work

**Check:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors

**Common causes:**

- Service worker not registered
- VAPID keys not configured
- Database migration not applied

**Fix:**

1. Check service worker: DevTools → Application → Service Workers
2. Verify VAPID keys in `.env.local`
3. Run database migration

### Issue: Permission denied

**Check:**

- Browser notification settings
- Site permissions

**Fix:**

1. Go to browser settings
2. Find site permissions for localhost:3000
3. Allow notifications
4. Refresh page and try again

### Issue: Notification doesn't appear

**Check:**

1. Browser console for errors
2. Network tab for failed requests
3. Service worker console logs

**Fix:**

1. Check if service worker is active: DevTools → Application → Service Workers
2. Verify subscription was saved to database
3. Check server logs for errors

### Issue: Database error when saving subscription

**Cause:** Migration not applied

**Fix:**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the migration from `plans/migration-push-subscriptions.sql`

## Testing Checklist

- [ ] Enable notifications (permission granted)
- [ ] Send test notification (notification appears)
- [ ] Click notification (opens app)
- [ ] Test with app closed (notification still appears)
- [ ] Test on mobile Android (works on mobile)
- [ ] Disable notifications (status changes to disabled)
- [ ] Re-enable notifications (works again)

## Browser DevTools Debugging

### Check Service Worker

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. You should see: `sw.js` with status "activated and is running"

### Check Push Subscription

1. In Application tab
2. Click **Push Messaging** in left sidebar
3. You should see subscription details with endpoint

### Check Console Logs

Look for these messages:

- `[Service Worker] Loaded with push notification support`
- `Notification permission: granted`
- `Subscribed to push notifications`
- `✅ Email sent:` (when test notification is sent)

## Manual Testing with curl

You can also test push notifications manually using curl:

```bash
# Get your subscription details from browser console
# Then use web-push CLI to send a test notification

npx web-push send-notification \
  --endpoint="YOUR_ENDPOINT" \
  --key="YOUR_P256DH_KEY" \
  --auth="YOUR_AUTH_KEY" \
  --vapid-subject="mailto:noreply@mycare.app" \
  --vapid-pubkey="YOUR_VAPID_PUBLIC_KEY" \
  --vapid-pvtkey="YOUR_VAPID_PRIVATE_KEY" \
  --payload='{"title":"Test","body":"Manual test notification"}'
```

## Expected Behavior Summary

### When Enabled

- ✅ Status: "Activadas"
- ✅ Permission: "Concedido"
- ✅ Test button visible
- ✅ Subscription saved to database
- ✅ Service worker active

### When Disabled

- ❌ Status: "Desactivadas"
- ✅ Permission: "Concedido" (permission persists)
- ❌ Test button hidden
- ❌ Subscription removed from database

### Notification Behavior

- Appears on screen (top-right on desktop, notification tray on mobile)
- Shows icon, title, and body text
- Clicking opens app to specified URL
- Works even when app is closed
- Vibrates on mobile (if supported)

## Next Steps After Testing

Once all tests pass:

1. Commit any fixes
2. Create Pull Request
3. Deploy to production
4. Add VAPID keys to Vercel environment variables
5. Test on production
6. Test on real mobile devices

---

**Need Help?**

- Check browser console for errors
- Check service worker console
- Check network tab for failed requests
- Verify database migration was applied
- Verify VAPID keys are correct
