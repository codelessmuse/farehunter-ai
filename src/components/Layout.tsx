import { Link, Outlet } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/results', label: 'Results' },
  { to: '/saved-searches', label: 'Saved' },
  { to: '/dashboard', label: 'Dashboard' },
] as const;

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-sky-400">
            FareHunter AI
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        Find smarter flight deals with flexible dates and nearby airports.
      </footer>
    </div>
  );
}
