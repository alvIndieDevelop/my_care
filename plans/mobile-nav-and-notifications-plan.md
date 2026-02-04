# 🎯 Mobile Navigation & Push Notifications Implementation Plan

**Date:** February 4, 2026  
**Priority:** High  
**Estimated Time:** 6-8 hours total

---

## 📋 Overview

This plan covers two parallel tracks:

1. **Mobile Navigation Improvements** (2-3 hours)
2. **Push Notifications with Brevo SMTP** (4-5 hours)

---

# Part 1: Mobile Navigation Improvements

## 🎨 Track 1: Admin Mobile Navigation - Scroll Indicators

### Problem

The admin mobile navigation has 7 items in a horizontal scroll, but users can't tell there are more items to the right because:

- Scrollbar is hidden
- No visual indicators
- No gradient fade effects

### Solution

Add gradient overlays on left/right edges to indicate scrollable content.

### Implementation

**File:** `apps/web/src/components/layout/dashboard-nav.tsx`

**Current Code (lines ~218-233):**

```tsx
{/* Navigation Links - Mobile */}
<div className="md:hidden pb-3 flex overflow-x-auto space-x-1 scrollbar-hide">
  {(isAdmin ? adminLinksMobile : caregiverLinks).map((link) => (
    // ... menu items
  ))}
</div>
```

**New Code:**

```tsx
{/* Navigation Links - Mobile */}
<div className="relative md:hidden">
  {/* Left fade indicator */}
  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />

  {/* Scrollable content */}
  <div className="pb-3 flex overflow-x-auto space-x-1 scrollbar-hide px-8">
    {(isAdmin ? adminLinksMobile : caregiverLinks).map((link) => (
      // ... existing menu items
    ))}
  </div>

  {/* Right fade indicator */}
  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
</div>
```

**Changes:**

- Wrap in relative container
- Add left gradient (fades from background color)
- Add right gradient (fades from background color)
- Add padding to scrollable content (px-8) to prevent items from hiding under gradients
- Use `pointer-events-none` so gradients don't block clicks
- Use `z-10` to ensure gradients appear above content

**Time:** 30 minutes

---

## 🎨 Track 2: Guest Bottom Navigation - Active States

### Problem

The guest bottom navigation doesn't show which page is currently active. All links look the same.

### Solution

Add active state styling using `usePathname()` to detect current route.

### Implementation

**File:** `apps/web/src/app/guest/dashboard/layout.tsx`

**Current Code (lines ~103-133):**

```tsx
<Link
  href="/guest/dashboard"
  className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
>
  <Home className="h-5 w-5" />
  <span className="text-xs mt-1">{t.nav.home}</span>
</Link>
```

**New Code:**

```tsx
'use client'

import { usePathname } from 'next/navigation'

// Inside component:
const pathname = usePathname()

// For each link:
<Link
  href="/guest/dashboard"
  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
    pathname === '/guest/dashboard'
      ? 'text-blue-600 dark:text-blue-400 font-semibold'
      : 'text-muted-foreground hover:text-foreground'
  }`}
>
  <Home className={`h-5 w-5 ${pathname === '/guest/dashboard' ? 'stroke-[2.5]' : ''}`} />
  <span className="text-xs mt-1">{t.nav.home}</span>
</Link>
```

**Apply to all 4 navigation links:**

1. `/guest/dashboard` - Home
2. `/guest/dashboard/tasks` - Tasks
3. `/guest/dashboard/medications` - Medications
4. `/guest/dashboard/appointments` - Appointments

**Changes:**

- Add `'use client'` directive at top
- Import `usePathname` from `next/navigation`
- Use `pathname` to check current route
- Apply blue color and bold font when active
- Make icon stroke thicker when active

**Time:** 20 minutes

---

## 🎨 Track 3: Guest Login - Helper Text

### Problem

Users who don't have an access code don't know how to get one.

### Solution

Add informational text explaining that access codes are provided by the admin.

### Implementation

**File:** `apps/web/src/app/guest/page.tsx`

**Add after the access code input (around line ~80):**

```tsx
{
  /* Helper text */
}
<div className="mt-4 p-3 rounded-md bg-muted/50 border border-border">
  <p className="text-sm font-medium text-foreground mb-1">
    ¿No tienes código de acceso?
  </p>
  <p className="text-sm text-muted-foreground">
    Contacta al administrador para obtener tu código de acceso de 6 dígitos. Los
    códigos son personales y te permiten acceder a tus horarios y tareas
    asignadas.
  </p>
</div>;
```

**Changes:**

- Add informational card below access code input
- Explain how to get access code
- Use muted background for subtle appearance
- Keep text concise and helpful

**Time:** 10 minutes

---

# Part 2: Push Notifications with Brevo SMTP

## 📧 Overview

Brevo (formerly Sendinblue) will be used for:

- Email notifications (SMTP)
- Transactional emails
- Notification scheduling

**Note:** Web Push Notifications are separate from email and require additional setup. This plan focuses on email notifications first.

---

## 🔧 Step 1: Brevo Setup & Configuration

### A. Get Brevo SMTP Credentials

**Steps:**

1. Log in to Brevo account
2. Go to Settings → SMTP & API
3. Create new SMTP key
4. Note down:
   - SMTP Server: `smtp-relay.brevo.com`
   - Port: `587` (TLS) or `465` (SSL)
   - Login: Your Brevo email
   - SMTP Key: Generated key

### B. Add Environment Variables

**File:** `apps/web/.env.local` (create if doesn't exist)

```env
# Brevo SMTP Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-email@example.com
BREVO_SMTP_KEY=your-smtp-key-here
BREVO_FROM_EMAIL=noreply@your-domain.com
BREVO_FROM_NAME=MyCare Notifications
```

**File:** `apps/web/.env.example` (for documentation)

```env
# Brevo SMTP Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=
BREVO_SMTP_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=MyCare Notifications
```

**Important:** Add `.env.local` to `.gitignore` (should already be there)

**Time:** 15 minutes

---

## 🔧 Step 2: Install Email Library

### Install Nodemailer

```bash
cd apps/web
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Why Nodemailer?**

- Industry standard for Node.js email
- Works with any SMTP provider
- Simple API
- TypeScript support

**Time:** 5 minutes

---

## 🔧 Step 3: Create Email Service

### Create Email Utility

**File:** `apps/web/src/lib/email/brevo.ts`

```typescript
import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
  secure: process.env.BREVO_SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// Verify connection configuration
export async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
}

// Send email function
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error };
  }
}
```

**Time:** 20 minutes

---

## 🔧 Step 4: Create Email Templates

### Create Template Utilities

**File:** `apps/web/src/lib/email/templates.ts`

```typescript
import { t } from "@/lib/translations";

export interface MedicationReminderData {
  caregiverName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  careRecipientName: string;
}

export function medicationReminderEmail(data: MedicationReminderData) {
  const subject = `Recordatorio: Medicamento ${data.medicationName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; }
          .medication { background-color: white; padding: 15px; border-left: 4px solid #2563eb; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💊 Recordatorio de Medicamento</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${data.caregiverName}</strong>,</p>
            <p>Este es un recordatorio para administrar el siguiente medicamento:</p>
            <div class="medication">
              <p><strong>Paciente:</strong> ${data.careRecipientName}</p>
              <p><strong>Medicamento:</strong> ${data.medicationName}</p>
              <p><strong>Dosis:</strong> ${data.dosage}</p>
              <p><strong>Hora programada:</strong> ${data.scheduledTime}</p>
            </div>
            <p>Por favor, registra la administración en la aplicación después de dar el medicamento.</p>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático de MyCare - Coordinación de Cuidados</p>
            <p>No respondas a este correo</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Recordatorio de Medicamento

Hola ${data.caregiverName},

Este es un recordatorio para administrar el siguiente medicamento:

Paciente: ${data.careRecipientName}
Medicamento: ${data.medicationName}
Dosis: ${data.dosage}
Hora programada: ${data.scheduledTime}

Por favor, registra la administración en la aplicación después de dar el medicamento.

---
Este es un mensaje automático de MyCare - Coordinación de Cuidados
  `;

  return { subject, html, text };
}

export interface ShiftReminderData {
  caregiverName: string;
  careRecipientName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  taskCount: number;
}

export function shiftReminderEmail(data: ShiftReminderData) {
  const subject = `Recordatorio: Turno ${data.shiftDate} - ${data.startTime}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; }
          .shift { background-color: white; padding: 15px; border-left: 4px solid #10b981; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Recordatorio de Turno</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${data.caregiverName}</strong>,</p>
            <p>Tienes un turno programado:</p>
            <div class="shift">
              <p><strong>Paciente:</strong> ${data.careRecipientName}</p>
              <p><strong>Fecha:</strong> ${data.shiftDate}</p>
              <p><strong>Horario:</strong> ${data.startTime} - ${data.endTime}</p>
              <p><strong>Tareas asignadas:</strong> ${data.taskCount}</p>
            </div>
            <p>Recuerda revisar las tareas asignadas en la aplicación antes de comenzar tu turno.</p>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático de MyCare - Coordinación de Cuidados</p>
            <p>No respondas a este correo</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Recordatorio de Turno

Hola ${data.caregiverName},

Tienes un turno programado:

Paciente: ${data.careRecipientName}
Fecha: ${data.shiftDate}
Horario: ${data.startTime} - ${data.endTime}
Tareas asignadas: ${data.taskCount}

Recuerda revisar las tareas asignadas en la aplicación antes de comenzar tu turno.

---
Este es un mensaje automático de MyCare - Coordinación de Cuidados
  `;

  return { subject, html, text };
}

export interface AppointmentReminderData {
  caregiverName: string;
  careRecipientName: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  location?: string;
  notes?: string;
}

export function appointmentReminderEmail(data: AppointmentReminderData) {
  const subject = `Recordatorio: Cita ${data.appointmentType} - ${data.appointmentDate}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; }
          .appointment { background-color: white; padding: 15px; border-left: 4px solid #8b5cf6; margin: 10px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Recordatorio de Cita</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${data.caregiverName}</strong>,</p>
            <p>Recordatorio de cita médica:</p>
            <div class="appointment">
              <p><strong>Paciente:</strong> ${data.careRecipientName}</p>
              <p><strong>Tipo de cita:</strong> ${data.appointmentType}</p>
              <p><strong>Fecha:</strong> ${data.appointmentDate}</p>
              <p><strong>Hora:</strong> ${data.appointmentTime}</p>
              ${data.location ? `<p><strong>Lugar:</strong> ${data.location}</p>` : ""}
              ${data.notes ? `<p><strong>Notas:</strong> ${data.notes}</p>` : ""}
            </div>
            <p>Por favor, asegúrate de llegar con tiempo suficiente.</p>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático de MyCare - Coordinación de Cuidados</p>
            <p>No respondas a este correo</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Recordatorio de Cita

Hola ${data.caregiverName},

Recordatorio de cita médica:

Paciente: ${data.careRecipientName}
Tipo de cita: ${data.appointmentType}
Fecha: ${data.appointmentDate}
Hora: ${data.appointmentTime}
${data.location ? `Lugar: ${data.location}` : ""}
${data.notes ? `Notas: ${data.notes}` : ""}

Por favor, asegúrate de llegar con tiempo suficiente.

---
Este es un mensaje automático de MyCare - Coordinación de Cuidados
  `;

  return { subject, html, text };
}
```

**Time:** 30 minutes

---

## 🔧 Step 5: Create Server Actions for Notifications

### Create Notification Actions

**File:** `apps/web/src/app/actions/notifications.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/brevo";
import {
  medicationReminderEmail,
  shiftReminderEmail,
  appointmentReminderEmail,
} from "@/lib/email/templates";

export async function sendMedicationReminder(medicationScheduleId: string) {
  const supabase = await createClient();

  // Get medication schedule with related data
  const { data: schedule, error } = await supabase
    .from("medication_schedules")
    .select(
      `
      *,
      medications (
        name,
        dosage,
        care_recipient_id,
        care_recipients (name)
      )
    `,
    )
    .eq("id", medicationScheduleId)
    .single();

  if (error || !schedule) {
    return { success: false, error: "Medication schedule not found" };
  }

  // Get caregivers assigned to this care recipient
  const { data: schedules } = await supabase
    .from("schedules")
    .select(
      `
      caregivers (
        id,
        profiles (email, full_name)
      )
    `,
    )
    .eq("care_recipient_id", schedule.medications.care_recipient_id);

  if (!schedules || schedules.length === 0) {
    return { success: false, error: "No caregivers found" };
  }

  // Send email to each caregiver
  const results = [];
  for (const sched of schedules) {
    if (sched.caregivers?.profiles?.email) {
      const emailData = medicationReminderEmail({
        caregiverName: sched.caregivers.profiles.full_name,
        medicationName: schedule.medications.name,
        dosage: schedule.medications.dosage,
        scheduledTime: schedule.scheduled_time,
        careRecipientName: schedule.medications.care_recipients.name,
      });

      const result = await sendEmail({
        to: sched.caregivers.profiles.email,
        ...emailData,
      });

      results.push(result);
    }
  }

  return { success: true, results };
}

export async function sendShiftReminder(scheduleId: string, shiftDate: string) {
  const supabase = await createClient();

  // Get schedule with related data
  const { data: schedule, error } = await supabase
    .from("schedules")
    .select(
      `
      *,
      care_recipients (name),
      caregivers (
        id,
        profiles (email, full_name)
      ),
      tasks (id)
    `,
    )
    .eq("id", scheduleId)
    .single();

  if (error || !schedule) {
    return { success: false, error: "Schedule not found" };
  }

  if (!schedule.caregivers?.profiles?.email) {
    return { success: false, error: "Caregiver email not found" };
  }

  const emailData = shiftReminderEmail({
    caregiverName: schedule.caregivers.profiles.full_name,
    careRecipientName: schedule.care_recipients.name,
    shiftDate,
    startTime: schedule.start_time,
    endTime: schedule.end_time,
    taskCount: schedule.tasks?.length || 0,
  });

  const result = await sendEmail({
    to: schedule.caregivers.profiles.email,
    ...emailData,
  });

  return result;
}

export async function sendAppointmentReminder(appointmentId: string) {
  const supabase = await createClient();

  // Get appointment with related data
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      care_recipients (name),
      caregivers (
        id,
        profiles (email, full_name)
      )
    `,
    )
    .eq("id", appointmentId)
    .single();

  if (error || !appointment) {
    return { success: false, error: "Appointment not found" };
  }

  if (!appointment.caregivers?.profiles?.email) {
    return { success: false, error: "Caregiver email not found" };
  }

  const emailData = appointmentReminderEmail({
    caregiverName: appointment.caregivers.profiles.full_name,
    careRecipientName: appointment.care_recipients.name,
    appointmentType: appointment.type,
    appointmentDate: appointment.appointment_date,
    appointmentTime: appointment.appointment_time,
    location: appointment.location,
    notes: appointment.notes,
  });

  const result = await sendEmail({
    to: appointment.caregivers.profiles.email,
    ...emailData,
  });

  return result;
}
```

**Time:** 40 minutes

---

## 🔧 Step 6: Create Notification Scheduling (Optional - Advanced)

### Option A: Manual Triggers (Simple)

Add buttons in admin interface to send notifications manually.

**Example in medication page:**

```tsx
<Button onClick={() => sendMedicationReminder(medicationScheduleId)}>
  Enviar Recordatorio
</Button>
```

### Option B: Cron Jobs (Advanced)

Use Vercel Cron Jobs to schedule automatic notifications.

**File:** `apps/web/vercel.json` (update existing)

```json
{
  "crons": [
    {
      "path": "/api/cron/medication-reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/shift-reminders",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Create API routes:**

**File:** `apps/web/src/app/api/cron/medication-reminders/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMedicationReminder } from "@/app/actions/notifications";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = await createClient();

  // Get current time
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM
  const currentDay = now.getDay();

  // Find medication schedules for current time
  const { data: schedules } = await supabase
    .from("medication_schedules")
    .select("id, scheduled_time, day_of_week, frequency")
    .eq("scheduled_time", currentTime);

  if (!schedules) {
    return NextResponse.json({ sent: 0 });
  }

  // Filter schedules (daily or matching day of week)
  const relevantSchedules = schedules.filter(
    (s) => s.frequency === "daily" || s.day_of_week === currentDay,
  );

  // Send reminders
  const results = await Promise.all(
    relevantSchedules.map((s) => sendMedicationReminder(s.id)),
  );

  return NextResponse.json({ sent: results.length, results });
}
```

**Time:** 1-2 hours (if implementing cron jobs)

---

## 📋 Implementation Checklist

### Mobile Navigation

- [ ] Add scroll indicators to admin mobile nav
- [ ] Add active states to guest bottom nav
- [ ] Add helper text to guest login page
- [ ] Test on mobile devices
- [ ] Test in light and dark modes

### Brevo Email Setup

- [ ] Get Brevo SMTP credentials
- [ ] Add environment variables
- [ ] Install nodemailer
- [ ] Create email service utility
- [ ] Create email templates
- [ ] Create server actions
- [ ] Test email sending

### Optional: Cron Jobs

- [ ] Update vercel.json with cron schedules
- [ ] Create API routes for cron jobs
- [ ] Add CRON_SECRET to environment variables
- [ ] Test cron job execution
- [ ] Monitor cron job logs

---

## 🧪 Testing Plan

### Mobile Navigation Testing

1. Test admin nav on small screen (iPhone SE)
2. Verify gradient indicators appear
3. Test scrolling behavior
4. Test guest nav active states
5. Verify helper text displays correctly

### Email Testing

1. Test email connection with `verifyEmailConnection()`
2. Send test medication reminder
3. Send test shift reminder
4. Send test appointment reminder
5. Verify emails arrive in inbox
6. Check email formatting (HTML and text)
7. Test with multiple recipients

---

## 📊 Success Criteria

### Mobile Navigation

- [ ] Scroll indicators visible on admin nav
- [ ] Active states work on guest nav
- [ ] Helper text clear and helpful
- [ ] No layout issues on any screen size

### Email Notifications

- [ ] Emails send successfully
- [ ] HTML formatting looks good
- [ ] Text fallback works
- [ ] Correct recipients receive emails
- [ ] Email content is accurate
- [ ] No spam folder issues

---

## 🚀 Deployment Steps

1. **Mobile Navigation:**
   - Create branch: `feature/mobile-nav-improvements`
   - Make changes
   - Test locally
   - Commit and push
   - Create PR
   - Merge to main

2. **Email Notifications:**
   - Add environment variables to Vercel
   - Create branch: `feature/email-notifications`
   - Implement email service
   - Test with real emails
   - Commit and push
   - Create PR
   - Merge to main

---

## 📝 Documentation Needed

1. **User Guide:**
   - How to enable/disable notifications
   - What notifications are sent
   - When notifications are sent

2. **Admin Guide:**
   - How to configure Brevo
   - How to test email sending
   - How to monitor email delivery

3. **Developer Guide:**
   - Email template customization
   - Adding new notification types
   - Cron job configuration

---

## 🎯 Next Steps After Implementation

1. **Monitor email delivery rates**
2. **Gather user feedback on notifications**
3. **Add notification preferences UI**
4. **Implement web push notifications** (separate from email)
5. **Add notification history/logs**

---

## 📞 Support Resources

- [Brevo Documentation](https://developers.brevo.com/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
