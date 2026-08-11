export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-serif font-bold text-foreground mb-8">My Dashboard</h1>
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-xl font-medium mb-4">Your Upcoming Appointments</h2>
        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          You don&apos;t have any upcoming appointments.
        </div>
      </div>
    </div>
  )
}
