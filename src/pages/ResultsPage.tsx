export default function ResultsPage() {
  const sampleDeals = [
    { route: 'JFK → LHR', price: '$412', score: 'Great' },
    { route: 'EWR → LHR', price: '$389', score: 'Excellent' },
    { route: 'JFK → CDG', price: '$445', score: 'Good' },
  ];

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Results</h1>
      <p className="text-slate-400">Sample deals for demonstration.</p>
      <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
        {sampleDeals.map((deal) => (
          <li
            key={deal.route}
            className="flex items-center justify-between gap-4 px-4 py-4"
          >
            <span className="font-medium text-white">{deal.route}</span>
            <span className="text-sky-400">{deal.price}</span>
            <span className="text-sm text-slate-400">{deal.score}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
