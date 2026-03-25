export interface Tier {
  id: string;
  name: string;
  price: number;
  interval: 'day' | 'week' | 'month' | 'season';
  intervalLabel: string;
  description: string;
  features: string[];
  popular: boolean;
  badge?: string;
  priceId: string;
  trialDays?: number;
  isOneTime?: boolean;
}

/** Tier access level — higher number = more access */
export const TIER_LEVELS: Record<string, number> = {
  free: 0,
  daily: 1,
  weekly: 2,
  monthly: 3,
  season: 4,
};

export const tiers: Tier[] = [
  {
    id: 'daily',
    name: 'Daily Pass',
    price: 24.99,
    interval: 'day',
    intervalLabel: '/day',
    description: 'One-time payment. Full access for 24 hours — no subscription.',
    features: [
      'All daily MLB picks & analysis',
      'TriplePlayz Lounge access',
      'Real-time odds & line movement',
      'Game-day alerts',
      'No commitment — pay once',
    ],
    popular: false,
    badge: 'Try It',
    priceId: 'price_1TEr5UD7hIjQfa8atrgwi3kL',
    isOneTime: true,
  },
  {
    id: 'weekly',
    name: 'Weekly',
    price: 74.99,
    interval: 'week',
    intervalLabel: '/week',
    description: 'All picks & analysis, billed weekly. Cancel anytime.',
    features: [
      'All daily MLB game analysis',
      'TriplePlayz Lounge community access',
      'Game-day alerts & notifications',
      'Real-time odds & line movement',
      'Weekly deep-dive reports',
    ],
    popular: false,
    badge: 'Flexible',
    priceId: process.env.STRIPE_PRICE_WEEKLY || '',
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 229.99,
    interval: 'month',
    intervalLabel: '/month',
    description: 'Full access, billed monthly. Our most popular plan.',
    features: [
      'Everything in Weekly',
      'Priority pick alerts',
      'VIP TriplePlayz Lounge channels',
      'Direct expert chat access',
      'Exclusive parlay picks',
      'Monthly performance reports',
      'Save vs weekly',
    ],
    popular: true,
    badge: 'Most Popular',
    priceId: process.env.STRIPE_PRICE_MONTHLY || '',
  },
  {
    id: 'season',
    name: 'Season Pass',
    price: 699,
    interval: 'season',
    intervalLabel: '/6 months',
    description: 'Lock in for the half season. Best value by far.',
    features: [
      'Everything in Monthly',
      'Full half-season coverage',
      'World Series special picks',
      'Season Pass TriplePlayz badge',
      'Early access to new sports (NFL)',
      'Private strategy sessions',
      'Best value — massive savings',
    ],
    popular: false,
    badge: 'Best Value',
    priceId: process.env.STRIPE_PRICE_SEASON || '',
  },
];
