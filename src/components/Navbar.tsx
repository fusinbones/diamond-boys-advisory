'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Zap } from 'lucide-react';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tos', label: 'Terms' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
                <div className="flex items-center justify-between h-14 sm:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
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
                            <span className="block text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] text-[#00e59b]/70 uppercase -mt-0.5 sm:-mt-1">
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
                                className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
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
                        className="md:hidden text-white p-1.5 sm:p-2 hover:bg-white/5 rounded-lg transition"
                        aria-label="Toggle navigation menu"
                    >
                        {isOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-[#0d1525]/95 backdrop-blur-xl border-b border-[#00e59b]/10"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition font-medium text-sm"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/pricing"
                                onClick={() => setIsOpen(false)}
                                className="btn-glow w-full text-center mt-2 !block text-sm !py-2.5"
                            >
                                <Zap size={14} className="inline mr-1.5" />
                                Get Picks Now
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
