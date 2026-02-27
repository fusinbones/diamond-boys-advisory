'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, Home, CreditCard, LayoutDashboard, FileText, TrendingUp, Users, Trophy } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tos', label: 'Terms', icon: FileText },
];

const quickStats = [
    { label: 'Win Rate', value: '65%', icon: TrendingUp, color: '#fbbf24' },
    { label: 'Members', value: '1,200+', icon: Users, color: '#00e59b' },
    { label: 'Units Profit', value: '+187', icon: Trophy, color: '#34d399' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-[#040810]/90 backdrop-blur-xl border-b border-[#00e59b]/10 shadow-lg shadow-black/20'
                : 'bg-transparent'
                }`}
        >
            <div className="container-db">
                <div className="flex items-center justify-between h-14 sm:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0 relative z-[60]">
                        <Image
                            src="/logo.png"
                            alt="Diamond Boys Sports Advisory"
                            width={36}
                            height={36}
                            className="sm:w-11 sm:h-11 rounded-lg group-hover:scale-105 transition-transform"
                        />
                        <div className="hidden xs:block sm:block">
                            <span className="text-white font-display font-bold text-sm sm:text-lg tracking-wide">
                                DIAMOND BOYS
                            </span>
                            <span className="block text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] text-[#00e59b] uppercase -mt-0.5 sm:-mt-1">
                                Sports Advisory
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6 lg:gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#00e59b] transition-all group-hover:w-full" />
                            </Link>
                        ))}
                        <Link href="/pricing" className="btn-glow text-xs sm:text-sm !py-2 !px-4 sm:!py-2.5 sm:!px-5">
                            <Zap size={14} className="sm:w-4 sm:h-4" />
                            Get Picks
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-white p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition relative z-[60]"
                        aria-label="Toggle navigation menu"
                    >
                        {isOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* ═══ PREMIUM FULL-SCREEN MOBILE MENU ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="md:hidden fixed inset-0 z-50"
                        style={{
                            background: 'linear-gradient(180deg, #040810 0%, #0a1628 40%, #061218 100%)',
                            paddingTop: '56px',
                        }}
                    >
                        {/* Background glow */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '15%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '300px',
                                height: '300px',
                                background: 'radial-gradient(circle, rgba(0,229,155,0.08) 0%, transparent 70%)',
                                pointerEvents: 'none',
                            }}
                        />

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 56px)', position: 'relative' }}>
                            {/* Nav Links — staggered entrance */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '14px',
                                                padding: '14px 16px',
                                                color: '#e5e7eb',
                                                fontSize: '17px',
                                                fontWeight: 600,
                                                borderRadius: '12px',
                                                transition: 'background 0.15s',
                                            }}
                                            className="hover:bg-white/5 active:bg-white/10"
                                        >
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: 'rgba(0,229,155,0.08)',
                                                border: '1px solid rgba(0,229,155,0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <link.icon size={17} style={{ color: '#00e59b' }} />
                                            </div>
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Glowing CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.4 }}
                                style={{ marginBottom: '28px' }}
                            >
                                <Link
                                    href="/pricing"
                                    onClick={() => setIsOpen(false)}
                                    className="btn-glow pulse-ring"
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '16px',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        borderRadius: '14px',
                                    }}
                                >
                                    <Zap size={18} />
                                    Get Picks — From $39/mo
                                </Link>
                                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                    7-day free trial • Cancel anytime
                                </p>
                            </motion.div>

                            {/* Quick stats — social proof */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, duration: 0.4 }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px',
                                    marginBottom: '24px',
                                }}
                            >
                                {quickStats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        style={{
                                            textAlign: 'center',
                                            padding: '14px 8px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: '12px',
                                        }}
                                    >
                                        <stat.icon size={16} style={{ color: stat.color, margin: '0 auto 6px' }} />
                                        <p style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>
                                            {stat.value}
                                        </p>
                                        <p style={{ color: '#9ca3af', fontSize: '11px', margin: '2px 0 0', fontWeight: 500 }}>
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Bottom trust badge */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.55 }}
                                style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '20px' }}
                            >
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                                    💎 Trusted by 1,200+ sports bettors since 2024
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
