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
} from 'lucide-react';

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
    paid: { label: 'Paid', bg: 'rgba(0,229,155,0.1)', color: '#00e59b', border: 'rgba(0,229,155,0.2)' },
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
    season: 'Season Pass',
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeTrials: 0, expiredTrials: 0, paidUsers: 0, expiringToday: 0, staffCount: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
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
            const res = await fetch('/api/admin/users', {
                headers: { 'x-admin-email': getAdminEmail() },
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
            const res = await fetch('/api/admin/users', {
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
            <div style={{ marginBottom: '20px' }}>
                <h1 style={{ color: 'white', fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, marginBottom: '4px' }}>
                    👥 User Management & CRM
                </h1>
                <p style={{ color: '#6b7280', fontSize: '13px' }}>
                    Manage accounts, roles, subscriptions, and customer notes
                </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                {[
                    { icon: Users, label: 'Total', value: stats.totalUsers, color: '#60a5fa' },
                    { icon: Clock, label: 'Trials', value: stats.activeTrials, color: '#00e59b' },
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
                    {filteredUsers.map((user) => {
                        const sc = statusConfig[user.status] || statusConfig.expired;
                        const rc = roleConfig[user.role] || roleConfig.member;
                        const isExpanded = expandedUser === user.id;
                        const isActioning = actionLoading === user.id;

                        return (
                            <div key={user.id} className="admin-card" style={{ padding: '12px 14px' }}>
                                {/* Main row */}
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                    onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '50%',
                                        background: user.avatarColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                                    }}>
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
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
                                        <div style={{ fontSize: '10px', color: '#6b7280', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <span>{tierLabels[user.tier] || user.tier}</span>
                                            <span>Seen {timeAgo(user.lastSeen)}</span>
                                            {!user.isPaid && user.trialDaysLeft > 0 && (
                                                <span style={{ color: user.trialDaysLeft <= 2 ? '#fb923c' : '#60a5fa' }}>
                                                    {user.trialDaysLeft}d left
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expand arrow */}
                                    <ChevronDown
                                        size={14}
                                        style={{
                                            color: '#6b7280', flexShrink: 0,
                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s',
                                        }}
                                    />
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                                        {/* Detail grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '11px' }}>
                                                <span style={{ color: '#6b7280' }}>📧 Email: </span>
                                                <span style={{ color: '#d1d5db' }}>{user.email}</span>
                                                {user.emailConfirmed ? (
                                                    <CheckCircle2 size={10} style={{ color: '#00e59b', marginLeft: '4px', verticalAlign: 'middle' }} />
                                                ) : (
                                                    <XCircle size={10} style={{ color: '#f87171', marginLeft: '4px', verticalAlign: 'middle' }} />
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px' }}>
                                                <Calendar size={10} style={{ color: '#6b7280', verticalAlign: 'middle', marginRight: '4px' }} />
                                                <span style={{ color: '#6b7280' }}>Joined: </span>
                                                <span style={{ color: '#d1d5db' }}>{formatDate(user.createdAt)}</span>
                                            </div>
                                            <div style={{ fontSize: '11px' }}>
                                                <Eye size={10} style={{ color: '#6b7280', verticalAlign: 'middle', marginRight: '4px' }} />
                                                <span style={{ color: '#6b7280' }}>Last seen: </span>
                                                <span style={{ color: '#d1d5db' }}>{timeAgo(user.lastSeen)}</span>
                                            </div>
                                            <div style={{ fontSize: '11px' }}>
                                                <Mail size={10} style={{ color: '#6b7280', verticalAlign: 'middle', marginRight: '4px' }} />
                                                <span style={{ color: '#6b7280' }}>Last sign-in: </span>
                                                <span style={{ color: '#d1d5db' }}>{timeAgo(user.lastSignIn)}</span>
                                            </div>
                                            {!user.isPaid && (
                                                <div style={{ fontSize: '11px' }}>
                                                    <Clock size={10} style={{ color: '#6b7280', verticalAlign: 'middle', marginRight: '4px' }} />
                                                    <span style={{ color: '#6b7280' }}>Trial: </span>
                                                    <span style={{ color: user.trialDaysLeft > 2 ? '#60a5fa' : user.trialDaysLeft > 0 ? '#fb923c' : '#a1a1aa' }}>
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
                                                <Loader2 size={14} style={{ color: '#00e59b', animation: 'spin 1s linear infinite' }} />
                                            )}

                                            {/* Role selector — super admin only */}
                                            {isSuperAdmin() && (
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) handleAction(user.id, 'setRole', e.target.value);
                                                            e.target.value = '';
                                                        }}
                                                        className="admin-input"
                                                        style={{ fontSize: '11px', padding: '4px 8px', paddingRight: '20px', width: 'auto', minWidth: '80px', cursor: 'pointer', appearance: 'none' }}
                                                        defaultValue=""
                                                        disabled={isActioning}
                                                    >
                                                        <option value="" disabled>🛡️ Role</option>
                                                        <option value="member">Member</option>
                                                        <option value="staff">Staff Mod</option>
                                                        <option value="admin">Admin</option>
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
