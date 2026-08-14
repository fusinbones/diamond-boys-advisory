import { NextResponse } from 'next/server';

// Discord cron job removed — YourSwami now uses internal community
export async function GET() {
    return NextResponse.json({ message: 'Discord posting cron disabled — use The Swami Lounge', count: 0 });
}
