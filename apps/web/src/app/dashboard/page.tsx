import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { Tables } from '@/types/database'

type Task = Tables<'tasks'>

export default async function DashboardPage() {
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

  if (isAdmin) {
    return <AdminDashboard />
  }

  return <CaregiverDashboard />
}

async function AdminDashboard() {
  const supabase = await createClient()

  // Get counts for dashboard
  const [
    { count: careRecipientsCount },
    { count: caregiversCount },
    { count: schedulesCount },
    { count: appointmentsCount },
  ] = await Promise.all([
    supabase.from('care_recipients').select('*', { count: 'exact', head: true }),
    supabase.from('caregivers').select('*', { count: 'exact', head: true }),
    supabase.from('schedules').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
  ])

  const stats = [
    { label: 'Care Recipients', value: careRecipientsCount || 0, href: '/dashboard/care-recipients' },
    { label: 'Caregivers', value: caregiversCount || 0, href: '/dashboard/caregivers' },
    { label: 'Schedules', value: schedulesCount || 0, href: '/dashboard/schedules' },
    { label: 'Upcoming Appointments', value: appointmentsCount || 0, href: '/dashboard/appointments' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage care coordination for your team</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link 
              href="/dashboard/care-recipients/new" 
              className="block p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              + Add Care Recipient
            </Link>
            <Link 
              href="/dashboard/caregivers/new" 
              className="block p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              + Add Caregiver
            </Link>
            <Link 
              href="/dashboard/schedules/new" 
              className="block p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              + Create Schedule
            </Link>
            <Link 
              href="/dashboard/appointments/new" 
              className="block p-3 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
            >
              + Schedule Appointment
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Add Care Recipients</strong> - The people being cared for</p>
            <p>2. <strong>Add Caregivers</strong> - Invite team members to help</p>
            <p>3. <strong>Create Schedules</strong> - Assign caregivers to shifts</p>
            <p>4. <strong>Add Tasks</strong> - Define what needs to be done each shift</p>
            <p>5. <strong>Set Up Medications</strong> - Track medication schedules</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function CaregiverDashboard() {
  const supabase = await createClient()
  
  // Get today's day of week (0 = Sunday, 6 = Saturday)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const todayStr = today.toISOString().split('T')[0]

  // Get caregiver's schedules for today
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`
      *,
      care_recipients (name),
      tasks (
        id,
        title,
        description,
        due_time,
        sort_order
      )
    `)
    .eq('day_of_week', dayOfWeek)

  // Get today's task logs
  const { data: taskLogs } = await supabase
    .from('task_logs')
    .select('task_id, status')
    .eq('log_date', todayStr)

  const taskLogMap = new Map(taskLogs?.map(log => [log.task_id, log.status]) || [])

  // Get shift notes from previous shifts
  const { data: shiftNotes } = await supabase
    .from('shift_notes')
    .select('*, caregivers(profiles(full_name))')
    .eq('shift_date', todayStr)
    .eq('is_urgent', true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today&apos;s Schedule</h1>
        <p className="text-gray-600">
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Urgent Notes */}
      {shiftNotes && shiftNotes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 text-lg">⚠️ Urgent Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {shiftNotes.map((note) => (
              <div key={note.id} className="p-3 bg-white rounded-lg border border-red-200">
                <p className="text-gray-900">{note.notes}</p>
                <p className="text-xs text-gray-500 mt-1">
                  From previous shift
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today's Schedules */}
      {schedules && schedules.length > 0 ? (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{schedule.care_recipients?.name}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {schedule.tasks && schedule.tasks.length > 0 ? (
                  <ul className="space-y-2">
                    {(schedule.tasks as Task[])
                      .sort((a: Task, b: Task) => {
                        if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time)
                        if (a.due_time) return -1
                        if (b.due_time) return 1
                        return a.sort_order - b.sort_order
                      })
                      .map((task: Task) => {
                        const status = taskLogMap.get(task.id)
                        return (
                          <li 
                            key={task.id} 
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              status === 'completed' 
                                ? 'bg-green-50 border-green-200' 
                                : status === 'skipped'
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div>
                              <p className={`font-medium ${status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                {task.title}
                              </p>
                              {task.due_time && (
                                <p className="text-xs text-gray-500">Due: {task.due_time.slice(0, 5)}</p>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              status === 'completed' 
                                ? 'bg-green-100 text-green-700' 
                                : status === 'skipped'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {status || 'Pending'}
                            </span>
                          </li>
                        )
                      })}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-4">No tasks assigned for this shift</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No schedules assigned for today</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
