# 📧 Email Notifications Implementation Guide - Brevo SMTP

**Date:** February 4, 2026  
**Priority:** High  
**Estimated Time:** 4-5 hours  
**Status:** Ready to implement

---

## 🎯 Overview

This guide provides step-by-step instructions to implement email notifications using Brevo (formerly Sendinblue) SMTP for the MyCare app.

### What We're Building

**Email Notification System for:**

1. **Medication Reminders** - Notify caregivers when it's time to give medication
2. **Shift Reminders** - Remind caregivers about upcoming shifts
3. **Appointment Reminders** - Alert caregivers about medical appointments

---

## 📋 Prerequisites

### 1. Brevo Account Setup

**Steps:**

1. Log in to your Brevo account at https://app.brevo.com
2. Navigate to: **Settings** → **SMTP & API**
3. Click **"Create a new SMTP key"**
4. Give it a name (e.g., "MyCare Production")
5. Copy the generated SMTP key

**You'll need:**

- SMTP Server: `smtp-relay.brevo.com`
- Port: `587` (recommended) or `465`
- Login: Your Brevo account email
- SMTP Key: The key you just generated

### 2. Verify Sender Email

**Important:** Brevo requires you to verify the sender email address.

**Steps:**

1. Go to **Settings** → **Senders & IP**
2. Click **"Add a sender"**
3. Enter your email (e.g., `noreply@your-domain.com`)
4. Verify the email (check your inbox for verification link)

**Recommended sender:**

- Email: `noreply@your-domain.com` (or use your Brevo email)
- Name: `MyCare Notifications`

---

## 🔧 Implementation Steps

### Step 1: Environment Variables (5 minutes)

#### A. Create `.env.local` file

**Location:** `apps/web/.env.local`

```env
# Brevo SMTP Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-email@example.com
BREVO_SMTP_KEY=your-smtp-key-here
BREVO_FROM_EMAIL=noreply@your-domain.com
BREVO_FROM_NAME=MyCare Notifications
```

**Replace:**

- `your-brevo-email@example.com` with your Brevo account email
- `your-smtp-key-here` with the SMTP key from Brevo
- `noreply@your-domain.com` with your verified sender email

#### B. Update `.env.example`

**Location:** `apps/web/.env.example`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Brevo SMTP Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=
BREVO_SMTP_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=MyCare Notifications
```

#### C. Add to Vercel Environment Variables

**For production deployment:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - `BREVO_SMTP_HOST` = `smtp-relay.brevo.com`
   - `BREVO_SMTP_PORT` = `587`
   - `BREVO_SMTP_USER` = your Brevo email
   - `BREVO_SMTP_KEY` = your SMTP key
   - `BREVO_FROM_EMAIL` = your verified sender email
   - `BREVO_FROM_NAME` = `MyCare Notifications`

---

### Step 2: Install Dependencies (2 minutes)

```bash
cd apps/web
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Why Nodemailer?**

- Industry standard for Node.js email
- Works with any SMTP provider (including Brevo)
- Simple, reliable API
- Full TypeScript support

---

### Step 3: Create Email Service (20 minutes)

#### Create Email Utility

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

**What this does:**

- Creates a reusable SMTP transporter
- Provides connection verification function
- Provides simple email sending function
- Handles errors gracefully

---

### Step 4: Create Email Templates (30 minutes)

#### Create Template Utilities

**File:** `apps/web/src/lib/email/templates.ts`

```typescript
import { t } from "@/lib/translations";

// Medication Reminder Template
export interface MedicationReminderData {
  caregiverName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  careRecipientName: string;
}

export function medicationReminderEmail(data: MedicationReminderData) {
  const subject = `💊 Recordatorio: ${data.medicationName} - ${data.scheduledTime}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
          .medication-box {
            background-color: #f9fafb;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .medication-box p {
            margin: 8px 0;
          }
          .medication-box strong {
            color: #1f2937;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
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
            
            <div class="medication-box">
              <p><strong>Paciente:</strong> ${data.careRecipientName}</p>
              <p><strong>Medicamento:</strong> ${data.medicationName}</p>
              <p><strong>Dosis:</strong> ${data.dosage}</p>
              <p><strong>Hora programada:</strong> ${data.scheduledTime}</p>
            </div>
            
            <p>Por favor, registra la administración en la aplicación después de dar el medicamento.</p>
          </div>
          <div class="footer">
            <p><strong>MyCare - Coordinación de Cuidados</strong></p>
            <p>Este es un mensaje automático. No respondas a este correo.</p>
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
MyCare - Coordinación de Cuidados
Este es un mensaje automático. No respondas a este correo.
  `.trim();

  return { subject, html, text };
}

// Shift Reminder Template
export interface ShiftReminderData {
  caregiverName: string;
  careRecipientName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  taskCount: number;
}

export function shiftReminderEmail(data: ShiftReminderData) {
  const subject = `📅 Recordatorio: Turno ${data.shiftDate} - ${data.startTime}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #10b981;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
          .shift-box {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .shift-box p {
            margin: 8px 0;
          }
          .shift-box strong {
            color: #1f2937;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
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
            
            <div class="shift-box">
              <p><strong>Paciente:</strong> ${data.careRecipientName}</p>
              <p><strong>Fecha:</strong> ${data.shiftDate}</p>
              <p><strong>Horario:</strong> ${data.startTime} - ${data.endTime}</p>
              <p><strong>Tareas asignadas:</strong> ${data.taskCount}</p>
            </div>
            
            <p>Recuerda revisar las tareas asignadas en la aplicación antes de comenzar tu turno.</p>
          </div>
          <div class="footer">
            <p><strong>MyCare - Coordinación de Cuidados</strong></p>
            <p>Este es un mensaje automático. No respondas a este correo.</p>
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
MyCare - Coordinación de Cuidados
Este es un mensaje automático. No respondas a este correo.
  `.trim();

  return { subject, html, text };
}

// Appointment Reminder Template
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
  const subject = `🏥 Recordatorio: Cita ${data.appointmentType} - ${data.appointmentDate}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #8b5cf6;
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
          }
          .appointment-box {
            background-color: #faf5ff;
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .appointment-box p {
            margin: 8px 0;
          }
          .appointment-box strong {
            color: #1f2937;
          }
          .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Recordatorio de Cita</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${data.caregiverName}</strong>,</p>
            <p>Recordatorio de cita médica:</p>
            
            <div class="appointment-box">
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
            <p><strong>MyCare - Coordinación de Cuidados</strong></p>
            <p>Este es un mensaje automático. No respondas a este correo.</p>
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
MyCare - Coordinación de Cuidados
Este es un mensaje automático. No respondas a este correo.
  `.trim();

  return { subject, html, text };
}
```

**What this provides:**

- Professional HTML email templates
- Plain text fallback for email clients that don't support HTML
- Responsive design for mobile devices
- Consistent branding
- Clear, actionable information

---

### Step 5: Create Server Actions (40 minutes)

#### Create Notification Actions

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

// Test function to verify email configuration
export async function sendTestEmail(toEmail: string) {
  const result = await sendEmail({
    to: toEmail,
    subject: "Test Email from MyCare",
    text: "This is a test email to verify your email configuration is working correctly.",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email</h2>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p>If you received this email, your Brevo SMTP integration is working! ✅</p>
      </div>
    `,
  });

  return result;
}
```

**What this provides:**

- Server actions for sending each type of notification
- Database queries to get relevant data
- Error handling
- Test function for verification

---

## 🧪 Testing Guide

### Step 1: Test Email Connection

Create a test page or use the browser console:

```typescript
import { sendTestEmail } from "@/app/actions/notifications";

// Test with your email
const result = await sendTestEmail("your-email@example.com");
console.log(result);
```

**Expected result:**

```json
{
  "success": true,
  "messageId": "<some-id@brevo.com>"
}
```

### Step 2: Test Medication Reminder

```typescript
import { sendMedicationReminder } from "@/app/actions/notifications";

// Use a real medication_schedule_id from your database
const result = await sendMedicationReminder("medication-schedule-id-here");
console.log(result);
```

### Step 3: Test Shift Reminder

```typescript
import { sendShiftReminder } from "@/app/actions/notifications";

// Use a real schedule_id and date
const result = await sendShiftReminder("schedule-id-here", "2026-02-05");
console.log(result);
```

### Step 4: Test Appointment Reminder

```typescript
import { sendAppointmentReminder } from "@/app/actions/notifications";

// Use a real appointment_id
const result = await sendAppointmentReminder("appointment-id-here");
console.log(result);
```

---

## 📊 Implementation Checklist

### Setup

- [ ] Get Brevo SMTP credentials
- [ ] Verify sender email in Brevo
- [ ] Add environment variables to `.env.local`
- [ ] Add environment variables to Vercel
- [ ] Install nodemailer package

### Code Implementation

- [ ] Create `apps/web/src/lib/email/brevo.ts`
- [ ] Create `apps/web/src/lib/email/templates.ts`
- [ ] Create `apps/web/src/app/actions/notifications.ts`

### Testing

- [ ] Test email connection with `sendTestEmail()`
- [ ] Test medication reminder
- [ ] Test shift reminder
- [ ] Test appointment reminder
- [ ] Verify HTML formatting in email client
- [ ] Verify text fallback works
- [ ] Test with multiple recipients

### Deployment

- [ ] Commit changes
- [ ] Push to GitHub
- [ ] Create PR
- [ ] Merge to main
- [ ] Verify environment variables in Vercel
- [ ] Test in production

---

## 🚀 Next Steps (Optional)

### Add Manual Trigger Buttons

Add buttons in admin interface to manually send notifications:

**Example in medication page:**

```tsx
import { sendMedicationReminder } from "@/app/actions/notifications";

<Button
  onClick={async () => {
    const result = await sendMedicationReminder(medicationScheduleId);
    if (result.success) {
      toast.success("Recordatorio enviado");
    } else {
      toast.error("Error al enviar recordatorio");
    }
  }}
>
  Enviar Recordatorio
</Button>;
```

### Add Automatic Scheduling (Advanced)

Use Vercel Cron Jobs to automatically send notifications at scheduled times.

**See:** [`mobile-nav-and-notifications-plan.md`](./mobile-nav-and-notifications-plan.md) for cron job implementation details.

---

## 📝 Success Criteria

- [ ] Emails send successfully
- [ ] HTML formatting looks professional
- [ ] Text fallback works
- [ ] Correct recipients receive emails
- [ ] Email content is accurate and helpful
- [ ] No emails go to spam folder
- [ ] Response time < 5 seconds

---

## 🎯 Summary

**What You'll Have:**

- ✅ Professional email notification system
- ✅ 3 types of notifications (medication, shift, appointment)
- ✅ HTML + text email templates
- ✅ Server actions for sending emails
- ✅ Test function for verification
- ✅ Ready for manual or automatic triggering

**Estimated Time:** 4-5 hours total

**Ready to implement?** Follow the steps above in order, and you'll have a fully functional email notification system!
