'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { tiers } from '@/lib/tiers';
import { CreditCard, User, Mail, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function CheckoutForm() {
    const searchParams = useSearchParams();
    const tierId = searchParams.get('tier') || 'monthly';
    const selectedTier = tiers.find((t) => t.id === tierId) || tiers[2];

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim()) {
            setError('Name and email are required.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tierId: selectedTier.id,
                    name,
                    email,
                }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '900px' }}>
                <Link href="/pricing" className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-[#00e59b] transition text-xs sm:text-sm mb-5 sm:mb-8">
                    <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
                    Back to Pricing
                </Link>

                <div className="grid md:grid-cols-5 gap-4 sm:gap-6">
                    {/* Order Summary — stacks on top on mobile */}
                    <div className="md:col-span-2 order-1 md:order-1">
                        <div className="glass-card p-4 sm:p-6 md:sticky md:top-24">
                            <h3 className="text-white font-semibold text-sm sm:text-lg mb-3 sm:mb-4">Order Summary</h3>

                            <div className="flex items-center gap-3 mb-4 sm:mb-6">
                                <Image src="/logo.png" alt="TriplePlayz" width={36} height={36} className="sm:w-10 sm:h-10 rounded-lg flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-white font-semibold text-sm sm:text-base">{selectedTier.name}</p>
                                    <p className="text-gray-500 text-xs sm:text-sm truncate">{selectedTier.description}</p>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-3 sm:pt-4 mb-3 sm:mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-xs sm:text-base">Price</span>
                                    <span className="text-white font-display font-bold text-xl sm:text-2xl">
                                        ${selectedTier.price}
                                        <span className="text-gray-500 text-xs sm:text-sm font-normal">
                                            {selectedTier.intervalLabel}
                                        </span>
                                    </span>
                                </div>
                                {selectedTier.trialDays && (
                                    <p className="text-[#00e59b] text-xs mt-1.5 sm:mt-2">
                                        ✓ {selectedTier.trialDays}-day free trial included
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600">
                                <Shield size={11} className="sm:w-3 sm:h-3" />
                                Secure payment via Stripe
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="md:col-span-3 order-2 md:order-2">
                        <div className="glass-card p-5 sm:p-6 lg:p-8">
                            <h2 className="text-white font-display font-bold text-lg sm:text-2xl mb-4 sm:mb-6">Complete Your Subscription</h2>

                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                                {/* Name */}
                                <div>
                                    <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Full Name</label>
                                    <div className="relative">
                                        <User size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[#1a2744]/50 border border-white/10 rounded-lg sm:rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00e59b]/50 focus:ring-1 focus:ring-[#00e59b]/20 transition text-xs sm:text-sm"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-[#1a2744]/50 border border-white/10 rounded-lg sm:rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00e59b]/50 focus:ring-1 focus:ring-[#00e59b]/20 transition text-xs sm:text-sm"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>


                                {/* Payment note */}
                                <div className="glass-card p-3 sm:p-4 bg-[#0d1525]/50 border-[#00e59b]/10">
                                    <div className="flex items-start gap-2 sm:gap-3">
                                        <CreditCard size={14} className="sm:w-4 sm:h-4 text-[#00e59b] mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] sm:text-xs text-gray-500">
                                            Card details collected securely on the next step via Stripe.
                                            We never store your payment info.
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-red-400 text-xs sm:text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-glow w-full !py-3 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        <>
                                            <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />
                                            Continue to Payment
                                        </>
                                    )}
                                </button>

                                {/* Agreement */}
                                <p className="text-[9px] sm:text-[10px] text-gray-600 text-center leading-relaxed">
                                    By subscribing, you agree to our{' '}
                                    <Link href="/tos" className="text-[#00e59b] hover:underline">Terms</Link>,{' '}
                                    <Link href="/tos#privacy" className="text-[#00e59b] hover:underline">Privacy</Link>, and{' '}
                                    <Link href="/tos#ban-policy" className="text-[#00e59b] hover:underline">Access Policy</Link>.
                                    Non-refundable. Non-payment = immediate access removal.
                                    Entertainment only. 21+. Not financial advice.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-[#00e59b]/30 border-t-[#00e59b] rounded-full animate-spin mx-auto" />
            </div>
        }>
            <CheckoutForm />
        </Suspense>
    );
}
