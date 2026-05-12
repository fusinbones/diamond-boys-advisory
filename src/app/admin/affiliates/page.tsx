'use client';

import { useState, useEffect } from 'react';
import { Users, DollarSign, Settings, Loader2, Search, Pause, Play, Ban, Check, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';

interface Affiliate {
    id: string;
    user_id: string;
    email: string;
    affiliate_code: string;
    commission_rate: number;
    recurrence: string;
    status: string;
    total_earned: number;
    total_paid: number;
    balance: number;
    referral_count: number;
    created_at: string;
}

interface Summary {
    total_affiliates: number;
    active_affiliates: number;
    total_referrals: number;
    total_commission: number;
    total_paid: number;
    total_owed: number;
}

export default function AdminAffiliatesPage() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [editRate, setEditRate] = useState(15);
    const [editRecurrence, setEditRecurrence] = useState('first_only');
    const [saving, setSaving] = useState(false);
    const [payoutId, setPayoutId] = useState<string | null>(null);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('paypal');
    const [payoutNotes, setPayoutNotes] = useState('');
    const [payoutSaving, setPayoutSaving] = useState(false);
    const [message, setMessage] = useState('');

    const fetchData = async () => {
        try {
            const { supabase } = await import('@/lib/supabase');
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            const res = await fetch('/api/admin/affiliates', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAffiliates(data.affiliates || []);
                setSummary(data.summary || null);
            }
        } catch (err) {
            console.error('Fetch affiliates error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const updateAffiliate = async (affiliateId: string, updates: Record<string, unknown>) => {
        setSaving(true);
        try {
            const { supabase } = await import('@/lib/supabase');
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            const res = await fetch('/api/admin/affiliates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ affiliateId, ...updates }),
            });
            if (res.ok) {
                const data = await res.json();
                setAffiliates(prev => prev.map(a => a.id === affiliateId ? { ...a, ...data.affiliate, balance: (data.affiliate.total_earned - data.affiliate.total_paid) } : a));
                setEditId(null);
                setMessage('Updated successfully');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            console.error('Update affiliate error:', err);
        } finally {
            setSaving(false);
        }
    };

    const recordPayout = async () => {
        if (!payoutId || !payoutAmount || Number(payoutAmount) <= 0) return;
        setPayoutSaving(true);
        try {
            const { supabase } = await import('@/lib/supabase');
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            const res = await fetch('/api/admin/affiliates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    affiliateId: payoutId,
                    amount: Number(payoutAmount),
                    method: payoutMethod,
                    notes: payoutNotes,
                }),
            });
            if (res.ok) {
                setPayoutId(null);
                setPayoutAmount('');
                setPayoutNotes('');
                setMessage('Payout recorded');
                setTimeout(() => setMessage(''), 3000);
                fetchData(); // Refresh all data
            }
        } catch (err) {
            console.error('Record payout error:', err);
        } finally {
            setPayoutSaving(false);
        }
    };

    const toggleStatus = (aff: Affiliate) => {
        const newStatus = aff.status === 'active' ? 'paused' : 'active';
        updateAffiliate(aff.id, { status: newStatus });
    };

    const filtered = affiliates.filter(a =>
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.affiliate_code.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="admin-loader">
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#00e59b' }} />
                <span>Loading affiliates...</span>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={22} style={{ color: '#fbbf24' }} />
                    Affiliate Management
                </h1>
                <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                    Manage affiliate partners, commission rates, and payouts
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '10px', marginBottom: '20px',
                }}>
                    {[
                        { label: 'Total Affiliates', value: summary.total_affiliates.toString(), icon: Users, color: '#60a5fa' },
                        { label: 'Active', value: summary.active_affiliates.toString(), icon: Check, color: '#00e59b' },
                        { label: 'Total Referrals', value: summary.total_referrals.toString(), icon: TrendingUp, color: '#a78bfa' },
                        { label: 'Commission Earned', value: `$${summary.total_commission.toFixed(2)}`, icon: DollarSign, color: '#fbbf24' },
                        { label: 'Total Paid', value: `$${summary.total_paid.toFixed(2)}`, icon: CreditCard, color: '#34d399' },
                        { label: 'Balance Owed', value: `$${summary.total_owed.toFixed(2)}`, icon: AlertCircle, color: summary.total_owed > 0 ? '#f87171' : '#00e59b' },
                    ].map(stat => (
                        <div key={stat.label} className="admin-card" style={{ padding: '14px', textAlign: 'center' }}>
                            <stat.icon size={16} style={{ color: stat.color, margin: '0 auto 6px' }} />
                            <p style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)' }}>
                                {stat.value}
                            </p>
                            <p style={{ color: '#6b7280', fontSize: '10px', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Message banner */}
            {message && (
                <div style={{
                    background: 'rgba(0,229,155,0.08)', border: '1px solid rgba(0,229,155,0.2)',
                    borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                    color: '#00e59b', fontSize: '13px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                    <Check size={14} /> {message}
                </div>
            )}

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by email or code..."
                    className="admin-input"
                    style={{ paddingLeft: '36px', width: '100%' }}
                />
            </div>

            {/* Affiliates Table */}
            {filtered.length === 0 ? (
                <div className="admin-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <Users size={32} style={{ color: '#374151', margin: '0 auto 12px' }} />
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                        {affiliates.length === 0 ? 'No affiliates yet' : 'No results found'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(aff => (
                        <div key={aff.id} className="admin-card" style={{ padding: '16px' }}>
                            {/* Main row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <p style={{ color: 'white', fontSize: '14px', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {aff.email}
                                        </p>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                            textTransform: 'uppercase',
                                            background: aff.status === 'active' ? 'rgba(0,229,155,0.1)' : aff.status === 'paused' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: aff.status === 'active' ? '#00e59b' : aff.status === 'paused' ? '#fbbf24' : '#f87171',
                                        }}>
                                            {aff.status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#6b7280' }}>
                                        <span>Code: <strong style={{ color: '#e5e7eb' }}>{aff.affiliate_code}</strong></span>
                                        <span>Rate: <strong style={{ color: '#fbbf24' }}>{aff.commission_rate}%</strong></span>
                                        <span style={{ textTransform: 'capitalize' }}>{aff.recurrence.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: '#60a5fa', fontSize: '16px', fontWeight: 800, margin: 0 }}>{aff.referral_count}</p>
                                        <p style={{ color: '#6b7280', fontSize: '9px', margin: 0, textTransform: 'uppercase' }}>Referrals</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: '#00e59b', fontSize: '16px', fontWeight: 800, margin: 0 }}>${aff.total_earned.toFixed(2)}</p>
                                        <p style={{ color: '#6b7280', fontSize: '9px', margin: 0, textTransform: 'uppercase' }}>Earned</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ color: '#34d399', fontSize: '16px', fontWeight: 800, margin: 0 }}>${aff.total_paid.toFixed(2)}</p>
                                        <p style={{ color: '#6b7280', fontSize: '9px', margin: 0, textTransform: 'uppercase' }}>Paid</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{
                                            color: aff.balance > 0 ? '#fbbf24' : '#6b7280',
                                            fontSize: '16px', fontWeight: 800, margin: 0,
                                        }}>
                                            ${aff.balance.toFixed(2)}
                                        </p>
                                        <p style={{ color: '#6b7280', fontSize: '9px', margin: 0, textTransform: 'uppercase' }}>Balance</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => {
                                            if (editId === aff.id) {
                                                setEditId(null);
                                            } else {
                                                setEditId(aff.id);
                                                setEditRate(aff.commission_rate);
                                                setEditRecurrence(aff.recurrence);
                                            }
                                        }}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ padding: '6px 10px', fontSize: '11px' }}
                                    >
                                        <Settings size={12} />
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(aff)}
                                        className="admin-btn admin-btn-secondary"
                                        style={{ padding: '6px 10px', fontSize: '11px' }}
                                        title={aff.status === 'active' ? 'Pause' : 'Resume'}
                                    >
                                        {aff.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
                                    </button>
                                    {aff.status !== 'revoked' && (
                                        <button
                                            onClick={() => updateAffiliate(aff.id, { status: 'revoked' })}
                                            className="admin-btn admin-btn-secondary"
                                            style={{ padding: '6px 10px', fontSize: '11px', color: '#f87171' }}
                                            title="Revoke"
                                        >
                                            <Ban size={12} />
                                        </button>
                                    )}
                                    {aff.balance > 0 && (
                                        <button
                                            onClick={() => {
                                                setPayoutId(aff.id);
                                                setPayoutAmount(aff.balance.toFixed(2));
                                            }}
                                            className="admin-btn admin-btn-primary"
                                            style={{ padding: '6px 12px', fontSize: '11px' }}
                                        >
                                            <DollarSign size={12} /> Pay
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Edit panel */}
                            {editId === aff.id && (
                                <div style={{
                                    marginTop: '12px', paddingTop: '12px',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap',
                                }}>
                                    <div>
                                        <label className="admin-label" style={{ marginBottom: '4px' }}>Commission Rate</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="range"
                                                min={1}
                                                max={50}
                                                value={editRate}
                                                onChange={e => setEditRate(Number(e.target.value))}
                                                style={{ width: '120px', accentColor: '#fbbf24' }}
                                            />
                                            <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 800, minWidth: '40px' }}>
                                                {editRate}%
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="admin-label" style={{ marginBottom: '4px' }}>Recurrence</label>
                                        <select
                                            value={editRecurrence}
                                            onChange={e => setEditRecurrence(e.target.value)}
                                            className="admin-input"
                                            style={{ padding: '6px 10px', fontSize: '12px', minWidth: '130px' }}
                                        >
                                            <option value="first_only">First Only</option>
                                            <option value="recurring">Recurring</option>
                                            <option value="lifetime">Lifetime</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => updateAffiliate(aff.id, { commission_rate: editRate, recurrence: editRecurrence })}
                                        disabled={saving}
                                        className="admin-btn admin-btn-primary"
                                        style={{ padding: '6px 16px', fontSize: '12px' }}
                                    >
                                        {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Payout Modal */}
            {payoutId && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px',
                }} onClick={() => setPayoutId(null)}>
                    <div
                        className="admin-card"
                        style={{ maxWidth: '400px', width: '100%', padding: '24px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={18} style={{ color: '#fbbf24' }} />
                            Record Payout
                        </h3>
                        <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '16px' }}>
                            For: {affiliates.find(a => a.id === payoutId)?.email}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label className="admin-label">Amount ($)</label>
                                <input
                                    type="number"
                                    value={payoutAmount}
                                    onChange={e => setPayoutAmount(e.target.value)}
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                    step="0.01"
                                    min="0.01"
                                />
                            </div>
                            <div>
                                <label className="admin-label">Method</label>
                                <select
                                    value={payoutMethod}
                                    onChange={e => setPayoutMethod(e.target.value)}
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                >
                                    <option value="paypal">PayPal</option>
                                    <option value="venmo">Venmo</option>
                                    <option value="cashapp">Cash App</option>
                                    <option value="zelle">Zelle</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="admin-label">Notes (optional)</label>
                                <input
                                    type="text"
                                    value={payoutNotes}
                                    onChange={e => setPayoutNotes(e.target.value)}
                                    className="admin-input"
                                    style={{ width: '100%' }}
                                    placeholder="e.g. PayPal txn ID"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button
                                onClick={() => setPayoutId(null)}
                                className="admin-btn admin-btn-secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={recordPayout}
                                disabled={payoutSaving || !payoutAmount || Number(payoutAmount) <= 0}
                                className="admin-btn admin-btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                {payoutSaving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                                {payoutSaving ? 'Recording...' : 'Record Payout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
