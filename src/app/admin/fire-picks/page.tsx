'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/adminAuth';
import {
    Flame, Save, Loader2, AlertCircle, Check, Clock, ChevronDown,
    Calendar, Zap, Trophy, Trash2, Send,
} from 'lucide-react';

interface OddsGame {
    id: string;
    sport: string;
    sportEmoji: string;
    homeTeam: string;
    awayTeam: string;
    gameTime: string;
    moneyline: { home: number | null; away: number | null; bestBook: string } | null;
    spread: { home: number | null; away: number | null; line: number | null; bestBook: string } | null;
    total: { overUnder: number | null; overOdds: number | null; underOdds: number | null; bestBook: string } | null;
}

interface FirePick {
    id: string;
    matchup: string;
    sport: string;
    pick_type: string;
    pick_team: string;
    pick_value: string;
    odds: string | null;
    confidence: number;
    units: number;
    reasoning: string | null;
    pattern_break_game: number;
    scheduled_at: string;
    status: string;
    result: string | null;
    created_at: string;
}

function fmtOdds(p: number | null): string {
    if (p === null) return '—';
    return p > 0 ? `+${p}` : `${p}`;
}

function shortTime(time: string): string {
    try {
        const d = new Date(time);
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
        const t = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
        return `${date} · ${t} ET`;
    } catch { return 'TBD'; }
}

export default function FirePicksPage() {
    const { user } = useAdminAuth();
    const [games, setGames] = useState<OddsGame[]>([]);
    const [firePicks, setFirePicks] = useState<FirePick[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [selectedGame, setSelectedGame] = useState<OddsGame | null>(null);
    const [pickType, setPickType] = useState('ML');
    const [pickTeam, setPickTeam] = useState('');
    const [pickValue, setPickValue] = useState('');
    const [spreadLine, setSpreadLine] = useState('');
    const [odds, setOdds] = useState('');
    const [confidence, setConfidence] = useState(90);
    const [units, setUnits] = useState(3);
    const [reasoning, setReasoning] = useState('');
    const [breakGame, setBreakGame] = useState(7);
    const [scheduleMode, setScheduleMode] = useState<'hours' | 'tomorrow'>('hours');
    const [scheduleHours, setScheduleHours] = useState(2);
    const [scheduleMinutes, setScheduleMinutes] = useState(0);
    const [tomorrowTime, setTomorrowTime] = useState('10:00');

    useEffect(() => {
        fetchGames();
        fetchFirePicks();
    }, []);

    const fetchGames = async () => {
        try {
            const res = await fetch('/api/dashboard/games');
            const data = await res.json();
            setGames((data.games || []).filter((g: OddsGame & { isCompleted?: boolean }) => !g.isCompleted));
        } catch { /* non-critical */ }
        finally { setLoading(false); }
    };

    const fetchFirePicks = async () => {
        try {
            const res = await fetch('/api/admin/fire-picks');
            const data = await res.json();
            setFirePicks(data.firePicks || []);
        } catch { /* non-critical */ }
    };

    const selectGame = (game: OddsGame) => {
        setSelectedGame(game);
        setPickTeam(game.awayTeam);
        setPickValue(`${game.awayTeam} ML ${fmtOdds(game.moneyline?.away ?? null)}`);
        setOdds(fmtOdds(game.moneyline?.away ?? null));
    };

    const getScheduledAt = (): string => {
        if (scheduleMode === 'hours') {
            const d = new Date();
            d.setHours(d.getHours() + scheduleHours);
            d.setMinutes(d.getMinutes() + scheduleMinutes);
            return d.toISOString();
        } else {
            // Tomorrow at specified time in ET
            const now = new Date();
            const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
            const etDate = new Date(etStr);
            etDate.setDate(etDate.getDate() + 1);
            const [h, m] = tomorrowTime.split(':').map(Number);
            etDate.setHours(h, m, 0, 0);
            const offset = etDate.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTime();
            return new Date(now.getTime() + offset).toISOString();
        }
    };

    const handleSave = async () => {
        if (!selectedGame || !pickValue) {
            setError('Select a game and enter the pick value.');
            return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const res = await fetch('/api/admin/fire-picks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: selectedGame.id,
                    matchup: `${selectedGame.awayTeam} @ ${selectedGame.homeTeam}`,
                    sport: selectedGame.sport,
                    pick_type: pickType,
                    pick_team: pickTeam,
                    pick_value: pickValue,
                    odds: odds || null,
                    confidence,
                    units,
                    reasoning: reasoning || null,
                    pattern_break_game: breakGame,
                    scheduled_at: getScheduledAt(),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            setSuccess('🔥 Fire Pick scheduled!');
            setSelectedGame(null);
            setPickValue('');
            setReasoning('');
            fetchFirePicks();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const gradeFirePick = async (id: string, result: 'won' | 'lost' | 'push') => {
        try {
            await fetch('/api/admin/fire-picks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: result, result }),
            });
            fetchFirePicks();
        } catch { /* ignore */ }
    };

    const deleteFirePick = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this fire pick? This cannot be undone.')) return;
        try {
            await fetch(`/api/admin/fire-picks?id=${id}`, {
                method: 'DELETE',
            });
            fetchFirePicks();
        } catch { /* ignore */ }
    };

    const releaseNow = async (id: string) => {
        try {
            await fetch('/api/admin/fire-picks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'revealed', scheduled_at: new Date().toISOString() }),
            });
            fetchFirePicks();
        } catch { /* ignore */ }
    };

    if (!user) return null;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Flame size={22} style={{ color: '#fb923c' }} />
                <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 800 }}>🔥 Fire Picks</h1>
                <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                    {firePicks.length} total
                </span>
            </div>

            {/* Create Fire Pick */}
            <div className="admin-card" style={{ marginBottom: '20px' }}>
                <h2 className="admin-card-title" style={{ marginBottom: '16px' }}>
                    <Zap size={16} style={{ color: '#fbbf24' }} />
                    Schedule New Fire Pick
                </h2>

                {/* Step 1: Select Game */}
                <label className="admin-label">Select Game</label>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px', color: '#6b7280' }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading games...
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px', marginBottom: '16px' }}>
                        {games.map(game => (
                            <button
                                key={game.id}
                                onClick={() => selectGame(game)}
                                style={{
                                    background: selectedGame?.id === game.id ? 'rgba(251,146,60,0.15)' : 'rgba(15,23,42,0.5)',
                                    border: `1px solid ${selectedGame?.id === game.id ? 'rgba(251,146,60,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    color: 'white',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                    {game.sportEmoji} {game.sport} · {shortTime(game.gameTime)}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                    {game.awayTeam} @ {game.homeTeam}
                                </div>
                                <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    {game.moneyline && (
                                        <span>ML: {fmtOdds(game.moneyline.away)} / {fmtOdds(game.moneyline.home)}</span>
                                    )}
                                    {game.spread && (
                                        <span style={{ color: '#a78bfa' }}>
                                            {game.sport === 'MLB' ? 'RL' : 'Spread'}: {game.spread.line != null ? `${game.spread.line > 0 ? '+' : ''}${game.spread.line}` : '—'} ({fmtOdds(game.spread.away)} / {fmtOdds(game.spread.home)})
                                        </span>
                                    )}
                                    {game.total && (
                                        <span style={{ color: '#67e8f9' }}>O/U: {game.total.overUnder ?? '—'}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 2: Pick Details */}
                {selectedGame && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label className="admin-label">Pick Type</label>
                            <select className="admin-select" value={pickType} onChange={e => {
                                const newType = e.target.value;
                                setPickType(newType);
                                // Auto-update pick value to match new type
                                if (selectedGame && pickTeam) {
                                    const isHome = pickTeam === selectedGame.homeTeam;
                                    if (newType === 'ML') {
                                        const ml = isHome ? selectedGame.moneyline?.home : selectedGame.moneyline?.away;
                                        setPickValue(`${pickTeam} ML ${fmtOdds(ml ?? null)}`);
                                        setOdds(fmtOdds(ml ?? null));
                                        setSpreadLine('');
                                    } else if (newType === 'RL') {
                                        const sp = isHome ? selectedGame.spread?.home : selectedGame.spread?.away;
                                        const line = selectedGame.spread?.line;
                                        const displayLine = isHome ? (line ?? 0) : -(line ?? 0);
                                        const lineStr = `${displayLine > 0 ? '+' : ''}${displayLine}`;
                                        setSpreadLine(lineStr);
                                        setPickValue(`${pickTeam} RL ${lineStr} (${fmtOdds(sp ?? null)})`);
                                        setOdds(fmtOdds(sp ?? null));
                                    } else if (newType === 'Spread') {
                                        const sp = isHome ? selectedGame.spread?.home : selectedGame.spread?.away;
                                        const line = selectedGame.spread?.line;
                                        const displayLine = isHome ? (line ?? 0) : -(line ?? 0);
                                        const lineStr = `${displayLine > 0 ? '+' : ''}${displayLine}`;
                                        setSpreadLine(lineStr);
                                        setPickValue(`${pickTeam} ${lineStr} (${fmtOdds(sp ?? null)})`);
                                        setOdds(fmtOdds(sp ?? null));
                                    } else if (newType === 'Total') {
                                        const ou = selectedGame.total?.overUnder;
                                        setPickValue(`Over ${ou ?? ''}`);
                                        setOdds(fmtOdds(selectedGame.total?.overOdds ?? null));
                                    } else {
                                        setPickValue(`${pickTeam} ${newType}`);
                                    }
                                }
                            }}>
                                <option value="ML">Moneyline</option>
                                <option value="RL">Run Line</option>
                                <option value="Spread">Spread</option>
                                <option value="Total">Over/Under</option>
                                <option value="F5">First 5 Innings</option>
                                <option value="Prop">Player Prop</option>
                            </select>
                        </div>
                        <div>
                            <label className="admin-label">Pick Team</label>
                            <select className="admin-select" value={pickTeam} onChange={e => {
                                const newTeam = e.target.value;
                                setPickTeam(newTeam);
                                const isHome = newTeam === selectedGame.homeTeam;
                                if (pickType === 'ML') {
                                    const ml = isHome ? selectedGame.moneyline?.home : selectedGame.moneyline?.away;
                                    setPickValue(`${newTeam} ML ${fmtOdds(ml ?? null)}`);
                                    setOdds(fmtOdds(ml ?? null));
                                } else if (pickType === 'RL') {
                                    const sp = isHome ? selectedGame.spread?.home : selectedGame.spread?.away;
                                    const line = selectedGame.spread?.line;
                                    const displayLine = isHome ? (line ?? 0) : -(line ?? 0);
                                    setPickValue(`${newTeam} RL ${displayLine > 0 ? '+' : ''}${displayLine} (${fmtOdds(sp ?? null)})`);
                                    setOdds(fmtOdds(sp ?? null));
                                } else if (pickType === 'Spread') {
                                    const sp = isHome ? selectedGame.spread?.home : selectedGame.spread?.away;
                                    const line = selectedGame.spread?.line;
                                    const displayLine = isHome ? (line ?? 0) : -(line ?? 0);
                                    setPickValue(`${newTeam} ${displayLine > 0 ? '+' : ''}${displayLine} (${fmtOdds(sp ?? null)})`);
                                    setOdds(fmtOdds(sp ?? null));
                                } else if (pickType === 'Total') {
                                    // Total doesn't change with team
                                } else {
                                    setPickValue(`${newTeam} ${pickType}`);
                                }
                            }}>
                                <option value={selectedGame.awayTeam}>{selectedGame.awayTeam}</option>
                                <option value={selectedGame.homeTeam}>{selectedGame.homeTeam}</option>
                            </select>
                        </div>

                        {/* Line field — only for RL / Spread */}
                        {(pickType === 'RL' || pickType === 'Spread') && (
                            <div>
                                <label className="admin-label">Line (e.g. -1.5, +2.5)</label>
                                <input className="admin-input" value={spreadLine}
                                    onChange={e => {
                                        const newLine = e.target.value;
                                        setSpreadLine(newLine);
                                        // Auto-rebuild pick value display
                                        const prefix = pickType === 'RL' ? 'RL' : '';
                                        const lineDisplay = newLine || '?';
                                        setPickValue(`${pickTeam} ${prefix} ${lineDisplay} (${odds})`.trim());
                                    }}
                                    placeholder="-1.5" />
                            </div>
                        )}

                        <div>
                            <label className="admin-label">Pick Value (displayed)</label>
                            <input className="admin-input" value={pickValue} onChange={e => setPickValue(e.target.value)}
                                placeholder="e.g. Tigers RL -1.5 (+180)" />
                        </div>
                        <div>
                            <label className="admin-label">Odds</label>
                            <input className="admin-input" value={odds} onChange={e => setOdds(e.target.value)}
                                placeholder="-150" />
                        </div>
                        <div>
                            <label className="admin-label">Confidence ({confidence}%)</label>
                            <input type="range" min={50} max={99} value={confidence}
                                onChange={e => setConfidence(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#fbbf24' }} />
                        </div>
                        <div>
                            <label className="admin-label">Units</label>
                            <select className="admin-select" value={units} onChange={e => setUnits(Number(e.target.value))}>
                                {[1, 2, 3, 4, 5].map(u => (
                                    <option key={u} value={u}>{u}u</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="admin-label">Pattern Break Game</label>
                            <select className="admin-select" value={breakGame} onChange={e => setBreakGame(Number(e.target.value))}>
                                {[6, 7, 8, 9, 10].map(g => (
                                    <option key={g} value={g}>Game {g}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Reasoning */}
                {selectedGame && (
                    <div style={{ marginBottom: '16px' }}>
                        <label className="admin-label">Reasoning (displayed to users)</label>
                        <textarea className="admin-textarea" value={reasoning}
                            onChange={e => setReasoning(e.target.value)}
                            placeholder="Why is this a Fire Pick? What pattern breaks here?" />
                    </div>
                )}

                {/* Schedule */}
                {selectedGame && (
                    <div style={{ marginBottom: '16px' }}>
                        <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={13} /> Schedule Drop
                        </label>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                            <button
                                onClick={() => setScheduleMode('hours')}
                                className={`admin-tab ${scheduleMode === 'hours' ? 'active' : ''}`}
                                style={{ flex: '0 0 auto', padding: '6px 14px', fontSize: '12px' }}
                            >In X Hours/Min</button>
                            <button
                                onClick={() => setScheduleMode('tomorrow')}
                                className={`admin-tab ${scheduleMode === 'tomorrow' ? 'active' : ''}`}
                                style={{ flex: '0 0 auto', padding: '6px 14px', fontSize: '12px' }}
                            >Tomorrow At</button>
                        </div>
                        {scheduleMode === 'hours' ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="number" min={0} max={24} value={scheduleHours}
                                    onChange={e => setScheduleHours(Number(e.target.value))}
                                    className="admin-input" style={{ width: '80px' }} />
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>hours</span>
                                <input type="number" min={0} max={59} value={scheduleMinutes}
                                    onChange={e => setScheduleMinutes(Number(e.target.value))}
                                    className="admin-input" style={{ width: '80px' }} />
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>minutes</span>
                            </div>
                        ) : (
                            <input type="time" value={tomorrowTime}
                                onChange={e => setTomorrowTime(e.target.value)}
                                className="admin-input" style={{ maxWidth: '160px' }} />
                        )}
                    </div>
                )}

                {/* Alerts */}
                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: '#fca5a5', fontSize: '12px' }}>
                        <AlertCircle size={14} /> {error}
                    </div>
                )}
                {success && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: '#fb923c', fontSize: '12px' }}>
                        <Check size={14} /> {success}
                    </div>
                )}

                {/* Save Button */}
                {selectedGame && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="admin-btn admin-btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px', background: 'linear-gradient(135deg, #fb923c, #ef4444)' }}
                    >
                        {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Flame size={16} />}
                        {saving ? 'Scheduling...' : '🔥 Schedule Fire Pick'}
                    </button>
                )}
            </div>

            {/* Fire Pick History */}
            <div className="admin-card">
                <h2 className="admin-card-title" style={{ marginBottom: '16px' }}>
                    <Trophy size={16} style={{ color: '#fbbf24' }} />
                    Fire Pick History
                </h2>
                {firePicks.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                        No fire picks yet. Schedule your first one above!
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {firePicks.map(fp => (
                            <div key={fp.id} style={{
                                background: 'rgba(15,23,42,0.5)',
                                border: '1px solid rgba(251,146,60,0.15)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                flexWrap: 'wrap',
                            }}>
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                        <Flame size={13} style={{ color: '#fb923c' }} />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'white' }}>{fp.pick_value}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                        {fp.matchup} · {fp.sport} · Game {fp.pattern_break_game} break
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#4b5563', marginTop: '2px' }}>
                                        Scheduled: {shortTime(fp.scheduled_at)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {fp.status === 'scheduled' && (
                                        <>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                                                <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />Scheduled
                                            </span>
                                            <button onClick={() => releaseNow(fp.id)} className="admin-btn" style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(0,229,155,0.1)', color: '#00e59b', border: '1px solid rgba(0,229,155,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Send size={10} /> Release Now
                                            </button>
                                            <button onClick={() => deleteFirePick(fp.id)} className="admin-btn" style={{ padding: '4px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </>
                                    )}
                                    {fp.status === 'revealed' && (
                                        <>
                                            <button onClick={() => gradeFirePick(fp.id, 'won')} className="admin-btn" style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(0,229,155,0.1)', color: '#00e59b', border: '1px solid rgba(0,229,155,0.2)' }}>Won</button>
                                            <button onClick={() => gradeFirePick(fp.id, 'lost')} className="admin-btn" style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>Lost</button>
                                            <button onClick={() => gradeFirePick(fp.id, 'push')} className="admin-btn" style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>Push</button>
                                            <button onClick={() => deleteFirePick(fp.id)} className="admin-btn" style={{ padding: '4px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', marginLeft: '8px' }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </>
                                    )}
                                    {(fp.status === 'won' || fp.status === 'lost' || fp.status === 'push') && (
                                        <>
                                            <span style={{
                                                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                                color: fp.status === 'won' ? '#00e59b' : fp.status === 'lost' ? '#f87171' : '#fbbf24',
                                                background: fp.status === 'won' ? 'rgba(0,229,155,0.1)' : fp.status === 'lost' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                                            }}>
                                                {fp.status.toUpperCase()}
                                            </span>
                                            <button onClick={() => deleteFirePick(fp.id)} className="admin-btn" style={{ padding: '4px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', marginLeft: '8px' }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
