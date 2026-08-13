import { NextResponse } from 'next/server';

// Discord integration removed — YourSwami now uses internal community
export async function POST() {
    return NextResponse.json({ error: 'Discord integration has been removed. Use The Swami Lounge community instead.' }, { status: 410 });
}

export async function GET() {
    return NextResponse.json({ error: 'Discord integration has been removed.' }, { status: 410 });
}
