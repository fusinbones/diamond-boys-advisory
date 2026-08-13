'use client';

import { useState, useEffect, Suspense, useCallback, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, UserPlus, LogIn, Loader2, Shield, Flame, LogOut, ArrowUp, KeyRound, Trash2, Phone } from 'lucide-react';
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
import Tooltip from '@/components/dashboard/Tooltip';
import FirePickCard from '@/components/dashboard/FirePickCard';
import PhonePopup from '@/components/dashboard/PhonePopup';

interface UserProfile {
    subscription_tier: string | null;
    trial_end: string | null;
    trial_bonus_days: number;
    display_name: string;
    is_admin: boolean;
    role?: string;
}

// ── Types ──
interface KPIs {
    record: string;
    winRate: string;
    totalUnits: string;
    roi: string;
    streak: string;
    avgEdge: string;
    isPreseason?: boolean;
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

// Sport filters moved into GamesBoard component

// ── Resend OTP Code Button with cooldown ──
function ResendCodeButton({ email }: { email: string }): ReactNode {
    const [cooldown, setCooldown] = useState(0);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0 || sending) return;
        setSending(true);
        setSent(false);
        try {
            await supabase.auth.resend({ type: 'signup', email });
            setSent(true);
            setCooldown(30);
            setTimeout(() => setSent(false), 4000);
        } catch {
            // silent — Supabase rate-limits internally
        } finally {
            setSending(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || sending}
            style={{
                background: sent ? 'rgba(0,229,155,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${sent ? 'rgba(0,229,155,0.25)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px',
                padding: '10px 20px',
                color: cooldown > 0 ? '#4b5563' : sent ? '#00e59b' : '#d1d5db',
                fontSize: '13px', fontWeight: 600,
                cursor: cooldown > 0 || sending ? 'default' : 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                opacity: cooldown > 0 ? 0.5 : 1,
            }}
        >
            {sending ? '📧 Sending new code...'
                : sent ? '✅ New code sent! Check your inbox & spam'
                : cooldown > 0 ? `Resend available in ${cooldown}s`
                : "📧 Didn't get a code? Tap to resend"}
        </button>
    );
}

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
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [phone, setPhone] = useState('');

    // Dashboard state
    const [sportFilter, setSportFilter] = useState('All');
    const [picks, setPicks] = useState<PickData[]>([]);
    const [newPickCount, setNewPickCount] = useState(0);
    const seenPickIds = useState<Set<string>>(() => new Set())[0];
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [slate, setSlate] = useState<MorningSlateData | null>(null);
    const [dailyPnl, setDailyPnl] = useState<DailyPnl[]>([]);
    const [recentDays, setRecentDays] = useState<DailyPnl[]>([]);
    const [bySport, setBySport] = useState<SportBreakdown[]>([]);
    const [tailTracker, setTailTracker] = useState({ seasonUnits: 0, weekUnits: 0, totalPicks: 0 });
    const [fireStats, setFireStats] = useState({ record: '0-0', winPct: '0.0%', units: 0 });
    const [dashLoading, setDashLoading] = useState(true);
    const [loginStreak, setLoginStreak] = useState(1);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fire Pick state
    interface FirePickData {
        id: string;
        matchup: string;
        sport: string;
        pick_type?: string;
        pick_team?: string;
        pick_value?: string;
        odds?: string;
        confidence?: number;
        units?: number;
        reasoning?: string;
        scheduled_at: string;
        status: string;
    }
    const [firePicks, setFirePicks] = useState<FirePickData[]>([]);
    const [fireHistory, setFireHistory] = useState<FirePickData[]>([]);
    const [deletingPickId, setDeletingPickId] = useState<string | null>(null);
    const [todayStr, setTodayStr] = useState(() => {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
        const parts = formatter.formatToParts(new Date());
        const y = parts.find(p => p.type === 'year')?.value;
        const m = parts.find(p => p.type === 'month')?.value;
        const d = parts.find(p => p.type === 'day')?.value;
        return (y && m && d) ? `${y}-${m}-${d}` : new Date().toISOString().split('T')[0];
    });

    // Scroll-to-top listener
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-select signup tab when coming from free CTA
    useEffect(() => {
        if (isFreeSignup) setIsSignUp(true);
    }, [isFreeSignup]);

    // Listen for PASSWORD_RECOVERY event from Supabase
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setRecoveryMode(true);
                setError('');
                setMessage('');
            }
        });

        // Check URL hash for recovery type or expired/invalid link errors
        if (typeof window !== 'undefined') {
            const hash = window.location.hash;

            // Detect recovery flow from URL hash (type=recovery)
            if (hash.includes('type=recovery')) {
                setRecoveryMode(true);
                setError('');
                setMessage('');
                // Don't clean hash immediately — Supabase needs it to establish the session
                // Clean it after a delay so the auth tokens are processed
                setTimeout(() => {
                    window.history.replaceState(null, '', window.location.pathname);
                }, 2000);
            }

            // Detect expired/invalid links
            if (hash.includes('error=access_denied') || hash.includes('otp_expired')) {
                setError('This link has expired or is invalid. Please try signing in again or request a new link.');
                window.history.replaceState(null, '', window.location.pathname);
            }
        }

        return () => subscription.unsubscribe();
    }, []);

    // Handle setting new password
    const handleSetNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setMessage('Password updated successfully! Redirecting...');
            setRecoveryMode(false);
            setTimeout(() => router.push('/dashboard'), 1500);
        } catch (err: unknown) {
            const raw = err instanceof Error ? err.message : String(err);
            if (raw.toLowerCase().includes('same')) {
                setError('New password must be different from your current password.');
            } else {
                setError('Could not update password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

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
            // Autowire fix: Heal broken Stripe subs that fired before the user registered
            if (user.email) {
                fetch('/api/user/sync-tier', { method: 'POST', body: JSON.stringify({ email: user.email }) }).catch(console.error);
            }
        };
        fetchProfile();
    }, [user]);

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        try {
            setDashLoading(true);
            const [picksRes, statsRes, fireRes] = await Promise.all([
                fetch('/api/dashboard/picks'),
                fetch('/api/dashboard/stats'),
                fetch('/api/public/fire-pick'),
            ]);

            if (picksRes.ok) {
                const data = await picksRes.json();
                const incoming: PickData[] = data.picks || [];
                const serverToday = data.todayStr || todayStr;
                if (data.todayStr) setTodayStr(data.todayStr);
                // Only count TODAY's unseen upcoming picks as "new" (ignore yesterday's)
                const freshCount = incoming.filter(p =>
                    !seenPickIds.has(p.id) &&
                    p.status === 'upcoming' &&
                    (p.game_date || '').startsWith(serverToday)
                ).length;
                if (freshCount > 0) setNewPickCount(freshCount);
                // Mark all as seen
                incoming.forEach(p => seenPickIds.add(p.id));
                setPicks(incoming);
                setKpis(data.kpis || null);
                setSlate(data.morningSlate || null);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setDailyPnl(data.dailyPnl || []);
                setRecentDays(data.recentDays || []);
                setBySport(data.bySport || []);
                setTailTracker(data.tailTracker || { seasonUnits: 0, weekUnits: 0, totalPicks: 0 });
                if (data.fireStats) {
                    setFireStats(data.fireStats);
                }
            }

            if (fireRes.ok) {
                const data = await fireRes.json();
                setFirePicks(data.firePicks || (data.firePick ? [data.firePick] : []));
                setFireHistory(data.history || []);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setDashLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchData();
        // Auto-refresh every 60s so stats update in real-time
        const interval = setInterval(() => { if (user) fetchData(); }, 60000);
        return () => clearInterval(interval);
    }, [user, fetchData]);

    // Delete pick handler (admin only)
    const handleDeletePick = async (pickId: string) => {
        try {
            const res = await fetch(`/api/admin/picks/${pickId}`, { method: 'DELETE' });
            if (res.ok) {
                setPicks(prev => prev.filter(p => p.id !== pickId));
            }
        } catch (err) {
            console.error('Delete pick error:', err);
        } finally {
            setDeletingPickId(null);
        }
    };

    // Access logic: paid vs trial vs expired
    const isPaid = profile?.subscription_tier && ['starter', 'pro', 'elite', 'daily', 'weekly', 'monthly', 'season'].includes(profile.subscription_tier);
    const trialEnd = profile?.trial_end ? new Date(profile.trial_end) : (user ? new Date(new Date(user.created_at).getTime() + 7 * 86400000) : new Date());
    const bonusDays = profile?.trial_bonus_days || 0;
    const effectiveTrialEnd = new Date(trialEnd.getTime() + bonusDays * 86400000);
    const daysLeft = Math.max(0, Math.ceil((effectiveTrialEnd.getTime() - Date.now()) / 86400000));
    const trialActive = !isPaid && daysLeft > 0;
    const trialExpired = !isPaid && daysLeft <= 0;
    const picksLocked = !isPaid && !trialActive; // Picks visible for paid users AND active trial users

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    // No emailRedirectTo needed since we use OTP Verification on this page
                });
                if (error) throw error;

                // Supabase returns success with empty identities when email already exists (confirmed user)
                // This is intentional anti-enumeration behavior — we handle it explicitly
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    setError('An account with this email already exists. Try signing in instead.');
                    setIsSignUp(false);
                    return;
                }

                setShowOtp(true);
                setMessage('A confirmation code has been sent to your email. Be sure to check your spam/junk folder!');
                // Save phone number to pick_subscribers if provided during signup
                if (phone.trim()) {
                    fetch('/api/subscribers/phone', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, phone: phone.trim() }),
                    }).catch(() => {});
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/dashboard');
            }
        } catch (err: unknown) {
            const raw = err instanceof Error ? err.message : String(err);
            const lower = raw.toLowerCase();

            if (lower.includes('user already registered') || lower.includes('already been registered')) {
                setError('This email is already registered. Try signing in instead.');
            } else if (lower.includes('invalid login credentials') || lower.includes('invalid password')) {
                setError('Incorrect email or password. Please try again.');
            } else if (lower.includes('email not confirmed')) {
                // If they haven't confirmed, let them trigger OTP again by re-signing up
                setShowOtp(true);
                setError('Please check your email and enter the confirmation code to verify your account first.');
            } else if (lower.includes('password') && lower.includes('6')) {
                setError('Password must be at least 6 characters.');
            } else if (lower.includes('rate limit') || lower.includes('too many')) {
                setError('Too many attempts. Please wait a moment and try again.');
            } else if (lower.includes('database') || lower.includes('relation') || lower.includes('column') || lower.includes('violates') || lower.includes('duplicate key')) {
                console.error('Signup DB error (hidden from user):', raw);
                if (isSignUp) {
                    setShowOtp(true);
                    setMessage('Account creation partially complete. Enter your code to continue.');
                } else {
                    setError('Something went wrong. Please try again in a moment.');
                }
            } else if (lower.includes('network') || lower.includes('fetch')) {
                setError('Network error. Please check your connection and try again.');
            } else {
                console.error('Auth error (hidden):', raw);
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length !== 8) {
            setError('Please enter the 8-digit code from your email.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
            if (error) throw error;
            router.push('/dashboard');
        } catch (err: unknown) {
            const raw = err instanceof Error ? err.message : String(err);
            if (raw.toLowerCase().includes('expired')) {
                setError('That code has expired. Please go back and sign up again to get a new code.');
            } else if (raw.toLowerCase().includes('invalid')) {
                setError('Invalid code. Please double-check what was sent to your email.');
            } else {
                setError('Failed to verify code. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setError('Please enter your email address first.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/dashboard`,
            });
            if (error) throw error;
            setMessage('Password reset link sent! Check your email.');
        } catch (err: unknown) {
            const raw = err instanceof Error ? err.message : String(err);
            if (raw.toLowerCase().includes('rate limit') || raw.toLowerCase().includes('too many')) {
                setError('Too many attempts. Please wait a moment and try again.');
            } else {
                setError('Could not send reset email. Please try again.');
            }
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
    if (!user || recoveryMode) {
        // Password recovery mode — show "Set New Password" form
        if (recoveryMode) {
            return (
                <div style={{ paddingTop: '40px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="container-db" style={{ maxWidth: '420px' }}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0,229,155,0.1)', border: '1px solid rgba(0,229,155,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <KeyRound size={28} style={{ color: '#00e59b' }} />
                                </div>
                                <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                    Set New Password
                                </h1>
                                <p style={{ color: '#d1d5db', fontSize: '15px', lineHeight: 1.5 }}>
                                    Enter your new password below.
                                </p>
                            </div>

                            <div className="glass-card" style={{ padding: '28px 24px', marginBottom: '20px' }}>
                                <form onSubmit={handleSetNewPassword}>
                                    <label htmlFor="new-password" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                        New Password
                                    </label>
                                    <div style={{ position: 'relative', marginBottom: '14px' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                        <input
                                            id="new-password"
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{
                                                width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                                            }}
                                            placeholder="New password (min 6 chars)"
                                            minLength={6}
                                        />
                                    </div>

                                    <label htmlFor="confirm-password" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                        Confirm Password
                                    </label>
                                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            style={{
                                                width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                                            }}
                                            placeholder="Confirm new password"
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
                                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                                        ) : (
                                            <><KeyRound size={16} /> Set New Password</>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            );
        }

        if (showOtp) {
            const OTP_LENGTH = 8;
            const handleOtpBoxChange = (index: number, value: string) => {
                const digit = value.replace(/\D/g, '').slice(-1); // take last char typed
                const newOtp = otp.split('');
                while (newOtp.length < OTP_LENGTH) newOtp.push('');
                newOtp[index] = digit;
                const joined = newOtp.join('').replace(/\s/g, '').slice(0, OTP_LENGTH);
                setOtp(joined);
                // Auto-focus next box
                if (digit && index < OTP_LENGTH - 1) {
                    const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
                    next?.focus();
                }
            };
            const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Backspace' && !otp[index] && index > 0) {
                    const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
                    prev?.focus();
                    const newOtp = otp.split('');
                    newOtp[index - 1] = '';
                    setOtp(newOtp.join('').trimEnd());
                }
            };
            const handleOtpPaste = (e: React.ClipboardEvent) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
                setOtp(pasted);
                // Focus last filled box or submit button
                const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
                const target = document.getElementById(`otp-${focusIdx}`) as HTMLInputElement | null;
                target?.focus();
            };

            return (
                <div style={{ paddingTop: '40px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="container-db" style={{ maxWidth: '420px', padding: '0 16px' }}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0,229,155,0.1)', border: '1px solid rgba(0,229,155,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <KeyRound size={28} style={{ color: '#00e59b' }} />
                                </div>
                                <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                    Verify Email
                                </h1>
                                <p style={{ color: '#d1d5db', fontSize: '14px', lineHeight: 1.5 }}>
                                    Enter the 8-digit code sent to<br /><strong style={{ color: 'white' }}>{email}</strong>
                                </p>
                            </div>

                            {/* Spam/junk folder warning */}
                            <div style={{
                                background: 'rgba(251,191,36,0.06)',
                                border: '1px solid rgba(251,191,36,0.15)',
                                borderRadius: '10px',
                                padding: '12px 14px',
                                marginBottom: '16px',
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'flex-start',
                            }}>
                                <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1.3 }}>⚠️</span>
                                <div>
                                    <p style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                                        Check your Spam / Junk folder!
                                    </p>
                                    <p style={{ color: '#9ca3af', fontSize: '11px', lineHeight: 1.5, margin: 0 }}>
                                        The code email may land in spam, especially on Gmail, Yahoo, or Outlook.
                                        Search for &ldquo;verification&rdquo; or &ldquo;confirm&rdquo; in your inbox.
                                    </p>
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: '24px 20px', marginBottom: '20px' }}>
                                <form onSubmit={handleVerifyOtp}>
                                    {/* 8-Box OTP Input — mobile perfect */}
                                    <div
                                        style={{
                                            display: 'flex', gap: '8px', justifyContent: 'center',
                                            marginBottom: '20px',
                                        }}
                                        onPaste={handleOtpPaste}
                                    >
                                        {Array.from({ length: OTP_LENGTH }, (_, i) => i).map(i => (
                                            <input
                                                key={i}
                                                id={`otp-${i}`}
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                value={otp[i] || ''}
                                                onChange={(e) => handleOtpBoxChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                onFocus={(e) => e.target.select()}
                                                maxLength={1}
                                                style={{
                                                    width: '38px', height: '50px',
                                                    background: otp[i] ? 'rgba(0,229,155,0.08)' : 'rgba(255,255,255,0.04)',
                                                    border: `2px solid ${otp[i] ? 'rgba(0,229,155,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: '12px', color: 'white',
                                                    fontSize: '20px', fontWeight: 800,
                                                    textAlign: 'center', outline: 'none',
                                                    caretColor: '#00e59b',
                                                    transition: 'border-color 0.2s, background 0.2s',
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Hidden real input for form submission */}
                                    <input type="hidden" name="otp" value={otp} />

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

                                    <button type="submit" className="btn-glow" disabled={loading || otp.length < OTP_LENGTH}
                                        style={{
                                            width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            opacity: otp.length < OTP_LENGTH ? 0.5 : 1,
                                        }}
                                    >
                                        {loading ? (
                                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                                        ) : (
                                            <><KeyRound size={16} /> Verify & Access</>
                                        )}
                                    </button>
                                </form>
                            </div>

                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                                <ResendCodeButton email={email} />
                                <button type="button" onClick={() => setShowOtp(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
                                    ← Go back
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ paddingTop: '40px', paddingBottom: '60px', minHeight: 'calc(100vh - 96px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container-db" style={{ maxWidth: '420px' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <Image src="/brand/logo-primary.png" alt="YourSwami" width={80} height={80} style={{ margin: '0 auto 16px', objectFit: 'contain' }} />
                            <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                                {isSignUp && isFreeSignup ? 'Start Your Free Week' : isSignUp ? 'Create Account' : 'Welcome Back'}
                            </h1>
                            <p style={{ color: '#d1d5db', fontSize: '15px', lineHeight: 1.5 }}>
                                {isSignUp && isFreeSignup
                                    ? '7 days of full dashboard access — picks, stats, community. No credit card.'
                                    : isSignUp
                                        ? 'Join YourSwami and get access to today\'s best picks.'
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
                                {isSignUp && (
                                    <>
                                        <label htmlFor="dash-phone" style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                                            Phone Number <span style={{ color: '#6b7280', fontWeight: 400 }}>(optional)</span>
                                        </label>
                                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                                            <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                                            <input
                                                id="dash-phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                style={{
                                                    width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '10px', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                                                }}
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                    </>
                                )}
                                {!isSignUp && (
                                    <div style={{ textAlign: 'right', marginTop: '-12px', marginBottom: '16px' }}>
                                        <button
                                            type="button"
                                            onClick={handleForgotPassword}
                                            disabled={loading}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#00e59b', fontSize: '13px', fontWeight: 600,
                                                padding: 0, opacity: loading ? 0.5 : 1,
                                            }}
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {(profile?.is_admin || profile?.role === 'admin' || profile?.role === 'staff') && (
                            <Link href="/admin" className="btn-glow" style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                <Shield size={13} /> Admin Panel
                            </Link>
                        )}
                        <button
                            onClick={signOut}
                            style={{ color: '#9ca3af', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <LogOut size={13} /> Sign out
                        </button>
                    </div>
                </div>

                {/* Morning Slate */}
                {slate && (
                    <MorningSlate
                        totalGames={slate.totalGames}
                        upcomingPicks={slate.upcomingPicks}
                        sports={slate.sports}
                        userEmail={user?.email}
                    />
                )}

                {/* KPI Strip — always visible above fold */}
                {kpis && (
                    <div className="dashboard-kpi-grid" style={{ margin: '16px 0 12px' }}>
                        <KPICard icon="record" label="Record" value={kpis.record} sub={`${kpis.winRate} Win Rate`} trend={kpis.isPreseason ? 'Model target' : 'Season to date'} delay={0.05} />
                        <KPICard icon="roi" label="ROI" value={`${Number(kpis.totalUnits) >= 0 ? '+' : ''}${kpis.totalUnits}u`} sub={`${kpis.roi} ROI`} trend={kpis.isPreseason ? 'Model target' : 'Units profit'} delay={0.1} />
                        <KPICard icon="streak" label="Streak" value={kpis.streak} sub="Current streak" delay={0.15} />
                        <KPICard icon="edge" label="Avg Edge" value={kpis.avgEdge} sub="Model confidence" delay={0.2} />
                    </div>
                )}

                {/* ═══ MOBILE: Horizontal Game Strip (above fold) ═══ */}
                <div className="games-strip-mobile">
                    <GamesBoard />
                </div>

                {/* ═══ 3-PANEL LAYOUT ═══ */}
                <div className="dash-3panel">
                    {/* LEFT: Games Sidebar (desktop only) */}
                    <aside className="games-sidebar-desktop">
                        <GamesBoard />
                    </aside>

                    {/* CENTER: Main Content */}
                    <main style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', minWidth: 0 }}>
                        {dashLoading ? (
                            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                <Loader2 size={20} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 6px' }} />
                                <p style={{ color: '#6b7280', fontSize: '12px' }}>Loading picks...</p>
                            </div>
                        ) : picks.length > 0 ? (() => {
                            const sportTabs = ['All', ...Array.from(new Set(picks.map(p => p.sport))).filter(Boolean)];
                            const filteredPicks = sportFilter === 'All' ? picks : picks.filter(p => p.sport === sportFilter);
                            return (
                            <>
                                <PickDropBanner pickCount={newPickCount} isPaid={!!isPaid} />

                                {/* 🔥 Fire Picks — pinned to top */}
                                {firePicks.map(fp => (
                                    <FirePickCard key={fp.id} firePick={fp} isPaid={!!isPaid} />
                                ))}

                                {/* 🔥 Past Fire Picks (Paid Only) */}
                                {isPaid && fireHistory.length > 0 && (
                                    <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <Flame size={16} style={{ color: '#6b7280' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Past Fire Picks</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {fireHistory.map((pick) => (
                                                <div key={pick.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div>
                                                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>{pick.pick_value}</p>
                                                        <p style={{ fontSize: '11px', color: '#6b7280' }}>
                                                            {new Date(pick.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {pick.matchup}
                                                        </p>
                                                    </div>
                                                    <span style={{ 
                                                        fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', 
                                                        color: pick.status === 'won' ? '#00e59b' : pick.status === 'lost' ? '#f87171' : '#fbbf24',
                                                        background: pick.status === 'won' ? 'rgba(0,229,155,0.1)' : pick.status === 'lost' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)'
                                                    }}>
                                                        {pick.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sport filter pills */}
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                    {sportTabs.map(tab => {
                                        const count = tab === 'All' ? picks.length : picks.filter(p => p.sport === tab).length;
                                        const active = sportFilter === tab;
                                        return (
                                            <button key={tab} onClick={() => setSportFilter(tab)} style={{
                                                padding: '4px 12px', borderRadius: '14px',
                                                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                                border: active ? '1px solid rgba(0,229,155,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                                background: active ? 'rgba(0,229,155,0.1)' : 'transparent',
                                                color: active ? '#00e59b' : '#6b7280',
                                                transition: 'all 0.12s',
                                            }}>
                                                {tab} <span style={{ opacity: 0.5, marginLeft: '3px' }}>{count}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {(() => {
                                    const todayPicks = filteredPicks.filter(p => (p.game_date || '').startsWith(todayStr));
                                    const yesterdayPicks = filteredPicks.filter(p => !(p.game_date || '').startsWith(todayStr));

                                    const renderPick = (pick: PickData) => (
                                        <div key={pick.id} style={{ position: 'relative' }}>
                                            <PickCard pick={pick} locked={picksLocked} />
                                            {profile?.is_admin && (
                                                <button
                                                    onClick={() => setDeletingPickId(pick.id)}
                                                    style={{
                                                        position: 'absolute', top: '10px', right: '10px',
                                                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                                        borderRadius: '6px', padding: '4px 6px', cursor: 'pointer',
                                                        color: '#f87171', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px',
                                                        zIndex: 5,
                                                    }}
                                                >
                                                    <Trash2 size={11} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    );

                                    return (
                                        <>
                                            {/* Today's Picks */}
                                            {todayPicks.length > 0 && (
                                                <>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        marginBottom: '6px', marginTop: '2px',
                                                    }}>
                                                        <div style={{
                                                            width: '6px', height: '6px', borderRadius: '50%',
                                                            background: '#00e59b', boxShadow: '0 0 6px #00e59b',
                                                        }} />
                                                        <span style={{
                                                            fontSize: '12px', fontWeight: 700, color: '#00e59b',
                                                            textTransform: 'uppercase', letterSpacing: '0.5px',
                                                        }}>Today&apos;s Picks</span>
                                                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{todayPicks.length}</span>
                                                        <div style={{ flex: 1, height: '1px', background: 'rgba(0,229,155,0.15)' }} />
                                                    </div>
                                                    {todayPicks.map(renderPick)}
                                                </>
                                            )}

                                            {/* Yesterday's Picks */}
                                            {yesterdayPicks.length > 0 && (
                                                <>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        marginBottom: '6px', marginTop: todayPicks.length > 0 ? '16px' : '2px',
                                                    }}>
                                                        <span style={{
                                                            fontSize: '12px', fontWeight: 700, color: '#6b7280',
                                                            textTransform: 'uppercase', letterSpacing: '0.5px',
                                                        }}>Yesterday&apos;s Picks</span>
                                                        <span style={{ fontSize: '11px', color: '#4b5563' }}>{yesterdayPicks.length}</span>
                                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                                    </div>
                                                    <div style={{ opacity: 0.7 }}>
                                                        {yesterdayPicks.map(renderPick)}
                                                    </div>
                                                </>
                                            )}

                                            {todayPicks.length === 0 && yesterdayPicks.length === 0 && (
                                                <div className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db', marginBottom: '4px' }}>No {sportFilter} picks today</p>
                                                    <p style={{ fontSize: '12px', color: '#6b7280' }}>Check other sports or wait for upcoming picks.</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </>
                            );
                        })() : (
                            <div className="glass-card" style={{ padding: '30px 20px', textAlign: 'center' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db', marginBottom: '6px' }}>No picks yet</p>
                                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                                    Check back closer to game time for today&apos;s picks.
                                </p>
                            </div>
                        )}

                        <BankrollChart data={dailyPnl} />
                        {trialExpired && <PaywallOverlay daysLeft={daysLeft} />}
                    </main>

                    {/* RIGHT: Stats Sidebar */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Today's Summary */}
                        <div className="dash-sidebar-card">
                            <h3 className="dash-sidebar-card__title" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                Today&apos;s Summary
                                <Tooltip text="Your daily performance: total picks made, win/loss record, and profit in units. 1 unit = your standard bet size." />
                            </h3>
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

                        {/* Fire Pick Marketing Widget */}
                        <div className="dash-sidebar-card" style={{ 
                            background: 'linear-gradient(180deg, rgba(251,191,36,0.1) 0%, rgba(20,20,25,0.95) 100%)',
                            border: '1px solid rgba(251,191,36,0.2)' 
                        }}>
                            <h3 className="dash-sidebar-card__title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', marginBottom: '10px' }}>
                                <Flame size={14} style={{ color: '#fbbf24' }} />
                                Fire Pick Record
                                <Tooltip text="The official win/loss record for all highest-confidence Fire Picks." />
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 600 }}>All-Time Record</span>
                                    <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>
                                        {fireStats.record}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 600 }}>Win Rate</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>
                                        {fireStats.winPct}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '12px', color: '#d1d5db', fontWeight: 600 }}>Net Profit</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: fireStats.units >= 0 ? '#00e59b' : '#f87171' }}>
                                        {fireStats.units >= 0 ? '+' : ''}{fireStats.units}u
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Pattern System CTA */}
                        <Link href="/patterns" style={{ textDecoration: 'none' }}>
                            <div className="dash-sidebar-card" style={{
                                background: 'linear-gradient(180deg, rgba(167,139,250,0.1) 0%, rgba(20,20,25,0.95) 100%)',
                                border: '1px solid rgba(167,139,250,0.2)',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s, transform 0.2s',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <ArrowUp size={14} style={{ color: '#a78bfa', transform: 'rotate(45deg)' }} />
                                    </div>
                                    <h3 className="dash-sidebar-card__title" style={{ color: '#a78bfa', margin: 0 }}>
                                        Pattern System
                                    </h3>
                                </div>
                                <p style={{ color: '#9ca3af', fontSize: '11px', lineHeight: 1.5, marginBottom: '10px' }}>
                                    W/L alternation analysis for all 30 MLB teams. Find break points with 62-99% probability.
                                </p>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    color: '#a78bfa', fontSize: '12px', fontWeight: 700,
                                }}>
                                    Open Patterns →
                                </span>
                            </div>
                        </Link>

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

                        <CommunityPulse />

                        {/* Trial CTA */}
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
                    </aside>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingPickId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px',
                        }}
                        onClick={() => setDeletingPickId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#1a1f2e', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '14px', padding: '24px', maxWidth: '340px', width: '100%',
                                textAlign: 'center',
                            }}
                        >
                            <Trash2 size={28} style={{ color: '#f87171', margin: '0 auto 12px' }} />
                            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Delete This Pick?</h3>
                            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '18px' }}>
                                This action cannot be undone. The pick will be permanently removed.
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => setDeletingPickId(null)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#d1d5db', fontSize: '13px', fontWeight: 600,
                                    }}
                                >Cancel</button>
                                <button
                                    onClick={() => handleDeletePick(deletingPickId)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                        color: '#f87171', fontSize: '13px', fontWeight: 700,
                                    }}
                                >Delete Pick</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{
                            position: 'fixed', bottom: '24px', right: '24px',
                            width: '44px', height: '44px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00e59b, #00c9ff)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(0,229,155,0.3)',
                            zIndex: 100,
                        }}
                        title="Back to top"
                    >
                        <ArrowUp size={20} style={{ color: '#0a0a0f', strokeWidth: 3 }} />
                    </motion.button>
                )}
            </AnimatePresence>
            <PhonePopup />
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
