'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';
import {
    Zap, Save, Trash2, Edit3, Check, X, Loader2, AlertCircle,
    Sparkles, ChevronDown, ChevronUp, Clock, TrendingUp, HelpCircle,
} from 'lucide-react';
import type { Pick } from '@/lib/api-sports-types';

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
    oddsSpread: number;
    bestValue: string | null;
}

type PickStep = 'select_game' | 'select_pick' | 'confirm';

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

export default function PicksPage() {
    const { user } = useAdminAuth();
    const searchParams = useSearchParams();
    const [picks, setPicks] = useState<Pick[]>([]);
    const [games, setGames] = useState<OddsGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPicks, setShowPicks] = useState(true);

    // Quick Pick wizard state
    const [step, setStep] = useState<PickStep>('select_game');
    const [selectedGame, setSelectedGame] = useState<OddsGame | null>(null);
    const [pickType, setPickType] = useState('');
    const [pickTeam, setPickTeam] = useState('');
    const [pickValue, setPickValue] = useState('');
    const [confidence, setConfidence] = useState(75);
    const [unitSize, setUnitSize] = useState(1);
    const [reason, setReason] = useState('');
    const [sportFilter, setSportFilter] = useState('All');

    const urlAway = searchParams.get('away') || '';
    const urlHome = searchParams.get('home') || '';

    useEffect(() => {
        fetchPicks();
        fetchGames();
    }, []);

    // If URL has game params, find & select it
    useEffect(() => {
        if (urlAway && urlHome && games.length > 0) {
            const match = games.find(g =>
                g.awayTeam.toLowerCase().includes(urlAway.toLowerCase()) &&
                g.homeTeam.toLowerCase().includes(urlHome.toLowerCase())
            );
            if (match) { setSelectedGame(match); setStep('select_pick'); }
        }
    }, [urlAway, urlHome, games]);

    const fetchPicks = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/admin/picks?from=${today}&limit=50`);
            const data = await res.json();
            setPicks(data.picks || []);
        } catch { setError('Failed to load picks'); }
        finally { setLoading(false); }
    };

    const fetchGames = async () => {
        try {
            const res = await fetch('/api/dashboard/games');
            const data = await res.json();
            setGames((data.games || []).filter((g: OddsGame & { isCompleted?: boolean }) => !g.isCompleted));
        } catch { /* non-critical */ }
    };

    const selectQuickPick = (game: OddsGame, type: string, team: string, value: string) => {
        setSelectedGame(game);
        setPickType(type);
        setPickTeam(team);
        setPickValue(value);
        // Auto-calculate confidence from odds divergence
        const conf = Math.min(95, Math.max(55, 60 + game.oddsSpread));
        setConfidence(conf);
        setStep('confirm');
    };

    const savePick = async () => {
        if (!selectedGame) return;
        setSaving(true);
        setError('');
        try {
            const body = {
                home_team: selectedGame.homeTeam,
                away_team: selectedGame.awayTeam,
                pick_type: pickType,
                pick_team: pickTeam,
                pick_value: pickValue,
                confidence,
                reason,
                notes: '',
                game_date: new Date().toISOString().split('T')[0],
                unit_size: unitSize,
                created_by: user?.email || 'admin',
                game_id: selectedGame.id,
                result: 'pending',
                source: 'manual',
                sport: selectedGame.sport,
                odds_at_pick: {
                    moneyline: selectedGame.moneyline,
                    spread: selectedGame.spread,
                    total: selectedGame.total,
                    timestamp: new Date().toISOString(),
                },
            };

            const res = await fetch('/api/admin/picks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            setPicks([data.pick, ...picks]);
            setSuccess(`✅ ${pickTeam} pick saved!`);
            resetWizard();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally { setSaving(false); }
    };

    const autoGenerateReason = async () => {
        if (!selectedGame) return;
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/ai/reason', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    awayTeam: selectedGame.awayTeam,
                    homeTeam: selectedGame.homeTeam,
                    pickTeam,
                    pickType,
                    gameDate: new Date().toISOString().split('T')[0],
                }),
            });
            const data = await res.json();
            if (data.reason) setReason(data.reason);
        } catch { /* ignore */ }
        setGenerating(false);
    };

    const deletePick = async (id: string) => {
        try {
            await fetch(`/api/admin/picks/${id}`, { method: 'DELETE' });
            setPicks(picks.filter(p => p.id !== id));
        } catch { setError('Failed to delete'); }
    };

    const updateResult = async (id: string, result: string) => {
        try {
            const res = await fetch(`/api/admin/picks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ result }),
            });
            const data = await res.json();
            if (data.pick) setPicks(picks.map(p => p.id === id ? data.pick : p));
            setEditingId(null);
        } catch { setError('Failed to update'); }
    };

    const resetWizard = () => {
        setStep('select_game');
        setSelectedGame(null);
        setPickType('');
        setPickTeam('');
        setPickValue('');
        setConfidence(75);
        setUnitSize(1);
        setReason('');
    };

    const filteredGames = sportFilter === 'All' ? games : games.filter(g => g.sport === sportFilter);
    const sports = [...new Set(games.map(g => g.sport))];

    return (
        <div>
            {/* Alerts */}
            {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                    <span style={{ color: '#fca5a5', fontSize: '13px', flex: 1 }}>{error}</span>
                    <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={14} /></button>
                </div>
            )}
            {success && (
                <div style={{ background: 'rgba(0,229,155,0.08)', border: '1px solid rgba(0,229,155,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={14} style={{ color: '#00e59b' }} />
                    <span style={{ color: '#6ee7b7', fontSize: '13px' }}>{success}</span>
                </div>
            )}

            {/* ═══════════════════════════════════════
               QUICK PICK WIZARD
               ═══════════════════════════════════════ */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(0,229,155,0.04) 0%, rgba(26,39,68,0.3) 100%)',
                border: '1px solid rgba(0,229,155,0.12)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
            }}>
                {/* Wizard header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} style={{ color: '#fbbf24' }} />
                            Quick Pick
                        </h2>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {step === 'select_game' && 'Tap a game to start'}
                            {step === 'select_pick' && 'Choose your pick'}
                            {step === 'confirm' && 'Review & publish'}
                        </p>
                    </div>
                    {/* Step indicators */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {['select_game', 'select_pick', 'confirm'].map((s, i) => (
                            <div key={s} style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: step === s ? '#00e59b' : i < ['select_game', 'select_pick', 'confirm'].indexOf(step) ? '#00e59b' : 'rgba(255,255,255,0.1)',
                                transition: 'background 0.2s',
                            }} />
                        ))}
                    </div>
                </div>

                {/* ═══ STEP 1: Select Game ═══ */}
                {step === 'select_game' && (
                    <>
                        {/* Sport filter */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            {['All', ...sports].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSportFilter(s)}
                                    style={{
                                        padding: '4px 12px', borderRadius: '14px', fontSize: '11px', fontWeight: 600,
                                        cursor: 'pointer',
                                        border: sportFilter === s ? '1px solid rgba(0,229,155,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                        background: sportFilter === s ? 'rgba(0,229,155,0.1)' : 'transparent',
                                        color: sportFilter === s ? '#00e59b' : '#6b7280',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Game cards grid */}
                        {games.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280', fontSize: '13px' }}>
                                <Clock size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                                <p>Loading games from Odds API...</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: '8px',
                                maxHeight: '50vh',
                                overflowY: 'auto',
                                padding: '2px',
                            }}>
                                {filteredGames.map(game => (
                                    <button
                                        key={game.id}
                                        onClick={() => { setSelectedGame(game); setStep('select_pick'); }}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: '12px',
                                            padding: '12px 14px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.15s',
                                            position: 'relative',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,155,0.3)'; e.currentTarget.style.background = 'rgba(0,229,155,0.04)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                    >
                                        {/* Sport + Time */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '10px', color: '#6b7280' }}>{game.sportEmoji} {game.sport}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {game.oddsSpread > 30 && (
                                                    <span style={{ fontSize: '8px', fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.12)', padding: '1px 5px', borderRadius: '3px' }}>
                                                        ⚡ VALUE
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>{shortTime(game.gameTime)}</span>
                                            </div>
                                        </div>
                                        {/* Teams + Odds */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{game.awayTeam}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: game.moneyline?.away && game.moneyline.away > 0 ? '#00e59b' : '#f87171' }}>
                                                {game.moneyline ? fmtOdds(game.moneyline.away) : ''}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#b0b8c4' }}>{game.homeTeam}</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: game.moneyline?.home && game.moneyline.home > 0 ? '#00e59b' : '#f87171' }}>
                                                {game.moneyline ? fmtOdds(game.moneyline.home) : ''}
                                            </span>
                                        </div>
                                        {game.total?.overUnder && (
                                            <div style={{ marginTop: '6px', fontSize: '10px', color: '#4b5563' }}>
                                                O/U <span style={{ color: '#60a5fa', fontWeight: 600 }}>{game.total.overUnder}</span>
                                                {game.spread?.line !== null && (
                                                    <span style={{ marginLeft: '10px' }}>
                                                        Spread <span style={{ color: '#94a3b8', fontWeight: 600 }}>{game.spread!.line! > 0 ? `+${game.spread!.line}` : game.spread!.line}</span>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══ STEP 2: Select Pick Type ═══ */}
                {step === 'select_pick' && selectedGame && (
                    <div>
                        {/* Selected game header */}
                        <div style={{
                            background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div>
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>{selectedGame.sportEmoji} {shortTime(selectedGame.gameTime)}</span>
                                <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginTop: '2px' }}>
                                    {selectedGame.awayTeam} <span style={{ color: '#4b5563' }}>@</span> {selectedGame.homeTeam}
                                </p>
                            </div>
                            <button onClick={resetWizard} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '11px' }}>
                                ← Change
                            </button>
                        </div>

                        {/* Pick buttons — big, beautiful, tap-friendly */}
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Moneyline <HelpCircle size={10} style={{ color: '#4b5563' }} />
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                            <button
                                onClick={() => selectQuickPick(selectedGame, 'ML', selectedGame.awayTeam, fmtOdds(selectedGame.moneyline?.away ?? null))}
                                style={{
                                    padding: '16px 12px', borderRadius: '12px', cursor: 'pointer',
                                    background: selectedGame.moneyline?.away && selectedGame.moneyline.away > 0 ? 'rgba(0,229,155,0.08)' : 'rgba(248,113,113,0.06)',
                                    border: `1px solid ${selectedGame.moneyline?.away && selectedGame.moneyline.away > 0 ? 'rgba(0,229,155,0.2)' : 'rgba(248,113,113,0.15)'}`,
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{selectedGame.awayTeam}</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: selectedGame.moneyline?.away && selectedGame.moneyline.away > 0 ? '#00e59b' : '#f87171' }}>
                                    {selectedGame.moneyline ? fmtOdds(selectedGame.moneyline.away) : '—'}
                                </div>
                                <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                                    {selectedGame.moneyline?.away && selectedGame.moneyline.away > 0 ? 'Underdog' : 'Favorite'}
                                </div>
                            </button>
                            <button
                                onClick={() => selectQuickPick(selectedGame, 'ML', selectedGame.homeTeam, fmtOdds(selectedGame.moneyline?.home ?? null))}
                                style={{
                                    padding: '16px 12px', borderRadius: '12px', cursor: 'pointer',
                                    background: selectedGame.moneyline?.home && selectedGame.moneyline.home > 0 ? 'rgba(0,229,155,0.08)' : 'rgba(248,113,113,0.06)',
                                    border: `1px solid ${selectedGame.moneyline?.home && selectedGame.moneyline.home > 0 ? 'rgba(0,229,155,0.2)' : 'rgba(248,113,113,0.15)'}`,
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>{selectedGame.homeTeam}</div>
                                <div style={{ fontSize: '18px', fontWeight: 800, color: selectedGame.moneyline?.home && selectedGame.moneyline.home > 0 ? '#00e59b' : '#f87171' }}>
                                    {selectedGame.moneyline ? fmtOdds(selectedGame.moneyline.home) : '—'}
                                </div>
                                <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>
                                    {selectedGame.moneyline?.home && selectedGame.moneyline.home > 0 ? 'Underdog' : 'Favorite'}
                                </div>
                            </button>
                        </div>

                        {/* Over/Under */}
                        {selectedGame.total && (
                            <>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Over/Under ({selectedGame.total.overUnder}) <HelpCircle size={10} style={{ color: '#4b5563' }} />
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                                    <button
                                        onClick={() => selectQuickPick(selectedGame, 'O/U', `Over ${selectedGame.total!.overUnder}`, fmtOdds(selectedGame.total!.overOdds))}
                                        style={{
                                            padding: '14px 12px', borderRadius: '12px', cursor: 'pointer',
                                            background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>Over {selectedGame.total.overUnder}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#93c5fd', marginTop: '2px' }}>
                                            {fmtOdds(selectedGame.total.overOdds)}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => selectQuickPick(selectedGame, 'O/U', `Under ${selectedGame.total!.overUnder}`, fmtOdds(selectedGame.total!.underOdds))}
                                        style={{
                                            padding: '14px 12px', borderRadius: '12px', cursor: 'pointer',
                                            background: 'rgba(192,132,252,0.06)', border: '1px solid rgba(192,132,252,0.15)', textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc' }}>Under {selectedGame.total.overUnder}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#d8b4fe', marginTop: '2px' }}>
                                            {fmtOdds(selectedGame.total.underOdds)}
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Spread */}
                        {selectedGame.spread && selectedGame.spread.line !== null && (
                            <>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                    Run Line / Spread
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <button
                                        onClick={() => selectQuickPick(selectedGame, 'Run Line', `${selectedGame.awayTeam} ${selectedGame.spread!.line! > 0 ? '+' : ''}${selectedGame.spread!.line}`, fmtOdds(selectedGame.spread!.away))}
                                        style={{
                                            padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db' }}>{selectedGame.awayTeam}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', marginTop: '2px' }}>
                                            {selectedGame.spread.line! > 0 ? `+${selectedGame.spread.line}` : selectedGame.spread.line}
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => selectQuickPick(selectedGame, 'Run Line', `${selectedGame.homeTeam} ${-(selectedGame.spread!.line!) > 0 ? '+' : ''}${-(selectedGame.spread!.line!)}`, fmtOdds(selectedGame.spread!.home))}
                                        style={{
                                            padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db' }}>{selectedGame.homeTeam}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', marginTop: '2px' }}>
                                            {-(selectedGame.spread.line!) > 0 ? `+${-(selectedGame.spread.line!)}` : -(selectedGame.spread.line!)}
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ═══ STEP 3: Confirm & Publish ═══ */}
                {step === 'confirm' && selectedGame && (
                    <div>
                        {/* Pick summary card */}
                        <div style={{
                            background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '16px',
                            marginBottom: '16px', border: '1px solid rgba(0,229,155,0.15)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '10px', color: '#6b7280' }}>{selectedGame.sportEmoji} {selectedGame.sport}</span>
                                <span style={{ fontSize: '10px', color: '#9ca3af' }}>{shortTime(selectedGame.gameTime)}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                                {selectedGame.awayTeam} @ {selectedGame.homeTeam}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: '#00e59b' }}>{pickTeam}</span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 600, color: '#fbbf24',
                                    background: 'rgba(251,191,36,0.12)', padding: '2px 8px', borderRadius: '4px',
                                }}>{pickType}</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#d1d5db' }}>{pickValue}</span>
                            </div>
                        </div>

                        {/* Confidence slider */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                Confidence: <span style={{ color: confidence >= 80 ? '#00e59b' : confidence >= 60 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>{confidence}%</span>
                                <HelpCircle size={10} style={{ color: '#4b5563' }} />
                            </label>
                            <input type="range" min={30} max={98} step={1} value={confidence} onChange={e => setConfidence(Number(e.target.value))}
                                style={{ width: '100%', accentColor: '#00e59b', height: '4px' }} />
                        </div>

                        {/* Unit size */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Unit Size <HelpCircle size={10} style={{ color: '#4b5563' }} />
                            </label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map(u => (
                                    <button
                                        key={u} onClick={() => setUnitSize(u)}
                                        style={{
                                            flex: 1, padding: '10px 0', borderRadius: '8px', cursor: 'pointer',
                                            border: `1px solid ${unitSize === u ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                            background: unitSize === u ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
                                            color: unitSize === u ? '#fbbf24' : '#6b7280',
                                            fontSize: '11px', fontWeight: 700, textAlign: 'center',
                                        }}
                                    >
                                        {u}u {'🔥'.repeat(u)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* AI Reason */}
                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>Analysis (optional)</label>
                                <button
                                    onClick={autoGenerateReason}
                                    disabled={generating}
                                    style={{
                                        background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)',
                                        borderRadius: '6px', padding: '3px 8px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '3px',
                                        color: '#c084fc', fontSize: '10px', fontWeight: 600,
                                    }}
                                >
                                    {generating ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={10} />}
                                    {generating ? 'Thinking...' : '✨ AI Analyze'}
                                </button>
                            </div>
                            <textarea
                                value={reason} onChange={e => setReason(e.target.value)}
                                placeholder="AI will generate analysis, or type your own..."
                                style={{
                                    width: '100%', minHeight: '60px', padding: '10px 12px',
                                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '8px', color: '#d1d5db', fontSize: '12px',
                                    resize: 'vertical', outline: 'none',
                                }}
                            />
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={savePick}
                                disabled={saving}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '10px', cursor: 'pointer',
                                    background: 'linear-gradient(135deg, #00e59b, #00b377)',
                                    border: 'none', color: '#0a0f1e', fontWeight: 800, fontSize: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    opacity: saving ? 0.6 : 1,
                                }}
                            >
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                {saving ? 'Publishing...' : '🚀 Publish Pick'}
                            </button>
                            <button
                                onClick={() => setStep('select_pick')}
                                style={{
                                    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                    color: '#9ca3af', fontSize: '12px', fontWeight: 600,
                                }}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════
               TODAY'S PICKS LIST
               ═══════════════════════════════════════ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📋 Today&apos;s Picks
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>({picks.length})</span>
                </h3>
                <button onClick={() => setShowPicks(!showPicks)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                    {showPicks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {showPicks && (
                loading ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280', fontSize: '13px' }}>
                        <Loader2 size={18} style={{ color: '#00e59b', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                        Loading picks...
                    </div>
                ) : picks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '24px', marginBottom: '6px' }}>🏟️</p>
                        No picks entered yet. Use Quick Pick above!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {picks.map(pick => (
                            <div key={pick.id} style={{
                                background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px', padding: '14px',
                                borderLeft: `3px solid ${pick.result === 'hit' ? '#00e59b' : pick.result === 'miss' ? '#f87171' : pick.result === 'push' ? '#fbbf24' : '#3b82f6'}`,
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                                            {pick.game_date} • {pick.away_team} @ {pick.home_team}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{pick.pick_team}</span>
                                            <span style={{ fontSize: '10px', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>{pick.pick_type}</span>
                                            <span style={{ fontSize: '11px', color: '#fbbf24' }}>{'🔥'.repeat(pick.unit_size || 1)}</span>
                                            <span style={{ fontSize: '10px', color: '#6b7280' }}>{pick.confidence}%</span>
                                        </div>
                                        {pick.reason && (
                                            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px', lineHeight: 1.4 }}>{pick.reason}</p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                        {editingId === pick.id ? (
                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                {['hit', 'miss', 'push'].map(r => (
                                                    <button
                                                        key={r} onClick={() => updateResult(pick.id!, r)}
                                                        style={{
                                                            padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                                                            border: 'none', fontSize: '10px', fontWeight: 600,
                                                            background: r === 'hit' ? 'rgba(0,229,155,0.15)' : r === 'miss' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.15)',
                                                            color: r === 'hit' ? '#00e59b' : r === 'miss' ? '#f87171' : '#fbbf24',
                                                        }}
                                                    >{r}</button>
                                                ))}
                                                <button onClick={() => setEditingId(null)} style={{ padding: '4px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <span style={{
                                                    fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                                    background: pick.result === 'hit' ? 'rgba(0,229,155,0.12)' : pick.result === 'miss' ? 'rgba(248,113,113,0.12)' : pick.result === 'push' ? 'rgba(251,191,36,0.12)' : 'rgba(59,130,246,0.12)',
                                                    color: pick.result === 'hit' ? '#00e59b' : pick.result === 'miss' ? '#f87171' : pick.result === 'push' ? '#fbbf24' : '#60a5fa',
                                                }}>
                                                    {pick.result}
                                                </span>
                                                <button onClick={() => setEditingId(pick.id!)} style={{ padding: '4px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                                                    <Edit3 size={12} />
                                                </button>
                                                <button onClick={() => deletePick(pick.id!)} style={{ padding: '4px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
