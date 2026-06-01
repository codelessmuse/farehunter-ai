import { Link } from 'react-router-dom';

export default function SearchPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Flight search</h1>
      <p className="text-slate-400">
        Search form UI will go here. For now, continue to sample results.
      </p>
      <Link
        to="/results"
        className="inline-block rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
      >
        View sample results
      </Link>
    </section>
  );
}
