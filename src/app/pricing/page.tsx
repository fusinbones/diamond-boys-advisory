import PricingCards from '@/components/pricing/PricingCards';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing | Diamond Boys Sports Advisory',
    description: 'Choose your Diamond Boys subscription tier. Daily picks from $39/mo, Weekly Package $59/mo, Monthly Elite $99/mo, or Season Pass $299.',
};

export default function PricingPage() {
    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-14">
                    <span className="badge-emerald mb-3 sm:mb-4 inline-flex text-[10px] sm:text-xs">💎 Choose Your Tier</span>
                    <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                        Simple, Transparent <span className="gradient-text">Pricing</span>
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-lg max-w-xl mx-auto leading-relaxed">
                        Every tier includes Discord access, expert analysis, and our documented track record.
                    </p>
                </div>

                <PricingCards />

                {/* Fine Print */}
                <div className="mt-8 sm:mt-14 max-w-2xl mx-auto">
                    <div className="glass-card p-4 sm:p-6 text-center">
                        <h3 className="text-white font-semibold text-xs sm:text-sm mb-2 sm:mb-3 uppercase tracking-wider">Important Information</h3>
                        <div className="text-[10px] sm:text-xs text-gray-500 space-y-1.5 sm:space-y-2 leading-relaxed">
                            <p>
                                All subscriptions billed through Stripe in USD. Auto-renew unless cancelled.
                            </p>
                            <p>
                                <strong className="text-gray-400">Access Policy:</strong> Active subscription = Discord access.
                                Non-payment results in <strong>immediate and permanent</strong> removal.{' '}
                                <a href="/tos#ban-policy" className="text-[#00e59b] hover:underline">Full policy</a>.
                            </p>
                            <p>
                                <strong>Non-refundable.</strong> Entertainment/analysis service.{' '}
                                <a href="/tos" className="text-[#00e59b] hover:underline">Terms of Service</a>.
                            </p>
                            <p>
                                For entertainment only. Must be 21+. Not financial advice. Past performance ≠ future results.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
