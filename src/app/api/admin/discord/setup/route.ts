import { NextResponse } from 'next/server';
import { tiers, TIER_LEVELS } from '@/lib/tiers';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_API = 'https://discord.com/api/v10';

interface DiscordChannel {
    id: string;
    name: string;
    type: number;
    parent_id?: string;
}

async function discordFetch(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${DISCORD_API}${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.text();
        console.error(`Discord API error: ${res.status} ${error}`);
        throw new Error(`Discord API ${res.status}: ${error}`);
    }

    if (res.status === 204) return null;
    return res.json();
}

/**
 * Discord permission bits (as regular numbers — these values are small enough)
 * @see https://discord.com/developers/docs/topics/permissions
 */
const PERMS = {
    VIEW_CHANNEL: (1 << 10).toString(),    // 1024
    SEND_MESSAGES: (1 << 11).toString(),   // 2048
    READ_MESSAGE_HISTORY: (1 << 16).toString(), // 65536
};

/** Combine permission strings by OR-ing the numeric values */
function combinePerms(...perms: string[]): string {
    return perms.reduce((acc, p) => (parseInt(acc) | parseInt(p)).toString(), '0');
}

/**
 * POST /api/admin/discord/setup
 *
 * Creates the full Diamond Boys Discord server structure:
 * - 📢 PUBLIC category: #welcome, #rules, #general
 * - 💎 PICKS category: #daily-picks, #weekly-picks, #elite-picks, #season-vip
 * - 🤖 BOT category: #diamond-bot
 *
 * Each picks channel is locked to its tier role + all higher tier roles.
 */
export async function POST() {
    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
        return NextResponse.json(
            { error: 'DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must be set' },
            { status: 500 }
        );
    }

    const log: string[] = [];
    const channelIds: Record<string, string> = {};

    try {
        // ─── Get the @everyone role ID (same as guild ID) ───
        const everyoneRoleId = DISCORD_GUILD_ID;

        // ─── Sort tiers by level so permissions cascade correctly ───
        const sortedTiers = [...tiers].sort(
            (a, b) => (TIER_LEVELS[a.id] || 0) - (TIER_LEVELS[b.id] || 0)
        );

        // ═══════════════════════════════════════════
        // 1. Create Categories
        // ═══════════════════════════════════════════

        // Public category
        const publicCat: DiscordChannel = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`, {
            method: 'POST',
            body: JSON.stringify({
                name: '📢 PUBLIC',
                type: 4, // GUILD_CATEGORY
            }),
        });
        log.push(`✅ Created category: ${publicCat.name} (${publicCat.id})`);

        // Picks category (hidden from @everyone by default)
        const picksCat: DiscordChannel = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`, {
            method: 'POST',
            body: JSON.stringify({
                name: '💎 PICKS',
                type: 4,
                permission_overwrites: [
                    {
                        id: everyoneRoleId,
                        type: 0, // role
                        deny: PERMS.VIEW_CHANNEL,
                    },
                ],
            }),
        });
        log.push(`✅ Created category: ${picksCat.name} (${picksCat.id})`);

        // Bot category
        const botCat: DiscordChannel = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`, {
            method: 'POST',
            body: JSON.stringify({
                name: '🤖 BOT',
                type: 4,
            }),
        });
        log.push(`✅ Created category: ${botCat.name} (${botCat.id})`);

        // ═══════════════════════════════════════════
        // 2. Create Public Channels
        // ═══════════════════════════════════════════

        const publicChannels = [
            { name: 'welcome', topic: 'Welcome to Diamond Boys! 💎 Read the rules and grab your role.' },
            { name: 'rules', topic: 'Server rules and subscription info.' },
            { name: 'general', topic: 'Free chat — talk sports, share vibes, meet the crew.' },
        ];

        for (const ch of publicChannels) {
            const created: DiscordChannel = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`, {
                method: 'POST',
                body: JSON.stringify({
                    name: ch.name,
                    type: 0, // GUILD_TEXT
                    topic: ch.topic,
                    parent_id: publicCat.id,
                }),
            });
            log.push(`✅ Created #${created.name} (${created.id})`);
            channelIds[ch.name] = created.id;
        }

        // ═══════════════════════════════════════════
        // 3. Create Tier-Gated Picks Channels
        // ═══════════════════════════════════════════

        const tierChannelConfig: Record<string, { name: string; topic: string }> = {
            daily: { name: 'daily-picks', topic: '⚾ Daily MLB picks from Diamond Boys. Daily Sub+ access.' },
            weekly: { name: 'weekly-picks', topic: '📊 Weekly deep-dive picks & reports. Weekly Sub+ access.' },
            monthly: { name: 'elite-picks', topic: '🔥 Elite monthly picks & parlay plays. Monthly Elite+ access.' },
            season: { name: 'season-vip', topic: '👑 Season Pass VIP exclusive picks & strategy sessions.' },
        };

        for (const tier of sortedTiers) {
            const config = tierChannelConfig[tier.id];
            if (!config) continue;

            // Build permission overwrites:
            // - Deny @everyone from viewing
            // - Allow this tier's role + all higher tier roles to view
            const permissionOverwrites = [
                {
                    id: everyoneRoleId,
                    type: 0,
                    deny: PERMS.VIEW_CHANNEL,
                },
            ];

            // Add VIEW permission for this tier and all tiers at or above this level
            const thisLevel = TIER_LEVELS[tier.id] || 0;
            for (const t of sortedTiers) {
                if ((TIER_LEVELS[t.id] || 0) >= thisLevel && t.discordRoleId) {
                    permissionOverwrites.push({
                        id: t.discordRoleId,
                        type: 0,
                        deny: '0',
                        allow: combinePerms(PERMS.VIEW_CHANNEL, PERMS.SEND_MESSAGES, PERMS.READ_MESSAGE_HISTORY),
                    } as typeof permissionOverwrites[0]);
                }
            }

            const created: DiscordChannel = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`, {
                method: 'POST',
                body: JSON.stringify({
                    name: config.name,
                    type: 0,
                    topic: config.topic,
                    parent_id: picksCat.id,
                    permission_overwrites: permissionOverwrites,
                }),
            });

            log.push(`✅ Created #${created.name} (${created.id}) — visible to: ${tier.name}+`);
            channelIds[tier.id] = created.id;
        }

        // ═══════════════════════════════════════════
        // 4. Create Bot Channel
        // ═══════════════════════════════════════════

        const botChannel: DiscordChannel = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/channels`, {
            method: 'POST',
            body: JSON.stringify({
                name: 'diamond-bot',
                type: 0,
                topic: '💎 Chat with DiamondBot! Ask about games, matchups, and analysis.',
                parent_id: botCat.id,
            }),
        });
        log.push(`✅ Created #${botChannel.name} (${botChannel.id})`);
        channelIds['diamond-bot'] = botChannel.id;

        // ═══════════════════════════════════════════
        // 5. Post welcome message to #welcome
        // ═══════════════════════════════════════════

        if (channelIds['welcome']) {
            await discordFetch(`/channels/${channelIds['welcome']}/messages`, {
                method: 'POST',
                body: JSON.stringify({
                    embeds: [{
                        title: '💎 Welcome to Diamond Boys Advisory! 💎',
                        description: [
                            '**Your home for winning MLB picks.**',
                            '',
                            '🎯 **Daily expert analysis** with confidence ratings',
                            '📊 **65% documented win rate** — every pick tracked',
                            '⚡ **Real-time alerts** when lines move',
                            '🤖 **DiamondBot AI** — ask about any matchup',
                            '',
                            '**How to get started:**',
                            '1️⃣ Subscribe at **diamondboysadvisory.com/pricing**',
                            '2️⃣ Your tier channels unlock automatically',
                            '3️⃣ Check your tier channel for daily picks',
                            '4️⃣ Chat with **@DiamondBot** for instant analysis',
                            '',
                            '*For entertainment purposes only. 21+.*',
                        ].join('\n'),
                        color: 0x00e59b,
                        thumbnail: { url: 'https://diamond-boys-advisory.vercel.app/logo.png' },
                        footer: { text: 'Diamond Boys Advisory • diamondboysadvisory.com' },
                    }],
                }),
            });
            log.push('✅ Posted welcome message to #welcome');
        }

        // ═══════════════════════════════════════════
        // Return results + env var snippet
        // ═══════════════════════════════════════════

        const envSnippet = [
            `DISCORD_CHANNEL_DAILY=${channelIds['daily'] || ''}`,
            `DISCORD_CHANNEL_WEEKLY=${channelIds['weekly'] || ''}`,
            `DISCORD_CHANNEL_MONTHLY=${channelIds['monthly'] || ''}`,
            `DISCORD_CHANNEL_SEASON=${channelIds['season'] || ''}`,
            `DISCORD_DEFAULT_CHANNEL_ID=${channelIds['general'] || ''}`,
        ].join('\n');

        return NextResponse.json({
            success: true,
            log,
            channelIds,
            envSnippet,
            message: 'Server setup complete! Copy the envSnippet values into your .env.local file.',
        });
    } catch (error) {
        console.error('Discord server setup error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Setup failed',
                log,
                channelIds,
            },
            { status: 500 }
        );
    }
}
