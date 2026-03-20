import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { tiers, TIER_LEVELS } from '@/lib/tiers';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API = 'https://discord.com/api/v10';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function buildPickEmbed(pick: {
    away_team: string;
    home_team: string;
    pick_type: string;
    pick_team: string;
    pick_value?: string;
    confidence: number;
    reason: string;
    notes?: string;
    game_date: string;
    unit_size?: number;
}) {
    const unitEmojis = '🔥'.repeat(pick.unit_size || 1);
    const confBar = '█'.repeat(Math.round(pick.confidence / 10)) + '░'.repeat(10 - Math.round(pick.confidence / 10));
    const confColor = pick.confidence >= 80 ? 0x00e59b : pick.confidence >= 60 ? 0xfbbf24 : 0xf87171;

    const gameDate = new Date(pick.game_date + 'T12:00:00');
    const dateStr = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const fields = [
        {
            name: '🏟️ Matchup',
            value: `**${pick.away_team}** @ **${pick.home_team}**`,
            inline: false,
        },
        {
            name: '🎯 Pick',
            value: `**${pick.pick_team}** (${pick.pick_type}${pick.pick_value ? ` ${pick.pick_value}` : ''})`,
            inline: true,
        },
        {
            name: '📊 Confidence',
            value: `\`${confBar}\` **${pick.confidence}%**`,
            inline: true,
        },
        {
            name: '💰 Units',
            value: `${unitEmojis} (${pick.unit_size || 1}u)`,
            inline: true,
        },
    ];

    if (pick.reason) {
        fields.push({
            name: '📝 Analysis',
            value: pick.reason,
            inline: false,
        });
    }

    if (pick.notes) {
        fields.push({
            name: '📌 Notes',
            value: pick.notes,
            inline: false,
        });
    }

    return {
        embeds: [
            {
                title: '💎 DIAMOND BOYS PICK 💎',
                color: confColor,
                fields,
                footer: {
                    text: `Diamond Boys Advisory • ${dateStr}`,
                    icon_url: 'https://diamond-boys-advisory.vercel.app/logo.png',
                },
                timestamp: new Date().toISOString(),
                thumbnail: {
                    url: 'https://diamond-boys-advisory.vercel.app/logo.png',
                },
            },
        ],
    };
}

/**
 * Get all channel IDs that should receive a pick based on its minimum tier.
 * A 'daily' pick goes to ALL channels. A 'monthly' pick goes to monthly + season only.
 */
function getTargetChannels(minTier: string): string[] {
    const minLevel = TIER_LEVELS[minTier] || 1;
    return tiers
        .filter(t => (TIER_LEVELS[t.id] || 0) >= minLevel && t.discordChannelId)
        .map(t => t.discordChannelId);
}

export async function POST(request: NextRequest) {
    if (!DISCORD_BOT_TOKEN) {
        return NextResponse.json({ error: 'Discord not configured' }, { status: 500 });
    }

    try {
        const { pickId } = await request.json();
        if (!pickId) {
            return NextResponse.json({ error: 'pickId required' }, { status: 400 });
        }

        // Fetch the pick from Supabase
        const supabase = getSupabase();
        const { data: pick, error: fetchError } = await supabase
            .from('picks')
            .select('*')
            .eq('id', pickId)
            .single();

        if (fetchError || !pick) {
            return NextResponse.json({ error: 'Pick not found' }, { status: 404 });
        }

        // Build the embed
        const embed = buildPickEmbed(pick);

        // Determine target channels — fan out based on min_tier
        const minTier = pick.min_tier || 'daily';
        const targetChannels = getTargetChannels(minTier);

        // Fallback: use pick-specific channel or default
        if (targetChannels.length === 0) {
            const fallback = pick.discord_channel_id || process.env.DISCORD_DEFAULT_CHANNEL_ID;
            if (fallback) targetChannels.push(fallback);
        }

        if (targetChannels.length === 0) {
            return NextResponse.json({ error: 'No target channels configured' }, { status: 400 });
        }

        // Post to all target channels
        const results: { channelId: string; messageId: string }[] = [];
        const errors: string[] = [];

        for (const channelId of targetChannels) {
            try {
                const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(embed),
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`Discord post error for channel ${channelId}:`, errorText);
                    errors.push(`Channel ${channelId}: ${res.status}`);
                } else {
                    const message = await res.json();
                    results.push({ channelId, messageId: message.id });
                }
            } catch (err) {
                console.error(`Failed to post to channel ${channelId}:`, err);
                errors.push(`Channel ${channelId}: network error`);
            }
        }

        // Update pick record with posted status
        await supabase
            .from('picks')
            .update({
                discord_posted: true,
                discord_message_id: results[0]?.messageId || null,
            })
            .eq('id', pickId);

        return NextResponse.json({
            success: true,
            posted: results.length,
            channels: results,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Discord post API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to post to Discord' },
            { status: 500 }
        );
    }
}
