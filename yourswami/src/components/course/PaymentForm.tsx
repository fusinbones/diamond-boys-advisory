'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Loader2, CreditCard } from 'lucide-react';

// Accept.js types
declare global {
    interface Window {
        Accept?: {
            dispatchData: (
                secureData: { authData: { clientKey: string; apiLoginID: string }; cardData: { cardNumber: string; month: string; year: string; cardCode: string } },
                handler: (response: AcceptResponse) => void
            ) => void;
        };
    }
}

interface AcceptResponse {
    messages: { resultCode: string; message: Array<{ code: string; text: string }> };
    opaqueData?: { dataDescriptor: string; dataValue: string };
}

interface PaymentFormProps {
    amount: number;
    productName: string;
    onSuccess: (data: { transactionId: string; email: string; accessToken?: string }) => void;
}

export default function PaymentForm({ amount, productName, onSuccess }: PaymentFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expMonth, setExpMonth] = useState('');
    const [expYear, setExpYear] = useState('');
    const [cvv, setCvv] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Load Accept.js script
    useEffect(() => {
        if (document.getElementById('authorizenet-acceptjs')) {
            setScriptLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'authorizenet-acceptjs';
        script.src = 'https://js.authorize.net/v1/Accept.js';
        script.charset = 'utf-8';
        script.onload = () => setScriptLoaded(true);
        document.head.appendChild(script);
    }, []);

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim()) {
            setError('Name and email are required.');
            return;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }

        const rawCard = cardNumber.replace(/\s/g, '');
        if (rawCard.length < 13) {
            setError('Please enter a valid card number.');
            return;
        }
        if (!expMonth || !expYear || !cvv) {
            setError('Please complete all card fields.');
            return;
        }

        if (!window.Accept) {
            setError('Payment system is loading. Please try again in a moment.');
            return;
        }

        setLoading(true);

        const clientKey = process.env.NEXT_PUBLIC_AUTHORIZE_NET_PUBLIC_CLIENT_KEY || '';
        const apiLoginID = process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID || '';

        // Step 1: Get payment nonce from Accept.js
        window.Accept.dispatchData(
            {
                authData: { clientKey, apiLoginID },
                cardData: {
                    cardNumber: rawCard,
                    month: expMonth,
                    year: expYear,
                    cardCode: cvv,
                },
            },
            async (response: AcceptResponse) => {
                if (response.messages.resultCode === 'Error') {
                    setError(response.messages.message[0]?.text || 'Card validation failed.');
                    setLoading(false);
                    return;
                }

                if (!response.opaqueData) {
                    setError('Failed to tokenize card. Please try again.');
                    setLoading(false);
                    return;
                }

                // Step 2: Send nonce to our server
                try {
                    const res = await fetch('/api/course/purchase', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            dataDescriptor: response.opaqueData.dataDescriptor,
                            dataValue: response.opaqueData.dataValue,
                            amount,
                            name: name.trim(),
                            email: email.trim(),
                            product: productName,
                        }),
                    });

                    const data = await res.json();

                    if (data.success) {
                        onSuccess({ transactionId: data.transactionId, email: email.trim(), accessToken: data.accessToken });
                    } else {
                        setError(data.error || 'Payment failed. Please try again.');
                    }
                } catch {
                    setError('Network error. Please check your connection and try again.');
                } finally {
                    setLoading(false);
                }
            }
        );
    }, [name, email, cardNumber, expMonth, expYear, cvv, amount, productName, onSuccess]);

    return (
        <form onSubmit={handleSubmit} className="fire-payment-form">
            <div className="fire-form-row">
                <label>Full Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="John Smith"
                    className="fire-form-input"
                    required
                />
            </div>

            <div className="fire-form-row">
                <label>Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="fire-form-input"
                    required
                />
            </div>

            <div className="fire-form-row">
                <label>Card Number</label>
                <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4111 1111 1111 1111"
                    className="fire-form-input"
                    maxLength={19}
                    inputMode="numeric"
                    required
                />
            </div>

            <div className="fire-form-split">
                <div className="fire-form-row">
                    <label>Exp Month</label>
                    <select
                        value={expMonth}
                        onChange={e => setExpMonth(e.target.value)}
                        className="fire-form-input"
                        required
                    >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const m = String(i + 1).padStart(2, '0');
                            return <option key={m} value={m}>{m}</option>;
                        })}
                    </select>
                </div>
                <div className="fire-form-row">
                    <label>Exp Year</label>
                    <select
                        value={expYear}
                        onChange={e => setExpYear(e.target.value)}
                        className="fire-form-input"
                        required
                    >
                        <option value="">YYYY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                            const y = String(new Date().getFullYear() + i);
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                </div>
            </div>

            <div className="fire-form-row">
                <label>CVV</label>
                <input
                    type="text"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className="fire-form-input"
                    maxLength={4}
                    inputMode="numeric"
                    required
                    style={{ maxWidth: '120px' }}
                />
            </div>

            <button
                type="submit"
                disabled={loading || !scriptLoaded}
                className="fire-pay-btn"
            >
                {loading ? (
                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
                ) : (
                    <><CreditCard size={18} /> Get Instant Access — ${amount.toLocaleString()}</>
                )}
            </button>

            {error && <div className="fire-error">{error}</div>}

            <div className="fire-trust-badges">
                <span className="fire-trust-badge">
                    <Lock size={11} /> 256-bit SSL
                </span>
                <span className="fire-trust-badge">
                    <Lock size={11} /> PCI Compliant
                </span>
                <span className="fire-trust-badge">
                    🔒 Secure Checkout
                </span>
            </div>
        </form>
    );
}
