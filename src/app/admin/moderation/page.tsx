'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    ShieldAlert,
    AlertTriangle,
    Clock,
    Ban,
    VolumeX,
    CheckCircle2,
    XCircle,
    Loader2,
    Eye,
    ChevronDown,
    UserX,
    MessageSquareWarning,
    Filter,
} from 'lucide-react';

interface Report {
    id: string;
    reporter_id: string;
    reporter_email: string;
    reported_user_id: string;
    reported_user_email: string;
    message_id: string | null;
    message_content: string | null;
    reason: string;
    details: string | null;
    status: string;
    resolution: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    created_at: string;
}

interface BanEntry {
    id: string;
    user_id: string;
    action: string;
    reason: string;
    moderator_email: string;
    channel_id: string | null;
    expires_at: string | null;
    is_active: boolean;
    created_at: string;
}

const REASON_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    spam: { label: 'Spam', color: '#fb923c', icon: '📢' },
    harassment: { label: 'Harassment', color: '#f87171', icon: '⚠️' },
    hate_speech: { label: 'Hate Speech', color: '#ef4444', icon: '🚫' },
    inappropriate: { label: 'Inappropriate', color: '#a78bfa', icon: '🔞' },
    impersonation: { label: 'Impersonation', color: '#fbbf24', icon: '🎭' },
    other: { label: 'Other', color: '#6b7280', icon: '📋' },
};

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    ban: { label: 'Banned', color: '#ef4444', icon: '🚫' },
    mute: { label: 'Muted', color: '#fb923c', icon: '🔇' },
    suspend: { label: 'Suspended', color: '#f59e0b', icon: '⏸️' },
    kick: { label: 'Kicked', color: '#a78bfa', icon: '👢' },
    warn: { label: 'Warned', color: '#fbbf24', icon: '⚠️' },
};

export default function ModerationPage() {
    const [activeTab, setActiveTab] = useState<'reports' | 'bans' | 'log'>('reports');
    const [reports, setReports] = useState<Report[]>([]);
    const [bans, setBans] = useState<BanEntry[]>([]);
    const [allBans, setAllBans] = useState<BanEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [expandedReport, setExpandedReport] = useState<string | null>(null);
    const [resolveText, setResolveText] = useState('');

    // Quick action modal state
    const [quickAction, setQuickAction] = useState<{
        userId: string;
        userEmail: string;
        action: string;
    } | null>(null);
    const [quickReason, setQuickReason] = useState('');
    const [quickDuration, setQuickDuration] = useState('60');

    const getAdminEmail = () => {
        try {
            const stored = localStorage.getItem('sb-swbiwmmqsylwdzwjifpf-auth-token');
            if (stored) return JSON.parse(stored)?.user?.email || '';
        } catch { /* empty */ }
        return '';
    };

    const getAdminId = () => {
        try {
            const stored = localStorage.getItem('sb-swbiwmmqsylwdzwjifpf-auth-token');
            if (stored) return JSON.parse(stored)?.user?.id || '';
        } catch { /* empty */ }
        return '';
    };

    const fetchReports = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/moderation?view=reports&status=${statusFilter}`);
            const data = await res.json();
            setReports(data.reports || []);
        } catch (err) { console.error('Reports fetch:', err); }
    }, [statusFilter]);

    const fetchBans = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/moderation?view=bans');
            const data = await res.json();
            setBans(data.bans || []);
        } catch (err) { console.error('Bans fetch:', err); }
    }, []);

    const fetchLog = useCallback(async () => {
        try {
            // Use reports with all statuses for the log view
            const res = await fetch('/api/admin/moderation?view=bans');
            const data = await res.json();
            setAllBans(data.bans || []);
        } catch (err) { console.error('Log fetch:', err); }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchReports(), fetchBans(), fetchLog()]).finally(() => setLoading(false));
    }, [fetchReports, fetchBans, fetchLog]);

    // Quick action execution
    const executeQuickAction = async () => {
        if (!quickAction) return;
        setActionLoading(quickAction.userId);

        try {
            const res = await fetch('/api/admin/moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: quickAction.action,
                    userId: quickAction.userId,
                    reason: quickReason || `${quickAction.action} by admin`,
                    moderatorId: getAdminId(),
                    moderatorEmail: getAdminEmail(),
                    duration: quickDuration,
                }),
            });
            const data = await res.json();
            if (data.error) alert(data.error);
            else {
                setQuickAction(null);
                setQuickReason('');
                fetchBans();
                fetchLog();
            }
        } catch (err) { console.error('Quick action:', err); }
        finally { setActionLoading(null); }
    };

    // Resolve report
    const resolveReport = async (reportId: string, newStatus: string) => {
        setActionLoading(reportId);
        try {
            await fetch('/api/admin/moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resolve_report',
                    reportId,
                    status: newStatus,
                    resolution: resolveText || `${newStatus} by admin`,
                    reviewerId: getAdminId(),
                }),
            });
            setResolveText('');
            setExpandedReport(null);
            fetchReports();
        } catch (err) { console.error('Resolve:', err); }
        finally { setActionLoading(null); }
    };

    // Lift ban
    const liftBan = async (banEntry: BanEntry) => {
        setActionLoading(banEntry.id);
        try {
            const action = banEntry.action === 'ban' ? 'unban' : 'unmute';
            await fetch('/api/admin/moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    userId: banEntry.user_id,
                    moderatorEmail: getAdminEmail(),
                }),
            });
            fetchBans();
        } catch (err) { console.error('Lift ban:', err); }
        finally { setActionLoading(null); }
    };

    const tabs = [
        { id: 'reports' as const, label: 'Reports', count: reports.length, icon: MessageSquareWarning },
        { id: 'bans' as const, label: 'Active Bans', count: bans.length, icon: Ban },
        { id: 'log' as const, label: 'Action Log', count: allBans.length, icon: Clock },
    ];

    if (loading) {
        return (
            <div className="admin-loader" style={{ minHeight: '300px' }}>
                <div className="admin-spinner" />
                <span>Loading moderation data...</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <ShieldAlert size={22} style={{ color: '#f87171' }} /> Moderation Center
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0' }}>
                        Reports, bans, mutes, and moderation actions
                    </p>
                </div>

                {/* Pending reports alert */}
                {reports.length > 0 && statusFilter === 'pending' && (
                    <div style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        animation: 'pulse 2s infinite',
                    }}>
                        <AlertTriangle size={14} style={{ color: '#f87171' }} />
                        <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: 700 }}>
                            {reports.length} pending report{reports.length > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="admin-tabs" style={{ marginBottom: '20px' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
                        {tab.label}
                        {tab.count > 0 && (
                            <span style={{
                                marginLeft: '6px', padding: '1px 6px', borderRadius: '8px',
                                background: tab.id === 'reports' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                                color: tab.id === 'reports' ? '#f87171' : '#6b7280',
                                fontSize: '10px', fontWeight: 700,
                            }}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ REPORTS TAB ═══ */}
            {activeTab === 'reports' && (
                <div>
                    {/* Status filter */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {['pending', 'reviewed', 'actioned', 'dismissed'].map(st => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                style={{
                                    padding: '5px 12px', borderRadius: '8px',
                                    background: statusFilter === st ? 'rgba(0,229,155,0.1)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${statusFilter === st ? 'rgba(0,229,155,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                    color: statusFilter === st ? '#00e59b' : '#6b7280',
                                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                    textTransform: 'capitalize',
                                }}
                            >
                                <Filter size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                                {st}
                            </button>
                        ))}
                    </div>

                    {reports.length === 0 ? (
                        <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <CheckCircle2 size={32} style={{ color: '#00e59b', marginBottom: '12px', opacity: 0.5 }} />
                            <p style={{ color: '#6b7280', fontSize: '14px' }}>No {statusFilter} reports</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {reports.map(report => {
                                const reason = REASON_LABELS[report.reason] || REASON_LABELS.other;
                                const isExpanded = expandedReport === report.id;

                                return (
                                    <div key={report.id} className="admin-card" style={{ padding: '14px 16px' }}>
                                        {/* Report header */}
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '10px' }}
                                            onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                <span style={{ fontSize: '18px' }}>{reason.icon}</span>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>
                                                        {report.reported_user_email || 'Unknown User'}
                                                    </div>
                                                    <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                                        Reported by {report.reporter_email || 'someone'} · {new Date(report.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '6px',
                                                    background: `${reason.color}15`, color: reason.color,
                                                    fontSize: '10px', fontWeight: 700,
                                                }}>{reason.label}</span>
                                                <ChevronDown size={14} style={{ color: '#6b7280', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                                                {report.message_content && (
                                                    <div style={{
                                                        background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                                        padding: '10px 12px', marginBottom: '12px',
                                                        borderLeft: '3px solid rgba(239,68,68,0.3)',
                                                    }}>
                                                        <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Reported Message</div>
                                                        <div style={{ color: '#d1d5db', fontSize: '13px', whiteSpace: 'pre-wrap' }}>{report.message_content}</div>
                                                    </div>
                                                )}
                                                {report.details && (
                                                    <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>
                                                        <strong>Details:</strong> {report.details}
                                                    </div>
                                                )}

                                                {/* Resolution notes */}
                                                <textarea
                                                    value={resolveText}
                                                    onChange={e => setResolveText(e.target.value)}
                                                    placeholder="Resolution notes (optional)..."
                                                    style={{
                                                        width: '100%', padding: '8px 12px', borderRadius: '8px',
                                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                                        color: 'white', fontSize: '12px', resize: 'vertical', minHeight: '60px',
                                                        boxSizing: 'border-box', marginBottom: '10px',
                                                    }}
                                                />

                                                {/* Action buttons */}
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    <button
                                                        onClick={() => resolveReport(report.id, 'dismissed')}
                                                        disabled={actionLoading === report.id}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ fontSize: '11px', padding: '5px 10px' }}
                                                    >
                                                        <XCircle size={12} /> Dismiss
                                                    </button>
                                                    <button
                                                        onClick={() => resolveReport(report.id, 'reviewed')}
                                                        disabled={actionLoading === report.id}
                                                        className="admin-btn admin-btn-secondary"
                                                        style={{ fontSize: '11px', padding: '5px 10px' }}
                                                    >
                                                        <Eye size={12} /> Mark Reviewed
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            resolveReport(report.id, 'actioned');
                                                            setQuickAction({ userId: report.reported_user_id, userEmail: report.reported_user_email, action: 'warn' });
                                                        }}
                                                        disabled={actionLoading === report.id}
                                                        className="admin-btn"
                                                        style={{ fontSize: '11px', padding: '5px 10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
                                                    >
                                                        ⚠️ Warn User
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            resolveReport(report.id, 'actioned');
                                                            setQuickAction({ userId: report.reported_user_id, userEmail: report.reported_user_email, action: 'mute' });
                                                        }}
                                                        disabled={actionLoading === report.id}
                                                        className="admin-btn"
                                                        style={{ fontSize: '11px', padding: '5px 10px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', color: '#fb923c' }}
                                                    >
                                                        <VolumeX size={12} /> Mute
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            resolveReport(report.id, 'actioned');
                                                            setQuickAction({ userId: report.reported_user_id, userEmail: report.reported_user_email, action: 'suspend' });
                                                        }}
                                                        disabled={actionLoading === report.id}
                                                        className="admin-btn"
                                                        style={{ fontSize: '11px', padding: '5px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
                                                    >
                                                        <Clock size={12} /> Suspend
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            resolveReport(report.id, 'actioned');
                                                            setQuickAction({ userId: report.reported_user_id, userEmail: report.reported_user_email, action: 'ban' });
                                                        }}
                                                        disabled={actionLoading === report.id}
                                                        className="admin-btn"
                                                        style={{ fontSize: '11px', padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
                                                    >
                                                        <Ban size={12} /> Ban
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ ACTIVE BANS TAB ═══ */}
            {activeTab === 'bans' && (
                <div>
                    {bans.length === 0 ? (
                        <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <CheckCircle2 size={32} style={{ color: '#00e59b', marginBottom: '12px', opacity: 0.5 }} />
                            <p style={{ color: '#6b7280', fontSize: '14px' }}>No active bans or mutes</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {bans.map(ban => {
                                const actionInfo = ACTION_LABELS[ban.action] || ACTION_LABELS.warn;
                                const isExpired = ban.expires_at && new Date(ban.expires_at) < new Date();

                                return (
                                    <div key={ban.id} className="admin-card" style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '16px' }}>{actionInfo.icon}</span>
                                                <div>
                                                    <div style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>
                                                        {ban.user_id.slice(0, 8)}...
                                                    </div>
                                                    <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                                        {ban.reason} · by {ban.moderator_email || 'System'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '6px',
                                                    background: `${actionInfo.color}15`, color: actionInfo.color,
                                                    fontSize: '10px', fontWeight: 700,
                                                }}>{actionInfo.label}</span>
                                                {ban.expires_at && (
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '6px',
                                                        background: isExpired ? 'rgba(0,229,155,0.1)' : 'rgba(251,191,36,0.1)',
                                                        color: isExpired ? '#00e59b' : '#fbbf24',
                                                        fontSize: '10px', fontWeight: 600,
                                                    }}>
                                                        {isExpired ? 'Expired' : `Until ${new Date(ban.expires_at).toLocaleString()}`}
                                                    </span>
                                                )}
                                                <button
                                                    onClick={() => liftBan(ban)}
                                                    disabled={actionLoading === ban.id}
                                                    className="admin-btn admin-btn-secondary"
                                                    style={{ fontSize: '10px', padding: '3px 8px' }}
                                                >
                                                    {actionLoading === ban.id ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={10} />}
                                                    Lift
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ ACTION LOG TAB ═══ */}
            {activeTab === 'log' && (
                <div>
                    {allBans.length === 0 ? (
                        <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
                            <Clock size={32} style={{ color: '#6b7280', marginBottom: '12px', opacity: 0.5 }} />
                            <p style={{ color: '#6b7280', fontSize: '14px' }}>No moderation actions yet</p>
                        </div>
                    ) : (
                        <div className="admin-card" style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Action</th>
                                        <th>User</th>
                                        <th>Reason</th>
                                        <th>By</th>
                                        <th>Expires</th>
                                        <th>Date</th>
                                        <th>Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allBans.map(ban => {
                                        const actionInfo = ACTION_LABELS[ban.action] || ACTION_LABELS.warn;
                                        return (
                                            <tr key={ban.id}>
                                                <td>
                                                    <span style={{
                                                        padding: '2px 6px', borderRadius: '4px',
                                                        background: `${actionInfo.color}15`, color: actionInfo.color,
                                                        fontSize: '10px', fontWeight: 700,
                                                    }}>{actionInfo.icon} {actionInfo.label}</span>
                                                </td>
                                                <td style={{ fontSize: '11px' }}>{ban.user_id.slice(0, 8)}...</td>
                                                <td style={{ fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {ban.reason}
                                                </td>
                                                <td style={{ fontSize: '11px' }}>{ban.moderator_email || '—'}</td>
                                                <td style={{ fontSize: '11px' }}>
                                                    {ban.expires_at ? new Date(ban.expires_at).toLocaleString() : 'Permanent'}
                                                </td>
                                                <td style={{ fontSize: '11px' }}>
                                                    {new Date(ban.created_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    {ban.is_active
                                                        ? <span style={{ color: '#f87171', fontSize: '10px', fontWeight: 700 }}>● Active</span>
                                                        : <span style={{ color: '#6b7280', fontSize: '10px' }}>● Ended</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ QUICK ACTION MODAL ═══ */}
            {quickAction && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px',
                }}>
                    <div className="admin-card" style={{
                        maxWidth: '420px', width: '100%', padding: '24px',
                    }}>
                        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserX size={18} style={{ color: '#f87171' }} />
                            {quickAction.action.charAt(0).toUpperCase() + quickAction.action.slice(1)} User
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
                            Target: {quickAction.userEmail || quickAction.userId.slice(0, 12) + '...'}
                        </p>

                        <label style={{ display: 'block', color: '#9ca3af', fontSize: '11px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Reason</label>
                        <textarea
                            value={quickReason}
                            onChange={e => setQuickReason(e.target.value)}
                            placeholder="Reason for this action..."
                            style={{
                                width: '100%', padding: '8px 12px', borderRadius: '8px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: 'white', fontSize: '13px', resize: 'vertical', minHeight: '60px',
                                boxSizing: 'border-box', marginBottom: '12px',
                            }}
                        />

                        {(quickAction.action === 'mute' || quickAction.action === 'suspend') && (
                            <>
                                <label style={{ display: 'block', color: '#9ca3af', fontSize: '11px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>
                                    Duration {quickAction.action === 'mute' ? '(minutes)' : '(hours)'}
                                </label>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                    {(quickAction.action === 'mute'
                                        ? [{ label: '5m', val: '5' }, { label: '15m', val: '15' }, { label: '30m', val: '30' }, { label: '1h', val: '60' }, { label: '24h', val: '1440' }]
                                        : [{ label: '1h', val: '1' }, { label: '6h', val: '6' }, { label: '12h', val: '12' }, { label: '24h', val: '24' }, { label: '48h', val: '48' }, { label: '7d', val: '168' }]
                                    ).map(opt => (
                                        <button
                                            key={opt.val}
                                            onClick={() => setQuickDuration(opt.val)}
                                            style={{
                                                padding: '4px 10px', borderRadius: '6px',
                                                background: quickDuration === opt.val ? 'rgba(0,229,155,0.1)' : 'rgba(255,255,255,0.03)',
                                                border: `1px solid ${quickDuration === opt.val ? 'rgba(0,229,155,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                                color: quickDuration === opt.val ? '#00e59b' : '#6b7280',
                                                fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                            }}
                                        >{opt.label}</button>
                                    ))}
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setQuickAction(null); setQuickReason(''); }}
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '12px' }}
                            >Cancel</button>
                            <button
                                onClick={executeQuickAction}
                                disabled={!!actionLoading}
                                className="admin-btn admin-btn-primary"
                                style={{ fontSize: '12px' }}
                            >
                                {actionLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                Confirm {quickAction.action}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
