import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/layout/dashboard-nav'
import { getUserRoles } from '@/lib/auth/roles'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user roles
  const { isAdmin, isCaregiver, profile } = await getUserRoles(user.id)

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profile={profile} isAdmin={isAdmin} isCaregiver={isCaregiver} />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
    </div>
  )
}
