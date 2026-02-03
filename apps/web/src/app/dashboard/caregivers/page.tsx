import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/translations'

export default async function CaregiversPage() {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all caregivers with their profile info (if linked)
  const { data: caregivers } = await supabase
    .from('caregivers')
    .select(`
      *,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  // Helper function to get caregiver display name
  const getCaregiverName = (caregiver: typeof caregivers extends (infer T)[] | null ? T : never) => {
    // If linked to a profile, use profile name
    if (caregiver.profiles?.full_name) {
      return caregiver.profiles.full_name
    }
    // Otherwise use the caregiver's own full_name (guest caregiver)
    return caregiver.full_name || 'Desconocido'
  }

  // Helper function to get caregiver email
  const getCaregiverEmail = (caregiver: typeof caregivers extends (infer T)[] | null ? T : never) => {
    // If linked to a profile, use profile email
    if (caregiver.profiles?.email) {
      return caregiver.profiles.email
    }
    // Otherwise use the caregiver's own email (guest caregiver)
    return caregiver.email
  }

  // Helper function to check if caregiver is a guest (no profile linked)
  const isGuestCaregiver = (caregiver: typeof caregivers extends (infer T)[] | null ? T : never) => {
    return !caregiver.profile_id
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.caregivers.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t.caregivers.subtitle}</p>
        </div>
        <Link href="/dashboard/caregivers/new">
          <Button className="w-full sm:w-auto min-h-[44px]">{t.caregivers.addNew}</Button>
        </Link>
      </div>

      {caregivers && caregivers.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {caregivers.map((caregiver) => (
            <Link key={caregiver.id} href={`/dashboard/caregivers/${caregiver.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2 p-4 sm:p-6 sm:pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg break-words">
                      {getCaregiverName(caregiver)}
                    </CardTitle>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Badge variant={caregiver.is_active ? 'default' : 'secondary'} className="text-xs">
                        {caregiver.is_active ? t.common.active : t.common.inactive}
                      </Badge>
                      {isGuestCaregiver(caregiver) && (
                        <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                          {t.caregivers.guestBadge}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  {getCaregiverEmail(caregiver) && (
                    <p className="text-xs sm:text-sm text-muted-foreground break-all">
                      {getCaregiverEmail(caregiver)}
                    </p>
                  )}
                  {caregiver.phone && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      📞 {caregiver.phone}
                    </p>
                  )}
                  {isGuestCaregiver(caregiver) && !getCaregiverEmail(caregiver) && !caregiver.phone && (
                    <p className="text-xs text-muted-foreground/70 italic">
                      Sin información de contacto
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center p-4 sm:p-6">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">{t.caregivers.noCaregivers}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/70 mb-6">
              {t.caregivers.noCaregiversHelp}
            </p>
            <Link href="/dashboard/caregivers/new">
              <Button className="min-h-[44px]">{t.caregivers.addFirst}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
