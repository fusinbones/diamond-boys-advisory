import { NextResponse } from 'next/server';

// Discord cron job removed — TriplePlayz now uses internal community
export async function GET() {
    return NextResponse.json({ message: 'Discord posting cron disabled — use The TriplePlayz Lounge', count: 0 });
}
