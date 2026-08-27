import Link from 'next/link';
import Image from 'next/image';
import { Shield, Mail, ExternalLink, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative border-t border-[#FFC107]/10 bg-[#040810]">
            {/* Brand footer banner */}
            <div className="w-full overflow-hidden">
                <Image
                    src="/brand/footer-banner.webp"
                    alt="I Am Your Swami. Real picks. Real results. Real cash."
                    width={1536}
                    height={414}
                    sizes="100vw"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                />
            </div>
            {/* The banner is a busy full-bleed image. A hairline of brand gold
                separates it from the text below so the two do not read as one
                crowded block. */}
            <div
                aria-hidden="true"
                style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255,193,7,0.28), transparent)',
                }}
            />
            <div
                className="container-db"
                style={{
                    paddingTop: 'clamp(36px, 5vw, 60px)',
                    paddingBottom: 'clamp(28px, 4vw, 44px)',
                }}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-white font-display font-bold text-base sm:text-xl tracking-wide">
                            YOURSWAMI
                        </span>
                        <p className="text-gray-500 text-sm leading-relaxed" style={{ marginTop: '12px' }}>
                            Real picks. Real results. Real cash. Follow the Swami.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider" style={{ marginBottom: '14px' }}>Quick Links</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { href: '/', label: 'Home' },
                                { href: '/pricing', label: 'Pricing' },
                                { href: '/community', label: 'The Lounge' },
                                { href: '/dashboard', label: 'Dashboard' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-gray-500 hover:text-[#FFC107] transition text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider" style={{ marginBottom: '14px' }}>Legal</h4>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                                { href: '/tos', label: 'Terms of Service' },
                                { href: '/privacy', label: 'Privacy Policy' },
                                { href: '/tos#ban-policy', label: 'Ban Policy' },
                                { href: '/tos#disclaimer', label: 'Disclaimer' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-gray-500 hover:text-[#FFC107] transition text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider" style={{ marginBottom: '14px' }}>Contact</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <a
                                href="mailto:support@yourswami.com"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#FFC107] transition text-sm break-all"
                            >
                                <Mail size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                support@yourswami.com
                            </a>
                            <a
                                href="tel:+19145213681"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#FFC107] transition text-sm"
                            >
                                <Phone size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                +1 (914) 521-3681
                            </a>
                            <a
                                href="/community"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#FFC107] transition text-sm"
                            >
                                <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                The Swami Lounge
                            </a>
                            <p className="text-gray-600 text-xs leading-relaxed pt-1">
                                Operated by <strong className="text-gray-500">TRIPLE PLAYZ INC</strong><br />
                                99 Longfellow Dr, Colonia, NJ 07067
                            </p>
                        </div>
                    </div>
                </div>

                {/* Disclaimer Bar */}
                <div className="border-t border-white/5" style={{ marginTop: '32px', paddingTop: '28px' }}>
                    <div
                        className="glass-card bg-[#0d1525]/50"
                        style={{ padding: 'clamp(16px, 2vw, 22px)', marginBottom: '22px' }}
                    >
                        <div className="flex items-start gap-2 sm:gap-3">
                            <Shield size={14} className="sm:w-[18px] sm:h-[18px] text-[#FFC107] mt-0.5 flex-shrink-0" />
                            <div
                                className="text-xs sm:text-sm text-gray-400 leading-relaxed"
                                style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}
                            >
                                <p>
                                    <strong className="text-gray-400">Disclaimer:</strong> YourSwami provides sports analysis
                                    for <strong>entertainment purposes only</strong>. Not a licensed sportsbook, financial advisor, or gambling operator.
                                </p>
                                <p>
                                    Past performance is not indicative of future results. Must be <strong>21+</strong>.
                                    Please wager responsibly. If you or someone you know has a gambling problem, call <strong>1-800-GAMBLER</strong>.
                                </p>
                                <p>
                                    Subscriptions are non-refundable. Non-payment results in immediate community access revocation per our{' '}
                                    <Link href="/tos#ban-policy" className="text-[#FFC107] hover:underline">Access Policy</Link>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <p>© {new Date().getFullYear()} YourSwami. All rights reserved.</p>
                        <p>Not affiliated with the NCAA, NBA, or any sports league.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
