# 🧠 Agent Instructions – Care Coordination App

## 🎯 Project Purpose

This project is a **personal care coordination platform** designed to help a small group of caregivers organize:

* Schedules
* Tasks
* Appointments
* Medications

The context is **home care for a dependent person**, not a clinic or hospital.

Primary goals:

* Clarity
* Reliability
* Low cognitive load

This is a real-world, human-centered system. Simplicity is more important than feature completeness.

---

## 👥 User Roles

### Admin

* Creates and manages caregivers
* Assigns schedules, tasks, appointments, and medications
* Reviews task completion and logs
* Has full visibility of the system

### Caregiver

* Views assigned schedules
* Sees tasks for their shifts
* Marks tasks as completed
* Logs medication intake
* Receives notifications

Caregivers **must not** see data that is not assigned to them.

---

## 🧩 MVP Scope (Strict)

### Included

* Authentication via Supabase
* Role-based access (admin / caregiver)
* Caregiver management (admin only)
* Schedule management (day + time range)
* Tasks linked to schedules
* Task completion tracking
* Appointment scheduling with reminders
* Medication schedules with intake logs
* Email notifications
* Mobile-friendly responsive UI (PWA-ready)

### Explicitly Excluded

* Cameras or video streaming
* Medical diagnosis or recommendations
* AI features
* Native mobile apps
* WhatsApp, SMS, or third-party integrations
* Multi-family or multi-tenant SaaS logic

If a feature is not explicitly listed as included, **do not implement it**.

---

## 🛠️ Tech Stack (Mandatory)

* Next.js (App Router)
* TypeScript
* Supabase (Auth, Database, RLS)
* TailwindCSS
* shadcn/ui
* Supabase MCP for database operations
* Email notifications via server actions

No alternative frameworks, ORMs, or databases unless explicitly requested.

---

## 🗂️ Data Modeling Rules

* Use relational tables
* UUIDs for primary keys
* Clear foreign key relationships
* Avoid over-abstraction
* Prefer explicit tables over polymorphic designs
* Optimize for readability and maintainability

---

## 🔐 Security & Access Rules

* All data access must respect Supabase Row Level Security
* Admin has full access
* Caregivers can only access:

  * Their own schedules
  * Their assigned tasks
  * Their assigned appointments
  * Their assigned medications

Security must be enforced at the database level, not only in the UI.

---

## 🎨 UI / UX Principles

* Mobile-first design
* Large touch targets
* Minimal screens
* One primary action per screen
* No dashboards with charts or analytics

The app must be usable by tired caregivers under stress.

---

## 🚦 Product Rule

Before implementing any feature, always ask:

> Does this help ensure the dependent person is properly cared for today?

If the answer is not clearly "yes", the feature should be postponed.

---

## 🔮 Out of Scope (Future Only)

* Camera integrations
* Sensors and automatic alerts
* Advanced reporting
* Multi-user families
* Paid plans or subscriptions

These ideas must not influence current architecture decisions.

---

## 🧠 Agent Behavior Rules

* Do not invent features
* Do not refactor without a request
* Prefer incremental, explicit changes
* Explain architectural decisions briefly
* Ask for clarification if a request may expand scope

End of agent instructions.
