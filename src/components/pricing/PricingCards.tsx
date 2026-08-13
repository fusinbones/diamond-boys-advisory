'use client';

import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown, Gem } from 'lucide-react';
import { tiers } from '@/lib/tiers';
import { trackEvent } from '@/components/Analytics';

const tierIcons: Record<string, React.ReactNode> = {
    weekly: <Star size={18} />,
    monthly: <Crown size={18} />,
    season: <Gem size={18} />,
};

const tierColors: Record<string, { border: string; badge: string; glow: string }> = {
    weekly: {
        border: 'border-[#FFC107]/20',
        badge: 'bg-[#FFC107]/10 text-[#FFC107] border-[#FFC107]/20',
        glow: '',
    },
    monthly: {
        border: 'border-[#FFC107]/40',
        badge: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30',
        glow: 'popular-glow',
    },
    season: {
        border: 'border-[#a78bfa]/20',
        badge: 'bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/20',
        glow: '',
    },
};

export default function PricingCards() {
    const handleSelect = (tierId: string, tierName: string) => {
        trackEvent('checkout_start', { tier: tierId, tier_name: tierName });
        window.location.href = `/checkout?tier=${tierId}`;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {tiers.map((tier, i) => {
                const colors = tierColors[tier.id] || tierColors.weekly;

                return (
                    <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative ${colors.glow}`}
                    >
                        <div
                            className={`glass-card h-full flex flex-col p-5 sm:p-6 transition-all duration-300 hover:translate-y-[-4px] ${colors.border} ${tier.popular ? 'border-transparent' : ''
                                }`}
                        >
                            {/* Badge */}
                            {tier.badge && (
                                <div className="mb-3 sm:mb-4">
                                    <span className={`badge border ${colors.badge} text-[9px] sm:text-[10px]`}>
                                        {tier.popular && <Star size={9} className="sm:w-2.5 sm:h-2.5 fill-current" />}
                                        {tier.badge}
                                    </span>
                                </div>
                            )}

                            {/* Icon + Name */}
                            <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
                                <div className="text-[#FFC107]">
                                    {tierIcons[tier.id]}
                                </div>
                                <h3 className="text-white font-display font-bold text-base sm:text-lg">{tier.name}</h3>
                            </div>

                            {/* Price */}
                            <div className="mb-3 sm:mb-4">
                                <span className="text-3xl sm:text-4xl font-display font-black text-white">${tier.price}</span>
                                <span className="text-gray-500 text-xs sm:text-sm ml-1">{tier.intervalLabel}</span>
                            </div>

                            {/* Description */}
                            <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">{tier.description}</p>

                            {/* Features */}
                            <ul className="space-y-2 sm:space-y-2.5 mb-6 sm:mb-8 flex-1">
                                {tier.features.map((feature, j) => (
                                    <li key={j} className="flex items-start gap-2 sm:gap-2.5">
                                        <Check size={14} className="sm:w-4 sm:h-4 text-[#FFC107] mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-400 text-xs sm:text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                onClick={() => handleSelect(tier.id, tier.name)}
                                className={`w-full py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 cursor-pointer ${tier.popular
                                        ? 'btn-glow !rounded-xl'
                                        : 'bg-white/5 text-white hover:bg-white/10 border border-white/10 hover:border-[#FFC107]/30'
                                    }`}
                            >
                                {tier.trialDays ? `Start ${tier.trialDays}-Day Free Trial` : `Choose ${tier.name}`}
                            </button>

                            {tier.trialDays && (
                                <p className="text-[9px] sm:text-[10px] text-gray-600 text-center mt-1.5 sm:mt-2">
                                    Card required. Billed ${tier.price}{tier.intervalLabel} after trial.
                                </p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
