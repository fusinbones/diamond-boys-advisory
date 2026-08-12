import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import CountdownTimer from '@/components/landing/CountdownTimer';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SocialProof from '@/components/landing/SocialProof';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FreeSignupSection from '@/components/landing/FreeSignupSection';
import MagicTicker from '@/components/MagicTicker';
import AuthRedirect from '@/components/AuthRedirect';
import SocialProofToast from '@/components/landing/SocialProofToast';

export default function HomePage() {
  return (
    <>
      <AuthRedirect />
      <HeroSection />
      <MagicTicker />
      <StatsBar />
      <CountdownTimer />
      <FeaturesSection />
      <FreeSignupSection />
      <SocialProof />
      <TestimonialsSection />

      {/* Final CTA */}
      <section className="text-center" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="container-db text-center" style={{ maxWidth: '48rem' }}>
          <h2 className="font-display text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4">
            Ready to Join the{' '}
            <span className="gradient-text">YourSwami</span>?
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed">
            Start with a free account, get game analysis, community chat, and freebie picks instantly. Upgrade anytime for full premium access.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <a href="/dashboard?signup=free" className="btn-glow btn-glow-lg pulse-ring" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              ✨ Create Free Account
            </a>
            <a href="/dashboard" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Log In →
            </a>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-600 mt-4 sm:mt-6">
            For entertainment purposes only. Must be 21+.
            Please wager responsibly. <a href="/tos" className="text-[#FFC107] hover:underline">Terms apply</a>.
          </p>
        </div>
      </section>

      {/* Social proof purchase toast */}
      <SocialProofToast />
    </>
  );
}
