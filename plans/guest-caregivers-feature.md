# Guest Caregivers Feature Plan

## Overview

This feature allows admins to create caregivers directly without requiring them to register or have a login. These "guest caregivers" are managed entirely by the admin and cannot log into the app themselves.

## Use Cases

- Caregivers who don't have smartphones
- Caregivers who don't need app access (admin tracks everything)
- Quick onboarding without waiting for caregiver to register
- Elderly caregivers who may not be tech-savvy

## Current Schema

### `profiles` table
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | FK to auth.users |
| role | text | NO | 'admin' or 'caregiver' |
| full_name | text | NO | |
| email | text | NO | |
| created_at | timestamptz | NO | |
| push_subscription | jsonb | YES | |

### `caregivers` table
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | PK |
| profile_id | uuid | NO | FK to profiles |
| phone | text | YES | |
| is_active | boolean | NO | |
| created_at | timestamptz | NO | |

## Proposed Schema Changes

### Option 1: Add fields to `caregivers` table (Recommended)

Make `profile_id` nullable and add `full_name` directly to caregivers:

```sql
-- Migration: add_guest_caregivers_support
ALTER TABLE caregivers 
  ALTER COLUMN profile_id DROP NOT NULL;

ALTER TABLE caregivers 
  ADD COLUMN full_name text,
  ADD COLUMN email text;

-- Add constraint: either profile_id OR full_name must be set
ALTER TABLE caregivers 
  ADD CONSTRAINT caregivers_identity_check 
  CHECK (profile_id IS NOT NULL OR full_name IS NOT NULL);
```

**Pros:**
- Simple change
- Backward compatible
- Guest caregivers stored in same table

**Cons:**
- Some data duplication (full_name in both profiles and caregivers)

### Data Model After Change

```
caregivers table:
├── id (uuid, PK)
├── profile_id (uuid, FK to profiles, NULLABLE)
├── full_name (text, NULLABLE) -- for guest caregivers
├── email (text, NULLABLE) -- optional contact email
├── phone (text, NULLABLE)
├── is_active (boolean)
└── created_at (timestamptz)

Logic:
- If profile_id is set → linked to a user account (can login)
- If profile_id is NULL → guest caregiver (admin-managed)
```

## Implementation Steps

### Step 1: Database Migration

```sql
-- Migration: add_guest_caregivers_support

-- 1. Make profile_id nullable
ALTER TABLE caregivers 
  ALTER COLUMN profile_id DROP NOT NULL;

-- 2. Add full_name and email columns for guest caregivers
ALTER TABLE caregivers 
  ADD COLUMN full_name text,
  ADD COLUMN email text;

-- 3. Add constraint to ensure identity
ALTER TABLE caregivers 
  ADD CONSTRAINT caregivers_identity_check 
  CHECK (profile_id IS NOT NULL OR full_name IS NOT NULL);

-- 4. Update RLS policies to allow admin to create guest caregivers
-- (Existing admin policies should already allow this)
```

### Step 2: Update TypeScript Types

Update `apps/web/src/types/database.ts`:

```typescript
caregivers: {
  Row: {
    id: string
    profile_id: string | null  // Changed from string
    full_name: string | null   // New
    email: string | null       // New
    phone: string | null
    is_active: boolean
    created_at: string
  }
  Insert: {
    id?: string
    profile_id?: string | null  // Changed
    full_name?: string | null   // New
    email?: string | null       // New
    phone?: string | null
    is_active?: boolean
    created_at?: string
  }
  // ... Update and Relationships
}
```

### Step 3: Update Caregiver Creation Form

Modify `apps/web/src/app/dashboard/caregivers/new/page.tsx`:

**New Form Fields:**
- Full Name (required)
- Phone (optional)
- Email (optional, for contact purposes only)

**Remove:**
- Email lookup requirement
- "User must register first" message

**New Flow:**
1. Admin enters caregiver name
2. Optionally adds phone and email
3. Click "Add Caregiver"
4. Caregiver is created directly in the database

### Step 4: Update Caregiver List Page

Modify `apps/web/src/app/dashboard/caregivers/page.tsx`:

- Show `full_name` from caregiver record OR `profiles.full_name` if linked
- Add badge to indicate "Guest" vs "Has Account"
- Show email from caregiver record OR profiles

### Step 5: Update Caregiver Detail Page

Modify `apps/web/src/app/dashboard/caregivers/[id]/page.tsx`:

- Handle both guest and linked caregivers
- Show appropriate fields based on type

### Step 6: Update Schedule/Task Assignment

Ensure schedules and tasks work with guest caregivers:
- Schedules reference `caregiver_id`, not `profile_id` ✓
- Tasks reference `schedule_id` ✓
- Task logs reference `caregiver_id` ✓

**Note:** Guest caregivers can be assigned to schedules, but since they can't log in, the admin would need to mark tasks as complete on their behalf.

## UI/UX Considerations

### Caregiver Creation Form

```
┌─────────────────────────────────────┐
│ Add New Caregiver                   │
├─────────────────────────────────────┤
│                                     │
│ Full Name *                         │
│ ┌─────────────────────────────────┐ │
│ │ María García                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Phone                               │
│ ┌─────────────────────────────────┐ │
│ │ +507 6123-4567                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Email (optional)                    │
│ ┌─────────────────────────────────┐ │
│ │ maria@example.com               │ │
│ └─────────────────────────────────┘ │
│ For contact purposes only           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        Add Caregiver            │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Caregiver List

```
┌─────────────────────────────────────┐
│ María García          [Guest]       │
│ +507 6123-4567                      │
├─────────────────────────────────────┤
│ Juan Pérez            [Has Account] │
│ juan@example.com                    │
└─────────────────────────────────────┘
```

## Migration Strategy

1. Apply database migration
2. Update TypeScript types
3. Update caregiver creation form
4. Update caregiver list/detail pages
5. Test with existing caregivers (should still work)
6. Test creating new guest caregivers

## Rollback Plan

If issues arise:
1. Guest caregivers can be deleted
2. Migration can be reversed by:
   - Removing guest caregivers
   - Dropping new columns
   - Re-adding NOT NULL constraint

## Future Considerations

- **Convert Guest to Account:** Later, we could add a feature to "upgrade" a guest caregiver to a full account by inviting them to register
- **Admin Task Completion:** Since guests can't log in, admin may need a way to complete tasks on their behalf
- **Notifications:** Guest caregivers won't receive push notifications (no app access)

## Files to Modify

1. **Database:** New migration via Supabase MCP
2. **Types:** `apps/web/src/types/database.ts`
3. **Translations:** `apps/web/src/lib/translations.ts`
4. **New Caregiver Page:** `apps/web/src/app/dashboard/caregivers/new/page.tsx`
5. **Caregiver List:** `apps/web/src/app/dashboard/caregivers/page.tsx`
6. **Caregiver Detail:** `apps/web/src/app/dashboard/caregivers/[id]/page.tsx`
