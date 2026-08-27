'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Users,
    Clock,
    CreditCard,
    AlertTriangle,
    Search,
    Plus,
    ChevronDown,
    Loader2,
    StickyNote,
    CheckCircle2,
    XCircle,
    Shield,
    Trash2,
    RotateCcw,
    Mail,
    Calendar,
    Eye,
    Phone,
    LogIn,
} from 'lucide-react';
import { adminFetch } from '@/lib/adminFetch';

interface UserData {
    id: string;
    email: string;
    emailConfirmed: boolean;
    displayName: string;
    tier: string;
    trialEnd: string;
    trialDaysLeft: number;
    trialBonusDays: number;
    status: string;
    isPaid: boolean;
    isAdmin: boolean;
    role: string;
    lastSeen: string | null;
    lastSignIn: string | null;
    notes: string | null;
    phone?: string | null;
    smsConsent?: boolean;
    smsConsentAt?: string | null;
    createdAt: string;
    avatarColor: string;
}

interface Stats {
    totalUsers: number;
    activeTrials: number;
    expiredTrials: number;
    paidUsers: number;
    expiringToday: number;
    staffCount: number;
}

const statusConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
    paid: { label: 'Paid', bg: 'rgba(106,0,255,0.1)', color: '#FFC107', border: 'rgba(106,0,255,0.2)' },
    trial: { label: 'Trial', bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
    expiring: { label: 'Expiring', bg: 'rgba(251,146,60,0.1)', color: '#fb923c', border: 'rgba(251,146,60,0.2)' },
    expired: { label: 'Expired', bg: 'rgba(161,161,170,0.08)', color: '#a1a1aa', border: 'rgba(161,161,170,0.15)' },
};

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    admin: { label: '👑 Admin', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    staff: { label: '🛡️ Staff', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    member: { label: 'Member', color: '#6b7280', bg: 'transparent' },
};

const tierLabels: Record<string, string> = {
    free: 'Free',
    daily: 'Daily Pass',
    weekly: 'Weekly',
    monthly: 'Monthly',
    season: 'Annual',
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeTrials: 0, expiredTrials: 0, paidUsers: 0, expiringToday: 0, staffCount: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [backfilling, setBackfilling] = useState(false);
    const [backfillResult, setBackfillResult] = useState('');

    // Pushes existing accounts into GoHighLevel. Contacts already there are left
    // untouched. Tags them 'imported', NOT 'website-signup', because the trial
    // nurture workflow triggers on that tag and would email every existing user
    // as though their free week had just begun.
    const runBackfill = async (dryRun: boolean) => {
        if (!dryRun && !confirm('Create GHL contacts for every account that is missing one. Continue?')) return;
        setBackfilling(true);
        setBackfillResult('');
        try {
            const res = await adminFetch('/api/admin/ghl-backfill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dryRun }),
            });
            const json = await res.json();
            setBackfillResult(JSON.stringify(json, null, 2));
        } catch (e) {
            setBackfillResult('Failed: ' + (e instanceof Error ? e.message : String(e)));
        } finally {
            setBackfilling(false);
        }
    };
    const [filterStatus, setFilterStatus] = useState('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [noteUserId, setNoteUserId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const getAdminEmail = () => {
        try {
            const stored = localStorage.getItem('sb-swbiwmmqsylwdzwjifpf-auth-token');
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed?.user?.email || '';
            }
        } catch { /* empty */ }
        return '';
    };

    const isSuperAdmin = () => {
        const email = getAdminEmail().toLowerCase();
        return ['support@tripleplayz.com', 'diamondboysadvisory@gmail.com'].includes(email);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/users?t=${Date.now()}`, {
                headers: { 'x-admin-email': getAdminEmail() },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setStats(data.stats || stats);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Action handler
    const handleAction = async (userId: string, action: string, value: string | number) => {
        setActionLoading(userId);
        try {
            const res = await adminFetch('/api/admin/users', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': getAdminEmail(),
                },
                body: JSON.stringify({ userId, action, value }),
            });
            if (res.ok) {
                await fetchUsers();
            } else {
                const err = await res.json();
                alert(err.error || 'Action failed');
            }
        } catch (err) {
            console.error('Action failed:', err);
        } finally {
            setActionLoading(null);
            setConfirmDelete(null);
        }
    };

    const submitNote = async () => {
        if (!noteUserId || !noteText.trim()) return;
        await handleAction(noteUserId, 'addNote', noteText.trim());
        setNoteUserId(null);
        setNoteText('');
    };

    // Filter and search
    const filteredUsers = useMemo(() => {
        let result = users;
        if (filterStatus !== 'all') {
            if (filterStatus === 'staff') {
                result = result.filter(u => u.role === 'staff' || u.role === 'admin');
            } else {
                result = result.filter(u => u.status === filterStatus);
            }
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                u.email.toLowerCase().includes(q) ||
                u.displayName.toLowerCase().includes(q) ||
                u.role.toLowerCase().includes(q) ||
                u.tier.toLowerCase().includes(q)
            );
        }
        return result;
    }, [users, filterStatus, search]);

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch { return '—'; }
    };

    const timeAgo = (d: string | null): string => {
        if (!d) return 'Never';
        const diff = Date.now() - new Date(d).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, marginBottom: '4px' }}>
                        👥 User Management & CRM
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>
                        Manage accounts, roles, subscriptions, and customer notes
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                        onClick={() => runBackfill(true)}
                        disabled={backfilling}
                        style={{
                            fontSize: '13px', fontWeight: 700, padding: '9px 14px', borderRadius: '9px',
                            background: 'rgba(255,255,255,0.06)', color: '#e5e7eb',
                            border: '1px solid rgba(255,255,255,0.15)', cursor: backfilling ? 'wait' : 'pointer',
                        }}
                    >
                        {backfilling ? 'Working...' : 'Preview CRM sync'}
                    </button>
                    <button
                        onClick={() => runBackfill(false)}
                        disabled={backfilling}
                        style={{
                            fontSize: '13px', fontWeight: 700, padding: '9px 14px', borderRadius: '9px',
                            background: '#FFC107', color: '#0a0512', border: 'none',
                            cursor: backfilling ? 'wait' : 'pointer',
                        }}
                    >
                        Sync users to CRM
                    </button>
                </div>
            </div>

            {backfillResult && (
                <pre style={{
                    marginBottom: '16px', padding: '12px 14px', borderRadius: '10px',
                    background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#d1d5db', fontSize: '12px', lineHeight: 1.6,
                    maxHeight: '320px', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                    {backfillResult}
                </pre>
            )}

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {[
                    { icon: Users, label: 'Total', value: stats.totalUsers, color: '#60a5fa' },
                    { icon: Clock, label: 'Trials', value: stats.activeTrials, color: '#FFC107' },
                    { icon: AlertTriangle, label: 'Expiring', value: stats.expiringToday, color: '#fb923c' },
                    { icon: XCircle, label: 'Expired', value: stats.expiredTrials, color: '#a1a1aa' },
                    { icon: CreditCard, label: 'Paid', value: stats.paidUsers, color: '#a78bfa' },
                    { icon: Shield, label: 'Staff', value: stats.staffCount, color: '#818cf8' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="admin-stat-card" style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <Icon size={12} style={{ color }} />
                            <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                        </div>
                        <span style={{ color: 'white', fontWeight: 800, fontSize: '20px' }}>
                            {loading ? '…' : value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div className="admin-search" style={{ flex: '1 1 200px' }}>
                    <Search size={14} className="admin-search-icon" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search email, name, role..."
                        className="admin-search-input"
                        style={{ fontSize: '13px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    {['all', 'trial', 'expiring', 'expired', 'paid', 'staff'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            className={`admin-btn ${filterStatus === f ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                            style={{ fontSize: '11px', padding: '5px 10px', textTransform: 'capitalize' }}
                        >
                            {f === 'all' ? 'All' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
                Showing {filteredUsers.length} of {users.length} users
                {search && ` matching "${search}"`}
            </p>

            {/* User Cards */}
            {loading ? (
                <div className="admin-loader">
                    <div className="admin-spinner" />
                    <span>Loading users...</span>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="admin-empty">
                    <div className="admin-empty-icon">👥</div>
                    <p style={{ fontSize: '14px' }}>
                        {search ? `No users matching "${search}"` : 'No users found'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Column headings. Hidden under 1024px, where rows become cards. */}
                    <div className="admin-user-head">
                        <span />
                        <span>User</span>
                        <span>Tier</span>
                        <span>Last seen</span>
                        <span>Trial</span>
                        <span />
                    </div>
                    {filteredUsers.map((user) => {
                        const sc = statusConfig[user.status] || statusConfig.expired;
                        const rc = roleConfig[user.role] || roleConfig.member;
                        const isExpanded = expandedUser === user.id;
                        const isActioning = actionLoading === user.id;

                        return (
                            <div key={user.id} className="admin-card" style={{ padding: '12px 14px' }}>
                                {/* Main row */}
                                <div
                                    className="admin-user-row"
                                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                >
                                    {/* Avatar */}
                                    <div className="admin-user-avatar" style={{ background: user.avatarColor }}>
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="admin-user-ident">
                                            <span className="admin-user-email" title={user.email}>
                                                {user.email}
                                            </span>
                                            {/* Role badge */}
                                            {user.role !== 'member' && (
                                                <span style={{
                                                    fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                                                    color: rc.color, background: rc.bg,
                                                    border: `1px solid ${rc.color}30`,
                                                }}>
                                                    {rc.label}
                                                </span>
                                            )}
                                            {/* Status badge */}
                                            <span style={{
                                                fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px',
                                                background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                            }}>
                                                {sc.label}
                                            </span>
                                    </div>

                                    {/* Meta columns. At 1024px and up this wrapper uses
                                        display:contents so the three spans become cells of
                                        the row grid and line up with the header. Below
                                        that it becomes a flex line under the email. */}
                                    <div className="admin-user-stats">
                                        <span className="admin-user-stat">{tierLabels[user.tier] || user.tier}</span>
                                        <span className="admin-user-stat">Seen {timeAgo(user.lastSeen)}</span>
                                        <span
                                            className="admin-user-stat"
                                            style={{ color: user.trialDaysLeft <= 2 ? '#fb923c' : '#60a5fa' }}
                                        >
                                            {!user.isPaid && user.trialDaysLeft > 0 ? `${user.trialDaysLeft}d left` : ''}
                                        </span>
                                    </div>

                                    {/* Expand arrow */}
                                    <ChevronDown
                                        size={14}
                                        className="admin-user-chevron"
                                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                    />
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="admin-user-detail">
                                        {/* Detail grid */}
                                        <div className="admin-user-detail-grid">
                                            <div className="admin-user-detail-field">
                                                <Mail size={11} />
                                                <span className="admin-user-detail-label">Email</span>
                                                <span className="admin-user-detail-value" title={user.email}>{user.email}</span>
                                                {user.emailConfirmed
                                                    ? <CheckCircle2 size={11} style={{ color: '#22c55e', flexShrink: 0 }} />
                                                    : <XCircle size={11} style={{ color: '#f87171', flexShrink: 0 }} />}
                                            </div>

                                            <div className="admin-user-detail-field">
                                                <Phone size={11} />
                                                <span className="admin-user-detail-label">Phone</span>
                                                <span className="admin-user-detail-value" style={{ color: user.phone ? '#d1d5db' : '#6b7280' }}>
                                                    {user.phone || 'none'}
                                                </span>
                                                {/* A number is not permission. Only a ticked consent box plus
                                                    the 21+ confirmation makes someone textable. */}
                                                {user.phone && (
                                                    <span style={{
                                                        flexShrink: 0, fontSize: '9px', fontWeight: 700,
                                                        padding: '1px 5px', borderRadius: '4px',
                                                        color: user.smsConsent ? '#22c55e' : '#f87171',
                                                        background: user.smsConsent ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                                    }}>
                                                        {user.smsConsent ? 'SMS OK' : 'NO CONSENT'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="admin-user-detail-field">
                                                <Calendar size={11} />
                                                <span className="admin-user-detail-label">Joined</span>
                                                <span className="admin-user-detail-value">{formatDate(user.createdAt)}</span>
                                            </div>

                                            <div className="admin-user-detail-field">
                                                <Eye size={11} />
                                                <span className="admin-user-detail-label">Last seen</span>
                                                <span className="admin-user-detail-value">{timeAgo(user.lastSeen)}</span>
                                            </div>

                                            <div className="admin-user-detail-field">
                                                <LogIn size={11} />
                                                <span className="admin-user-detail-label">Last sign-in</span>
                                                <span className="admin-user-detail-value">{timeAgo(user.lastSignIn)}</span>
                                            </div>

                                            {!user.isPaid && (
                                                <div className="admin-user-detail-field">
                                                    <Clock size={11} />
                                                    <span className="admin-user-detail-label">Trial</span>
                                                    <span className="admin-user-detail-value" style={{ color: user.trialDaysLeft > 2 ? '#60a5fa' : user.trialDaysLeft > 0 ? '#fb923c' : '#a1a1aa' }}>
                                                        {user.trialDaysLeft > 0 ? `${user.trialDaysLeft}d left` : 'Expired'}
                                                        {user.trialBonusDays > 0 && ` (+${user.trialBonusDays} bonus)`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {user.notes && (
                                            <div style={{ marginBottom: '12px', fontSize: '11px', color: '#9ca3af', background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '8px', whiteSpace: 'pre-line' }}>
                                                📝 {user.notes}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            {isActioning && (
                                                <Loader2 size={14} style={{ color: '#FFC107', animation: 'spin 1s linear infinite' }} />
                                            )}

                                            {!user.emailConfirmed && (
                                                <button
                                                    onClick={() => handleAction(user.id, 'confirmEmail', '')}
                                                    className="admin-btn"
                                                    style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(106,0,255,0.1)', color: '#FFC107', border: '1px solid rgba(106,0,255,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    disabled={isActioning}
                                                >
                                                    <CheckCircle2 size={12} /> Confirm Email
                                                </button>
                                            )}

                                            {/* Role selector — super admin only */}
                                            {isSuperAdmin() && (
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value && e.target.value !== user.role) {
                                                                handleAction(user.id, 'setRole', e.target.value);
                                                            }
                                                        }}
                                                        className="admin-input"
                                                        style={{ fontSize: '11px', padding: '4px 8px', paddingRight: '20px', width: 'auto', minWidth: '80px', cursor: 'pointer', appearance: 'none' }}
                                                        value={user.role}
                                                        disabled={isActioning}
                                                    >
                                                        <option value="member">Role: Member</option>
                                                        <option value="staff">Role: Staff</option>
                                                        <option value="admin">Role: Admin</option>
                                                    </select>
                                                    <ChevronDown size={10} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                                                </div>
                                            )}

                                            {/* Grant trial days */}
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    onChange={(e) => {
                                                        const days = Number(e.target.value);
                                                        if (days > 0) handleAction(user.id, 'grantBonusDays', days);
                                                        e.target.value = '';
                                                    }}
                                                    className="admin-input"
                                                    style={{ fontSize: '11px', padding: '4px 8px', paddingRight: '20px', width: 'auto', minWidth: '70px', cursor: 'pointer', appearance: 'none' }}
                                                    defaultValue=""
                                                    disabled={isActioning}
                                                >
                                                    <option value="" disabled>+ Days</option>
                                                    <option value="3">+3d</option>
                                                    <option value="7">+7d</option>
                                                    <option value="14">+14d</option>
                                                    <option value="30">+30d</option>
                                                </select>
                                                <ChevronDown size={10} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                                            </div>

                                            {/* Change tier */}
                                            <div style={{ position: 'relative' }}>
                                                <select
                                                    onChange={(e) => {
                                                        if (e.target.value) handleAction(user.id, 'changeTier', e.target.value);
                                                        e.target.value = '';
                                                    }}
                                                    className="admin-input"
                                                    style={{ fontSize: '11px', padding: '4px 8px', paddingRight: '20px', width: 'auto', minWidth: '75px', cursor: 'pointer', appearance: 'none' }}
                                                    defaultValue=""
                                                    disabled={isActioning}
                                                >
                                                    <option value="" disabled>Tier</option>
                                                    <option value="free">Free</option>
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="season">Season</option>
                                                </select>
                                                <ChevronDown size={10} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none' }} />
                                            </div>

                                            {/* Add note */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setNoteUserId(noteUserId === user.id ? null : user.id); }}
                                                className="admin-btn admin-btn-secondary"
                                                style={{ fontSize: '11px', padding: '4px 8px' }}
                                                disabled={isActioning}
                                                title="Add note"
                                            >
                                                <StickyNote size={12} />
                                            </button>

                                            {/* Reset trial */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAction(user.id, 'resetTrial', ''); }}
                                                className="admin-btn admin-btn-secondary"
                                                style={{ fontSize: '11px', padding: '4px 8px' }}
                                                disabled={isActioning}
                                                title="Reset trial (7 days)"
                                            >
                                                <RotateCcw size={12} />
                                            </button>

                                            {/* Delete — super admin only */}
                                            {isSuperAdmin() && (
                                                confirmDelete === user.id ? (
                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '10px', color: '#f87171' }}>Confirm?</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleAction(user.id, 'deleteUser', ''); }}
                                                            className="admin-btn"
                                                            style={{ fontSize: '10px', padding: '3px 8px', background: '#ef44441a', color: '#f87171', border: '1px solid #ef44443a' }}
                                                            disabled={isActioning}
                                                        >
                                                            Yes, Delete
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                                                            className="admin-btn admin-btn-secondary"
                                                            style={{ fontSize: '10px', padding: '3px 6px' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(user.id); }}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ fontSize: '11px', padding: '4px 8px', color: '#f87171' }}
                                                        disabled={isActioning}
                                                        title="Delete user (super admin)"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )
                                            )}
                                        </div>

                                        {/* Note input */}
                                        {noteUserId === user.id && (
                                            <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                                                <input
                                                    type="text"
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder="Add a CRM note..."
                                                    className="admin-input"
                                                    style={{ flex: 1, fontSize: '12px' }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') submitNote(); }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                                <button onClick={submitNote} className="admin-btn admin-btn-primary" style={{ fontSize: '11px', padding: '6px 10px' }}>
                                                    <Plus size={12} /> Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
