'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap, Home, CreditCard, LayoutDashboard, FileText, TrendingUp, Users, Trophy, LogOut, User, MessageCircle, Shield, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { isAdminEmail } from '@/lib/adminAuth';

const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pricing', label: 'Pricing', icon: CreditCard },
    { href: '/community', label: 'The Lounge', icon: MessageCircle },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tos', label: 'Terms', icon: FileText },
];

const quickStats = [
    { label: 'Experience', value: '30+ Yrs', icon: TrendingUp, color: '#fbbf24' },
    { label: 'Members', value: '1,200+', icon: Users, color: '#00e59b' },
    { label: 'Sportsbooks', value: '11+', icon: Trophy, color: '#34d399' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showMenuHint, setShowMenuHint] = useState(false);
    const { user, signOut } = useAuth();

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

    // Show mobile menu hint arrow for first-time visitors
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const seen = localStorage.getItem('tp_menu_hint_seen');
        if (!seen && window.innerWidth < 768) {
            const timer = setTimeout(() => setShowMenuHint(true), 2000);
            const dismiss = setTimeout(() => {
                setShowMenuHint(false);
                localStorage.setItem('tp_menu_hint_seen', '1');
            }, 10000);
            return () => { clearTimeout(timer); clearTimeout(dismiss); };
        }
    }, []);

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
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo + Brand */}
                    <Link href="/" className="flex items-center gap-3 sm:gap-4 group flex-shrink-0 relative z-[101]">
                        <Image
                            src="/logo.png"
                            alt="TriplePlayz - Sports Advisory"
                            width={200}
                            height={120}
                            className="h-[56px] sm:h-[72px] w-auto group-hover:scale-105 transition-transform"
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                        <div className="hidden sm:block">
                            <span className="text-white font-display font-bold text-lg lg:text-xl tracking-wide block">
                                TriplePlayz
                            </span>
                            <span className="block text-[10px] lg:text-[11px] tracking-[0.18em] text-[#00e59b] uppercase -mt-1 font-semibold">
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
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                                    <User size={14} style={{ color: '#00e59b' }} />
                                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                                </Link>
                                {user.email && isAdminEmail(user.email) && (
                                    <Link href="/admin" className="text-xs text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-1">
                                        <Shield size={12} /> Admin
                                    </Link>
                                )}
                                <Link href="/settings" className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1" style={{ textDecoration: 'none' }}>
                                    <Settings size={12} /> Settings
                                </Link>
                                <button
                                    onClick={signOut}
                                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <Link href="/pricing" className="btn-glow text-xs sm:text-sm !py-2 !px-4 sm:!py-2.5 sm:!px-5">
                                <Zap size={14} className="sm:w-4 sm:h-4" />
                                Early Access
                            </Link>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => {
                            setIsOpen(!isOpen);
                            if (showMenuHint) {
                                setShowMenuHint(false);
                                localStorage.setItem('tp_menu_hint_seen', '1');
                            }
                        }}
                        className="md:hidden text-white p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition relative z-[60]"
                        aria-label="Toggle navigation menu"
                    >
                        {isOpen ? <X size={22} /> : <Menu size={22} />}
                        {/* Animated arrow hint for first-time mobile visitors */}
                        {showMenuHint && !isOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                right: 'calc(100% + 8px)',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                whiteSpace: 'nowrap',
                                animation: 'menuHintBounce 1.2s ease-in-out infinite',
                            }}>
                                <span style={{
                                    background: 'linear-gradient(135deg, rgba(0,229,155,0.2), rgba(0,229,155,0.1))',
                                    border: '1px solid rgba(0,229,155,0.3)',
                                    borderRadius: '8px',
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#00e59b',
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 2px 12px rgba(0,229,155,0.2)',
                                }}>Dashboard ⚡</span>
                                <span style={{ color: '#00e59b', fontSize: '16px' }}>→</span>
                            </div>
                        )}
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
                        className="md:hidden fixed inset-0 z-[100]"
                        style={{
                            background: '#040810',
                            paddingTop: '56px',
                            overflowY: 'auto',
                            minHeight: '100dvh',
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
                            {/* Logo + Brand */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <Image
                                    src="/logo.png"
                                    alt="TriplePlayz - Sports Advisory"
                                    width={180}
                                    height={56}
                                    style={{ objectFit: 'contain' }}
                                />
                            </motion.div>

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
                                {user ? (
                                    <>
                                        <div style={{ background: 'rgba(0,229,155,0.06)', border: '1px solid rgba(0,229,155,0.12)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <User size={16} style={{ color: '#00e59b' }} />
                                            <div>
                                                <p style={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 600, margin: 0 }}>{user.email}</p>
                                                <p style={{ color: '#6b7280', fontSize: '11px', margin: 0 }}>Signed in</p>
                                            </div>
                                        </div>
                                        {user.email && isAdminEmail(user.email) && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setIsOpen(false)}
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '14px',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    borderRadius: '12px',
                                                    background: 'rgba(251,191,36,0.08)',
                                                    border: '1px solid rgba(251,191,36,0.2)',
                                                    color: '#fbbf24',
                                                    textDecoration: 'none',
                                                    marginBottom: '8px',
                                                }}
                                            >
                                                <Shield size={16} />
                                                Admin Panel
                                            </Link>
                                        )}
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsOpen(false)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '14px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                borderRadius: '12px',
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                color: '#9ca3af',
                                                textDecoration: 'none',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <Settings size={16} />
                                            Account Settings
                                        </Link>
                                        <button
                                            onClick={() => { signOut(); setIsOpen(false); }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '14px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                borderRadius: '12px',
                                                background: 'rgba(239,68,68,0.08)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                color: '#fca5a5',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            href="/dashboard?signup=free"
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
                                            Create Free Account
                                        </Link>
                                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                            No credit card required
                                        </p>
                                        <Link
                                            href="/pricing"
                                            onClick={() => setIsOpen(false)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '12px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                borderRadius: '12px',
                                                color: '#fbbf24',
                                                textDecoration: 'none',
                                                marginTop: '4px',
                                            }}
                                        >
                                            See Premium Plans →
                                        </Link>
                                    </>
                                )}
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
