# 🏗️ Architecture Overview – Care Coordination App

## 🎯 Architectural Goals

* Simple and understandable
* Secure by default
* Easy to extend without refactoring
* Optimized for a single household use case

This architecture intentionally avoids microservices and over-engineering.

---

## 🧩 High-Level Architecture

```
Client (Browser / Mobile PWA)
        ↓
Next.js App (Server Actions + UI)
        ↓
Supabase
  ├── Auth
  ├── PostgreSQL Database
  └── Row Level Security (RLS)
```

There is **no separate backend service**. Business logic lives in:

* Server Actions
* Database constraints and RLS

---

## 📁 Repository Structure

```
/root
├── apps/
│   └── web/
│       ├── app/            # Next.js App Router
│       ├── components/     # UI components
│       ├── lib/            # Utilities, Supabase client, helpers
│       ├── styles/
│       └── public/
│
├── docs/
│   ├── agent.md
│   ├── architecture.md
│   ├── roadmap.md
│   └── decisions.md
│
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── policies.sql
│
├── README.md
└── package.json
```

This structure supports future growth without forcing a monorepo framework.

---

## 👥 Authentication & Roles

* Supabase Auth handles authentication
* Each user has a role: `admin` or `caregiver`
* Role is stored in a dedicated column or profile table

Authorization rules:

* Admin: full access
* Caregiver: access only to assigned data

All authorization is enforced using **Supabase RLS policies**.

---

## 🗂️ Core Data Entities

### User

* id
* role (admin | caregiver)

### CareRecipient

* name
* notes

### Schedule

* caregiver_id
* day_of_week
* start_time
* end_time

### Task

* schedule_id
* title
* description

### TaskLog

* task_id
* caregiver_id
* status
* timestamp

### Appointment

* date
* time
* type
* location
* caregiver_id
* status

### Medication

* name
* dosage
* frequency
* notes

### MedicationLog

* medication_id
* caregiver_id
* status
* timestamp

---

## 🔔 Notifications

* Implemented via server actions
* Email only (initially)
* Triggered by:

  * Upcoming shifts
  * Pending tasks
  * Medication times
  * Upcoming appointments

No push notifications or SMS in MVP.

---

## 📱 Mobile Strategy

* Responsive design
* Progressive Web App (PWA)
* Offline tolerance where possible

No native mobile applications are planned.

---

## 🚧 Non-Goals

* Real-time monitoring
* Video or camera feeds
* Medical decision support
* AI-based automation

These are explicitly excluded to keep the system focused and maintainable.

---

## 🧠 Guiding Principle

> A clear, boring architecture is better than a clever one.

This project prioritizes reliability and human usability over technical novelty.
