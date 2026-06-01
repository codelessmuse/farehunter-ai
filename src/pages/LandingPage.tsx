import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section className="space-y-10 py-8">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-wider text-sky-400">
          Smarter flight deals
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Hunt fares with flexible dates and nearby airports
        </h1>
        <p className="max-w-xl text-lg text-slate-400">
          FareHunter AI helps travelers compare options, score deals, and save
          searches — all in one place.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/search"
          className="rounded-lg bg-sky-500 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-sky-400"
        >
          Start a search
        </Link>
        <Link
          to="/dashboard"
          className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
        >
          View dashboard
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Flexible dates',
            body: 'Explore departures across a range of days to catch price dips.',
          },
          {
            title: 'Nearby airports',
            body: 'Include alternate airports that may offer better fares.',
          },
          {
            title: 'Deal scoring',
            body: 'See which options stand out before you book.',
          },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <h2 className="font-semibold text-white">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
