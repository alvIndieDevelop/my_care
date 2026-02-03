import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/layout/dashboard-nav'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

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

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const isAdmin = profile.role === 'admin'

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav profile={profile} />
      <main className="container mx-auto px-4 py-6 max-w-7xl pb-bottom-nav md:pb-6">
        {children}
      </main>
      {/* Show bottom nav for both admin and caregiver on mobile */}
      <MobileBottomNav isAdmin={isAdmin} />
    </div>
  )
}
