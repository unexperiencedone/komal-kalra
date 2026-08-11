import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Calendar, IndianRupee, MessageSquare } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Middleware already protects this route, but it's good practice to ensure user exists
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch some mock or real data
  // In a real app with data, we would query the tables:
  const { count: appointmentsCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true })
  const { count: contactRequestsCount } = await supabase.from('contact_requests').select('*', { count: 'exact', head: true }).eq('status', 'unread')
  const { data: recentAppointments } = await supabase.from('appointments').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5)
  const { data: contactRequests } = await supabase.from('contact_requests').select('*').order('created_at', { ascending: false }).limit(5)

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
        <div className="px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-600 border border-slate-200">
          Admin Role Active
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <Calendar className="w-5 h-5 text-brand" />
            <span className="font-medium">Appointments</span>
          </div>
          <div className="text-3xl font-bold">{appointmentsCount || 0}</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <IndianRupee className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold">₹0</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="font-medium">Total Clients</span>
          </div>
          <div className="text-3xl font-bold">0</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <span className="font-medium">Unread Messages</span>
          </div>
          <div className="text-3xl font-bold">{contactRequestsCount || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold font-serif">Recent Appointments</h2>
          </div>
          <div className="p-6">
            {recentAppointments && recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((apt: any) => (
                  <div key={apt.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="font-medium">{apt.profiles?.full_name || 'Client'}</div>
                      <div className="text-sm text-slate-500">{new Date(apt.appointment_date).toLocaleDateString()}</div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No appointments found.</div>
            )}
          </div>
        </div>

        {/* Contact Requests */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold font-serif">Contact Requests</h2>
          </div>
          <div className="p-6">
            {contactRequests && contactRequests.length > 0 ? (
              <div className="space-y-4">
                {contactRequests.map((req: any) => (
                  <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{req.name}</div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${req.status === 'unread' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 line-clamp-2">{req.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">No contact requests found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
