import { NextResponse } from 'next/server';

// Discord integration removed — TriplePlayz now uses internal community
export async function POST() {
    return NextResponse.json({ error: 'Discord integration has been removed. Use The TriplePlayz Lounge community instead.' }, { status: 410 });
}
