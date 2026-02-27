import Link from 'next/link';
import { Shield, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative border-t border-[#00e59b]/10 bg-[#040810]">
            <div className="container-db py-8 sm:py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-white font-display font-bold text-base sm:text-xl tracking-wide">
                            DIAMOND BOYS
                        </span>
                        <p className="text-gray-500 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
                            Premium college basketball picks and elite Discord community access.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">Quick Links</h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                            {[
                                { href: '/', label: 'Home' },
                                { href: '/pricing', label: 'Pricing' },
                                { href: '/dashboard', label: 'Dashboard' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-gray-500 hover:text-[#00e59b] transition text-xs sm:text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">Legal</h4>
                        <ul className="space-y-1.5 sm:space-y-2">
                            {[
                                { href: '/tos', label: 'Terms of Service' },
                                { href: '/tos#privacy', label: 'Privacy Policy' },
                                { href: '/tos#ban-policy', label: 'Ban Policy' },
                                { href: '/tos#disclaimer', label: 'Disclaimer' },
                            ].map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-gray-500 hover:text-[#00e59b] transition text-xs sm:text-sm">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2 md:col-span-1">
                        <h4 className="text-white font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">Contact</h4>
                        <div className="space-y-2 sm:space-y-3">
                            <a
                                href="mailto:support@diamondboysadvisory.com"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#00e59b] transition text-xs sm:text-sm break-all"
                            >
                                <Mail size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                support@diamondboysadvisory.com
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-2 text-gray-500 hover:text-[#00e59b] transition text-xs sm:text-sm"
                            >
                                <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                Discord Server
                            </a>
                        </div>
                    </div>
                </div>

                {/* Disclaimer Bar */}
                <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-white/5">
                    <div className="glass-card p-3 sm:p-4 mb-4 sm:mb-6 bg-[#0d1525]/50">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <Shield size={14} className="sm:w-[18px] sm:h-[18px] text-[#00e59b] mt-0.5 flex-shrink-0" />
                            <div className="text-[10px] sm:text-xs text-gray-500 leading-relaxed space-y-1">
                                <p>
                                    <strong className="text-gray-400">Disclaimer:</strong> Diamond Boys Sports Advisory provides sports analysis
                                    for <strong>entertainment purposes only</strong>. Not a licensed sportsbook, financial advisor, or gambling operator.
                                </p>
                                <p>
                                    Past performance is not indicative of future results. Must be <strong>21+</strong>.
                                    Please wager responsibly. If you or someone you know has a gambling problem, call <strong>1-800-GAMBLER</strong>.
                                </p>
                                <p>
                                    Subscriptions are non-refundable. Non-payment results in immediate Discord access revocation per our{' '}
                                    <Link href="/tos#ban-policy" className="text-[#00e59b] hover:underline">Access Policy</Link>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                        <p>© {new Date().getFullYear()} Diamond Boys Sports Advisory. All rights reserved.</p>
                        <p>Not affiliated with the NCAA, NBA, or any sports league.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
