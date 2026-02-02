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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.caregivers.title}</h1>
          <p className="text-muted-foreground">{t.caregivers.subtitle}</p>
        </div>
        <Link href="/dashboard/caregivers/new">
          <Button>{t.caregivers.addNew}</Button>
        </Link>
      </div>

      {caregivers && caregivers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {caregivers.map((caregiver) => (
            <Link key={caregiver.id} href={`/dashboard/caregivers/${caregiver.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {caregiver.profiles?.full_name || 'Desconocido'}
                    </CardTitle>
                    <Badge variant={caregiver.is_active ? 'default' : 'secondary'}>
                      {caregiver.is_active ? t.common.active : t.common.inactive}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {caregiver.profiles?.email}
                  </p>
                  {caregiver.phone && (
                    <p className="text-sm text-muted-foreground mt-1">
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
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">{t.caregivers.noCaregivers}</p>
            <p className="text-sm text-muted-foreground/70 mb-6">
              {t.caregivers.noCaregiversHelp}
            </p>
            <Link href="/dashboard/caregivers/new">
              <Button>{t.caregivers.addFirst}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
