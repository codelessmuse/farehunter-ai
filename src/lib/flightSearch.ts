export type FlightSearchCriteria = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  flexibleDates: boolean;
  flexibilityDays: string;
  passengers: number;
  cabinClass: string;
  baggage: string;
  maxStops: string;
  maxBudget: string;
  includeNearbyAirports: boolean;
};

export const FLIGHT_SEARCH_STORAGE_KEY = 'farehunter-flight-search';

export function saveFlightSearchToStorage(criteria: FlightSearchCriteria): void {
  try {
    localStorage.setItem(FLIGHT_SEARCH_STORAGE_KEY, JSON.stringify(criteria));
  } catch {
    // Ignore quota or privacy errors in mock flow.
  }
}

export function loadFlightSearchFromStorage(): FlightSearchCriteria | null {
  try {
    const raw = localStorage.getItem(FLIGHT_SEARCH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FlightSearchCriteria;
  } catch {
    return null;
  }
}

export function flightSearchToSearchParams(
  criteria: FlightSearchCriteria
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('origin', criteria.origin);
  params.set('destination', criteria.destination);
  params.set('departureDate', criteria.departureDate);
  params.set('returnDate', criteria.returnDate);
  params.set('flexibleDates', String(criteria.flexibleDates));
  params.set('flexibilityDays', criteria.flexibilityDays);
  params.set('passengers', String(criteria.passengers));
  params.set('cabinClass', criteria.cabinClass);
  params.set('baggage', criteria.baggage);
  params.set('maxStops', criteria.maxStops);
  params.set('maxBudget', criteria.maxBudget);
  params.set('includeNearbyAirports', String(criteria.includeNearbyAirports));
  return params;
}

export function flightSearchFromSearchParams(
  params: URLSearchParams
): FlightSearchCriteria | null {
  const origin = params.get('origin');
  const destination = params.get('destination');
  const departureDate = params.get('departureDate');
  const returnDate = params.get('returnDate');

  if (!origin || !destination || !departureDate || !returnDate) {
    return null;
  }

  const passengers = Number(params.get('passengers') ?? '1');
  const flexibleDates = params.get('flexibleDates') === 'true';

  return {
    origin,
    destination,
    departureDate,
    returnDate,
    flexibleDates,
    flexibilityDays: params.get('flexibilityDays') ?? '3',
    passengers: Number.isFinite(passengers) && passengers > 0 ? passengers : 1,
    cabinClass: params.get('cabinClass') ?? 'economy',
    baggage: params.get('baggage') ?? 'one-checked',
    maxStops: params.get('maxStops') ?? '1',
    maxBudget: params.get('maxBudget') ?? '',
    includeNearbyAirports: params.get('includeNearbyAirports') !== 'false',
  };
}

export function resolveFlightSearch(
  searchParams: URLSearchParams
): FlightSearchCriteria | null {
  return (
    flightSearchFromSearchParams(searchParams) ?? loadFlightSearchFromStorage()
  );
}

export function formatSearchDate(isoDate: string): string {
  if (!isoDate) return '—';
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

export function formatBudget(amount: string): string {
  if (!amount.trim()) return '—';
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatFlexibleDates(criteria: FlightSearchCriteria): string {
  if (!criteria.flexibleDates) return 'Disabled';
  const option = FLEXIBILITY_LABELS[criteria.flexibilityDays];
  return option ? `Enabled (${option})` : 'Enabled';
}

const FLEXIBILITY_LABELS: Record<string, string> = {
  '1': '±1 day',
  '2': '±2 days',
  '3': '±3 days',
  '7': '±7 days',
};
