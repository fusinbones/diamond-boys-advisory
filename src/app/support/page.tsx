import type { Metadata } from 'next';
import { Mail, MessageSquare, Clock, ShieldCheck, CreditCard } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Support & Contact | YourSwami - Sports Advisory',
    description: 'Contact YourSwami - Sports Advisory for billing and account support.',
};

export default function SupportPage() {
    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '48rem' }}>
                <div className="text-center mb-12">
                    <h1 className="font-display text-4xl font-bold text-white mb-3">Customer Support</h1>
                    <p className="text-gray-500">We&apos;re here to help with your account and billing needs.</p>
                </div>

                <div className="space-y-6">
                    {/* Primary Contact Methods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="glass-card p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-[#00e59b]/10 flex items-center justify-center mb-4 border border-[#00e59b]/20">
                                <Mail className="text-[#00e59b]" size={24} />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Email Support</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                For billing inquiries, account issues, or general support.
                            </p>
                            <a href="mailto:support@yourswami.com" className="text-[#00e59b] font-mono bg-[#00e59b]/10 px-4 py-2 rounded-lg border border-[#00e59b]/20 hover:bg-[#00e59b]/20 transition-colors">
                                support@yourswami.com
                            </a>
                        </div>

                        <div className="glass-card p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-4 border border-[#3b82f6]/20">
                                <MessageSquare className="text-[#3b82f6]" size={24} />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Community Discord</h3>
                            <p className="text-gray-400 text-sm mb-4">
                                General chatter and community support for active subscribers.
                            </p>
                            <span className="text-gray-500 text-sm italic">
                                Accessed via The Lounge
                            </span>
                        </div>
                    </div>

                    {/* FAQ / Info Section */}
                    <div className="glass-card p-6 sm:p-8">
                        <h2 className="text-white font-display font-bold text-xl mb-6 flex items-center gap-2">
                            <Clock className="text-[#fbbf24]" size={20} />
                            Support Guidelines
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-[#0d1525]/50 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={16} className="text-[#00e59b]" />
                                    <h4 className="text-white font-semibold text-sm">Response Times</h4>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Our support team operates Monday - Friday, 9:00 AM - 6:00 PM EST.
                                    We aim to respond to all inquiries within 24-48 business hours.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-[#0d1525]/50 border border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <CreditCard size={16} className="text-[#fbbf24]" />
                                    <h4 className="text-white font-semibold text-sm">Billing & Subscriptions</h4>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    You can manage your subscription, update payment methods, or cancel at any time via your <Link href="/settings" className="text-[#00e59b] hover:underline">Account Settings</Link>.
                                    As outlined in our <Link href="/tos" className="text-[#00e59b] hover:underline">Terms of Service</Link>, all sales are final and we do not offer refunds for partial subscription periods.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck size={16} className="text-red-400" />
                                    <h4 className="text-white font-semibold text-sm">Ban & Suspension Policy</h4>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    We maintain a zero-tolerance policy for chargebacks, payment disputes, and community guidelines violations. 
                                    Ban actions are permanent and our support team does not review appeal requests.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <p className="text-gray-500 text-xs">
                            Legal documents: <Link href="/tos" className="hover:text-white transition-colors">Terms of Service</Link> | <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
