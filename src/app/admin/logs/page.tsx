'use client';

import { useState, useEffect } from 'react';
import { History, Download, Calendar, Filter, TrendingUp, Target, AlertCircle } from 'lucide-react';
import type { Pick } from '@/lib/api-sports-types';

export default function LogsPage() {
    const [picks, setPicks] = useState<Pick[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [resultFilter, setResultFilter] = useState('all');

    useEffect(() => {
        fetchPicks();
    }, [dateFrom, dateTo, resultFilter]);

    const fetchPicks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '200' });
            if (dateFrom) params.set('from', dateFrom);
            if (dateTo) params.set('to', dateTo);
            if (resultFilter !== 'all') params.set('result', resultFilter);

            const res = await fetch(`/api/admin/picks?${params}`);
            const data = await res.json();
            setPicks(data.picks || []);
        } catch {
            // Silent fail, show empty
        } finally {
            setLoading(false);
        }
    };

    // Performance stats
    const settled = picks.filter(p => p.result === 'hit' || p.result === 'miss');
    const hits = picks.filter(p => p.result === 'hit').length;
    const misses = picks.filter(p => p.result === 'miss').length;
    const pending = picks.filter(p => p.result === 'pending').length;
    const hitRate = settled.length > 0 ? Math.round((hits / settled.length) * 100) : 0;
    const avgConf = picks.length > 0 ? Math.round(picks.reduce((sum, p) => sum + p.confidence, 0) / picks.length) : 0;

    const exportCSV = () => {
        const headers = ['Date', 'Away', 'Home', 'Pick', 'Type', 'Confidence', 'Reason', 'Notes', 'Result'];
        const rows = picks.map(p => [
            p.game_date, p.away_team, p.home_team, p.pick_team, p.pick_type,
            `${p.confidence}%`, `"${(p.reason || '').replace(/"/g, '""')}"`,
            `"${(p.notes || '').replace(/"/g, '""')}"`, p.result,
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diamond-boys-picks-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                        📊 Pick Logs
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>Track performance and export history</p>
                </div>
                <button onClick={exportCSV} disabled={picks.length === 0} className="admin-btn admin-btn-primary" style={{ opacity: picks.length === 0 ? 0.5 : 1 }}>
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Performance Summary */}
            <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
                <div className="admin-stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Target size={14} style={{ color: '#00e59b' }} />
                        <span className="admin-stat-label">Hit Rate</span>
                    </div>
                    <div className="admin-stat-value" style={{ color: hitRate >= 55 ? '#00e59b' : hitRate >= 45 ? '#fbbf24' : '#f87171' }}>
                        {hitRate}%
                    </div>
                    <div style={{ color: '#4b5563', fontSize: '11px' }}>{hits}W - {misses}L</div>
                </div>
                <div className="admin-stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <History size={14} style={{ color: '#a78bfa' }} />
                        <span className="admin-stat-label">Total Picks</span>
                    </div>
                    <div className="admin-stat-value">{picks.length}</div>
                    <div style={{ color: '#4b5563', fontSize: '11px' }}>{pending} pending</div>
                </div>
                <div className="admin-stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <TrendingUp size={14} style={{ color: '#fbbf24' }} />
                        <span className="admin-stat-label">Avg Confidence</span>
                    </div>
                    <div className="admin-stat-value">{avgConf}%</div>
                </div>
                <div className="admin-stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <TrendingUp size={14} style={{ color: '#60a5fa' }} />
                        <span className="admin-stat-label">Settled</span>
                    </div>
                    <div className="admin-stat-value">{settled.length}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="admin-card" style={{ marginBottom: '16px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <Filter size={14} style={{ color: '#6b7280' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} style={{ color: '#4b5563' }} />
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="admin-input" style={{ width: '140px', padding: '6px 10px', fontSize: '12px' }} />
                        <span style={{ color: '#4b5563' }}>to</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="admin-input" style={{ width: '140px', padding: '6px 10px', fontSize: '12px' }} />
                    </div>
                    <select value={resultFilter} onChange={e => setResultFilter(e.target.value)} className="admin-select" style={{ width: '120px', padding: '6px 10px', fontSize: '12px' }}>
                        <option value="all">All Results</option>
                        <option value="hit">Hits</option>
                        <option value="miss">Misses</option>
                        <option value="pending">Pending</option>
                        <option value="push">Push</option>
                    </select>
                    {(dateFrom || dateTo || resultFilter !== 'all') && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); setResultFilter('all'); }} className="admin-btn admin-btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Picks History Table */}
            {loading ? (
                <div className="admin-loader"><div className="admin-spinner" /> Loading logs...</div>
            ) : picks.length === 0 ? (
                <div className="admin-empty">
                    <History size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <p>No picks found for the selected filters.</p>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Matchup</th>
                                <th>Pick</th>
                                <th>Type</th>
                                <th>Conf.</th>
                                <th>Reason</th>
                                <th>By</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {picks.map((pick) => (
                                <tr key={pick.id}>
                                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{pick.game_date}</td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{pick.away_team} @ {pick.home_team}</div>
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>{pick.pick_team}</td>
                                    <td style={{ fontSize: '12px' }}>{pick.pick_type}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <div className="admin-confidence-bar">
                                                <div className="admin-confidence-fill" style={{
                                                    width: `${pick.confidence}%`,
                                                    background: pick.confidence >= 80 ? '#00e59b' : pick.confidence >= 60 ? '#fbbf24' : '#f87171',
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '10px', color: '#6b7280' }}>{pick.confidence}%</span>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>{pick.reason}</td>
                                    <td style={{ fontSize: '11px', color: '#6b7280' }}>{pick.created_by?.split('@')[0]}</td>
                                    <td><span className={`admin-badge-${pick.result}`}>{pick.result}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
