import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { t } from '@/lib/translations'

export default async function CareRecipientsPage() {
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

  // Get all care recipients
  const { data: careRecipients } = await supabase
    .from('care_recipients')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.careRecipients.title}</h1>
          <p className="text-muted-foreground">{t.careRecipients.subtitle}</p>
        </div>
        <Link href="/dashboard/care-recipients/new">
          <Button>{t.careRecipients.addNew}</Button>
        </Link>
      </div>

      {careRecipients && careRecipients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {careRecipients.map((recipient) => (
            <Link key={recipient.id} href={`/dashboard/care-recipients/${recipient.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{recipient.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {recipient.date_of_birth && (
                    <p className="text-sm text-muted-foreground">
                      {t.careRecipients.born}: {new Date(recipient.date_of_birth).toLocaleDateString('es-ES')}
                    </p>
                  )}
                  {recipient.notes && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {recipient.notes}
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
            <p className="text-muted-foreground mb-4">{t.careRecipients.noRecipients}</p>
            <Link href="/dashboard/care-recipients/new">
              <Button>{t.careRecipients.addFirst}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
