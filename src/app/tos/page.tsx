import type { Metadata } from 'next';
import { Shield, AlertTriangle, Scale, Lock, Ban, Mail, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms of Service & Policies | TriplePlayz - Sports Advisory',
    description: 'TriplePlayz - Sports Advisory terms of service, privacy policy, ban policy, and gambling disclaimer.',
};

export default function TOSPage() {
    return (
        <div style={{ paddingTop: '40px', paddingBottom: '60px' }}>
            <div className="container-db" style={{ maxWidth: '48rem' }}>
                <div className="text-center mb-12">
                    <h1 className="font-display text-4xl font-bold text-white mb-3">Terms & Policies</h1>
                    <p className="text-gray-500">Last updated: February 2026</p>
                </div>

                <div className="space-y-8">
                    {/* Terms of Service */}
                    <section className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Scale size={24} className="text-[#00e59b]" />
                            <h2 className="text-white font-display font-bold text-2xl">Terms of Service</h2>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <p>
                                By accessing or using TriplePlayz - Sports Advisory (&quot;the Service&quot;), you agree to be bound by these
                                Terms of Service (&quot;Terms&quot;). If you do not agree, do not use the Service.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">1. Service Description</h3>
                            <p>
                                TriplePlayz - Sports Advisory provides sports analysis, commentary, and picks related to MLB baseball
                                and other sporting events. The Service is provided for <strong>entertainment and informational purposes only</strong>.
                                We are not a licensed sportsbook, gambling operator, or financial advisor. Our analysis does not constitute
                                financial or wagering advice, and no guarantee of profit or specific outcomes is made or implied.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">2. Eligibility</h3>
                            <p>
                                You must be at least <strong>21 years of age</strong> and located in a jurisdiction where accessing sports
                                analysis content is legal. By subscribing, you represent and warrant that you meet these requirements.
                                TriplePlayz - Sports Advisory does not facilitate, process, or accept wagers of any kind.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">3. Subscriptions & Billing</h3>
                            <p>
                                Subscriptions are billed through Stripe, our third-party payment processor. Recurring subscriptions
                                auto-renew at the end of each billing period unless cancelled prior to renewal. One-time purchases
                                (e.g., Season Pass) do not auto-renew. All prices are in US dollars. Stripe&apos;s terms of service also
                                apply to your payment.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">4. Refund Policy</h3>
                            <p>
                                <strong>All sales are final. Subscriptions are non-refundable.</strong> By purchasing, you acknowledge
                                that you are paying for access to analysis content and community features, not for guaranteed outcomes.
                                You may cancel future billing at any time, but no partial refunds will be issued for the current billing period.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">5. Chargebacks & Disputes</h3>
                            <p>
                                Filing a chargeback or payment dispute will result in <strong>immediate and permanent revocation</strong> of
                                all access, including community membership. We encourage you to contact us directly at
                                support@tripleplayz.com to resolve any billing concerns before initiating a dispute with your card issuer.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">6. Intellectual Property</h3>
                            <p>
                                All content produced by TriplePlayz - Sports Advisory — including picks, analysis, reports, and commentary —
                                is proprietary and protected by copyright. Redistribution, resale, or public sharing of our content is
                                strictly prohibited and will result in immediate termination of your subscription.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">7. Limitation of Liability</h3>
                            <p>
                                TriplePlayz - Sports Advisory, its owners, employees, and affiliates shall not be held liable for any
                                losses — financial or otherwise — incurred as a result of using the Service or acting on any information
                                provided. You acknowledge that sports wagering carries inherent risk and that past performance is not
                                indicative of future results. The Service is provided &quot;as is&quot; without warranties of any kind.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">8. Modifications</h3>
                            <p>
                                We reserve the right to modify these Terms at any time. Continued use of the Service after changes
                                constitutes acceptance of the revised Terms. Material changes will be communicated via email or the platform.
                            </p>
                        </div>
                    </section>

                    {/* SMS / Text Messaging Terms */}
                    <section id="sms" className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare size={24} className="text-[#00e59b]" />
                            <h2 className="text-white font-display font-bold text-2xl">SMS / Text Messaging Terms</h2>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <p>
                                TriplePlayz - Sports Advisory operates an optional SMS alerts program that delivers pick alerts and account notifications to subscribers who opt in. Participation is not a condition of any purchase.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Consent</h3>
                            <p>
                                By providing your mobile number and checking the SMS consent box, you agree to receive recurring automated text messages from TriplePlayz - Sports Advisory at the number provided. Consent is collected directly from you at the point of sign up and is never purchased, rented, or shared.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Message Frequency &amp; Cost</h3>
                            <p>
                                Message frequency varies based on pick activity. Message and data rates may apply according to your mobile carrier plan. TriplePlayz - Sports Advisory does not charge for the messages themselves.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Opt Out &amp; Help</h3>
                            <p>
                                You can cancel the SMS service at any time by replying <strong>STOP</strong> to any message. After you reply STOP, we will send a confirmation and you will not receive further SMS messages. For help, reply <strong>HELP</strong> or email support@tripleplayz.com.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Carriers &amp; Liability</h3>
                            <p>
                                Carriers are not liable for delayed or undelivered messages. Message delivery depends on your mobile carrier and is outside our control.
                            </p>
                        </div>
                    </section>

                    {/* Ban Policy */}
                    <section id="ban-policy" className="glass-card p-6 sm:p-8 border-red-500/20">
                        <div className="flex items-center gap-3 mb-6">
                            <Ban size={24} className="text-red-400" />
                            <h2 className="text-white font-display font-bold text-2xl">Access & Ban Policy</h2>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={18} className="text-red-400 mt-0.5" />
                                <p className="text-red-300 text-sm font-semibold">
                                    ZERO-TOLERANCE POLICY: Read carefully before subscribing.
                                </p>
                            </div>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <p>
                                Your active subscription grants you access to The TriplePlayz Lounge community and associated content.
                                This access is <strong>conditional upon maintaining an active, paid subscription</strong>.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Automatic Access Revocation</h3>
                            <p>The following events will trigger <strong>immediate and permanent</strong> removal from the community:</p>
                            <ul className="list-disc list-inside space-y-1.5 ml-2">
                                <li>Failed payment / declined card</li>
                                <li>Subscription cancellation (effective at period end)</li>
                                <li>Chargeback or payment dispute filed</li>
                                <li>Refund request (all sales are final)</li>
                                <li>Violation of community rules or Terms of Service</li>
                                <li>Redistribution or sharing of proprietary content</li>
                            </ul>
                            <h3 className="text-white font-semibold text-base pt-2">Permanence</h3>
                            <p>
                                Bans are <strong>permanent and non-negotiable</strong>. There is no appeals process. Our automated system
                                processes removal actions without manual review. This policy exists to maintain the integrity and exclusivity
                                of our community.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Re-entry</h3>
                            <p>
                                Users who have been removed may re-subscribe through the website, subject to availability.
                                A new subscription is required; previous subscription history does not carry over. We reserve
                                the right to decline service to any individual at our sole discretion.
                            </p>
                        </div>
                    </section>

                    {/* Privacy Policy */}
                    <section id="privacy" className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Lock size={24} className="text-[#00e59b]" />
                            <h2 className="text-white font-display font-bold text-2xl">Privacy Policy</h2>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <h3 className="text-white font-semibold text-base">Information We Collect</h3>
                            <ul className="list-disc list-inside space-y-1.5 ml-2">
                                <li><strong>Account Information:</strong> Name and email address (provided at checkout)</li>
                                <li><strong>Payment Information:</strong> Processed and stored exclusively by Stripe. We do not store credit card numbers, CVVs, or full card details on our servers.</li>
                                <li><strong>Usage Data:</strong> Page views and interaction data via Google Analytics (anonymized)</li>
                            </ul>
                            <h3 className="text-white font-semibold text-base pt-2">How We Use Your Information</h3>
                            <ul className="list-disc list-inside space-y-1.5 ml-2">
                                <li>To provide and manage your subscription and community access</li>
                                <li>To communicate service updates, picks delivery, and account-related notifications</li>
                                <li>To improve our service through anonymized analytics</li>
                            </ul>
                            <h3 className="text-white font-semibold text-base pt-2">Data Sharing</h3>
                            <p>
                                <strong>We do not sell, rent, or share your personal information</strong> with third parties for marketing
                                purposes. Data is shared only with essential service providers (Stripe for payments,
                                Google Analytics for anonymized usage metrics).
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Mobile Information & SMS</h3>
                            <p>
                                <strong>No mobile information will be shared with third parties or affiliates for marketing or promotional purposes.</strong> Text messaging originator opt-in data and consent are never shared with any third parties. See our SMS / Text Messaging Terms below for full details.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">Data Retention & Deletion</h3>
                            <p>
                                We retain your data only as long as necessary to provide the Service and fulfill legal obligations.
                                You may request deletion of your personal data by contacting support@tripleplayz.com.
                                Payment records maintained by Stripe are subject to Stripe&apos;s retention policies.
                            </p>
                            <h3 className="text-white font-semibold text-base pt-2">GDPR/CCPA Rights</h3>
                            <p>
                                If you are an EU/EEA resident or California resident, you have the right to access, correct, delete,
                                or port your personal data. Contact us at support@tripleplayz.com to exercise these rights.
                            </p>
                        </div>
                    </section>

                    {/* Gambling Disclaimer */}
                    <section id="disclaimer" className="glass-card p-6 sm:p-8 border-[#fbbf24]/20">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle size={24} className="text-[#fbbf24]" />
                            <h2 className="text-white font-display font-bold text-2xl">Gambling & Legal Disclaimer</h2>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <div className="bg-[#fbbf24]/5 border border-[#fbbf24]/15 rounded-xl p-4">
                                <p className="text-[#fbbf24] text-sm font-semibold">
                                    ⚠️ FOR ENTERTAINMENT PURPOSES ONLY
                                </p>
                            </div>
                            <p>
                                TriplePlayz - Sports Advisory provides sports analysis and commentary for <strong>entertainment
                                    purposes only</strong>. We do not operate as a sportsbook, gambling operator, or financial institution.
                                We do not accept, process, or facilitate wagers.
                            </p>
                            <p>
                                <strong>No Guarantees:</strong> Past performance is not indicative of future results. Statistics, win rates,
                                and performance metrics are historical and do not guarantee future outcomes. All sports contain inherent
                                uncertainty, and no analysis — however thorough — can eliminate risk.
                            </p>
                            <p>
                                <strong>Age Requirement:</strong> You must be 21 years of age or older to subscribe to this service.
                                By subscribing, you confirm that you meet this requirement.
                            </p>
                            <p>
                                <strong>Legal Compliance:</strong> You are solely responsible for ensuring that your use of this service
                                complies with all applicable local, state, and federal laws in your jurisdiction. TriplePlayz Sports
                                Advisory makes no representation regarding the legality of sports wagering in your location.
                            </p>
                            <p>
                                <strong>Responsible Gaming:</strong> If you or someone you know has a gambling problem, please contact:
                            </p>
                            <ul className="list-none space-y-1.5 ml-2">
                                <li>📞 <strong>National Council on Problem Gambling:</strong> 1-800-522-4700</li>
                                <li>📞 <strong>National Problem Gambling Helpline:</strong> 1-800-GAMBLER (1-800-426-2537)</li>
                                <li>🌐 <strong>www.ncpgambling.org</strong></li>
                                <li>💬 <strong>Crisis Text Line:</strong> Text &quot;GAMBLER&quot; to 233789</li>
                            </ul>
                            <p>
                                <strong>Not Affiliated:</strong> TriplePlayz - Sports Advisory is not affiliated with, endorsed by, or
                                sponsored by the NCAA, NBA, NFL, MLB, or any collegiate or professional sports organization, team,
                                or league.
                            </p>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="glass-card p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Mail size={24} className="text-[#00e59b]" />
                            <h2 className="text-white font-display font-bold text-2xl">Contact Us</h2>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <p>
                                For billing questions, technical support, or general inquiries (non-ban related), contact us at:
                            </p>
                            <div className="glass-card p-4 bg-[#0d1525]/50">
                                <p className="text-white font-medium">📧 support@tripleplayz.com</p>
                                <p className="text-gray-500 text-xs mt-1">We typically respond within 24 hours.</p>
                            </div>
                            <p className="text-xs text-gray-600">
                                Note: We do not respond to ban appeal requests. Please refer to our Access & Ban Policy above.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
