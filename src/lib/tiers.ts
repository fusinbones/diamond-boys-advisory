export interface Tier {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year' | 'one-time';
  description: string;
  features: string[];
  popular: boolean;
  badge?: string;
  priceId: string;
  trialDays?: number;
  discordRoleId: string;
  discordChannelId: string;
}

/** Tier access level — higher number = more access */
export const TIER_LEVELS: Record<string, number> = {
  daily: 1,
  weekly: 2,
  monthly: 3,
  season: 4,
};

export const tiers: Tier[] = [
  {
    id: 'daily',
    name: 'Daily Picks',
    price: 39,
    interval: 'month',
    description: 'Fresh analysis for top games. Includes Diamond Boys Discord chat.',
    features: [
      'Daily MLB baseball picks',
      'Discord community access',
      'Game-day alerts',
      'Basic analytics',
      '7-day free trial',
    ],
    popular: false,
    badge: 'Starter',
    priceId: process.env.STRIPE_PRICE_DAILY || 'price_daily_placeholder',
    trialDays: 7,
    discordRoleId: process.env.DISCORD_ROLE_DAILY || '1479150042890768584',
    discordChannelId: process.env.DISCORD_CHANNEL_DAILY || '',
  },
  {
    id: 'weekly',
    name: 'Weekly Package',
    price: 59,
    interval: 'month',
    description: 'Full week deep dives + alerts. Extended Discord access.',
    features: [
      'Everything in Daily',
      'Weekly deep-dive reports',
      'Extended Discord channels',
      'Priority alerts',
      'Line-movement insights',
    ],
    popular: false,
    badge: 'Pro',
    priceId: process.env.STRIPE_PRICE_WEEKLY || 'price_weekly_placeholder',
    discordRoleId: process.env.DISCORD_ROLE_WEEKLY || '1479150213288693812',
    discordChannelId: process.env.DISCORD_CHANNEL_WEEKLY || '',
  },
  {
    id: 'monthly',
    name: 'Monthly Elite',
    price: 99,
    interval: 'month',
    description: 'All picks + playoffs coverage. VIP role in Discord.',
    features: [
      'Everything in Weekly',
      'Full playoffs coverage',
      'VIP Discord role & channels',
      'Direct expert chat access',
      'Exclusive parlay picks',
      'Monthly performance reports',
    ],
    popular: true,
    badge: 'Most Popular',
    priceId: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
    discordRoleId: process.env.DISCORD_ROLE_MONTHLY || '1479150271522148524',
    discordChannelId: process.env.DISCORD_CHANNEL_MONTHLY || '',
  },
  {
    id: 'season',
    name: 'Season Pass',
    price: 299,
    interval: 'year',
    description: 'Entire MLB season + World Series special. Lifetime Discord (while active).',
    features: [
      'Everything in Monthly Elite',
      'Full season coverage',
      'World Series special picks',
      'Season Pass Discord badge',
      'Early access to new features',
      'Private strategy sessions',
      'Best value – save 75%',
    ],
    popular: false,
    badge: 'Best Value',
    priceId: process.env.STRIPE_PRICE_SEASON || 'price_season_placeholder',
    discordRoleId: process.env.DISCORD_ROLE_SEASON || '1479150351406858240',
    discordChannelId: process.env.DISCORD_CHANNEL_SEASON || '',
  },
];
