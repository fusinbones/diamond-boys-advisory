import { NextResponse } from 'next/server';

// Discord cron job removed — Diamond Boys now uses internal community
export async function GET() {
    return NextResponse.json({ message: 'Discord posting cron disabled — use The Diamond Lounge', count: 0 });
}
