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

  // Get all caregivers with their profile info
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.caregivers.title}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t.caregivers.subtitle}</p>
        </div>
        <Link href="/dashboard/caregivers/new">
          <Button className="w-full sm:w-auto min-h-[44px]">{t.caregivers.addNew}</Button>
        </Link>
      </div>

      {caregivers && caregivers.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {caregivers.map((caregiver) => (
            <Link key={caregiver.id} href={`/dashboard/caregivers/${caregiver.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg break-words">
                      {caregiver.profiles?.full_name || 'Desconocido'}
                    </CardTitle>
                    <Badge variant={caregiver.is_active ? 'default' : 'secondary'} className="shrink-0">
                      {caregiver.is_active ? t.common.active : t.common.inactive}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">
                    {caregiver.profiles?.email}
                  </p>
                  {caregiver.phone && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      📞 {caregiver.phone}
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
