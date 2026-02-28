import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API = 'https://discord.com/api/v10';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * Vercel Cron handler — runs every minute to check for picks due to post
 * Configure in vercel.json: { "crons": [{ "path": "/api/cron/post-picks", "schedule": "* * * * *" }] }
 */
export async function GET(request: NextRequest) {
    // Verify cron secret (Vercel sends this)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!DISCORD_BOT_TOKEN) {
        return NextResponse.json({ error: 'Discord not configured' }, { status: 500 });
    }

    try {
        const supabase = getSupabase();
        const now = new Date().toISOString();

        // Find picks that are due to post
        const { data: duePicks, error } = await supabase
            .from('picks')
            .select('*')
            .eq('discord_posted', false)
            .not('discord_post_at', 'is', null)
            .lte('discord_post_at', now)
            .not('discord_channel_id', 'is', null);

        if (error) throw error;
        if (!duePicks || duePicks.length === 0) {
            return NextResponse.json({ message: 'No picks due', count: 0 });
        }

        let posted = 0;
        for (const pick of duePicks) {
            try {
                const unitEmojis = '🔥'.repeat(pick.unit_size || 1);
                const confBar = '█'.repeat(Math.round(pick.confidence / 10)) + '░'.repeat(10 - Math.round(pick.confidence / 10));
                const confColor = pick.confidence >= 80 ? 0x00e59b : pick.confidence >= 60 ? 0xfbbf24 : 0xf87171;

                const gameDate = new Date(pick.game_date + 'T12:00:00');
                const dateStr = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                const fields = [
                    { name: '🏟️ Matchup', value: `**${pick.away_team}** @ **${pick.home_team}**`, inline: false },
                    { name: '🎯 Pick', value: `**${pick.pick_team}** (${pick.pick_type}${pick.pick_value ? ` ${pick.pick_value}` : ''})`, inline: true },
                    { name: '📊 Confidence', value: `\`${confBar}\` **${pick.confidence}%**`, inline: true },
                    { name: '💰 Units', value: `${unitEmojis} (${pick.unit_size || 1}u)`, inline: true },
                ];
                if (pick.reason) fields.push({ name: '📝 Analysis', value: pick.reason, inline: false });

                const res = await fetch(`${DISCORD_API}/channels/${pick.discord_channel_id}/messages`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        embeds: [{
                            title: '💎 DIAMOND BOYS PICK 💎',
                            color: confColor,
                            fields,
                            footer: {
                                text: `Diamond Boys Advisory • ${dateStr}`,
                                icon_url: 'https://diamond-boys-advisory.vercel.app/logo.png',
                            },
                            timestamp: new Date().toISOString(),
                            thumbnail: { url: 'https://diamond-boys-advisory.vercel.app/logo.png' },
                        }],
                    }),
                });

                if (res.ok) {
                    const message = await res.json();
                    await supabase
                        .from('picks')
                        .update({ discord_posted: true, discord_message_id: message.id })
                        .eq('id', pick.id);
                    posted++;
                } else {
                    console.error(`Failed to post pick ${pick.id}:`, await res.text());
                }

                // Rate limit: 200ms between posts
                await new Promise(r => setTimeout(r, 200));
            } catch (postError) {
                console.error(`Error posting pick ${pick.id}:`, postError);
            }
        }

        return NextResponse.json({ message: `Posted ${posted} picks`, count: posted });
    } catch (error) {
        console.error('Cron post-picks error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
