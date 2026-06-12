import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  formatBudget,
  formatFlexibleDates,
  formatSearchDate,
  resolveFlightSearch,
  type FlightSearchCriteria,
} from '../lib/flightSearch';
import {
  fetchTravelpayoutsFlights,
  type TravelpayoutsFlight,
} from '../lib/travelpayoutsApi';

type Level = 'Low' | 'Medium' | 'High';
type PriceTrend = 'rise' | 'stable' | 'drop';

type MockFlight = {
  id: string;
  airline: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  stops: number;
  price: string;
  dealScore: number;
  savingsPercent: number;
  averageFare: string;
  confidence: Level;
  risk: Level;
  priceTrend: PriceTrend;
  analysis: string[];
};

type AirlineVariant = {
  idSuffix: string;
  airline: string;
  stops: number;
  price: string;
  averageFare: string;
  dealScore: number;
  savingsPercent: number;
  confidence: Level;
  risk: Level;
  priceTrend: PriceTrend;
  analysis: (routeName: string, monthLabel: string) => string[];
};

function cityFromLocation(label: string): string {
  return label.split('(')[0]?.trim() || label.trim();
}

function routeLabel(origin: string, destination: string): string {
  return `${cityFromLocation(origin)} → ${cityFromLocation(destination)}`;
}

function monthLabelFromIso(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'your travel window';
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(parsed);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
}

function isPortugal(location: string): boolean {
  return /lisbon|porto|portugal|\blis\b|\bopo\b/i.test(location);
}

function isBrazil(location: string): boolean {
  return /rio|são paulo|sao paulo|salvador|brazil|\bgig\b|\bgru\b|\bssa\b|\bcgh\b/i.test(
    location
  );
}

function isUsUkRoute(origin: string, destination: string): boolean {
  const us = /new york|los angeles|san francisco|chicago|miami|usa|\bjfk\b|\bear\b|\blax\b|\bsfo\b|\bord\b|\bmia\b/i;
  const uk = /london|uk|\blhr\b|\blgw\b/i;
  return (us.test(origin) && uk.test(destination)) || (uk.test(origin) && us.test(destination));
}

function selectAirlineVariants(
  origin: string,
  destination: string
): AirlineVariant[] {
  if (isPortugal(origin) && isBrazil(destination)) {
    return [
      {
        idSuffix: 'tp',
        airline: 'TAP Air Portugal',
        stops: 0,
        price: '€579',
        averageFare: '€706',
        dealScore: 87,
        savingsPercent: 18,
        confidence: 'High',
        risk: 'Low',
        priceTrend: 'rise',
        analysis: (route, month) => [
          `This fare is 18% below the average ${route} price for ${month}.`,
          'Nonstop round-trip with convenient evening departures.',
          'Price trend suggests fares may increase soon as peak-season inventory tightens.',
        ],
      },
      {
        idSuffix: 'la',
        airline: 'LATAM',
        stops: 1,
        price: '€603',
        averageFare: '€685',
        dealScore: 83,
        savingsPercent: 12,
        confidence: 'High',
        risk: 'Low',
        priceTrend: 'rise',
        analysis: (route, month) => [
          `This fare is 12% below the average ${route} price for ${month}.`,
          'Good total travel time with a single connection and daytime segments.',
          'Historical pricing for this window tends to rise 2–3 weeks before departure.',
        ],
      },
      {
        idSuffix: 'az',
        airline: 'Azul Brazilian Airlines',
        stops: 1,
        price: '€512',
        averageFare: '€656',
        dealScore: 92,
        savingsPercent: 22,
        confidence: 'High',
        risk: 'Low',
        priceTrend: 'drop',
        analysis: (route, month) => [
          `This fare is 22% below the average ${route} price for ${month}.`,
          'Includes checked baggage and friendly connection windows.',
          'Lower shoulder-season demand improves pricing reliability and availability.',
        ],
      },
      {
        idSuffix: 'ib',
        airline: 'Iberia',
        stops: 1,
        price: '€648',
        averageFare: '€629',
        dealScore: 76,
        savingsPercent: -3,
        confidence: 'Medium',
        risk: 'Medium',
        priceTrend: 'stable',
        analysis: (route) => [
          `This fare is close to the 60-day average for ${route} (+3%).`,
          'Reasonable connection time and good arrival hours for check-in.',
          'Fares are stable lately, suggesting moderate flexibility for booking.',
        ],
      },
    ];
  }

  if (isUsUkRoute(origin, destination)) {
    return [
      {
        idSuffix: 'ba',
        airline: 'British Airways',
        stops: 0,
        price: '$742',
        averageFare: '$833',
        dealScore: 84,
        savingsPercent: 11,
        confidence: 'High',
        risk: 'Low',
        priceTrend: 'rise',
        analysis: (route, month) => [
          `This fare is 11% below the average ${route} price for ${month}.`,
          'Nonstop schedule with morning departures on both legs.',
          'Fares on this corridor often firm up three to four weeks before departure.',
        ],
      },
      {
        idSuffix: 'vs',
        airline: 'Virgin Atlantic',
        stops: 0,
        price: '$718',
        averageFare: '$844',
        dealScore: 88,
        savingsPercent: 15,
        confidence: 'High',
        risk: 'Low',
        priceTrend: 'rise',
        analysis: (route, month) => [
          `This fare is 15% below the average ${route} price for ${month}.`,
          'Strong onboard product and competitive total travel time.',
          `Recent price movement suggests a modest uptick as ${month} inventory sells.`,
        ],
      },
      {
        idSuffix: 'aa',
        airline: 'American Airlines',
        stops: 1,
        price: '$689',
        averageFare: '$757',
        dealScore: 81,
        savingsPercent: 9,
        confidence: 'Medium',
        risk: 'Low',
        priceTrend: 'stable',
        analysis: (route, month) => [
          `This fare is 9% below the average ${route} price for ${month}.`,
          'Single connection with a comfortable layover buffer.',
          'Pricing has been stable, with occasional dips when midweek seats open.',
        ],
      },
      {
        idSuffix: 'ua',
        airline: 'United Airlines',
        stops: 1,
        price: '$665',
        averageFare: '$715',
        dealScore: 79,
        savingsPercent: 7,
        confidence: 'Medium',
        risk: 'Medium',
        priceTrend: 'rise',
        analysis: (route, month) => [
          `This fare is 7% below the average ${route} price for ${month}.`,
          'Balanced itinerary with one stop and predictable arrival times.',
          'Historical patterns show gradual increases as departure approaches.',
        ],
      },
    ];
  }

  return [
    {
      idSuffix: 'lh',
      airline: 'Lufthansa',
      stops: 1,
      price: '$698',
      averageFare: '$775',
      dealScore: 82,
      savingsPercent: 10,
      confidence: 'High',
      risk: 'Low',
      priceTrend: 'rise',
      analysis: (route, month) => [
        `This fare is 10% below the average ${route} price for ${month}.`,
        'Reliable hub connection with competitive total travel time.',
        'Prices on this route have been edging up as departure gets closer.',
      ],
    },
    {
      idSuffix: 'ek',
      airline: 'Emirates',
      stops: 1,
      price: '$724',
      averageFare: '$710',
      dealScore: 78,
      savingsPercent: 2,
      confidence: 'Medium',
      risk: 'Medium',
      priceTrend: 'stable',
      analysis: (route) => [
        `This fare is close to the 60-day average for ${route} (+2%).`,
        'Single stop with a well-timed connection and generous baggage allowance.',
        'Fares are relatively stable, offering some booking flexibility.',
      ],
    },
    {
      idSuffix: 'qr',
      airline: 'Qatar Airways',
      stops: 1,
      price: '$671',
      averageFare: '$780',
      dealScore: 85,
      savingsPercent: 14,
      confidence: 'High',
      risk: 'Low',
      priceTrend: 'rise',
      analysis: (route, month) => [
        `This fare is 14% below the average ${route} price for ${month}.`,
        'Strong service quality with a single connection via Doha.',
        'Demand signals suggest fares may rise as ${month} inventory tightens.',
      ],
    },
    {
      idSuffix: 'tk',
      airline: 'Turkish Airlines',
      stops: 1,
      price: '$639',
      averageFare: '$790',
      dealScore: 90,
      savingsPercent: 19,
      confidence: 'High',
      risk: 'Low',
      priceTrend: 'drop',
      analysis: (route, month) => [
        `This fare is 19% below the average ${route} price for ${month}.`,
        'Competitive pricing with a manageable connection in Istanbul.',
        'Shoulder-season demand keeps availability healthy on this pairing.',
      ],
    },
  ];
}

type TravelpayoutsApiResponse = {
  success?: boolean;
  data?: TravelpayoutsFlight[] | null;
  error?: string | null;
};

function extractAirportCode(location: string): string | null {
  const match = location.match(/\(([A-Za-z]{3})\)/);
  return match ? match[1].toUpperCase() : null;
}

function airlineLabel(code?: string): string {
  if (!code) return 'Unknown airline';
  const names: Record<string, string> = {
    AA: 'American Airlines',
    AF: 'Air France',
    AZ: 'ITA Airways',
    BA: 'British Airways',
    DL: 'Delta Air Lines',
    EK: 'Emirates',
    IB: 'Iberia',
    KL: 'KLM',
    LH: 'Lufthansa',
    QR: 'Qatar Airways',
    TK: 'Turkish Airlines',
    TP: 'TAP Air Portugal',
    UA: 'United Airlines',
    VS: 'Virgin Atlantic',
  };
  return names[code.toUpperCase()] ?? code.toUpperCase();
}

function formatApiDate(iso?: string, fallbackIso?: string): string {
  if (iso) {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(parsed);
    }
  }
  return fallbackIso ? formatSearchDate(fallbackIso) : '—';
}

function formatEurPrice(amount: number): string {
  return `€${Math.round(amount).toLocaleString()}`;
}

function derivePriceTrend(price: number, prices: number[]): PriceTrend {
  if (prices.length < 2) return 'stable';
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (price < median * 0.97) return 'drop';
  if (price > median * 1.03) return 'rise';
  return 'stable';
}

function deriveDealMetrics(
  price: number,
  prices: number[],
  stops: number
): Pick<
  MockFlight,
  | 'dealScore'
  | 'savingsPercent'
  | 'averageFare'
  | 'confidence'
  | 'risk'
  | 'priceTrend'
> {
  const validPrices = prices.filter((p) => p > 0);
  const average =
    validPrices.length > 0
      ? validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length
      : price;
  const savingsPercent =
    average > 0 ? Math.round(((average - price) / average) * 100) : 0;

  let dealScore = 72 + Math.min(18, Math.max(-12, savingsPercent));
  if (stops === 0) dealScore += 4;
  if (stops >= 2) dealScore -= 4;
  dealScore = Math.max(60, Math.min(95, dealScore));

  const confidence: Level =
    savingsPercent >= 10 && stops <= 1
      ? 'High'
      : savingsPercent >= 0
        ? 'Medium'
        : 'Low';
  const risk: Level =
    savingsPercent >= 5 ? 'Low' : savingsPercent >= 0 ? 'Medium' : 'High';

  return {
    dealScore,
    savingsPercent,
    averageFare: formatEurPrice(average),
    confidence,
    risk,
    priceTrend: derivePriceTrend(price, validPrices),
  };
}

function buildApiAnalysis(
  routeName: string,
  month: string,
  savingsPercent: number,
  stops: number,
  priceTrend: PriceTrend
): string[] {
  const savingsLine =
    savingsPercent > 0
      ? `This fare is ${savingsPercent}% below the average ${routeName} price for ${month}.`
      : savingsPercent < 0
        ? `This fare is ${Math.abs(savingsPercent)}% above the average ${routeName} price for ${month}.`
        : `This fare is near the average ${routeName} price for ${month}.`;

  const convenienceLine =
    stops === 0
      ? 'Nonstop itinerary with competitive total travel time.'
      : `${stops} stop${stops > 1 ? 's' : ''} with a manageable connection on this route.`;

  const trendLine =
    priceTrend === 'rise'
      ? 'Live pricing suggests fares may increase as departure approaches.'
      : priceTrend === 'drop'
        ? 'Live pricing is softer than peers — good timing on this window.'
        : 'Live pricing has been stable for similar departures on this route.';

  return [savingsLine, convenienceLine, trendLine];
}

function convertTravelpayoutsToMockFlights(
  items: TravelpayoutsFlight[],
  criteria: FlightSearchCriteria
): MockFlight[] {
  const { origin, destination, departureDate, returnDate } = criteria;
  const routeName = routeLabel(origin, destination);
  const month = monthLabelFromIso(departureDate);
  const originSlug = slugify(origin);
  const destSlug = slugify(destination);
  const prices = items
    .map((item) => item.price ?? item.value ?? 0)
    .filter((price) => price > 0);

  return items
    .filter((item) => (item.price ?? item.value ?? 0) > 0)
    .map((item, index) => {
      const price = item.price ?? item.value ?? 0;
      const stops = item.transfers ?? 0;
      const metrics = deriveDealMetrics(price, prices, stops);
      const airline = airlineLabel(item.airline);
      const flightKey = item.flight_number?.replace(/\s+/g, '') ?? String(index);

      return {
        id: `${originSlug}-${destSlug}-tp-${item.airline ?? 'xx'}-${flightKey}`,
        airline,
        origin,
        destination,
        departureDate: formatApiDate(item.departure_at, departureDate),
        returnDate: formatApiDate(item.return_at, returnDate),
        stops,
        price: formatEurPrice(price),
        ...metrics,
        analysis: buildApiAnalysis(
          routeName,
          month,
          metrics.savingsPercent,
          stops,
          metrics.priceTrend
        ),
      };
    });
}

function parseTravelpayoutsResponse(
  response: unknown,
  criteria: FlightSearchCriteria
): MockFlight[] {
  const payload = response as TravelpayoutsApiResponse;
  if (payload.success === false || !Array.isArray(payload.data)) {
    return [];
  }
  return convertTravelpayoutsToMockFlights(payload.data, criteria);
}

function buildPersonalizedFlights(
  criteria: FlightSearchCriteria | null
): MockFlight[] {
  if (!criteria) return [];

  const { origin, destination, departureDate, returnDate } = criteria;
  const routeName = routeLabel(origin, destination);
  const month = monthLabelFromIso(departureDate);
  const departureFormatted = formatSearchDate(departureDate);
  const returnFormatted = formatSearchDate(returnDate);
  const originSlug = slugify(origin);
  const destSlug = slugify(destination);

  return selectAirlineVariants(origin, destination).map((variant) => ({
    id: `${originSlug}-${destSlug}-${variant.idSuffix}`,
    airline: variant.airline,
    origin,
    destination,
    departureDate: departureFormatted,
    returnDate: returnFormatted,
    stops: variant.stops,
    price: variant.price,
    dealScore: variant.dealScore,
    savingsPercent: variant.savingsPercent,
    averageFare: variant.averageFare,
    confidence: variant.confidence,
    risk: variant.risk,
    priceTrend: variant.priceTrend,
    analysis: variant.analysis(routeName, month),
  }));
}

type DealScoreTier = {
  label: string;
  ring: string;
  fill: string;
  glow: string;
  text: string;
};

function dealScoreTier(score: number): DealScoreTier {
  if (score >= 90) {
    return {
      label: 'Excellent',
      ring: 'stroke-emerald-400/40',
      fill: 'stroke-emerald-400',
      glow: 'shadow-emerald-500/25',
      text: 'text-emerald-300',
    };
  }
  if (score >= 80) {
    return {
      label: 'Good',
      ring: 'stroke-sky-400/40',
      fill: 'stroke-sky-400',
      glow: 'shadow-sky-500/25',
      text: 'text-sky-300',
    };
  }
  return {
    label: 'Fair',
    ring: 'stroke-amber-400/40',
    fill: 'stroke-amber-400',
    glow: 'shadow-amber-500/20',
    text: 'text-amber-300',
  };
}

function DealScoreBadge({ score }: { score: number }) {
  const tier = dealScoreTier(score);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className={[
        'flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 px-2.5 py-1.5 shadow-lg',
        tier.glow,
      ].join(' ')}
      title={`Deal Score ${score}/100 — ${tier.label} deal`}
    >
      <div className="relative h-11 w-11">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44" aria-hidden>
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            strokeWidth="3.5"
            className={tier.ring}
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={tier.fill}
          />
        </svg>
        <span
          className={[
            'absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums',
            tier.text,
          ].join(' ')}
        >
          {score}
        </span>
      </div>
      <div className="min-w-0 pr-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Deal Score
        </p>
        <p className={['text-sm font-semibold leading-tight', tier.text].join(' ')}>
          {tier.label}
        </p>
      </div>
    </div>
  );
}

function levelPillStyles(kind: 'Confidence' | 'Risk', level: Level) {
  const positive =
    (kind === 'Confidence' && level === 'High') ||
    (kind === 'Risk' && level === 'Low');
  const neutral = level === 'Medium';
  if (positive) {
    return {
      dot: 'bg-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
    };
  }
  if (neutral) {
    return {
      dot: 'bg-amber-400',
      badge: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
    };
  }
  return {
    dot: 'bg-rose-400',
    badge: 'bg-rose-500/10 text-rose-300 ring-rose-500/25',
  };
}

function LevelPill({
  kind,
  level,
}: {
  kind: 'Confidence' | 'Risk';
  level: Level;
}) {
  const styles = levelPillStyles(kind, level);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {kind}
      </span>
      <span
        className={[
          'inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset',
          styles.badge,
        ].join(' ')}
      >
        <span className={['h-1.5 w-1.5 rounded-full', styles.dot].join(' ')} />
        {level}
      </span>
    </div>
  );
}

const TREND_CONFIG: Record<
  PriceTrend,
  { label: string; icon: string; className: string }
> = {
  rise: {
    label: 'Price likely to rise',
    icon: '↑',
    className: 'bg-rose-500/10 text-rose-300 ring-rose-500/25',
  },
  stable: {
    label: 'Price stable',
    icon: '→',
    className: 'bg-slate-500/10 text-slate-300 ring-slate-500/25',
  },
  drop: {
    label: 'Price likely to drop',
    icon: '↓',
    className: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  },
};

function PriceTrendIndicator({ trend }: { trend: PriceTrend }) {
  const config = TREND_CONFIG[trend];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset',
        config.className,
      ].join(' ')}
      title={config.label}
    >
      <span className="text-sm leading-none" aria-hidden>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}

function SavingsBanner({
  savingsPercent,
  averageFare,
  price,
}: {
  savingsPercent: number;
  averageFare: string;
  price: string;
}) {
  const isSaving = savingsPercent > 0;
  const isAbove = savingsPercent < 0;

  return (
    <div
      className={[
        'rounded-lg border px-3 py-2',
        isSaving
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : isAbove
            ? 'border-amber-500/20 bg-amber-500/5'
            : 'border-slate-700/80 bg-slate-900/40',
      ].join(' ')}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        vs. average fare
      </p>
      <p
        className={[
          'mt-0.5 text-sm font-semibold tabular-nums',
          isSaving
            ? 'text-emerald-300'
            : isAbove
              ? 'text-amber-300'
              : 'text-slate-300',
        ].join(' ')}
      >
        {isSaving && (
          <>
            Est. save {Math.abs(savingsPercent)}% ·{' '}
            <span className="font-normal text-slate-400">
              avg {averageFare}
            </span>
          </>
        )}
        {isAbove && (
          <>
            {Math.abs(savingsPercent)}% above avg ·{' '}
            <span className="font-normal text-slate-400">
              avg {averageFare}
            </span>
          </>
        )}
        {!isSaving && !isAbove && (
          <>
            Near average ·{' '}
            <span className="font-normal text-slate-400">
              {averageFare} vs {price}
            </span>
          </>
        )}
      </p>
    </div>
  );
}

type FareBreakdownLine = {
  label: string;
  amount: string;
  emphasis?: boolean;
};

function parsePrice(price: string): { symbol: string; amount: number } | null {
  const match = price.trim().match(/^([€$£])\s*([\d,]+(?:\.\d{2})?)$/);
  if (!match) return null;
  const amount = Number(match[2].replace(/,/g, ''));
  if (!Number.isFinite(amount)) return null;
  return { symbol: match[1], amount };
}

function formatPriceAmount(symbol: string, amount: number): string {
  const rounded = Math.round(amount);
  return `${symbol}${rounded.toLocaleString()}`;
}

function buildFareBreakdown(flight: MockFlight): FareBreakdownLine[] {
  const parsed = parsePrice(flight.price);
  if (!parsed) {
    return [
      { label: 'Base fare', amount: flight.price },
      { label: 'Taxes & fees', amount: '—' },
      { label: 'Total', amount: flight.price, emphasis: true },
    ];
  }

  const { symbol, amount } = parsed;
  const baseFare = Math.round(amount * 0.78);
  const taxes = amount - baseFare;

  return [
    { label: 'Base fare', amount: formatPriceAmount(symbol, baseFare) },
    { label: 'Taxes & fees', amount: formatPriceAmount(symbol, taxes) },
    { label: 'Total', amount: flight.price, emphasis: true },
  ];
}

function buildScoringExplanation(flight: MockFlight): string[] {
  const savingsLine =
    flight.savingsPercent > 0
      ? `${flight.savingsPercent}% below the route average (${flight.averageFare}).`
      : flight.savingsPercent < 0
        ? `${Math.abs(flight.savingsPercent)}% above the route average (${flight.averageFare}).`
        : `Near the route average (${flight.averageFare}).`;

  const convenienceLine =
    flight.stops === 0
      ? 'Nonstop itinerary adds convenience points.'
      : `${flight.stops} stop${flight.stops > 1 ? 's' : ''} — still competitive on total travel time.`;

  const confidenceLine = `${flight.confidence} confidence and ${flight.risk.toLowerCase()} booking risk.`;

  const trendLine =
    flight.priceTrend === 'rise'
      ? 'Upward price trend reduces the score slightly but the fare remains strong.'
      : flight.priceTrend === 'drop'
        ? 'Downward price trend boosts the score — good timing on this window.'
        : 'Stable pricing keeps the score steady without urgency penalties.';

  return [savingsLine, convenienceLine, confidenceLine, trendLine];
}

function buildBaggageNote(flight: MockFlight): string {
  const baggageFromAnalysis = flight.analysis.find((line) =>
    /baggage|carry-on|checked/i.test(line)
  );
  if (baggageFromAnalysis) return baggageFromAnalysis;

  if (/azul|emirates|qatar/i.test(flight.airline)) {
    return 'Includes one checked bag and a standard carry-on on this fare.';
  }
  if (/british airways|virgin|lufthansa/i.test(flight.airline)) {
    return 'Economy fare includes a carry-on; first checked bag may cost extra.';
  }
  return 'Standard economy allowance — one personal item and carry-on included; checked bag fees may apply.';
}

function buildFlexibilityNote(flight: MockFlight): string {
  if (flight.priceTrend === 'rise') {
    return 'Limited flexibility — fares on this route are trending up. Date changes may cost more if you wait.';
  }
  if (flight.priceTrend === 'drop') {
    return 'Good flexibility — prices are softening. You may find a slightly lower fare if you monitor for a few days.';
  }
  return 'Moderate flexibility — pricing has been stable. Small date shifts are unlikely to move the fare much.';
}

function buildBookingRecommendation(flight: MockFlight): string {
  if (flight.dealScore >= 90) {
    return 'Book soon — this is a top-tier deal for your route and window.';
  }
  if (flight.dealScore >= 80) {
    return flight.priceTrend === 'rise'
      ? 'Consider booking soon if your dates are firm — this fare beats average and may not last.'
      : 'Solid value — book when ready, or track briefly if your dates are flexible.';
  }
  if (flight.savingsPercent < 0) {
    return 'Wait if you can — this option is above the route average; better deals may appear.';
  }
  return 'Fair option — compare alternatives or track price before committing.';
}

function FlightCard({
  flight,
  formatStops,
}: {
  flight: MockFlight;
  formatStops: (stops: number) => string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [trackingConfirmed, setTrackingConfirmed] = useState(false);

  const fareBreakdown = useMemo(() => buildFareBreakdown(flight), [flight]);
  const scoringExplanation = useMemo(() => buildScoringExplanation(flight), [flight]);
  const baggageNote = useMemo(() => buildBaggageNote(flight), [flight]);
  const flexibilityNote = useMemo(() => buildFlexibilityNote(flight), [flight]);
  const bookingRecommendation = useMemo(
    () => buildBookingRecommendation(flight),
    [flight]
  );

  return (
    <li className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-white">
                {flight.origin} → {flight.destination}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {flight.airline} • {formatStops(flight.stops)}
              </p>
            </div>
            <DealScoreBadge score={flight.dealScore} />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3 border-t border-slate-800/60 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <p className="text-sm text-slate-400">Round trip</p>
          <p className="text-2xl font-bold text-sky-300 tabular-nums">
            {flight.price}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <SavingsBanner
          savingsPercent={flight.savingsPercent}
          averageFare={flight.averageFare}
          price={flight.price}
        />
        <div className="flex gap-4 sm:justify-end">
          <LevelPill kind="Confidence" level={flight.confidence} />
          <LevelPill kind="Risk" level={flight.risk} />
        </div>
        <div className="flex sm:justify-end lg:justify-start">
          <PriceTrendIndicator trend={flight.priceTrend} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-slate-800/70 bg-slate-950/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Origin</p>
          <p className="mt-0.5 text-sm font-medium text-white">
            {flight.origin}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Destination</p>
          <p className="mt-0.5 text-sm font-medium text-white">
            {flight.destination}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Departure</p>
          <p className="mt-0.5 text-sm font-medium text-white">
            {flight.departureDate}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Return</p>
          <p className="mt-0.5 text-sm font-medium text-white">
            {flight.returnDate}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-800/70 bg-slate-950/30 p-3 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">AI Analysis</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {flight.analysis.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/30 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-slate-400">Stops</p>
              <p className="mt-0.5 text-sm font-medium text-white">
                {formatStops(flight.stops)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Deal tier</p>
              <p
                className={[
                  'mt-0.5 text-sm font-medium',
                  dealScoreTier(flight.dealScore).text,
                ].join(' ')}
              >
                {dealScoreTier(flight.dealScore).label} ({flight.dealScore})
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button
              type="button"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((open) => !open)}
              className="inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
            >
              {detailsOpen ? 'Hide Details' : 'View Details'}
            </button>
            <button
              type="button"
              disabled={trackingConfirmed}
              onClick={() => setTrackingConfirmed(true)}
              className={[
                'inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2',
                trackingConfirmed
                  ? 'cursor-default border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 focus:ring-emerald-400/40'
                  : 'border border-slate-700 bg-slate-950/30 text-slate-200 hover:bg-slate-900/40 focus:ring-slate-500/40',
              ].join(' ')}
            >
              {trackingConfirmed ? 'Tracking enabled' : 'Track Price'}
            </button>
          </div>

          {trackingConfirmed ? (
            <p className="text-xs text-emerald-300/90" role="status">
              Price tracking enabled for this route.
            </p>
          ) : null}
        </div>
      </div>

      {detailsOpen ? (
        <div className="mt-4 space-y-4 rounded-xl border border-sky-500/20 bg-slate-950/50 p-4">
          <section>
            <h3 className="text-sm font-semibold text-white">Fare breakdown</h3>
            <dl className="mt-2 space-y-1.5">
              {fareBreakdown.map((line) => (
                <div
                  key={line.label}
                  className={[
                    'flex items-center justify-between gap-3 text-sm',
                    line.emphasis
                      ? 'border-t border-slate-800/80 pt-2 font-semibold text-white'
                      : 'text-slate-300',
                  ].join(' ')}
                >
                  <dt>{line.label}</dt>
                  <dd className="tabular-nums">{line.amount}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white">
              Why this deal scored this way
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {scoringExplanation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">
              <h3 className="text-sm font-semibold text-white">Baggage note</h3>
              <p className="mt-1.5 text-sm text-slate-300">{baggageNote}</p>
            </section>
            <section className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">
              <h3 className="text-sm font-semibold text-white">
                Flexibility note
              </h3>
              <p className="mt-1.5 text-sm text-slate-300">{flexibilityNote}</p>
            </section>
          </div>

          <section className="rounded-lg border border-sky-500/15 bg-sky-500/5 p-3">
            <h3 className="text-sm font-semibold text-white">
              Booking recommendation
            </h3>
            <p className="mt-1.5 text-sm text-slate-200">
              {bookingRecommendation}
            </p>
          </section>
        </div>
      ) : null}
    </li>
  );
}

function SearchSummary() {
  const [searchParams] = useSearchParams();
  const criteria = resolveFlightSearch(searchParams);

  if (!criteria) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <h2 className="text-lg font-semibold text-white">Search summary</h2>
        <p className="mt-2 text-sm text-slate-400">
          No search criteria yet.{' '}
          <Link to="/search" className="font-medium text-sky-400 hover:text-sky-300">
            Run a flight search
          </Link>{' '}
          to see your route and dates here.
        </p>
      </section>
    );
  }

  const summaryItems = [
    { label: 'Origin', value: criteria.origin },
    { label: 'Destination', value: criteria.destination },
    {
      label: 'Departure date',
      value: formatSearchDate(criteria.departureDate),
    },
    { label: 'Return date', value: formatSearchDate(criteria.returnDate) },
    { label: 'Budget', value: formatBudget(criteria.maxBudget) },
    {
      label: 'Flexible dates',
      value: formatFlexibleDates(criteria),
    },
  ];

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
      <h2 className="text-lg font-semibold text-white">Search summary</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryItems.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-white">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const criteria = resolveFlightSearch(searchParams);
  const [flights, setFlights] = useState<MockFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!criteria) {
      setFlights([]);
      setLoading(false);
      setFetchError(null);
      return;
    }

    const activeCriteria = criteria;
    let cancelled = false;

    async function loadFlights() {
      setLoading(true);
      setFetchError(null);

      const originCode = extractAirportCode(activeCriteria.origin);
      const destinationCode = extractAirportCode(activeCriteria.destination);

      if (!originCode || !destinationCode) {
        if (!cancelled) {
          setFlights(buildPersonalizedFlights(activeCriteria));
          setFetchError('Could not resolve airport codes from your search.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetchTravelpayoutsFlights({
          origin: originCode,
          destination: destinationCode,
          departureDate: activeCriteria.departureDate,
          returnDate: activeCriteria.returnDate,
        });
        const apiFlights = parseTravelpayoutsResponse(response, activeCriteria);

        if (!cancelled) {
          if (apiFlights.length > 0) {
            setFlights(apiFlights);
          } else {
            setFlights(buildPersonalizedFlights(activeCriteria));
            setFetchError('No live fares found for this route.');
          }
        }
      } catch {
        if (!cancelled) {
          setFlights(buildPersonalizedFlights(activeCriteria));
          setFetchError('Unable to load live fares right now.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFlights();

    return () => {
      cancelled = true;
    };
  }, [
    criteria?.origin,
    criteria?.destination,
    criteria?.departureDate,
    criteria?.returnDate,
  ]);

  const searchedRoute = criteria
    ? routeLabel(criteria.origin, criteria.destination)
    : null;

  const formatStops = (stops: number) => {
    if (stops === 0) return 'Nonstop';
    if (stops === 1) return '1 stop';
    return `${stops} stops`;
  };

  const bestFlight =
    flights.length === 0
      ? null
      : [...flights].sort((a, b) => b.dealScore - a.dealScore)[0];

  const pickAnalysisLine = (analysis: string[], matcher: RegExp) =>
    analysis.find((line) => matcher.test(line));

  const buildRecommendationCopy = (flight: MockFlight) => {
    const route = routeLabel(flight.origin, flight.destination);

    const priceCompetitiveness =
      pickAnalysisLine(flight.analysis, /\b(below|above)\b.*\baverage\b/i) ??
      pickAnalysisLine(flight.analysis, /\baverage\b/i) ??
      'This fare looks competitive relative to the typical route pricing.';

    const convenience =
      pickAnalysisLine(
        flight.analysis,
        /\b(nonstop|stop|connection|travel time|departure|arrival|window)\b/i
      ) ??
      `It offers ${formatStops(flight.stops).toLowerCase()} and reasonable travel times.`;

    const expectedTrend =
      pickAnalysisLine(flight.analysis, /\b(trend|tends to|stable|increase|rise)\b/i) ??
      'Historical patterns suggest prices may move up as departure gets closer.';

    const recommendation =
      flight.dealScore >= 90 ? 'Book soon.' : 'Consider booking soon if dates are firm.';

    return {
      route,
      priceCompetitiveness,
      convenience,
      expectedTrend,
      recommendation,
    };
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-white">Results</h1>
        <p className="text-slate-400">
          {searchedRoute ? (
            <>
              Mock flight opportunities for{' '}
              <span className="font-medium text-slate-300">{searchedRoute}</span>.
              Deal Scores are estimated by FareHunter’s scoring heuristics
              (mocked).
            </>
          ) : (
            <>
              Run a search to see personalized opportunities for your route.
              Deal Scores are estimated by FareHunter’s scoring heuristics
              (mocked).
            </>
          )}
        </p>
      </header>

      <SearchSummary />

      {loading ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
          <p className="text-sm text-slate-400">Fetching live fares…</p>
        </section>
      ) : null}

      {!loading && fetchError ? (
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-300">
            {fetchError} Showing estimated fares instead.
          </p>
        </section>
      ) : null}

      {!loading && bestFlight ? (
        (() => {
          const recommendation = buildRecommendationCopy(bestFlight);
          return (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-sky-300/90">
                FareHunter AI Recommendation
              </p>
              <h2 className="text-lg font-semibold text-white">
                Best opportunity: {recommendation.route}
              </h2>
              <p className="text-sm text-slate-300">
                For your {routeLabel(bestFlight.origin, bestFlight.destination)}{' '}
                search, the {bestFlight.airline} option received the highest score
                (
                <span className="font-semibold tabular-nums text-white">
                  {bestFlight.dealScore}/100
                </span>
                ).
              </p>
            </div>

            <div className="flex items-baseline justify-between gap-3 sm:flex-col sm:items-end">
              <p className="text-sm text-slate-400">Round trip</p>
              <p className="text-2xl font-bold text-sky-300 tabular-nums">
                {bestFlight.price}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-xl border border-slate-800/70 bg-slate-950/30 p-4">
            <p className="text-sm text-slate-300">
              {recommendation.priceCompetitiveness}
            </p>
            <p className="text-sm text-slate-300">
              {recommendation.convenience}
            </p>
            <p className="text-sm text-slate-300">
              {recommendation.expectedTrend}
            </p>
            <p className="text-sm font-semibold text-white">
              Recommendation:{' '}
              <span className="text-slate-200">
                {recommendation.recommendation}
              </span>
            </p>
          </div>
        </section>
          );
        })()
      ) : null}

      {!loading && flights.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
          <p className="text-sm text-slate-400">
            No opportunities to show yet.{' '}
            <Link to="/search" className="font-medium text-sky-400 hover:text-sky-300">
              Search for a route
            </Link>{' '}
            to see airline options for your origin and destination.
          </p>
        </section>
      ) : null}

      {!loading ? (
      <ul className="grid gap-4">
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            formatStops={formatStops}
          />
        ))}
      </ul>
      ) : null}
    </section>
  );
}
