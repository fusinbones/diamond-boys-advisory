'use client';

import { useState, useEffect } from 'react';
import {
    Mic, Loader2, Copy, Check, RefreshCw, Flame,
    AlertCircle, ExternalLink, FileText, Sparkles,
} from 'lucide-react';

interface FirePick {
    id: string;
    matchup: string;
    pick_team: string;
    pick_type: string;
    pick_value: string;
    odds: string | null;
    confidence: number;
}

interface PodcastData {
    content: string;
    picks: FirePick[];
    record: string;
    winPct: string;
    generatedAt: string;
}

export default function PodcastPage() {
    const [data, setData] = useState<PodcastData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [todayPicks, setTodayPicks] = useState<FirePick[]>([]);
    const [checkingPicks, setCheckingPicks] = useState(true);

    // Check if there are fire picks today
    useEffect(() => {
        checkTodayPicks();
    }, []);

    const checkTodayPicks = async () => {
        setCheckingPicks(true);
        try {
            const res = await fetch('/api/admin/fire-picks');
            const result = await res.json();
            if (result.firePicks) {
                const today = new Date().toISOString().split('T')[0];
                const todaysOnes = result.firePicks.filter((fp: Record<string, unknown>) => {
                    const fpDate = (fp.scheduled_at as string)?.split('T')[0];
                    return fpDate === today;
                });
                setTodayPicks(todaysOnes.map((fp: Record<string, unknown>) => ({
                    id: fp.id as string,
                    matchup: fp.matchup as string,
                    pick_team: fp.pick_team as string,
                    pick_type: fp.pick_type as string,
                    pick_value: fp.pick_value as string,
                    odds: fp.odds as string | null,
                    confidence: fp.confidence as number,
                })));
            }
        } catch {
            // Silently handle
        } finally {
            setCheckingPicks(false);
        }
    };

    const generatePodcast = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/podcast/generate', { method: 'POST' });
            const result = await res.json();
            if (result.error) throw new Error(result.error);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!data?.content) return;
        try {
            await navigator.clipboard.writeText(data.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = data.content;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const downloadAsText = () => {
        if (!data?.content) return;
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'firepick-podcast-' + new Date().toISOString().split('T')[0] + '.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-card-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Mic size={22} style={{ color: '#fb923c' }} />
                        🔥 FirePick Podcast
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                        Generate NotebookLM-ready knowledge base from today&apos;s fire picks
                    </p>
                </div>
            </div>

            {/* Today's Picks Status */}
            <div className="admin-card" style={{ marginBottom: '16px' }}>
                <div className="admin-card-header">
                    <div className="admin-card-title">
                        <Flame size={16} style={{ color: '#fb923c' }} />
                        Today&apos;s Fire Picks
                    </div>
                    <button onClick={checkTodayPicks} className="admin-btn admin-btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                        <RefreshCw size={12} />
                        Refresh
                    </button>
                </div>

                {checkingPicks ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '6px' }} />
                        Checking...
                    </div>
                ) : todayPicks.length === 0 ? (
                    <div style={{
                        padding: '30px 20px', textAlign: 'center',
                        background: 'rgba(251,146,60,0.04)', borderRadius: '10px',
                        border: '1px solid rgba(251,146,60,0.1)',
                    }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
                        <div style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 600 }}>No fire picks entered today</div>
                        <div style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px' }}>
                            Enter fire picks first, then come back to generate the podcast
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {todayPicks.map(pick => (
                            <div key={pick.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.12)',
                                borderRadius: '8px', padding: '10px 14px',
                            }}>
                                <div>
                                    <div style={{ color: '#e5e7eb', fontSize: '13px', fontWeight: 600 }}>
                                        🔥 {pick.pick_team} {pick.pick_type} {pick.pick_value}
                                    </div>
                                    <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                                        {pick.matchup}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {pick.odds && (
                                        <span style={{
                                            background: 'rgba(106,0,255,0.1)', color: '#FFC107',
                                            padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                        }}>
                                            {pick.odds}
                                        </span>
                                    )}
                                    <span style={{
                                        background: 'rgba(251,146,60,0.1)', color: '#fb923c',
                                        padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                    }}>
                                        {pick.confidence}%
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Generate Button */}
                        <button
                            onClick={generatePodcast}
                            disabled={loading}
                            className="admin-btn admin-btn-primary"
                            style={{
                                width: '100%', justifyContent: 'center', padding: '14px',
                                marginTop: '8px', fontSize: '14px', fontWeight: 700,
                                background: loading
                                    ? 'rgba(251,146,60,0.1)'
                                    : 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(234,88,12,0.15))',
                                border: '1px solid rgba(251,146,60,0.3)',
                                borderRadius: '10px',
                            }}
                        >
                            {loading ? (
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Sparkles size={16} />
                            )}
                            {loading ? 'Generating Podcast Knowledge Base...' : 'Generate Podcast Content'}
                        </button>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="admin-card" style={{ marginBottom: '16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px' }}>
                        <AlertCircle size={14} style={{ color: '#f87171' }} />
                        <span style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</span>
                    </div>
                </div>
            )}

            {/* Loading Animation */}
            {loading && (
                <div className="admin-card" style={{ marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '14px', animation: 'pulse 2s infinite' }}>🎙️</div>
                        <div style={{ color: '#fb923c', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                            Writing Your Podcast Script...
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '12px', lineHeight: 1.6 }}>
                            Analyzing {todayPicks.length} fire pick{todayPicks.length !== 1 ? 's' : ''} • Building narrative arcs • Crafting host banter
                        </div>
                        <div style={{
                            marginTop: '20px', height: '3px', background: 'rgba(251,146,60,0.1)',
                            borderRadius: '2px', overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%', background: 'linear-gradient(90deg, #fb923c, #ea580c)',
                                borderRadius: '2px', animation: 'loading-bar 2s ease-in-out infinite',
                                width: '60%',
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Content */}
            {data && !loading && (
                <div className="admin-card">
                    <div className="admin-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
                        <div className="admin-card-title">
                            <FileText size={16} style={{ color: '#fb923c' }} />
                            Podcast Knowledge Base
                            <span style={{
                                background: 'rgba(106,0,255,0.1)', color: '#FFC107',
                                padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                                marginLeft: '8px',
                            }}>
                                Ready for NotebookLM
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                                onClick={copyToClipboard}
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '11px', padding: '4px 10px' }}
                            >
                                {copied ? <Check size={12} style={{ color: '#FFC107' }} /> : <Copy size={12} />}
                                {copied ? 'Copied!' : 'Copy All'}
                            </button>
                            <button
                                onClick={downloadAsText}
                                className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '11px', padding: '4px 10px' }}
                            >
                                <FileText size={12} />
                                Download .txt
                            </button>
                            <a
                                href="https://notebooklm.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-btn"
                                style={{
                                    fontSize: '11px', padding: '4px 12px',
                                    background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)',
                                    color: '#fb923c', borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700,
                                    textDecoration: 'none',
                                }}
                            >
                                <ExternalLink size={12} />
                                Open NotebookLM
                            </a>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div style={{
                        display: 'flex', gap: '16px', flexWrap: 'wrap',
                        marginBottom: '14px', padding: '10px 14px',
                        background: 'rgba(251,146,60,0.04)', borderRadius: '8px',
                        border: '1px solid rgba(251,146,60,0.08)',
                    }}>
                        <div>
                            <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Record</span>
                            <div style={{ color: '#FFC107', fontSize: '14px', fontWeight: 800 }}>{data.record}</div>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Win Rate</span>
                            <div style={{ color: '#fb923c', fontSize: '14px', fontWeight: 800 }}>{data.winPct}%</div>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Picks Today</span>
                            <div style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 800 }}>{data.picks.length}</div>
                        </div>
                        <div>
                            <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Generated</span>
                            <div style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 600 }}>
                                {new Date(data.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{
                        background: 'rgba(251,146,60,0.03)',
                        border: '1px solid rgba(251,146,60,0.1)',
                        borderRadius: '10px',
                        padding: '20px',
                        fontSize: '13px',
                        lineHeight: '1.8',
                        color: '#d1d5db',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '600px',
                        overflowY: 'auto',
                    }}>
                        {data.content.split('\n').map((line, i) => {
                            // Section headers (###)
                            if (line.startsWith('###')) {
                                return (
                                    <div key={i} style={{
                                        color: '#fb923c', fontWeight: 800, fontSize: '14px',
                                        marginTop: i > 0 ? '20px' : '0', marginBottom: '8px',
                                        borderBottom: '1px solid rgba(251,146,60,0.15)',
                                        paddingBottom: '6px',
                                    }}>
                                        {line.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
                                    </div>
                                );
                            }
                            // Sub-headers (**)
                            if (line.startsWith('**') && line.endsWith('**')) {
                                return (
                                    <div key={i} style={{ color: '#fbbf24', fontWeight: 700, fontSize: '13px', marginTop: '12px', marginBottom: '4px' }}>
                                        {line.replace(/\*\*/g, '')}
                                    </div>
                                );
                            }
                            // Bold sections
                            if (line.startsWith('**') && line.includes('**:')) {
                                const [label, ...rest] = line.split(':');
                                return (
                                    <div key={i} style={{ marginBottom: '4px', marginTop: '8px' }}>
                                        <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px' }}>
                                            {label.replace(/\*\*/g, '')}
                                        </span>
                                        <span style={{ color: '#e5e7eb' }}>:{rest.join(':')}</span>
                                    </div>
                                );
                            }
                            // Bullet points
                            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                                return (
                                    <div key={i} style={{ paddingLeft: '14px', marginBottom: '2px', color: '#d1d5db' }}>
                                        {line}
                                    </div>
                                );
                            }
                            if (!line.trim()) return <div key={i} style={{ height: '10px' }} />;
                            return <div key={i}>{line}</div>;
                        })}
                    </div>

                    {/* Workflow hint */}
                    <div style={{
                        marginTop: '14px', padding: '12px 16px',
                        background: 'rgba(167,139,250,0.05)', borderRadius: '8px',
                        border: '1px solid rgba(167,139,250,0.1)',
                        fontSize: '12px', color: '#9ca3af', lineHeight: 1.6,
                    }}>
                        <strong style={{ color: '#a78bfa' }}>💡 Workflow:</strong> Copy the content above → Open NotebookLM → Create a new notebook → Paste as a source → Click &quot;Generate Audio Overview&quot; → Your FirePick Podcast episode is ready to publish!
                    </div>
                </div>
            )}

            <style>{`
                @keyframes loading-bar {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(60%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}
