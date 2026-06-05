import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flightSearchToSearchParams,
  saveFlightSearchToStorage,
  type FlightSearchCriteria,
} from '../lib/flightSearch';

const MOCK_LOCATIONS = [
  'New York (JFK)',
  'New York (EWR)',
  'New York (LGA)',
  'London (LHR)',
  'London (LGW)',
  'Paris (CDG)',
  'Paris (ORY)',
  'Los Angeles (LAX)',
  'San Francisco (SFO)',
  'Chicago (ORD)',
  'Miami (MIA)',
  'Tokyo (NRT)',
  'Dubai (DXB)',
  'Singapore (SIN)',
  'Sydney (SYD)',
] as const;

const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium-economy', label: 'Premium economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
] as const;

const BAGGAGE_OPTIONS = [
  { value: 'carry-on', label: 'Carry-on only' },
  { value: 'one-checked', label: '1 checked bag' },
  { value: 'two-checked', label: '2+ checked bags' },
] as const;

const MAX_STOPS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'nonstop', label: 'Nonstop only' },
  { value: '1', label: '1 stop max' },
  { value: '2', label: '2 stops max' },
] as const;

const FLEXIBILITY_OPTIONS = [
  { value: '1', label: '±1 day' },
  { value: '2', label: '±2 days' },
  { value: '3', label: '±3 days' },
  { value: '7', label: '±7 days' },
] as const;

const inputClassName =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50';

const labelClassName = 'mb-1.5 block text-sm font-medium text-slate-300';

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={labelClassName}>
      {children}
    </label>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
      <div>
        <label htmlFor={id} className="font-medium text-white">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-sky-500' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const formId = useId();

  const [origin, setOrigin] = useState('New York (JFK)');
  const [destination, setDestination] = useState('London (LHR)');
  const [departureDate, setDepartureDate] = useState('2026-07-15');
  const [returnDate, setReturnDate] = useState('2026-07-22');
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [flexibilityDays, setFlexibilityDays] = useState('3');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('economy');
  const [baggage, setBaggage] = useState('one-checked');
  const [maxStops, setMaxStops] = useState('1');
  const [maxBudget, setMaxBudget] = useState('800');
  const [includeNearbyAirports, setIncludeNearbyAirports] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const criteria: FlightSearchCriteria = {
      origin,
      destination,
      departureDate,
      returnDate,
      flexibleDates,
      flexibilityDays,
      passengers,
      cabinClass,
      baggage,
      maxStops,
      maxBudget,
      includeNearbyAirports,
    };

    saveFlightSearchToStorage(criteria);
    const params = flightSearchToSearchParams(criteria);
    navigate(`/results?${params.toString()}`);
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-sky-400">
          Plan your hunt
        </p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Flight search
        </h1>
        <p className="max-w-2xl text-slate-400">
          Set your route, dates, and preferences. FareHunter will surface mock
          opportunities on the results page.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 rounded-xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8"
      >
        <fieldset className="space-y-5">
          <legend className="text-lg font-semibold text-white">Route</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${formId}-origin`}>
                Origin city or airport
              </FieldLabel>
              <input
                id={`${formId}-origin`}
                type="text"
                list={`${formId}-locations`}
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. New York (JFK)"
                className={inputClassName}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-destination`}>
                Destination city or airport
              </FieldLabel>
              <input
                id={`${formId}-destination`}
                type="text"
                list={`${formId}-locations`}
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. London (LHR)"
                className={inputClassName}
              />
            </div>
          </div>
          <datalist id={`${formId}-locations`}>
            {MOCK_LOCATIONS.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
          <Toggle
            id={`${formId}-nearby`}
            label="Include nearby airports"
            description="Search alternate airports within the metro area for better fares."
            checked={includeNearbyAirports}
            onChange={setIncludeNearbyAirports}
          />
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-lg font-semibold text-white">Dates</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${formId}-departure`}>
                Departure date
              </FieldLabel>
              <input
                id={`${formId}-departure`}
                type="date"
                required
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-return`}>Return date</FieldLabel>
              <input
                id={`${formId}-return`}
                type="date"
                required
                min={departureDate || undefined}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          <Toggle
            id={`${formId}-flexible`}
            label="Flexible dates"
            description="Widen your search window around the selected dates."
            checked={flexibleDates}
            onChange={setFlexibleDates}
          />
          {flexibleDates ? (
            <div className="max-w-xs">
              <FieldLabel htmlFor={`${formId}-flex-days`}>
                Flexibility window
              </FieldLabel>
              <select
                id={`${formId}-flex-days`}
                value={flexibilityDays}
                onChange={(e) => setFlexibilityDays(e.target.value)}
                className={inputClassName}
              >
                {FLEXIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-lg font-semibold text-white">
            Travelers &amp; cabin
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${formId}-passengers`}>
                Passengers
              </FieldLabel>
              <input
                id={`${formId}-passengers`}
                type="number"
                min={1}
                max={9}
                required
                value={passengers}
                onChange={(e) =>
                  setPassengers(Math.max(1, Number(e.target.value) || 1))
                }
                className={inputClassName}
              />
              <p className="mt-1 text-xs text-slate-500">1–9 travelers</p>
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-cabin`}>Cabin class</FieldLabel>
              <select
                id={`${formId}-cabin`}
                value={cabinClass}
                onChange={(e) => setCabinClass(e.target.value)}
                className={inputClassName}
              >
                {CABIN_CLASSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="text-lg font-semibold text-white">
            Preferences
          </legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor={`${formId}-baggage`}>
                Baggage preference
              </FieldLabel>
              <select
                id={`${formId}-baggage`}
                value={baggage}
                onChange={(e) => setBaggage(e.target.value)}
                className={inputClassName}
              >
                {BAGGAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor={`${formId}-stops`}>Max stops</FieldLabel>
              <select
                id={`${formId}-stops`}
                value={maxStops}
                onChange={(e) => setMaxStops(e.target.value)}
                className={inputClassName}
              >
                {MAX_STOPS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`${formId}-budget`}>Max budget</FieldLabel>
              <div className="relative max-w-xs">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  $
                </span>
                <input
                  id={`${formId}-budget`}
                  type="number"
                  min={0}
                  step={50}
                  required
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className={`${inputClassName} pl-7`}
                  placeholder="800"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Per person, round trip (USD, mock)
              </p>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {origin} → {destination}
            {flexibleDates ? ` · ±${flexibilityDays} days` : ''}
            {includeNearbyAirports ? ' · nearby airports' : ''}
          </p>
          <button
            type="submit"
            className="rounded-lg bg-sky-500 px-6 py-3 font-medium text-slate-950 transition hover:bg-sky-400"
          >
            Find flight opportunities
          </button>
        </div>
      </form>
    </section>
  );
}
