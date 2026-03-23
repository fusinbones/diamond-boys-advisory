export interface Tier {
  id: string;
  name: string;
  price: number;
  interval: 'week' | 'month' | 'season';
  intervalLabel: string;
  description: string;
  features: string[];
  popular: boolean;
  badge?: string;
  priceId: string;
  trialDays?: number;
}

/** Tier access level — higher number = more access */
export const TIER_LEVELS: Record<string, number> = {
  free: 0,
  weekly: 1,
  monthly: 2,
  season: 3,
};

export const tiers: Tier[] = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 9.99,
    interval: 'week',
    intervalLabel: '/week',
    description: 'All picks & analysis, billed weekly. Cancel anytime.',
    features: [
      'All daily MLB game analysis',
      'TriplePlayz Lounge community access',
      'Game-day alerts & notifications',
      'Real-time odds & line movement',
      'Weekly deep-dive reports',
      '7-day free trial',
    ],
    popular: false,
    badge: 'Flexible',
    priceId: process.env.STRIPE_PRICE_WEEKLY || '',
    trialDays: 7,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 39.99,
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
      'Save 25% vs weekly',
    ],
    popular: true,
    badge: 'Most Popular',
    priceId: process.env.STRIPE_PRICE_MONTHLY || '',
  },
  {
    id: 'season',
    name: 'Season Pass',
    price: 199,
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
      'Best value — save 55%+',
    ],
    popular: false,
    badge: 'Best Value',
    priceId: process.env.STRIPE_PRICE_SEASON || '',
  },
];
