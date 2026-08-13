import { NextResponse } from 'next/server';

// Discord integration removed — YourSwami now uses internal community
export async function GET() {
    return NextResponse.json({ error: 'Discord integration has been removed.' }, { status: 410 });
}
