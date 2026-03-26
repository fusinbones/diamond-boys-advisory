'use client';

import { useState, useEffect, useCallback } from 'react';

interface NicknamePromptProps {
    userId: string;
    currentNickname?: string | null;
    onSaved: (nickname: string) => void;
}

export default function NicknamePrompt({ userId, currentNickname, onSaved }: NicknamePromptProps) {
    const [nickname, setNickname] = useState(currentNickname || '');
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState<{ available: boolean; error: string | null } | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Debounced availability check
    const checkAvailability = useCallback(async (nick: string) => {
        if (nick.trim().length < 3) {
            setAvailability(null);
            return;
        }
        setChecking(true);
        try {
            const res = await fetch(`/api/nickname?nickname=${encodeURIComponent(nick.trim())}`);
            const data = await res.json();
            setAvailability(data);
        } catch {
            setAvailability({ available: false, error: 'Check failed' });
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (nickname.trim().length >= 3) {
                checkAvailability(nickname);
            } else {
                setAvailability(null);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [nickname, checkAvailability]);

    const handleSave = async () => {
        if (!availability?.available) return;
        setSaving(true);
        setSaveError(null);
        try {
            const res = await fetch('/api/nickname', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, nickname: nickname.trim() }),
            });
            const data = await res.json();
            if (data.success) {
                onSaved(data.nickname);
            } else {
                setSaveError(data.error || 'Failed to save');
            }
        } catch {
            setSaveError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const isValid = availability?.available && !checking && nickname.trim().length >= 3;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                maxWidth: '360px', width: '100%', padding: '28px',
                background: 'linear-gradient(135deg, rgba(15,20,35,0.99), rgba(10,14,23,0.99))',
                border: '1px solid rgba(0,229,155,0.15)', borderRadius: '18px',
                boxShadow: '0 12px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,229,155,0.05)',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏷️</div>
                    <h2 style={{
                        color: 'white', fontSize: '18px', fontWeight: 800,
                        letterSpacing: '-0.3px', marginBottom: '4px',
                    }}>
                        Choose Your Nickname
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>
                        This is how you&apos;ll appear in chat. Pick something unique!
                    </p>
                </div>

                {/* Input */}
                <div style={{ position: 'relative', marginBottom: '6px' }}>
                    <input
                        type="text"
                        value={nickname}
                        onChange={e => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                            if (val.length <= 16) setNickname(val);
                        }}
                        placeholder="your_nickname"
                        autoFocus
                        style={{
                            width: '100%', padding: '12px 40px 12px 14px',
                            fontSize: '15px', fontWeight: 600, color: 'white',
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${
                                availability?.available ? 'rgba(0,229,155,0.4)' :
                                availability && !availability.available ? 'rgba(239,68,68,0.4)' :
                                'rgba(255,255,255,0.08)'
                            }`,
                            borderRadius: '10px', outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s',
                        }}
                        onKeyDown={e => { if (e.key === 'Enter' && isValid) handleSave(); }}
                    />
                    {/* Status indicator */}
                    <div style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '14px',
                    }}>
                        {checking ? (
                            <div style={{
                                width: '14px', height: '14px',
                                border: '2px solid rgba(0,229,155,0.3)', borderTopColor: '#00e59b',
                                borderRadius: '50%', animation: 'spin 1s linear infinite',
                            }} />
                        ) : availability?.available ? (
                            <span style={{ color: '#00e59b' }}>✓</span>
                        ) : availability && !availability.available ? (
                            <span style={{ color: '#f87171' }}>✗</span>
                        ) : null}
                    </div>
                </div>

                {/* Feedback */}
                <div style={{ minHeight: '20px', marginBottom: '14px' }}>
                    {availability && !availability.available && availability.error && (
                        <p style={{ color: '#f87171', fontSize: '11px', fontWeight: 600 }}>
                            {availability.error}
                        </p>
                    )}
                    {availability?.available && (
                        <p style={{ color: '#00e59b', fontSize: '11px', fontWeight: 600 }}>
                            ✨ &quot;{nickname.trim()}&quot; is available!
                        </p>
                    )}
                    {saveError && (
                        <p style={{ color: '#f87171', fontSize: '11px', fontWeight: 600 }}>
                            {saveError}
                        </p>
                    )}
                </div>

                {/* Rules */}
                <div style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                    padding: '10px 12px', marginBottom: '16px',
                    border: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <p style={{ color: '#4b5563', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                        Rules
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {[
                            { rule: '3–16 characters', met: nickname.length >= 3 && nickname.length <= 16 },
                            { rule: 'Letters, numbers, underscores', met: /^[a-zA-Z0-9_]*$/.test(nickname) && nickname.length > 0 },
                            { rule: 'Must be unique', met: availability?.available || false },
                        ].map(({ rule, met }) => (
                            <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '10px', color: met ? '#00e59b' : '#374151' }}>
                                    {met ? '●' : '○'}
                                </span>
                                <span style={{ fontSize: '11px', color: met ? '#9ca3af' : '#4b5563' }}>
                                    {rule}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save button */}
                <button
                    onClick={handleSave}
                    disabled={!isValid || saving}
                    style={{
                        width: '100%', padding: '12px',
                        borderRadius: '10px', border: 'none',
                        background: isValid
                            ? 'linear-gradient(135deg, #00e59b, #00c9ff)'
                            : 'rgba(255,255,255,0.04)',
                        color: isValid ? '#0a0a0f' : '#4b5563',
                        fontSize: '14px', fontWeight: 800,
                        cursor: isValid ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s',
                        letterSpacing: '-0.2px',
                    }}
                >
                    {saving ? 'Saving...' : 'Lock In My Nickname 🔒'}
                </button>

                <p style={{
                    textAlign: 'center', fontSize: '10px', color: '#374151',
                    marginTop: '10px',
                }}>
                    You can change this later from your chat settings
                </p>
            </div>
        </div>
    );
}
