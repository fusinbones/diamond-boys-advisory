import type { Metadata } from 'next';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy | TriplePlayz - Sports Advisory',
    description: 'TriplePlayz - Sports Advisory privacy policy, data collection, and GDPR compliance.',
};

export default function PrivacyPage() {
    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '48rem' }}>
                <div className="text-center mb-12">
                    <h1 className="font-display text-4xl font-bold text-white mb-3">Privacy Policy</h1>
                    <p className="text-gray-500">Last updated: March 2026</p>
                </div>

                <div className="space-y-8">
                    <section className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock size={24} className="text-[#00e59b]" />
                            <h2 className="text-white font-display font-bold text-2xl">Data & Privacy</h2>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <h3 className="text-white font-semibold text-base">Information We Collect</h3>
                            <ul className="list-disc list-inside space-y-1.5 ml-2">
                                <li><strong>Account Information:</strong> Name and email address (provided at checkout / account creation).</li>
                                <li><strong>Payment Information:</strong> Processed and stored exclusively by Stripe. We do not store credit card numbers, CVVs, or full card details on our servers.</li>
                                <li><strong>Usage Data:</strong> Page views, session data, and interaction analytics (anonymized).</li>
                            </ul>

                            <h3 className="text-white font-semibold text-base pt-2">How We Use Your Information</h3>
                            <ul className="list-disc list-inside space-y-1.5 ml-2">
                                <li>To provide, manage, and secure your subscription and community access.</li>
                                <li>To process transactions and send related information, including confirmations and receipts.</li>
                                <li>To communicate service updates, picks delivery changes, and account-related notifications.</li>
                                <li>To improve our platform, content delivery, and user experience.</li>
                            </ul>

                            <h3 className="text-white font-semibold text-base pt-2">Data Sharing & Third Parties</h3>
                            <p>
                                <strong>We do not sell, rent, or trade your personal information</strong> with third parties for marketing
                                purposes. Data is shared exclusively with essential, industry-compliant service providers necessary to operate our business:
                            </p>
                            <ul className="list-disc list-inside space-y-1.5 ml-2">
                                <li><strong>Stripe:</strong> Payment processing and subscription management.</li>
                                <li><strong>Supabase:</strong> Secure database hosting and authentication.</li>
                                <li><strong>Google Analytics / Vercel Web Analytics:</strong> Anonymized usage metrics.</li>
                            </ul>

                            <h3 className="text-white font-semibold text-base pt-2">Data Security & Compliance</h3>
                            <div className="flex items-start gap-3 bg-[#00e59b]/5 border border-[#00e59b]/15 rounded-xl p-4 my-4">
                                <ShieldCheck size={20} className="text-[#00e59b] mt-0.5" />
                                <p className="text-[#00e59b] text-sm font-semibold">
                                    All payment processing is handled by Stripe. We never touch or store sensitive financial data.
                                </p>
                            </div>
                            <p>
                                We employ industry-standard security measures, including HTTPS encryption and secure credential storage,
                                to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                            </p>

                            <h3 className="text-white font-semibold text-base pt-2">Data Retention & Deletion</h3>
                            <p>
                                We retain your data only for as long as your account is active or as needed to provide you services,
                                comply with our legal obligations, resolve disputes, and enforce our agreements.
                            </p>

                            <h3 className="text-white font-semibold text-base pt-2">Your Rights (GDPR/CCPA)</h3>
                            <p>
                                Depending on your location, you may have the right to access, correct, delete, or restrict the use of your personal data.
                                If you wish to exercise any of these rights, please contact us.
                            </p>
                        </div>
                    </section>

                    <section className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Mail size={24} className="text-[#00e59b]" />
                            <h2 className="text-white font-display font-bold text-2xl">Contact Us</h2>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <p>
                                If you have any questions or concerns regarding this Privacy Policy or your data, please contact us at:
                            </p>
                            <div className="glass-card p-4 bg-[#0d1525]/50">
                                <p className="text-white font-medium">📧 support@tripleplayz.com</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
