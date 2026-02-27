'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, AlertTriangle, CheckCircle, RefreshCw, Shield, Gem } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const MOCK_SUBSCRIPTION = {
    active: true,
    tier: 'Monthly Elite',
    price: 99,
    interval: 'month',
    renewalDate: '2026-03-26',
    discordUsername: 'user123',
    memberSince: '2026-01-15',
};

export default function DashboardPage() {
    const [email, setEmail] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const sub = MOCK_SUBSCRIPTION;

    if (!loggedIn) {
        return (
            <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
                <div className="container-db" style={{ maxWidth: '28rem' }}>
                    <div className="text-center mb-6 sm:mb-8">
                        <Image src="/logo.png" alt="Diamond Boys" width={48} height={48} className="sm:w-[60px] sm:h-[60px] mx-auto mb-3 sm:mb-4" />
                        <h1 className="font-display text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Member Dashboard</h1>
                        <p className="text-gray-500 text-xs sm:text-sm">Enter your subscription email to view your status.</p>
                    </div>

                    <div className="glass-card p-5 sm:p-6">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (email.trim()) setLoggedIn(true);
                            }}
                            className="space-y-3 sm:space-y-4"
                        >
                            <div>
                                <label htmlFor="dash-email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Email Address</label>
                                <input
                                    id="dash-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#1a2744]/50 border border-white/10 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00e59b]/50 transition text-xs sm:text-sm"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <button type="submit" className="btn-glow w-full !py-2.5 sm:!py-3 text-sm">
                                View Subscription
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '48rem' }}>
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div className="min-w-0">
                        <h1 className="font-display text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">Dashboard</h1>
                        <p className="text-gray-500 text-xs sm:text-sm truncate">{email}</p>
                    </div>
                    <button
                        onClick={() => setLoggedIn(false)}
                        className="text-gray-600 hover:text-gray-400 text-xs sm:text-sm transition flex-shrink-0 ml-4"
                    >
                        Sign out
                    </button>
                </div>

                <div className="grid gap-4 sm:gap-5">
                    {/* Status Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-4 sm:p-6"
                    >
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-white font-semibold text-sm sm:text-lg">Subscription Status</h2>
                            {sub.active ? (
                                <span className="badge badge-success text-[9px] sm:text-xs">
                                    <CheckCircle size={10} className="sm:w-3 sm:h-3" />
                                    Active
                                </span>
                            ) : (
                                <span className="badge badge-danger text-[9px] sm:text-xs">
                                    <AlertTriangle size={10} className="sm:w-3 sm:h-3" />
                                    Inactive
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-[#1a2744]/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                                    <Gem size={12} className="sm:w-3.5 sm:h-3.5" />
                                    Current Tier
                                </div>
                                <p className="text-white font-display font-bold text-sm sm:text-xl">{sub.tier}</p>
                                <p className="text-gray-500 text-[10px] sm:text-sm">${sub.price}/{sub.interval}</p>
                            </div>
                            <div className="bg-[#1a2744]/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                                    <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                                    Next Renewal
                                </div>
                                <p className="text-white font-display font-bold text-sm sm:text-xl">
                                    {new Date(sub.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-gray-500 text-[10px] sm:text-sm">Auto-renew on</p>
                            </div>
                        </div>

                        {!sub.active && (
                            <div className="mt-4 sm:mt-6 bg-red-500/5 border border-red-500/15 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                <div className="flex items-start gap-2 sm:gap-3">
                                    <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px] text-red-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-red-300 font-semibold text-xs sm:text-sm">Subscription Inactive</p>
                                        <p className="text-gray-500 text-[10px] sm:text-xs mt-1">
                                            Your Discord access has been revoked. Renew to regain access.
                                        </p>
                                        <Link href="/pricing" className="btn-glow text-xs !py-1.5 sm:!py-2 !px-3 sm:!px-4 mt-2 sm:mt-3 inline-flex">
                                            <RefreshCw size={12} className="sm:w-3.5 sm:h-3.5" />
                                            Renew
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Discord Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-4 sm:p-6"
                    >
                        <h2 className="text-white font-semibold text-sm sm:text-lg mb-3 sm:mb-4">Discord Access</h2>
                        <div className="flex items-center justify-between bg-[#1a2744]/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <div>
                                <p className="text-gray-500 text-[10px] sm:text-xs mb-0.5 sm:mb-1">Connected as</p>
                                <p className="text-white font-medium text-sm sm:text-base">@{sub.discordUsername}</p>
                            </div>
                            {sub.active && (
                                <span className="badge badge-success text-[9px] sm:text-[10px]">
                                    <CheckCircle size={9} className="sm:w-2.5 sm:h-2.5" />
                                    Connected
                                </span>
                            )}
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-4 sm:p-6"
                    >
                        <h2 className="text-white font-semibold text-sm sm:text-lg mb-3 sm:mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <a
                                href="https://discord.gg/your-server"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-outline text-xs sm:text-sm !py-2.5 sm:!py-3 w-full"
                            >
                                Open Discord
                            </a>
                            <a
                                href="https://billing.stripe.com/p/login/test"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 rounded-lg sm:rounded-xl py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium text-center transition flex items-center justify-center gap-1.5 sm:gap-2"
                            >
                                <CreditCard size={12} className="sm:w-3.5 sm:h-3.5" />
                                Billing
                            </a>
                        </div>
                    </motion.div>

                    {/* Security note */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600 justify-center">
                        <Shield size={10} className="sm:w-3 sm:h-3" />
                        <span>All billing managed securely through Stripe</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
