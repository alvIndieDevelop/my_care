# 👥 Admin/Caregiver Dual Role Architecture

## 🎯 Problem Statement

Currently, the system has a limitation:

- A user can be either an **admin** OR a **caregiver**, but not both
- The `profiles.role` field is a single value: `'admin'` or `'caregiver'`
- An admin who wants to also work as a caregiver cannot do so

### Real-World Scenario

In a small family care setting, the person who manages the system (admin) often also provides care themselves. They need to:

- **As Admin:** Create schedules, manage caregivers, view all data
- **As Caregiver:** See their own shifts, complete tasks, log medications

## 🏗️ Current Architecture

### Database Schema

```sql
-- profiles table
profiles {
  id uuid PRIMARY KEY,
  role text,  -- 'admin' or 'caregiver' (single value)
  full_name text,
  email text
}

-- caregivers table
caregivers {
  id uuid PRIMARY KEY,
  profile_id uuid UNIQUE,  -- Links to profiles.id
  phone text,
  is_active boolean
}
```

### Current Logic

1. **Role Check:** `profile.role === 'admin'` or `profile.role === 'caregiver'`
2. **Caregiver Record:** Only created if role is `'caregiver'`
3. **Navigation:** Different UI based on single role
4. **RLS Policies:** Based on single role

## ✅ Recommended Solution: Hybrid Approach

### Option 1: Role-Based with Caregiver Record (RECOMMENDED)

This is the **simplest and most aligned** with your current architecture.

#### How It Works

1. **Keep `profiles.role` as primary role** (`'admin'` or `'caregiver'`)
2. **Allow admins to have a caregiver record** (remove uniqueness constraint)
3. **Check for caregiver record existence** instead of role

#### Database Changes

```sql
-- No changes to profiles table
-- profiles.role remains 'admin' or 'caregiver'

-- caregivers table stays the same
-- But we allow profile_id to be an admin's profile

-- The key: Check for caregiver record, not role
```

#### Implementation

```typescript
// Check if user can act as caregiver
async function canActAsCaregiver(userId: string): Promise<boolean> {
  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("id, is_active")
    .eq("profile_id", userId)
    .eq("is_active", true)
    .single();

  return !!caregiver;
}

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "admin";
}
```

#### UI Changes

```typescript
// Dashboard page
const profile = await getProfile(user.id)
const caregiver = await getCaregiver(user.id)

const isAdmin = profile.role === 'admin'
const isCaregiver = !!caregiver && caregiver.is_active

// Show admin sections if admin
{isAdmin && <AdminDashboard />}

// Show caregiver sections if has caregiver record
{isCaregiver && <CaregiverDashboard />}

// If both, show both sections or a role switcher
{isAdmin && isCaregiver && <RoleSwitcher />}
```

#### Advantages ✅

- **Minimal changes** to existing code
- **Backward compatible** with current data
- **Simple to understand** and maintain
- **Follows existing patterns**
- **No breaking changes** to RLS policies

#### Disadvantages ⚠️

- Role field becomes less meaningful (admin can also be caregiver)
- Need to check both role AND caregiver record in some places

---

### Option 2: Multi-Role System with Junction Table

A more robust but complex solution for future scalability.

#### Database Changes

```sql
-- New roles table
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,  -- 'admin', 'caregiver', 'family_member', etc.
  description text,
  created_at timestamptz DEFAULT now()
);

-- New user_roles junction table
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Keep profiles.role for backward compatibility (or deprecate it)
-- Keep caregivers table as-is
```

#### Implementation

```typescript
// Check if user has role
async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("id, roles(name)")
    .eq("user_id", userId)
    .eq("roles.name", roleName)
    .single();

  return !!data;
}

// Get all user roles
async function getUserRoles(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId);

  return data?.map((r) => r.roles.name) || [];
}
```

#### Advantages ✅

- **Highly flexible** - can add new roles easily
- **Multiple roles** per user natively supported
- **Scalable** for future features
- **Industry standard** pattern

#### Disadvantages ⚠️

- **Major refactoring** required
- **Breaking changes** to existing code
- **More complex** queries and RLS policies
- **Overkill** for current simple needs

---

### Option 3: Simple Boolean Flag

Quick and dirty solution.

#### Database Changes

```sql
ALTER TABLE profiles ADD COLUMN can_be_caregiver boolean DEFAULT false;

-- Admin with caregiver access:
-- role = 'admin', can_be_caregiver = true, has caregiver record

-- Regular admin:
-- role = 'admin', can_be_caregiver = false, no caregiver record

-- Regular caregiver:
-- role = 'caregiver', can_be_caregiver = true, has caregiver record
```

#### Advantages ✅

- **Very simple** to implement
- **Minimal code changes**

#### Disadvantages ⚠️

- **Redundant** with caregiver record existence
- **Not scalable** for future roles
- **Confusing** semantics

---

## 🎯 Recommended Implementation: Option 1

### Step-by-Step Plan

#### Phase 1: Database & RLS Updates

```sql
-- 1. Update RLS policies to check caregiver record, not just role
-- Example: schedules table
DROP POLICY IF EXISTS "Caregivers can view own schedules" ON schedules;

CREATE POLICY "Caregivers can view own schedules"
  ON schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM caregivers
      WHERE caregivers.id = schedules.caregiver_id
      AND caregivers.profile_id = auth.uid()
      AND caregivers.is_active = true
    )
  );

-- 2. No schema changes needed!
```

#### Phase 2: Server-Side Utilities

```typescript
// apps/web/src/lib/auth/roles.ts
import { createClient } from "@/lib/supabase/server";

export async function getUserRoles(userId: string) {
  const supabase = await createClient();

  // Get profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
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
  };
}

export async function requireAdmin(userId: string) {
  const { isAdmin } = await getUserRoles(userId);
  if (!isAdmin) {
    throw new Error("Admin access required");
  }
}

export async function requireCaregiver(userId: string) {
  const { isCaregiver } = await getUserRoles(userId);
  if (!isCaregiver) {
    throw new Error("Caregiver access required");
  }
}
```

#### Phase 3: UI Updates

```typescript
// apps/web/src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { isAdmin, isCaregiver, caregiverId } = await getUserRoles(user.id)

  return (
    <div className="space-y-6">
      {/* Admin Dashboard */}
      {isAdmin && (
        <section>
          <h2>Panel de Administración</h2>
          <AdminDashboard />
        </section>
      )}

      {/* Caregiver Dashboard */}
      {isCaregiver && (
        <section>
          <h2>Mi Turno</h2>
          <CaregiverDashboard caregiverId={caregiverId} />
        </section>
      )}

      {/* If both roles */}
      {isAdmin && isCaregiver && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p>Tienes acceso como administrador y cuidador</p>
        </div>
      )}
    </div>
  )
}
```

#### Phase 4: Navigation Updates

```typescript
// apps/web/src/components/layout/dashboard-nav.tsx
export function DashboardNav() {
  const { isAdmin, isCaregiver } = useUserRoles()

  return (
    <nav>
      {/* Admin navigation */}
      {isAdmin && (
        <>
          <NavLink href="/dashboard/caregivers">Cuidadores</NavLink>
          <NavLink href="/dashboard/schedules">Horarios</NavLink>
          <NavLink href="/dashboard/care-recipients">Personas</NavLink>
        </>
      )}

      {/* Caregiver navigation */}
      {isCaregiver && (
        <>
          <NavLink href="/dashboard/tasks">Mis Tareas</NavLink>
          <NavLink href="/dashboard/medications">Medicamentos</NavLink>
          <NavLink href="/dashboard/appointments">Citas</NavLink>
        </>
      )}
    </nav>
  )
}
```

#### Phase 5: Admin Can Create Self as Caregiver

```typescript
// apps/web/src/app/dashboard/caregivers/new/page.tsx
export default async function NewCaregiverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { isAdmin, isCaregiver } = await getUserRoles(user.id)

  return (
    <div>
      <h1>Agregar Cuidador</h1>

      {/* Option to add self as caregiver */}
      {isAdmin && !isCaregiver && (
        <Card>
          <CardHeader>
            <CardTitle>¿Quieres ser cuidador también?</CardTitle>
            <CardDescription>
              Como administrador, puedes agregarte como cuidador para ver tus propios turnos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAddSelfAsCaregiver}>
              Agregarme como cuidador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Regular caregiver form */}
      <CaregiverForm />
    </div>
  )
}

async function handleAddSelfAsCaregiver() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Create caregiver record for admin
  const { error } = await supabase
    .from('caregivers')
    .insert({
      profile_id: user.id,
      is_active: true
    })

  if (!error) {
    toast.success('Ahora eres cuidador también')
    router.refresh()
  }
}
```

---

## 📋 Migration Checklist

### Database

- [ ] Review RLS policies (most should already work)
- [ ] Test that admins can create caregiver records for themselves
- [ ] Verify data access works correctly

### Code Changes

- [ ] Create `lib/auth/roles.ts` utility
- [ ] Update dashboard page to show both sections
- [ ] Update navigation to show both menus
- [ ] Update middleware if needed
- [ ] Add "Add self as caregiver" option for admins

### Testing

- [ ] Admin without caregiver record - sees only admin features
- [ ] Admin with caregiver record - sees both admin and caregiver features
- [ ] Regular caregiver - sees only caregiver features
- [ ] RLS policies work correctly for all scenarios
- [ ] Navigation shows correct items
- [ ] No data leaks between roles

---

## 🎨 UI/UX Considerations

### Option A: Unified Dashboard (RECOMMENDED)

Show both admin and caregiver sections on same page.

**Pros:**

- Simple, no context switching
- See everything at once
- Natural for small teams

**Cons:**

- Can be overwhelming with lots of data

### Option B: Role Switcher

Add a toggle to switch between admin and caregiver views.

**Pros:**

- Cleaner, focused interface
- Clear separation of concerns

**Cons:**

- Extra click to switch
- More complex state management

### Option C: Separate Routes

- `/dashboard` - Admin view
- `/dashboard/my-shifts` - Caregiver view

**Pros:**

- Clear URL structure
- Easy to bookmark

**Cons:**

- Requires navigation between views

---

## 🔐 Security Considerations

1. **RLS Policies:** Already handle this correctly by checking caregiver record
2. **Server Actions:** Use `getUserRoles()` to verify access
3. **Middleware:** Update to allow both roles
4. **API Routes:** Check both admin status and caregiver record

---

## 🚀 Rollout Strategy

### Phase 1: Backend (Week 1)

- Create `getUserRoles()` utility
- Update any hardcoded role checks
- Test RLS policies

### Phase 2: UI (Week 2)

- Update dashboard to show both sections
- Update navigation
- Add "Add self as caregiver" feature

### Phase 3: Testing (Week 3)

- Test all scenarios
- Fix any edge cases
- User acceptance testing

### Phase 4: Documentation (Week 4)

- Update user guide
- Create admin tutorial
- Document for future developers

---

## 📊 Impact Analysis

### Low Risk Changes ✅

- Adding `getUserRoles()` utility
- Updating dashboard UI
- Adding "Add self as caregiver" button

### Medium Risk Changes ⚠️

- Updating navigation logic
- Modifying middleware

### High Risk Changes 🔴

- Changing RLS policies (test thoroughly!)

---

## 🎯 Conclusion

**Recommended Approach:** Option 1 (Role-Based with Caregiver Record)

**Why:**

- Minimal changes to existing architecture
- Backward compatible
- Simple to understand and maintain
- Aligns with current patterns
- Low risk

**Next Steps:**

1. Create `getUserRoles()` utility
2. Update dashboard page
3. Add "Add self as caregiver" feature
4. Test thoroughly
5. Deploy

**Estimated Effort:** 2-3 days of development + 1 day of testing

---

## 📝 Code Examples

See implementation examples in the plan above. Key files to modify:

- `apps/web/src/lib/auth/roles.ts` (new)
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/components/layout/dashboard-nav.tsx`
- `apps/web/src/app/dashboard/caregivers/new/page.tsx`
