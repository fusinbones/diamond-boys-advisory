'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Settings, User, Lock, Tag, Crown, ArrowLeft, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface UserProfile {
    display_name: string;
    nickname: string | null;
    avatar_color: string;
    subscription_tier: string | null;
    role: string;
    email: string | null;
    created_at: string;
}

export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const userEmail = user?.email || '';
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Nickname state
    const [nickname, setNickname] = useState('');
    const [nickChecking, setNickChecking] = useState(false);
    const [nickAvailability, setNickAvailability] = useState<{ available: boolean; error: string | null } | null>(null);
    const [nickSaving, setNickSaving] = useState(false);
    const [nickSaved, setNickSaved] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPass, setShowNewPass] = useState(false);
    const [passSaving, setPassSaving] = useState(false);
    const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load profile
    useEffect(() => {
        if (authLoading || !user) return;
        (async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('display_name, nickname, avatar_color, subscription_tier, role, email, created_at')
                .eq('id', user.id)
                .single();
            if (data) {
                setProfile(data);
                setNickname(data.nickname || '');
            }
            setLoading(false);
        })();
    }, [user, authLoading]);

    // Debounced nickname check
    const checkNickname = useCallback(async (nick: string) => {
        if (nick.trim().length < 3) { setNickAvailability(null); return; }
        if (nick.trim() === profile?.nickname) { setNickAvailability({ available: true, error: null }); return; }
        setNickChecking(true);
        try {
            const res = await fetch(`/api/nickname?nickname=${encodeURIComponent(nick.trim())}&email=${encodeURIComponent(userEmail)}`);
            const data = await res.json();
            setNickAvailability(data);
        } catch {
            setNickAvailability({ available: false, error: 'Check failed' });
        } finally {
            setNickChecking(false);
        }
    }, [profile?.nickname]);

    useEffect(() => {
        setNickSaved(false);
        const timer = setTimeout(() => checkNickname(nickname), 400);
        return () => clearTimeout(timer);
    }, [nickname, checkNickname]);

    const saveNickname = async () => {
        if (!user || !nickAvailability?.available) return;
        setNickSaving(true);
        try {
            const res = await fetch('/api/nickname', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, nickname: nickname.trim(), email: userEmail }),
            });
            const data = await res.json();
            if (data.success) {
                setNickSaved(true);
                setProfile(prev => prev ? { ...prev, nickname: data.nickname, display_name: data.nickname } : prev);
                setTimeout(() => setNickSaved(false), 3000);
            }
        } catch { /* ignore */ }
        finally { setNickSaving(false); }
    };

    const changePassword = async () => {
        setPassMsg(null);
        if (newPassword.length < 6) {
            setPassMsg({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPassMsg({ type: 'error', text: 'Passwords don\'t match' });
            return;
        }
        setPassSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                setPassMsg({ type: 'error', text: error.message });
            } else {
                setPassMsg({ type: 'success', text: 'Password updated successfully!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch {
            setPassMsg({ type: 'error', text: 'Failed to update password' });
        } finally {
            setPassSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '24px', height: '24px', border: '2px solid rgba(0,229,155,0.3)', borderTopColor: '#00e59b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!user) {
        return (
            <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px' }}>
                <Lock size={32} style={{ color: '#6b7280' }} />
                <p style={{ color: '#6b7280', fontSize: '14px' }}>Sign in to access settings</p>
                <Link href="/dashboard" style={{ color: '#00e59b', fontSize: '13px', textDecoration: 'none' }}>Go to Dashboard →</Link>
            </div>
        );
    }

    const tierLabels: Record<string, string> = {
        free: '🆓 Free',
        daily: '📅 Daily',
        weekly: '📆 Weekly',
        monthly: '📅 Monthly',
        season: '🏆 Season Pass',
    };

    const isNickChanged = nickname.trim() !== (profile?.nickname || '');
    const canSaveNick = isNickChanged && nickAvailability?.available && !nickChecking && nickname.trim().length >= 3;

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f', color: 'white',
            paddingTop: '80px', paddingBottom: '60px',
        }}>
            <div style={{ maxWidth: '580px', margin: '0 auto', padding: '0 20px' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <Link href="/dashboard" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        color: '#6b7280', fontSize: '12px', textDecoration: 'none',
                        marginBottom: '12px',
                    }}>
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <h1 style={{
                        fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <Settings size={22} style={{ color: '#00e59b' }} />
                        Account Settings
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                        Manage your profile, nickname, and security
                    </p>
                </div>

                {/* Profile Overview Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '20px', marginBottom: '20px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: profile?.avatar_color || '#6b7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', fontWeight: 800, color: 'white', flexShrink: 0,
                        }}>
                            {(profile?.nickname || profile?.display_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                                {profile?.nickname || profile?.display_name || 'User'}
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0' }}>
                                {user.email}
                            </p>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                                    borderRadius: '6px', background: 'rgba(0,229,155,0.1)',
                                    color: '#00e59b', textTransform: 'uppercase',
                                }}>
                                    {tierLabels[profile?.subscription_tier || 'free'] || '🆓 Free'}
                                </span>
                                {profile?.role && profile.role !== 'member' && (
                                    <span style={{
                                        fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                                        borderRadius: '6px',
                                        background: profile.role === 'admin' ? 'rgba(251,191,36,0.1)' : 'rgba(129,140,248,0.1)',
                                        color: profile.role === 'admin' ? '#fbbf24' : '#818cf8',
                                        textTransform: 'uppercase',
                                    }}>
                                        {profile.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {profile?.created_at && (
                        <p style={{ color: '#374151', fontSize: '10px', marginTop: '12px', textAlign: 'right' }}>
                            Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                    )}
                </div>

                {/* ── Nickname Section ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '20px', marginBottom: '20px',
                }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                        <Tag size={16} style={{ color: '#00e59b' }} />
                        Chat Nickname
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '14px' }}>
                        This is how you appear in the community chat. Must be unique.
                    </p>

                    <div style={{ position: 'relative', marginBottom: '6px' }}>
                        <input
                            type="text"
                            value={nickname}
                            onChange={e => {
                                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                if (val.length <= 16) setNickname(val);
                            }}
                            placeholder="your_nickname"
                            style={{
                                width: '100%', padding: '11px 40px 11px 14px',
                                fontSize: '14px', fontWeight: 600, color: 'white',
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${
                                    nickSaved ? 'rgba(0,229,155,0.5)' :
                                    nickAvailability?.available && isNickChanged ? 'rgba(0,229,155,0.3)' :
                                    nickAvailability && !nickAvailability.available && isNickChanged ? 'rgba(239,68,68,0.3)' :
                                    'rgba(255,255,255,0.08)'
                                }`,
                                borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>
                            {nickChecking ? (
                                <div style={{ width: '12px', height: '12px', border: '2px solid rgba(0,229,155,0.3)', borderTopColor: '#00e59b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                            ) : nickSaved ? (
                                <Check size={14} style={{ color: '#00e59b' }} />
                            ) : nickAvailability?.available && isNickChanged ? (
                                <span style={{ color: '#00e59b' }}>✓</span>
                            ) : nickAvailability && !nickAvailability.available && isNickChanged ? (
                                <span style={{ color: '#f87171' }}>✗</span>
                            ) : null}
                        </div>
                    </div>

                    {/* Feedback */}
                    <div style={{ minHeight: '18px', marginBottom: '10px' }}>
                        {nickSaved && <p style={{ color: '#00e59b', fontSize: '11px', fontWeight: 600 }}>✨ Nickname saved!</p>}
                        {!nickSaved && nickAvailability?.error && isNickChanged && (
                            <p style={{ color: '#f87171', fontSize: '11px', fontWeight: 600 }}>{nickAvailability.error}</p>
                        )}
                        {!nickSaved && nickAvailability?.available && isNickChanged && (
                            <p style={{ color: '#00e59b', fontSize: '11px', fontWeight: 600 }}>Available!</p>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: '#4b5563', marginBottom: '12px' }}>
                        <span>3-16 chars</span>
                        <span>•</span>
                        <span>Letters, numbers, underscores</span>
                    </div>

                    <button
                        onClick={saveNickname}
                        disabled={!canSaveNick || nickSaving}
                        style={{
                            width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                            background: canSaveNick ? 'linear-gradient(135deg, #00e59b, #00c9ff)' : 'rgba(255,255,255,0.04)',
                            color: canSaveNick ? '#0a0a0f' : '#4b5563',
                            fontSize: '13px', fontWeight: 700, cursor: canSaveNick ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {nickSaving ? 'Saving...' : 'Save Nickname'}
                    </button>
                </div>

                {/* ── Password Section ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '20px', marginBottom: '20px',
                }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                        <Lock size={16} style={{ color: '#fbbf24' }} />
                        Change Password
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '14px' }}>
                        Update your account password
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNewPass ? 'text' : 'password'}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="New password (min 6 characters)"
                                style={{
                                    width: '100%', padding: '11px 40px 11px 14px',
                                    fontSize: '13px', color: 'white',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                            <button
                                onClick={() => setShowNewPass(!showNewPass)}
                                style={{
                                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px',
                                }}
                            >
                                {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            style={{
                                width: '100%', padding: '11px 14px',
                                fontSize: '13px', color: 'white',
                                background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: '10px', outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {passMsg && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 12px', borderRadius: '8px', marginBottom: '12px',
                            background: passMsg.type === 'success' ? 'rgba(0,229,155,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${passMsg.type === 'success' ? 'rgba(0,229,155,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                            {passMsg.type === 'success' ? <Check size={13} style={{ color: '#00e59b' }} /> : <AlertCircle size={13} style={{ color: '#f87171' }} />}
                            <span style={{ fontSize: '12px', color: passMsg.type === 'success' ? '#00e59b' : '#f87171' }}>{passMsg.text}</span>
                        </div>
                    )}

                    <button
                        onClick={changePassword}
                        disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmPassword || passSaving}
                        style={{
                            width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
                            background: newPassword && newPassword.length >= 6 && newPassword === confirmPassword
                                ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.04)',
                            color: newPassword && newPassword.length >= 6 && newPassword === confirmPassword
                                ? '#fbbf24' : '#4b5563',
                            fontSize: '13px', fontWeight: 700,
                            cursor: newPassword && newPassword.length >= 6 && newPassword === confirmPassword ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {passSaving ? 'Updating...' : 'Update Password'}
                    </button>
                </div>

                {/* ── Subscription Section ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '20px', marginBottom: '20px',
                }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                        <Crown size={16} style={{ color: '#00e59b' }} />
                        Subscription
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '11px', marginBottom: '14px' }}>
                        Your current plan and membership details
                    </p>

                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 16px', borderRadius: '10px',
                        background: 'rgba(0,229,155,0.04)', border: '1px solid rgba(0,229,155,0.1)',
                    }}>
                        <div>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: '#00e59b' }}>
                                {tierLabels[profile?.subscription_tier || 'free'] || '🆓 Free'}
                            </p>
                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                {profile?.subscription_tier && profile.subscription_tier !== 'free'
                                    ? 'Active subscription'
                                    : 'Upgrade for full access'}
                            </p>
                        </div>
                        <Link href="/pricing" style={{
                            padding: '8px 16px', borderRadius: '8px',
                            background: 'rgba(0,229,155,0.1)', border: '1px solid rgba(0,229,155,0.2)',
                            color: '#00e59b', fontSize: '12px', fontWeight: 700,
                            textDecoration: 'none',
                        }}>
                            {profile?.subscription_tier && profile.subscription_tier !== 'free' ? 'Manage' : 'Upgrade'}
                        </Link>
                    </div>
                </div>

                {/* ── Account Info ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '14px', padding: '20px',
                }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                        <User size={16} style={{ color: '#818cf8' }} />
                        Account Info
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { label: 'Email', value: user.email || 'Not set' },
                            { label: 'User ID', value: user.id.slice(0, 8) + '...' },
                            { label: 'Joined', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>{label}</span>
                                <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600 }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
