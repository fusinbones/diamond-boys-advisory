import Link from 'next/link';
import Image from 'next/image';
import { Shield, Mail, ExternalLink } from 'lucide-react';

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
            <div className="container-db py-12 sm:py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-white font-display font-bold text-base sm:text-xl tracking-wide">
                            YOURSWAMI
                        </span>
                        <p className="text-gray-500 text-sm mt-2 sm:mt-3 leading-relaxed">
                            Real picks. Real results. Real cash. Follow the Swami.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3 sm:mb-4">Quick Links</h4>
                        <ul className="space-y-2.5">
                            {[
                                { href: '/', label: 'Home' },
                                { href: '/pricing', label: 'Pricing' },
                                { href: '/community', label: 'The Lounge' },
                                { href: '/patterns', label: 'Patterns' },
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
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3 sm:mb-4">Legal</h4>
                        <ul className="space-y-2.5">
                            {[
                                { href: '/tos', label: 'Terms of Service' },
                                { href: '/tos#privacy', label: 'Privacy Policy' },
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
                        <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-3 sm:mb-4">Contact</h4>
                        <div className="space-y-2 sm:space-y-3">
                            <a
                                href="mailto:support@yourswami.com"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#FFC107] transition text-sm break-all"
                            >
                                <Mail size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                support@yourswami.com
                            </a>
                            <a
                                href="/community"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#FFC107] transition text-sm"
                            >
                                <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                The Swami Lounge
                            </a>

                        </div>
                    </div>
                </div>

                {/* Disclaimer Bar */}
                <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-white/5">
                    <div className="glass-card p-4 sm:p-5 mb-4 sm:mb-6 bg-[#0d1525]/50">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <Shield size={14} className="sm:w-[18px] sm:h-[18px] text-[#FFC107] mt-0.5 flex-shrink-0" />
                            <div className="text-xs sm:text-sm text-gray-400 leading-relaxed space-y-2">
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
