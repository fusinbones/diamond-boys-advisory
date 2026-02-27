import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import CountdownTimer from '@/components/landing/CountdownTimer';
import FeaturesSection from '@/components/landing/FeaturesSection';
import SocialProof from '@/components/landing/SocialProof';
import TestimonialsSection from '@/components/landing/TestimonialsSection';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <CountdownTimer />
      <FeaturesSection />
      <SocialProof />
      <TestimonialsSection />

      {/* Final CTA */}
      <section className="text-center" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="container-db text-center" style={{ maxWidth: '48rem' }}>
          <h2 className="font-display text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4">
            Ready to Join the{' '}
            <span className="gradient-text">Diamond Boys</span>?
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto leading-relaxed">
            Sign up for early access — be the first to get our expert picks and join the Diamond Boys Discord.
          </p>
          <a href="/pricing" className="btn-glow btn-glow-lg pulse-ring w-full sm:w-auto">
            💎 Join Early Access — Free
          </a>
          <p className="text-[10px] sm:text-xs text-gray-600 mt-4 sm:mt-6">
            For entertainment purposes only. Must be 21+.
            Please wager responsibly. <a href="/tos" className="text-[#00e59b] hover:underline">Terms apply</a>.
          </p>
        </div>
      </section>
    </>
  );
}
