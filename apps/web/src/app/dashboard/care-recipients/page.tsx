import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
          <h1 className="text-2xl font-bold text-gray-900">Care Recipients</h1>
          <p className="text-gray-600">Manage the people being cared for</p>
        </div>
        <Link href="/dashboard/care-recipients/new">
          <Button>+ Add Care Recipient</Button>
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
                    <p className="text-sm text-gray-500">
                      Born: {new Date(recipient.date_of_birth).toLocaleDateString()}
                    </p>
                  )}
                  {recipient.notes && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
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
            <p className="text-gray-500 mb-4">No care recipients yet</p>
            <Link href="/dashboard/care-recipients/new">
              <Button>Add Your First Care Recipient</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
