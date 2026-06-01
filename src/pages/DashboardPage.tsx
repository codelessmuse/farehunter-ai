export default function DashboardPage() {
  const stats = [
    { label: 'Searches this week', value: '0' },
    { label: 'Best deal found', value: '—' },
    { label: 'Saved routes', value: '0' },
  ];

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
