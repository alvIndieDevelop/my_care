import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScheduleForm } from './schedule-form'
import { t } from '@/lib/translations'

interface NewSchedulePageProps {
  searchParams: Promise<{ caregiver?: string; care_recipient?: string }>
}

export default async function NewSchedulePage({ searchParams }: NewSchedulePageProps) {
  const params = await searchParams
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

  // Get care recipients for dropdown
  const { data: careRecipients } = await supabase
    .from('care_recipients')
    .select('id, name')
    .order('name')

  // Get active caregivers for dropdown
  const { data: caregivers } = await supabase
    .from('caregivers')
    .select(`
      id,
      profiles (full_name)
    `)
    .eq('is_active', true)

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6">
        <Link 
          href="/dashboard/schedules" 
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 min-h-[44px] inline-flex items-center"
        >
          ← {t.common.back} {t.schedules.title}
        </Link>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">{t.schedules.createTitle}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t.schedules.createSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <ScheduleForm 
            careRecipients={careRecipients || []}
            caregivers={caregivers || []}
            defaultCaregiverId={params.caregiver}
            defaultCareRecipientId={params.care_recipient}
          />
        </CardContent>
      </Card>
    </div>
  )
}
