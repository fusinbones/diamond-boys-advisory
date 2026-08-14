/**
 * Diamond Boys Discord Bot (Standalone)
 * 
 * Deploy separately on Replit, Railway, or a VPS.
 * Handles:
 *   - New member join → Assign "Pending" role + DM with 24h warning
 *   - Daily cron → Cross-check Stripe active subs vs Discord members
 *   - Mod log → All actions logged to #mod-logs channel
 * 
 * Required env vars:
 *   DISCORD_BOT_TOKEN
 *   DISCORD_GUILD_ID
 *   DISCORD_MOD_LOG_CHANNEL_ID
 *   DISCORD_PENDING_ROLE_ID
 *   STRIPE_SECRET_KEY
 * 
 * Install: npm install discord.js stripe
 * Run:     node scripts/discord-bot.js
 */

// NOTE: This script uses CommonJS require() for standalone deployment.
// If deploying as a module, rename to .mjs and use import statements.

const { Client, GatewayIntentBits, Events } = require('discord.js');
const Stripe = require('stripe');

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const MOD_LOG_CHANNEL_ID = process.env.DISCORD_MOD_LOG_CHANNEL_ID;
const PENDING_ROLE_ID = process.env.DISCORD_PENDING_ROLE_ID;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
    console.error('Missing required env vars: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ],
});

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ——— Utility: Log to mod channel ———
async function modLog(message) {
    try {
        if (!MOD_LOG_CHANNEL_ID) return;
        const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
        if (!guild) return;
        const channel = guild.channels.cache.get(MOD_LOG_CHANNEL_ID);
        if (channel) {
            await channel.send(`📋 **Mod Log** | ${new Date().toISOString()}\n${message}`);
        }
    } catch (err) {
        console.error('ModLog error:', err.message);
    }
}

// ——— Event: Bot Ready ———
client.once(Events.ClientReady, (c) => {
    console.log(`✅ Diamond Boys Bot online as ${c.user.tag}`);
    console.log(`   Guild: ${DISCORD_GUILD_ID}`);
    console.log(`   Mod Log Channel: ${MOD_LOG_CHANNEL_ID || 'NOT SET'}`);

    modLog('🤖 Diamond Boys Bot started successfully.');

    // Schedule daily reconciliation (every 24 hours)
    setInterval(dailyReconciliation, 24 * 60 * 60 * 1000);
    // Run first reconciliation 5 minutes after boot
    setTimeout(dailyReconciliation, 5 * 60 * 1000);
});

// ——— Event: New Member Join ———
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        console.log(`New member: ${member.user.username}`);

        // Add Pending role
        if (PENDING_ROLE_ID) {
            await member.roles.add(PENDING_ROLE_ID);
        }

        // Send DM
        await member.send(
            `💎 **Welcome to Diamond Boys Sports Advisory!**\n\n` +
            `To unlock full access, you need an active subscription.\n\n` +
            `🔗 Subscribe here: https://diamondboyssports.com/pricing\n\n` +
            `⚠️ **Important:** If you don't have an active subscription within 24 hours, ` +
            `you will be automatically removed from the server.\n\n` +
            `Already subscribed? Sit tight — our system will verify your access shortly.`
        );

        await modLog(`👋 New member joined: **${member.user.username}** (${member.user.id}) — Pending role assigned`);

        // Auto-kick after 24 hours if still Pending
        setTimeout(async () => {
            try {
                const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
                if (!guild) return;
                const freshMember = await guild.members.fetch(member.user.id).catch(() => null);
                if (!freshMember) return; // Already left or kicked

                if (PENDING_ROLE_ID && freshMember.roles.cache.has(PENDING_ROLE_ID)) {
                    await freshMember.send(
                        `⚠️ **Diamond Boys — Access Expired**\n\n` +
                        `You have been removed because no active subscription was detected within 24 hours.\n\n` +
                        `To rejoin, subscribe at: https://diamondboyssports.com/pricing`
                    );
                    await freshMember.kick('No subscription verified within 24h');
                    await modLog(`⏰ Auto-kicked: **${member.user.username}** — No sub after 24h`);
                }
            } catch (err) {
                console.error('24h kick error:', err.message);
            }
        }, 24 * 60 * 60 * 1000);
    } catch (err) {
        console.error('GuildMemberAdd error:', err.message);
    }
});

// ——— Daily Reconciliation: Stripe vs Discord ———
async function dailyReconciliation() {
    console.log('🔄 Starting daily reconciliation...');
    await modLog('🔄 Starting daily Stripe ↔ Discord reconciliation...');

    try {
        const guild = client.guilds.cache.get(DISCORD_GUILD_ID);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        // Fetch all members (may need multiple calls for large servers)
        await guild.members.fetch();

        // Get all active Stripe subscriptions
        const activeUsernames = new Set();
        let hasMore = true;
        let startingAfter = undefined;

        while (hasMore) {
            const params = { status: 'active', limit: 100, expand: ['data.customer'] };
            if (startingAfter) params.starting_after = startingAfter;

            const subs = await stripe.subscriptions.list(params);

            for (const sub of subs.data) {
                const username = sub.metadata?.discord_username;
                if (username) {
                    activeUsernames.add(username.toLowerCase());
                }
            }

            // Also check trialing
            hasMore = subs.has_more;
            if (subs.data.length > 0) {
                startingAfter = subs.data[subs.data.length - 1].id;
            }
        }

        // Also get trialing subscriptions
        hasMore = true;
        startingAfter = undefined;

        while (hasMore) {
            const params = { status: 'trialing', limit: 100 };
            if (startingAfter) params.starting_after = startingAfter;

            const subs = await stripe.subscriptions.list(params);

            for (const sub of subs.data) {
                const username = sub.metadata?.discord_username;
                if (username) {
                    activeUsernames.add(username.toLowerCase());
                }
            }

            hasMore = subs.has_more;
            if (subs.data.length > 0) {
                startingAfter = subs.data[subs.data.length - 1].id;
            }
        }

        console.log(`Active Stripe usernames: ${activeUsernames.size}`);

        // Check each Discord member (skip bots and admins)
        let kickCount = 0;

        for (const [, member] of guild.members.cache) {
            if (member.user.bot) continue;
            if (member.permissions.has('Administrator')) continue;
            if (PENDING_ROLE_ID && member.roles.cache.has(PENDING_ROLE_ID)) continue; // Still in pending window

            const username = member.user.username.toLowerCase();

            if (!activeUsernames.has(username)) {
                // No active sub found — kick
                try {
                    await member.send(
                        `⚠️ **Diamond Boys — Access Revoked**\n\n` +
                        `Our daily verification found no active subscription for your account.\n` +
                        `Your Discord access has been revoked per our zero-tolerance policy.\n\n` +
                        `To rejoin, purchase a new subscription: https://diamondboyssports.com/pricing`
                    );
                    await member.kick('Daily reconciliation: no active Stripe subscription found');
                    kickCount++;
                    await modLog(`🔄 Reconciliation kick: **${member.user.username}** — No active sub`);
                } catch (err) {
                    console.error(`Failed to kick ${member.user.username}:`, err.message);
                }
            }
        }

        await modLog(
            `✅ Daily reconciliation complete.\n` +
            `   Active Stripe subs: ${activeUsernames.size}\n` +
            `   Members kicked: ${kickCount}\n` +
            `   Discord members: ${guild.members.cache.filter(m => !m.user.bot).size}`
        );

        console.log(`Reconciliation complete. Kicked: ${kickCount}`);
    } catch (err) {
        console.error('Reconciliation error:', err);
        await modLog(`❌ Reconciliation ERROR: ${err.message}`);
    }
}

// ——— Start Bot ———
client.login(DISCORD_BOT_TOKEN);
