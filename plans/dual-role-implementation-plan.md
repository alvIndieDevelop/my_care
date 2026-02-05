# 👥 Dual Role Implementation Plan

## 🎯 Goal

Enable users to have both admin and caregiver roles simultaneously, so they can:

- Manage the system as an admin
- Work shifts and complete tasks as a caregiver
- See both admin and caregiver interfaces

## 📋 Implementation Steps

### Phase 1: Core Utilities (30 minutes)

#### Step 1.1: Create Role Utility Functions

**File:** `apps/web/src/lib/auth/roles.ts` (NEW)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserRoles {
  isAdmin: boolean;
  isCaregiver: boolean;
  caregiverId: string | null;
  profile: {
    id: string;
    role: string;
    full_name: string;
    email: string;
  } | null;
}

/**
 * Get user's roles and permissions
 */
export async function getUserRoles(userId?: string): Promise<UserRoles> {
  const supabase = await createClient();

  // Get current user if userId not provided
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        isAdmin: false,
        isCaregiver: false,
        caregiverId: null,
        profile: null,
      };
    }
    userId = user.id;
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", userId)
    .single();

  // Check if has caregiver record
  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("id, is_active")
    .eq("profile_id", userId)
    .single();

  return {
    isAdmin: profile?.role === "admin",
    isCaregiver: !!caregiver && caregiver.is_active,
    caregiverId: caregiver?.id || null,
    profile,
  };
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.isAdmin;
}

/**
 * Check if user can act as caregiver
 */
export async function isCaregiver(userId?: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.isCaregiver;
}

/**
 * Require admin access (throws if not admin)
 */
export async function requireAdmin(userId?: string): Promise<void> {
  const admin = await isAdmin(userId);
  if (!admin) {
    throw new Error("Admin access required");
  }
}

/**
 * Require caregiver access (throws if not caregiver)
 */
export async function requireCaregiver(userId?: string): Promise<void> {
  const caregiver = await isCaregiver(userId);
  if (!caregiver) {
    throw new Error("Caregiver access required");
  }
}
```

---

### Phase 2: Dashboard Updates (1 hour)

#### Step 2.1: Update Main Dashboard

**File:** `apps/web/src/app/dashboard/page.tsx`

**Changes:**

1. Import `getUserRoles()`
2. Get both admin and caregiver status
3. Show both sections when user has both roles

```typescript
import { getUserRoles } from '@/lib/auth/roles'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user roles
  const { isAdmin, isCaregiver, caregiverId } = await getUserRoles(user.id)

  // ... existing code ...

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t.dashboard.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t.dashboard.welcome}
          </p>
        </div>

        {/* Role indicator for dual role users */}
        {isAdmin && isCaregiver && (
          <Badge variant="outline" className="self-start sm:self-center">
            Administrador y Cuidador
          </Badge>
        )}
      </div>

      {/* Admin Dashboard */}
      {isAdmin && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Panel de Administración</h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Existing admin cards */}
            {/* ... */}
          </div>
        </section>
      )}

      {/* Caregiver Dashboard */}
      {isCaregiver && (
        <section className={isAdmin ? 'mt-8' : ''}>
          <h2 className="text-xl font-semibold mb-4">Mi Turno de Hoy</h2>
          {/* Caregiver content */}
          {/* ... existing caregiver code ... */}
        </section>
      )}

      {/* No role assigned */}
      {!isAdmin && !isCaregiver && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tienes roles asignados. Contacta al administrador.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

### Phase 3: Navigation Updates (45 minutes)

#### Step 3.1: Update Dashboard Navigation

**File:** `apps/web/src/components/layout/dashboard-nav.tsx`

**Changes:**

1. Use `getUserRoles()` instead of checking profile.role
2. Show both admin and caregiver navigation items
3. Add visual separator if user has both roles

```typescript
import { getUserRoles } from '@/lib/auth/roles'

export async function DashboardNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { isAdmin, isCaregiver, profile } = await getUserRoles(user.id)

  return (
    <nav>
      {/* Admin Navigation */}
      {isAdmin && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">
            Administración
          </p>
          <NavLink href="/dashboard" icon={Home}>
            {t.nav.dashboard}
          </NavLink>
          <NavLink href="/dashboard/caregivers" icon={Users}>
            {t.nav.caregivers}
          </NavLink>
          <NavLink href="/dashboard/schedules" icon={Calendar}>
            {t.nav.schedules}
          </NavLink>
          <NavLink href="/dashboard/care-recipients" icon={Heart}>
            {t.nav.careRecipients}
          </NavLink>
        </div>
      )}

      {/* Separator if both roles */}
      {isAdmin && isCaregiver && (
        <Separator className="my-4" />
      )}

      {/* Caregiver Navigation */}
      {isCaregiver && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">
            Mi Trabajo
          </p>
          <NavLink href="/dashboard/tasks" icon={CheckSquare}>
            {t.nav.tasks}
          </NavLink>
          <NavLink href="/dashboard/medications" icon={Pill}>
            {t.nav.medications}
          </NavLink>
          <NavLink href="/dashboard/appointments" icon={CalendarCheck}>
            {t.nav.appointments}
          </NavLink>
        </div>
      )}
    </nav>
  )
}
```

---

### Phase 4: Add Self as Caregiver Feature (1 hour)

#### Step 4.1: Create Server Action

**File:** `apps/web/src/app/actions/caregiver-actions.ts` (NEW or add to existing)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";

/**
 * Add current user as a caregiver
 */
export async function addSelfAsCaregiver() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is admin
  const { isAdmin, isCaregiver } = await getUserRoles(user.id);

  if (!isAdmin) {
    return {
      success: false,
      error: "Only admins can add themselves as caregivers",
    };
  }

  if (isCaregiver) {
    return { success: false, error: "You are already a caregiver" };
  }

  // Get profile info
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  // Create caregiver record
  const { error } = await supabase.from("caregivers").insert({
    profile_id: user.id,
    full_name: profile?.full_name || null,
    email: profile?.email || null,
    is_active: true,
  });

  if (error) {
    console.error("Error adding self as caregiver:", error);
    return { success: false, error: error.message };
  }

  // Revalidate dashboard
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Remove self as caregiver
 */
export async function removeSelfAsCaregiver() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get caregiver record
  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!caregiver) {
    return { success: false, error: "You are not a caregiver" };
  }

  // Check if caregiver has any schedules
  const { data: schedules } = await supabase
    .from("schedules")
    .select("id")
    .eq("caregiver_id", caregiver.id)
    .limit(1);

  if (schedules && schedules.length > 0) {
    return {
      success: false,
      error: "Cannot remove caregiver role while you have assigned schedules",
    };
  }

  // Delete caregiver record
  const { error } = await supabase
    .from("caregivers")
    .delete()
    .eq("id", caregiver.id);

  if (error) {
    console.error("Error removing self as caregiver:", error);
    return { success: false, error: error.message };
  }

  // Revalidate dashboard
  revalidatePath("/dashboard");

  return { success: true };
}
```

#### Step 4.2: Create UI Component

**File:** `apps/web/src/components/add-self-as-caregiver.tsx` (NEW)

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { addSelfAsCaregiver } from '@/app/actions/caregiver-actions'
import { UserPlus } from 'lucide-react'

export function AddSelfAsCaregiver() {
  const [loading, setLoading] = useState(false)

  async function handleAddSelf() {
    if (!confirm('¿Quieres agregarte como cuidador? Podrás ver tus propios turnos y tareas.')) {
      return
    }

    setLoading(true)
    try {
      const result = await addSelfAsCaregiver()

      if (result.success) {
        toast.success('Te has agregado como cuidador correctamente')
        // Page will refresh automatically due to revalidatePath
      } else {
        toast.error(result.error || 'Error al agregarte como cuidador')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregarte como cuidador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          ¿Quieres ser cuidador también?
        </CardTitle>
        <CardDescription>
          Como administrador, puedes agregarte como cuidador para ver tus propios turnos,
          completar tareas y registrar medicamentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleAddSelf}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Agregando...' : 'Agregarme como cuidador'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### Step 4.3: Add to Dashboard

**File:** `apps/web/src/app/dashboard/page.tsx`

```typescript
import { AddSelfAsCaregiver } from '@/components/add-self-as-caregiver'

// In the component:
{isAdmin && !isCaregiver && (
  <AddSelfAsCaregiver />
)}
```

---

### Phase 5: Update Existing Pages (30 minutes)

#### Step 5.1: Update Pages That Check Role

**Files to update:**

- `apps/web/src/app/dashboard/tasks/page.tsx`
- `apps/web/src/app/dashboard/medications/page.tsx`
- `apps/web/src/app/dashboard/appointments/page.tsx`

**Change from:**

```typescript
if (profile?.role === "admin") {
  redirect("/dashboard");
}
```

**Change to:**

```typescript
import { getUserRoles } from "@/lib/auth/roles";

const { isCaregiver } = await getUserRoles(user.id);

if (!isCaregiver) {
  redirect("/dashboard");
}
```

---

### Phase 6: Testing (1 hour)

#### Test Cases

1. **Admin without caregiver role**
   - [ ] Can access admin pages
   - [ ] Cannot access caregiver pages
   - [ ] Sees "Add self as caregiver" card
   - [ ] Can add self as caregiver

2. **Admin with caregiver role**
   - [ ] Can access admin pages
   - [ ] Can access caregiver pages
   - [ ] Sees both admin and caregiver sections
   - [ ] Navigation shows both menus
   - [ ] Can see own schedules
   - [ ] Can complete own tasks

3. **Regular caregiver**
   - [ ] Cannot access admin pages
   - [ ] Can access caregiver pages
   - [ ] Sees only caregiver sections
   - [ ] Navigation shows only caregiver menu

4. **Data isolation**
   - [ ] Admin with caregiver role only sees own schedules in caregiver view
   - [ ] Admin can see all schedules in admin view
   - [ ] RLS policies work correctly

---

## 📁 Files to Create/Modify

### New Files

- [ ] `apps/web/src/lib/auth/roles.ts`
- [ ] `apps/web/src/app/actions/caregiver-actions.ts`
- [ ] `apps/web/src/components/add-self-as-caregiver.tsx`

### Modified Files

- [ ] `apps/web/src/app/dashboard/page.tsx`
- [ ] `apps/web/src/components/layout/dashboard-nav.tsx`
- [ ] `apps/web/src/app/dashboard/tasks/page.tsx`
- [ ] `apps/web/src/app/dashboard/medications/page.tsx`
- [ ] `apps/web/src/app/dashboard/appointments/page.tsx`

---

## 🔄 Migration Steps

### No Database Changes Required! ✅

The current database schema already supports this:

- `profiles.role` can be 'admin'
- `caregivers.profile_id` can link to an admin's profile
- RLS policies already check caregiver record existence

---

## ⏱️ Time Estimate

| Phase     | Task                          | Time         |
| --------- | ----------------------------- | ------------ |
| 1         | Create role utilities         | 30 min       |
| 2         | Update dashboard              | 1 hour       |
| 3         | Update navigation             | 45 min       |
| 4         | Add self as caregiver feature | 1 hour       |
| 5         | Update existing pages         | 30 min       |
| 6         | Testing                       | 1 hour       |
| **Total** |                               | **~5 hours** |

---

## 🚀 Deployment Plan

### Step 1: Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/dual-roles
```

### Step 2: Implement Changes

Follow phases 1-5 above

### Step 3: Test Locally

Run through all test cases

### Step 4: Commit and Push

```bash
git add .
git commit -m "feat: add dual admin/caregiver role support

- Create getUserRoles() utility for role checking
- Update dashboard to show both admin and caregiver sections
- Update navigation to show both menus
- Add 'Add self as caregiver' feature for admins
- Update caregiver pages to use role utility
- Support admins working as caregivers

This allows users to have both admin and caregiver roles,
solving the issue where admins who also provide care needed
two separate accounts."

git push origin feature/dual-roles
```

### Step 5: Create PR

Create PR on GitHub with description

### Step 6: Review and Merge

Review, test, and merge to main

### Step 7: Deploy

Deploy to production via Vercel

---

## 📝 PR Description Template

```markdown
# feat: Add Dual Admin/Caregiver Role Support

## Problem

Currently, users can only be either an admin OR a caregiver, not both.
In small family care settings, the admin often also provides care and
needs access to both interfaces.

## Solution

- Created `getUserRoles()` utility to check both admin status and caregiver record
- Updated dashboard to show both admin and caregiver sections when user has both roles
- Updated navigation to show both admin and caregiver menus
- Added "Add self as caregiver" feature for admins
- Updated caregiver pages to use new role checking

## Changes

- New: `lib/auth/roles.ts` - Role utility functions
- New: `app/actions/caregiver-actions.ts` - Add/remove self as caregiver
- New: `components/add-self-as-caregiver.tsx` - UI component
- Modified: Dashboard, navigation, and caregiver pages

## Testing

- [x] Admin without caregiver role - sees only admin features
- [x] Admin with caregiver role - sees both admin and caregiver features
- [x] Regular caregiver - sees only caregiver features
- [x] RLS policies work correctly
- [x] Data isolation maintained

## Database Changes

None required! Current schema already supports this.

## Breaking Changes

None. Fully backward compatible.
```

---

## ✅ Success Criteria

- [ ] Admin can add themselves as caregiver
- [ ] Admin with caregiver role sees both dashboards
- [ ] Navigation shows appropriate items for each role
- [ ] Data isolation maintained (RLS works)
- [ ] No breaking changes to existing functionality
- [ ] All tests pass
- [ ] Code reviewed and approved
- [ ] Deployed to production

---

## 🎯 Next Steps After Implementation

1. **User Documentation**
   - Update user guide with dual role instructions
   - Create tutorial video

2. **Admin Training**
   - Show how to add self as caregiver
   - Explain dual role interface

3. **Monitor Usage**
   - Track how many admins use dual role
   - Gather feedback

4. **Future Enhancements**
   - Role switcher UI (toggle between views)
   - Separate routes for admin/caregiver views
   - Role-based notifications

---

Ready to implement! 🚀
