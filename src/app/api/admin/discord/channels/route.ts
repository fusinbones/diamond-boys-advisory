import { NextResponse } from 'next/server';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_API = 'https://discord.com/api/v10';

export async function GET() {
    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
        return NextResponse.json({ error: 'Discord not configured' }, { status: 500 });
    }

    try {
        const res = await fetch(`${DISCORD_API}/guilds/${DISCORD_GUILD_ID}/channels`, {
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
        });

        if (!res.ok) {
            const error = await res.text();
            console.error('Discord channels error:', error);
            return NextResponse.json({ error: 'Failed to fetch channels' }, { status: res.status });
        }

        const channels = await res.json();
        // Filter to text channels only (type 0) and sort by position
        const textChannels = channels
            .filter((c: { type: number }) => c.type === 0)
            .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
            .map((c: { id: string; name: string; position: number }) => ({
                id: c.id,
                name: c.name,
            }));

        return NextResponse.json({ channels: textChannels });
    } catch (error) {
        console.error('Discord channels API error:', error);
        return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }
}
