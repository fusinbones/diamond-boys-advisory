'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';
import {
    ClipboardList,
    Plus,
    Save,
    Trash2,
    Edit3,
    Check,
    X,
    Loader2,
    AlertCircle,
    Send,
    Clock,
    Sparkles,
} from 'lucide-react';
import type { Pick, Game } from '@/lib/api-sports-types';

interface DiscordChannel {
    id: string;
    name: string;
}

export default function PicksPage() {
    const { user } = useAdminAuth();
    const searchParams = useSearchParams();
    const [picks, setPicks] = useState<Pick[]>([]);
    const [todaysGames, setTodaysGames] = useState<Game[]>([]);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [posting, setPosting] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pre-fill from Quick Pick URL params
    const urlAway = searchParams.get('away') || '';
    const urlHome = searchParams.get('home') || '';
    const urlDate = searchParams.get('date') || '';

    // Form state
    const [form, setForm] = useState({
        home_team: '',
        away_team: '',
        pick_type: 'ML',
        pick_team: '',
        pick_value: '',
        confidence: 75,
        reason: '',
        notes: '',
        game_date: new Date().toISOString().split('T')[0],
        // Discord fields
        unit_size: 1,
        discord_channel_id: '',
        post_mode: 'now' as 'now' | 'schedule' | 'none',
        discord_post_at: '',
    });

    // Auto-open form if Quick Pick params are present
    useEffect(() => {
        if (urlAway || urlHome) {
            setForm(prev => ({
                ...prev,
                away_team: urlAway || prev.away_team,
                home_team: urlHome || prev.home_team,
                game_date: urlDate || prev.game_date,
            }));
            setShowForm(true);
        }
    }, [urlAway, urlHome, urlDate]);

    useEffect(() => {
        fetchPicks();
        fetchTodaysGames();
        fetchChannels();
    }, []);

    const fetchPicks = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/admin/picks?from=${today}&limit=50`);
            const data = await res.json();
            setPicks(data.picks || []);
        } catch {
            setError('Failed to load picks');
        } finally {
            setLoading(false);
        }
    };

    const fetchTodaysGames = async () => {
        try {
            const res = await fetch('/api/admin/games');
            const data = await res.json();
            setTodaysGames(data.games || []);
        } catch {
            // Non-critical
        }
    };

    const fetchChannels = async () => {
        try {
            const res = await fetch('/api/admin/discord/channels');
            const data = await res.json();
            setChannels(data.channels || []);
            // Default to first channel
            if (data.channels?.length > 0 && !form.discord_channel_id) {
                setForm(prev => ({ ...prev, discord_channel_id: data.channels[0].id }));
            }
        } catch {
            // Discord not configured — that's ok
        }
    };

    const selectGame = (game: Game) => {
        setForm(prev => ({
            ...prev,
            away_team: game.teams.away.name,
            home_team: game.teams.home.name,
            game_date: game.date?.split('T')[0] || prev.game_date,
        }));
    };

    const savePick = async () => {
        setSaving(true);
        setError('');
        try {
            const body: Record<string, unknown> = {
                home_team: form.home_team,
                away_team: form.away_team,
                pick_type: form.pick_type,
                pick_team: form.pick_team,
                pick_value: form.pick_value,
                confidence: form.confidence,
                reason: form.reason,
                notes: form.notes,
                game_date: form.game_date,
                unit_size: form.unit_size,
                discord_channel_id: form.discord_channel_id || null,
                discord_post_at: form.post_mode === 'schedule' ? form.discord_post_at : null,
                discord_posted: false,
                created_by: user?.email || 'unknown',
                game_id: null,
                result: 'pending',
            };

            const res = await fetch('/api/admin/picks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const savedPick = data.pick;
            setPicks([savedPick, ...picks]);
            setShowForm(false);
            resetForm();

            // If "Post Now" mode, immediately post to Discord
            if (form.post_mode === 'now' && form.discord_channel_id && savedPick.id) {
                await postToDiscord(savedPick.id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const postToDiscord = async (pickId: string) => {
        setPosting(pickId);
        setError('');
        try {
            const res = await fetch('/api/admin/discord/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pickId }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Update local state
            setPicks(prev =>
                prev.map(p => p.id === pickId ? { ...p, discord_posted: true, discord_message_id: data.messageId } : p)
            );
            setSuccess('Pick posted to Discord! ✅');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to post to Discord');
        } finally {
            setPosting(null);
        }
    };

    const deletePick = async (id: string) => {
        try {
            await fetch(`/api/admin/picks/${id}`, { method: 'DELETE' });
            setPicks(picks.filter(p => p.id !== id));
        } catch {
            setError('Failed to delete');
        }
    };

    const updateResult = async (id: string, result: string) => {
        try {
            const res = await fetch(`/api/admin/picks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result }),
            });
            const data = await res.json();
            if (data.pick) {
                setPicks(picks.map(p => p.id === id ? data.pick : p));
            }
            setEditingId(null);
        } catch {
            setError('Failed to update');
        }
    };

    const resetForm = () => {
        setForm({
            home_team: '', away_team: '', pick_type: 'ML', pick_team: '', pick_value: '',
            confidence: 75, reason: '', notes: '', game_date: new Date().toISOString().split('T')[0],
            unit_size: 1, discord_channel_id: channels[0]?.id || '', post_mode: 'now', discord_post_at: '',
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
                        📋 Pick Entry
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px' }}>Enter picks and publish to Discord</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="admin-btn admin-btn-primary">
                    <Plus size={16} /> New Pick
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} style={{ color: '#f87171' }} />
                    <span style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</span>
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={14} /></button>
                </div>
            )}
            {success && (
                <div style={{ background: 'rgba(0,229,155,0.08)', border: '1px solid rgba(0,229,155,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} style={{ color: '#00e59b' }} />
                    <span style={{ color: '#6ee7b7', fontSize: '13px' }}>{success}</span>
                </div>
            )}

            {/* ═══ NEW PICK FORM ═══ */}
            {showForm && (
                <div className="admin-card" style={{ marginBottom: '20px' }}>
                    <div className="admin-card-title" style={{ marginBottom: '16px' }}>
                        <ClipboardList size={16} style={{ color: '#00e59b' }} />
                        New Pick
                    </div>

                    {/* Quick Game Selector */}
                    {todaysGames.length > 0 && !form.away_team && (
                        <div style={{ marginBottom: '16px' }}>
                            <label className="admin-label">Quick Select — Today&apos;s Games</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '2px' }}>
                                {todaysGames.filter(g => g.status.short === 'NS').map(game => (
                                    <button
                                        key={game.id}
                                        onClick={() => selectGame(game)}
                                        className="admin-game-select-card"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={game.teams.away.logo} alt="" />
                                        <span style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 600 }}>{game.teams.away.name}</span>
                                        <span style={{ color: '#4b5563', fontSize: '11px' }}>@</span>
                                        <span style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 600 }}>{game.teams.home.name}</span>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={game.teams.home.logo} alt="" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected game */}
                    {form.away_team && form.home_team && (
                        <div style={{ background: 'rgba(0,229,155,0.06)', border: '1px solid rgba(0,229,155,0.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#00e59b', fontSize: '13px', fontWeight: 600 }}>
                                {form.away_team} @ {form.home_team}
                            </span>
                            <button onClick={() => setForm({ ...form, away_team: '', home_team: '' })} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' }}>
                                Change
                            </button>
                        </div>
                    )}

                    {/* Row 1: Pick Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {!form.away_team && (
                            <>
                                <div>
                                    <label className="admin-label">Away Team</label>
                                    <input value={form.away_team} onChange={e => setForm({ ...form, away_team: e.target.value })} className="admin-input" placeholder="e.g. NY Yankees" />
                                </div>
                                <div>
                                    <label className="admin-label">Home Team</label>
                                    <input value={form.home_team} onChange={e => setForm({ ...form, home_team: e.target.value })} className="admin-input" placeholder="e.g. Boston Red Sox" />
                                </div>
                            </>
                        )}
                        <div>
                            <label className="admin-label">Pick Type</label>
                            <select value={form.pick_type} onChange={e => setForm({ ...form, pick_type: e.target.value })} className="admin-select">
                                <option value="ML">Moneyline</option>
                                <option value="O/U">Over/Under</option>
                                <option value="Run Line">Run Line</option>
                                <option value="Prop">Prop</option>
                            </select>
                        </div>
                        <div>
                            <label className="admin-label">Pick (Team / Side)</label>
                            <input value={form.pick_team} onChange={e => setForm({ ...form, pick_team: e.target.value })} className="admin-input" placeholder="e.g. Yankees ML or Over 8.5" />
                        </div>
                        <div>
                            <label className="admin-label">Game Date</label>
                            <input type="date" value={form.game_date} onChange={e => setForm({ ...form, game_date: e.target.value })} className="admin-input" />
                        </div>
                    </div>

                    {/* Row 2: Confidence + Units */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                        <div>
                            <label className="admin-label">Confidence ({form.confidence}%)</label>
                            <input type="range" min={10} max={100} step={5} value={form.confidence} onChange={e => setForm({ ...form, confidence: Number(e.target.value) })} style={{ width: '100%', accentColor: '#00e59b' }} />
                        </div>
                        <div>
                            <label className="admin-label">Unit Size</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {[1, 2, 3, 4, 5].map(u => (
                                    <button
                                        key={u}
                                        onClick={() => setForm({ ...form, unit_size: u })}
                                        style={{
                                            flex: 1,
                                            padding: '8px 0',
                                            borderRadius: '6px',
                                            border: `1px solid ${form.unit_size === u ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                            background: form.unit_size === u ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.03)',
                                            color: form.unit_size === u ? '#fbbf24' : '#6b7280',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {'🔥'.repeat(u)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Reason + Notes */}
                    <div style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label className="admin-label">Reason</label>
                            {form.pick_team && form.home_team && form.away_team && (
                                <button
                                    onClick={async () => {
                                        setGenerating(true);
                                        try {
                                            const res = await fetch('/api/admin/ai/reason', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    awayTeam: form.away_team,
                                                    homeTeam: form.home_team,
                                                    pickTeam: form.pick_team,
                                                    pickType: form.pick_type,
                                                    gameDate: form.game_date,
                                                }),
                                            });
                                            const data = await res.json();
                                            if (data.reason) setForm(prev => ({ ...prev, reason: data.reason }));
                                        } catch { /* ignore */ }
                                        setGenerating(false);
                                    }}
                                    disabled={generating}
                                    className="admin-btn admin-btn-secondary"
                                    style={{ padding: '2px 8px', fontSize: '10px', gap: '3px', marginBottom: '4px' }}
                                >
                                    {generating ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={10} />}
                                    {generating ? 'Generating...' : '✨ Auto-Analyze'}
                                </button>
                            )}
                        </div>
                        <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="admin-textarea" placeholder="e.g. Alt streak + ace on the mound" />
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <label className="admin-label">Notes (optional)</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="admin-textarea" placeholder="Additional context..." style={{ minHeight: '50px' }} />
                    </div>

                    {/* ═══ DISCORD SECTION ═══ */}
                    <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(88,101,242,0.06)', border: '1px solid rgba(88,101,242,0.15)', borderRadius: '10px' }}>
                        <div style={{ color: '#7289da', fontSize: '12px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Send size={14} />
                            Discord Posting
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {/* Channel Picker */}
                            <div>
                                <label className="admin-label">Channel</label>
                                {channels.length > 0 ? (
                                    <select
                                        value={form.discord_channel_id}
                                        onChange={e => setForm({ ...form, discord_channel_id: e.target.value })}
                                        className="admin-select"
                                    >
                                        {channels.map(ch => (
                                            <option key={ch.id} value={ch.id}>#{ch.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div style={{ color: '#4b5563', fontSize: '11px', padding: '8px' }}>
                                        No channels found — check Discord bot config
                                    </div>
                                )}
                            </div>

                            {/* Post Mode */}
                            <div>
                                <label className="admin-label">When to Post</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[
                                        { value: 'now', label: '📤 Now', desc: 'Post on save' },
                                        { value: 'schedule', label: '⏰ Schedule', desc: 'Set time' },
                                        { value: 'none', label: '❌ Skip', desc: 'Don\'t post' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setForm({ ...form, post_mode: opt.value as 'now' | 'schedule' | 'none' })}
                                            style={{
                                                flex: 1,
                                                padding: '6px 4px',
                                                borderRadius: '6px',
                                                border: `1px solid ${form.post_mode === opt.value ? 'rgba(114,137,218,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                                background: form.post_mode === opt.value ? 'rgba(114,137,218,0.12)' : 'rgba(255,255,255,0.03)',
                                                color: form.post_mode === opt.value ? '#7289da' : '#6b7280',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                            }}
                                            title={opt.desc}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Schedule Time (only if schedule mode) */}
                        {form.post_mode === 'schedule' && (
                            <div style={{ marginTop: '12px' }}>
                                <label className="admin-label">Post Time</label>
                                <input
                                    type="datetime-local"
                                    value={form.discord_post_at}
                                    onChange={e => setForm({ ...form, discord_post_at: e.target.value })}
                                    className="admin-input"
                                    style={{ maxWidth: '280px' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Save Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button
                            onClick={savePick}
                            disabled={saving || !form.pick_team || !form.home_team || !form.away_team}
                            className="admin-btn admin-btn-primary"
                            style={{ opacity: (!form.pick_team || !form.home_team || !form.away_team) ? 0.5 : 1 }}
                        >
                            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                            {saving ? 'Saving...' : form.post_mode === 'now' ? 'Save & Post to Discord' : 'Save Pick'}
                        </button>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="admin-btn admin-btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ PICKS LIST ═══ */}
            {loading ? (
                <div className="admin-loader"><div className="admin-spinner" /> Loading picks...</div>
            ) : picks.length === 0 ? (
                <div className="admin-empty">
                    <ClipboardList size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <p>No picks entered for today yet.</p>
                </div>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Game</th>
                            <th>Pick</th>
                            <th>Units</th>
                            <th>Conf.</th>
                            <th>Discord</th>
                            <th>Result</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {picks.map((pick) => (
                            <tr key={pick.id}>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: '12px' }}>{pick.away_team} @ {pick.home_team}</div>
                                    <div style={{ color: '#6b7280', fontSize: '10px' }}>{pick.game_date}</div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 700, color: 'white', fontSize: '12px' }}>{pick.pick_team}</div>
                                    <div style={{ color: '#6b7280', fontSize: '10px' }}>{pick.pick_type}</div>
                                </td>
                                <td style={{ fontSize: '12px' }}>
                                    {'🔥'.repeat(pick.unit_size || 1)}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div className="admin-confidence-bar">
                                            <div className="admin-confidence-fill" style={{
                                                width: `${pick.confidence}%`,
                                                background: pick.confidence >= 80 ? '#00e59b' : pick.confidence >= 60 ? '#fbbf24' : '#f87171',
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '10px', color: '#9ca3af' }}>{pick.confidence}%</span>
                                    </div>
                                </td>
                                <td>
                                    {pick.discord_posted ? (
                                        <span style={{ color: '#00e59b', fontSize: '11px', fontWeight: 600 }}>✅ Posted</span>
                                    ) : pick.discord_post_at ? (
                                        <span style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock size={10} /> Scheduled
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => postToDiscord(pick.id!)}
                                            disabled={posting === pick.id}
                                            className="admin-btn admin-btn-secondary"
                                            style={{ padding: '3px 8px', fontSize: '10px', gap: '3px' }}
                                        >
                                            {posting === pick.id ? (
                                                <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                                            ) : (
                                                <Send size={10} />
                                            )}
                                            Post
                                        </button>
                                    )}
                                </td>
                                <td>
                                    {editingId === pick.id ? (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {['hit', 'miss', 'push'].map(r => (
                                                <button key={r} onClick={() => updateResult(pick.id!, r)} className={`admin-badge-${r === 'hit' ? 'hit' : r === 'miss' ? 'miss' : 'push'}`} style={{ cursor: 'pointer', border: 'none', fontSize: '10px' }}>
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className={`admin-badge-${pick.result}`}>{pick.result}</span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button onClick={() => setEditingId(editingId === pick.id ? null : pick.id!)} className="admin-btn admin-btn-secondary" style={{ padding: '4px 6px' }}>
                                            {editingId === pick.id ? <X size={12} /> : <Edit3 size={12} />}
                                        </button>
                                        <button onClick={() => deletePick(pick.id!)} className="admin-btn admin-btn-danger" style={{ padding: '4px 6px' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
