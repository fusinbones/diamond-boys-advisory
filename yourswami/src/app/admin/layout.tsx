'use client';

import { useAdminAuth } from '@/lib/adminAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    LayoutDashboard,
    Search,
    ClipboardList,
    History,
    LogOut,
    Loader2,
    Lock,
    Mail,
    ArrowRight,
    ShieldCheck,
    ArrowUpDown,
    Users,
    ShieldAlert,
    Flame,
    Mic,
} from 'lucide-react';
import './admin.css';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/analysis', label: 'Analysis Hub', icon: Search },
    { href: '/admin/picks', label: 'Pick Entry', icon: ClipboardList },
    { href: '/admin/fire-picks', label: 'Fire Picks', icon: Flame },
    { href: '/admin/podcast', label: 'Podcast', icon: Mic },
    { href: '/admin/logs', label: 'Pick Logs', icon: History },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/moderation', label: 'Moderation', icon: ShieldAlert },
    { href: '/admin/affiliates', label: 'Affiliates', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, loading, signOut } = useAdminAuth();
    const pathname = usePathname();

    // ── Auth loading ──
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}>
                <div className="admin-loader">
                    <div className="admin-spinner" />
                    <span>Loading...</span>
                </div>
            </div>
        );
    }

    // ── Not logged in → login form ──
    if (!user) {
        return <AdminLoginForm />;
    }

    // ── Not admin → access denied ──
    if (!isAdmin) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}>
                <div className="admin-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
                    <ShieldCheck size={32} style={{ color: '#f87171', marginBottom: '12px' }} />
                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Access Denied</h2>
                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                        Your account ({user.email}) is not authorized for admin access.
                    </p>
                    <button onClick={signOut} className="admin-btn admin-btn-secondary">
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>
        );
    }

    // ── Admin layout ──
    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Image src="/brand/logo-primary.png" alt="YourSwami" width={32} height={32} style={{ borderRadius: '6px' }} />
                        <div>
                            <div style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>YourSwami</div>
                            <div className="admin-sidebar-badge">🔒 Admin Panel</div>
                        </div>
                    </div>
                </div>

                <nav className="admin-nav">
                    <div className="admin-nav-section">Analysis</div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="admin-sidebar-footer">
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                    </div>
                    <button onClick={signOut} className="admin-btn admin-btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Content */}
            <main className="admin-content">
                {children}
            </main>
        </div>
    );
}

// ── Login Form Component ─────────────────

function AdminLoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 96px)' }}>
            <div style={{ maxWidth: '380px', width: '100%', padding: '0 20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <Image src="/brand/logo-primary.png" alt="YourSwami" width={48} height={48} style={{ borderRadius: '10px', margin: '0 auto 12px' }} />
                    <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>Admin Panel</h1>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>Sign in with your team account</p>
                </div>

                <div className="admin-card" style={{ padding: '24px' }}>
                    <form onSubmit={handleLogin}>
                        <label className="admin-label">Email</label>
                        <div style={{ position: 'relative', marginBottom: '14px' }}>
                            <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="admin-input"
                                style={{ paddingLeft: '36px' }}
                                placeholder="admin@tripleplayz.com"
                            />
                        </div>

                        <label className="admin-label">Password</label>
                        <div style={{ position: 'relative', marginBottom: '18px' }}>
                            <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="admin-input"
                                style={{ paddingLeft: '36px' }}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px' }}>
                                <p style={{ color: '#fca5a5', fontSize: '12px', margin: 0 }}>⚠ {error}</p>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p style={{ color: '#374151', fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
                    Internal use only. Authorized team members.
                </p>
            </div>
        </div>
    );
}
