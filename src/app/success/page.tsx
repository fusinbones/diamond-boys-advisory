'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { CheckCircle, MessageCircle, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false });

function SuccessContent() {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        const timer = setTimeout(() => setShowConfetti(false), 6000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="text-center overflow-hidden" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            {showConfetti && (
                <ReactConfetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={150}
                    colors={['#FFC107', '#FFC107', '#fbbf24', '#FFC107', '#a78bfa', '#ffffff']}
                />
            )}

            <div className="container-db" style={{ maxWidth: '32rem' }}>
                {/* Success icon */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="mb-5 sm:mb-8"
                >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFC107]/15 flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-[#FFC107]/30">
                        <CheckCircle size={28} className="sm:w-10 sm:h-10 text-[#FFC107]" />
                    </div>
                    <Image
                        src="/brand/logo-primary.png"
                        alt="YourSwami"
                        width={48}
                        height={48}
                        className="sm:w-[60px] sm:h-[60px] mx-auto rounded-xl shadow-xl"
                    />
                </motion.div>

                {/* Welcome message */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
                        Welcome to <span className="gradient-text">YourSwami!</span>
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-base mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
                        Your subscription is active! 🎉 Head to The Swami Lounge to see today&apos;s picks,
                        join the community chat, and start winning.
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="glass-card p-4 sm:p-6 mb-5 sm:mb-6 text-left"
                >
                    <div className="space-y-3 sm:space-y-4">
                        {[
                            'Head to The Swami Lounge to see today\'s picks',
                            'Check the #picks channel for daily expert analysis',
                            'Say hello in the chat — the crew is waiting!',
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                                <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FFC107]/15 flex items-center justify-center text-[10px] sm:text-xs text-[#FFC107] font-bold">
                                    {i + 1}
                                </span>
                                <p className="text-gray-300 text-xs sm:text-sm pt-0.5 sm:pt-1">{step}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* CTAs */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col gap-2.5 sm:gap-3"
                >
                    <Link
                        href="/community"
                        className="btn-glow w-full !py-3 text-sm sm:text-base"
                    >
                        <MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                        Enter The Swami Lounge
                    </Link>
                    <Link href="/dashboard" className="btn-outline w-full text-xs sm:text-sm">
                        View Dashboard
                        <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                    </Link>
                </motion.div>

                <p className="text-[10px] sm:text-xs text-gray-600 mt-4 sm:mt-6">
                    Need help? Contact support@yourswami.com
                </p>

                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600 mt-3">
                    <Shield size={10} className="sm:w-3 sm:h-3" />
                    <span>Secured by Stripe</span>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-[#FFC107]/30 border-t-[#FFC107] rounded-full animate-spin mx-auto" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
