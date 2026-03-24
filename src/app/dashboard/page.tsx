'use client';

import { useState, useEffect, Suspense, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, UserPlus, LogIn, Loader2, Shield, Flame, LogOut } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useSearchParams, useRouter } from 'next/navigation';
import './dashboard.css';

// Dashboard components
import KPICard from '@/components/dashboard/KPICard';
import PickCard, { type PickData } from '@/components/dashboard/PickCard';
import MorningSlate from '@/components/dashboard/MorningSlate';
import BankrollChart from '@/components/dashboard/BankrollChart';
import TailTracker from '@/components/dashboard/TailTracker';
import CommunityPulse from '@/components/dashboard/CommunityPulse';
import PaywallOverlay from '@/components/dashboard/PaywallOverlay';
import PickDropBanner from '@/components/dashboard/PickDropBanner';
import GamesBoard from '@/components/dashboard/GamesBoard';

interface UserProfile {
    subscription_tier: string | null;
    trial_end: string | null;
    trial_bonus_days: number;
    display_name: string;
    is_admin: boolean;
}

// ── Types ──
interface KPIs {
    record: string;
    winRate: string;
    totalUnits: string;
    roi: string;
    streak: string;
    avgEdge: string;
}

interface MorningSlateData {
    totalGames: number;
    upcomingPicks: number;
    sports: string[];
}

interface DailyPnl {
    date: string;
    cumulative: number;
    record: string;
    units: number;
}

interface SportBreakdown {
    sport: string;
    record: string;
    winPct: string;
    units: string;
    color: string;
}

const SPORT_FILTERS = ['All', 'MLB', 'NBA', 'NFL', 'NHL'];

function DashboardContent(): ReactNode {
    const { user, loading: authLoading, signOut } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isFreeSignup = searchParams.get('signup') === 'free';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Dashboard state
    const [activeTab, setActiveTab] = useState('today');
    const [activeSport, setActiveSport] = useState('All');
    const [picks, setPicks] = useState<PickData[]>([]);
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [slate, setSlate] = useState<MorningSlateData | null>(null);
    const [dailyPnl, setDailyPnl] = useState<DailyPnl[]>([]);
    const [recentDays, setRecentDays] = useState<DailyPnl[]>([]);
    const [bySport, setBySport] = useState<SportBreakdown[]>([]);
    const [tailTracker, setTailTracker] = useState({ seasonUnits: 0, weekUnits: 0, totalPicks: 0 });
    const [dashLoading, setDashLoading] = useState(true);
    const [loginStreak, setLoginStreak] = useState(1);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // Auto-select signup tab when coming from free CTA
    useEffect(() => {
        if (isFreeSignup) setIsSignUp(true);
    }, [isFreeSignup]);

    // Fetch user profile from Supabase
    useEffect(() => {
        if (!user) return;
        const fetchProfile = async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('subscription_tier, trial_end, trial_bonus_days, display_name, is_admin')
                .eq('id', user.id)
                .single();
            if (data) setProfile(data as UserProfile);
            // Update last_seen
            await supabase.from('user_profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id);
        };
        fetchProfile();
    }, [user]);

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        try {
            setDashLoading(true);
            const [picksRes, statsRes] = await Promise.all([
                fetch(`/api/dashboard/picks?tab=${activeTab}&sport=${activeSport}`),
                fetch('/api/dashboard/stats'),
            ]);

            if (picksRes.ok) {
                const data = await picksRes.json();
                setPicks(data.picks || []);
                setKpis(data.kpis || null);
                setSlate(data.morningSlate || null);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setDailyPnl(data.dailyPnl || []);
                setRecentDays(data.recentDays || []);
                setBySport(data.bySport || []);
                setTailTracker(data.tailTracker || { seasonUnits: 0, weekUnits: 0, totalPicks: 0 });
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setDashLoading(false);
        }
    }, [activeTab, activeSport]);

    useEffect(() => {
        if (user) fetchData();
    }, [user, fetchData]);

    // Access logic: paid vs trial vs expired
    const isPaid = profile?.subscription_tier && ['starter', 'pro', 'elite', 'daily', 'weekly', 'monthly', 'season'].includes(profile.subscription_tier);
    const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : (user ? new Date(new Date(user.created_at).getTime() + 7 * 86400000) : new Date());
    const bonusDays = profile?.trial_bonus_days || 0;
    const effectiveTrialEnd = new Date(trialEnd.getTime() + bonusDays * 86400000);
    const daysLeft = Math.max(0, Math.ceil((effectiveTrialEnd.getTime() - Date.now()) / 86400000));
    const trialActive = !isPaid && daysLeft > 0;
    const trialExpired = !isPaid && daysLeft <= 0;
    const picksLocked = !isPaid; // Picks are ONLY for paid users

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                    },
                });
                if (error) throw error;
                setMessage('Check your email for a confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/dashboard');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // ── Loading ──
    if (authLoading) {
        return (
            <div style={{ paddingTop: '60px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={28} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</p>
                </div>
            </div>
        );
    }

    // ── Not logged in — Auth Form ──
    if (!user) {
        return (
            <div style={{ paddingTop: '40px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container-db" style={{ maxWidth: '420px' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <Image src="/logo.png" alt="TriplePlayz" width={80} height={80} style={{ margin: '0 auto 16px', objectFit: 'contain' }} />
                            <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                {isSignUp && isFreeSignup ? 'Start Your Free Week' : isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h1>
                            <p style={{ color: '#d1d5db', fontSize: '15px', lineHeight: 1.5 }}>
                                {isSignUp && isFreeSignup
                                    ? '7 days of full dashboard access — picks, stats, community. No credit card.'
                                    : isSignUp
                                        ? 'Join TriplePlayz and get access to today\'s best picks.'
                                        : 'Sign in to your picks dashboard.'
                                }
                            </p>
                        </div>

                        {/* Auth tabs */}
                        <div className="dash-tabs" style={{ marginBottom: '20px' }}>
                            <button className={`dash-tab ${!isSignUp ? 'dash-tab--active' : ''}`} onClick={() => { setIsSignUp(false); setError(''); setMessage(''); }}>
                                <LogIn size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                                Sign In
                            </button>
                            <button className={`dash-tab ${isSignUp ? 'dash-tab--active' : ''}`} onClick={() => { setIsSignUp(true); setError(''); setMessage(''); }}>
                                <UserPlus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                                Sign Up
                            </button>
                        </div>

                        {/* Form */}
                        <div className="glass-card" style={{ padding: '28px 24px', marginBottom: '20px' }}>
                            <form onSubmit={handleAuth}>
                                <label htmlFor="dash-email" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative', marginBottom: '14px' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                    <input
                                        id="dash-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                                        }}
                                        placeholder="you@email.com"
                                    />
                                </div>
                                <label htmlFor="dash-password" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative', marginBottom: '20px' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                    <input
                                        id="dash-password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                                        }}
                                        placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Your password'}
                                        minLength={6}
                                    />
                                </div>

                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: '#f87171', fontSize: '13px' }}
                                        >{error}</motion.div>
                                    )}
                                    {message && (
                                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            style={{ background: 'rgba(0,229,155,0.1)', border: '1px solid rgba(0,229,155,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', color: '#00e59b', fontSize: '13px' }}
                                        >{message}</motion.div>
                                    )}
                                </AnimatePresence>

                                <button type="submit" className="btn-glow" disabled={loading}
                                    style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {loading ? (
                                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {isSignUp ? 'Creating Account...' : 'Signing In...'}</>
                                    ) : (
                                        <>{isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />} {isSignUp ? 'Start Free Week' : 'Sign In'}</>
                                    )}
                                </button>
                            </form>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#6b7280', fontSize: '12px' }}>
                            <Shield size={12} />
                            <span>Secure authentication powered by Supabase</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── Logged in — Pro Dashboard ──
    return (
        <div style={{ paddingTop: '24px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)' }}>
            <div className="container-db">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <h1 className="font-display" style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: 'white', marginBottom: '2px' }}>
                            Your Dashboard
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>{user.email}</span>
                            {loginStreak > 1 && (
                                <span className="streak-badge">
                                    <Flame size={12} /> {loginStreak} day streak
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        style={{ color: '#9ca3af', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <LogOut size={13} /> Sign out
                    </button>
                </div>

                {/* Morning Slate */}
                {slate && (
                    <MorningSlate
                        totalGames={slate.totalGames}
                        upcomingPicks={slate.upcomingPicks}
                        sports={slate.sports}
                    />
                )}

                {/* KPI Cards */}
                {kpis && (
                    <div className="dashboard-kpi-grid" style={{ margin: '16px 0' }}>
                        <KPICard icon="record" label="Record" value={kpis.record} sub={`${kpis.winRate} Win Rate`} trend="Season to date" delay={0.05} />
                        <KPICard icon="roi" label="ROI" value={`${Number(kpis.totalUnits) >= 0 ? '+' : ''}${kpis.totalUnits}u`} sub={`${kpis.roi} ROI`} trend="Units profit" delay={0.1} />
                        <KPICard icon="streak" label="Streak" value={kpis.streak} sub="Current streak" delay={0.15} />
                        <KPICard icon="edge" label="Avg Edge" value={kpis.avgEdge} sub="Model confidence" delay={0.2} />
                    </div>
                )}


                {/* ═══ TODAY'S GAMES — Live Odds Board (ALL users see this) ═══ */}
                <GamesBoard />

                {/* Divider between games and picks */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0 16px' }} />

                {/* Main Dashboard Grid — Picks + Sidebar */}
                <div className="dash-main">
                    {/* Left: Picks (paid-only content) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                        {dashLoading ? (
                            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                <Loader2 size={24} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading picks...</p>
                            </div>
                        ) : picks.length > 0 ? (
                            <>
                                {/* Pick drop banner — FOMO for trial, celebration for paid */}
                                <PickDropBanner pickCount={picks.filter(p => p.status === 'upcoming').length} isPaid={!!isPaid} />
                                {picks.map((pick) => (
                                    <PickCard key={pick.id} pick={pick} locked={picksLocked} />
                                ))}
                            </>
                        ) : (
                            <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: '#d1d5db', marginBottom: '8px' }}>No picks yet for this view</p>
                                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                                    {activeTab === 'today' ? 'Check back closer to game time for today\'s picks.' :
                                     activeTab === 'upcoming' ? 'All upcoming picks will appear here when published.' :
                                     'Graded picks and results will populate over time.'}
                                </p>
                            </div>
                        )}

                        {/* Bankroll Chart */}
                        <BankrollChart data={dailyPnl} />

                        {/* Paywall for expired free users */}
                        {trialExpired && <PaywallOverlay daysLeft={daysLeft} />}
                    </div>

                    {/* Right: Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Today's Summary */}
                        <div className="dash-sidebar-card">
                            <h3 className="dash-sidebar-card__title">Today&apos;s Summary</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { label: 'Total Picks', value: String(picks.filter(p => p.game_date === new Date().toISOString().split('T')[0]).length) },
                                    { label: 'Record', value: kpis?.record || 'N/A' },
                                    { label: 'Units P/L', value: kpis ? `${Number(kpis.totalUnits) >= 0 ? '+' : ''}${kpis.totalUnits}u` : 'N/A', isPositive: Number(kpis?.totalUnits) >= 0 },
                                ].map((row) => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{row.label}</span>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'isPositive' in row ? (row.isPositive ? '#00e59b' : '#f87171') : 'white' }}>
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tail Tracker */}
                        <TailTracker
                            seasonUnits={tailTracker.seasonUnits}
                            weekUnits={tailTracker.weekUnits}
                            totalPicks={tailTracker.totalPicks}
                        />

                        {/* Recent Days */}
                        {recentDays.length > 0 && (
                            <div className="dash-sidebar-card">
                                <h3 className="dash-sidebar-card__title">Recent Days</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {recentDays.map((d) => (
                                        <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <div>
                                                <p style={{ fontSize: '11px', color: '#6b7280' }}>
                                                    {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{d.record}</p>
                                            </div>
                                            <span style={{
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: d.units >= 0 ? '#00e59b' : '#f87171',
                                            }}>
                                                {d.units >= 0 ? '+' : ''}{d.units}u
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* By Sport */}
                        {bySport.length > 0 && (
                            <div className="dash-sidebar-card">
                                <h3 className="dash-sidebar-card__title">By Sport</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {bySport.map((s) => (
                                        <div key={s.sport} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '4px', height: '32px', borderRadius: '9999px', opacity: 0.6 }} className={s.color} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{s.sport}</span>
                                                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{s.record} ({s.winPct})</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                                    <div style={{ flex: 1, height: '4px', borderRadius: '9999px', background: 'rgba(255,255,255,0.06)' }}>
                                                        <div style={{ height: '4px', borderRadius: '9999px', width: s.winPct, opacity: 0.6 }} className={s.color} />
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00e59b', whiteSpace: 'nowrap' }}>{s.units}u</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Community Pulse */}
                        <CommunityPulse />

                        {/* Trial status badge */}
                        {trialActive && (
                            <div style={{
                                background: 'rgba(0,229,155,0.06)',
                                border: '1px solid rgba(0,229,155,0.15)',
                                borderRadius: '12px',
                                padding: '14px',
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#00e59b', marginBottom: '4px' }}>
                                    {daysLeft} day{daysLeft !== 1 ? 's' : ''} left on free trial
                                </p>
                                <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
                                    Upgrade to unlock picks &amp; Elite Plays
                                </p>
                                <Link href="/pricing" className="btn-glow" style={{ fontSize: '12px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    View Plans →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage(): ReactNode {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={28} style={{ color: '#00e59b', animation: 'spin 1s linear infinite' }} /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
