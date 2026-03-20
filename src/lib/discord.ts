// Discord bot utility functions
// These are called from the Stripe webhook handler via Discord REST API
// No running bot process needed for these operations

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_API = 'https://discord.com/api/v10';

interface DiscordMember {
    user: { id: string; username: string };
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
        throw new Error(`Discord API error: ${res.status}`);
    }

    if (res.status === 204) return null;
    return res.json();
}

/**
 * Search for a member in the guild by username
 */
export async function findMemberByUsername(username: string): Promise<string | null> {
    try {
        const cleanUsername = username.replace(/^@/, '');
        const members: DiscordMember[] = await discordFetch(
            `/guilds/${DISCORD_GUILD_ID}/members/search?query=${encodeURIComponent(cleanUsername)}&limit=1`
        );
        if (members && members.length > 0) {
            return members[0].user.id;
        }
        return null;
    } catch (error) {
        console.error('Error finding Discord member:', error);
        return null;
    }
}

/**
 * Add a role to a guild member
 */
export async function addRole(userId: string, roleId: string): Promise<void> {
    await discordFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`, {
        method: 'PUT',
    });
}

/**
 * Remove a role from a guild member
 */
export async function removeRole(userId: string, roleId: string): Promise<void> {
    await discordFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`, {
        method: 'DELETE',
    });
}

/**
 * Kick a member from the guild
 */
export async function kickMember(userId: string, reason: string): Promise<void> {
    await discordFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
    });
}

/**
 * Send a DM to a user
 */
export async function sendDM(userId: string, message: string): Promise<void> {
    try {
        // Create DM channel
        const channel = await discordFetch('/users/@me/channels', {
            method: 'POST',
            body: JSON.stringify({ recipient_id: userId }),
        });

        // Send message
        await discordFetch(`/channels/${channel.id}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content: message }),
        });
    } catch (error) {
        console.error('Error sending DM:', error);
    }
}

/**
 * Log an action to the mod-logs channel
 */
export async function logToModChannel(message: string): Promise<void> {
    const channelId = process.env.DISCORD_MOD_LOG_CHANNEL_ID;
    if (!channelId) return;

    try {
        await discordFetch(`/channels/${channelId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                content: `📋 **Mod Log** | ${new Date().toISOString()}\n${message}`,
            }),
        });
    } catch (error) {
        console.error('Error logging to mod channel:', error);
    }
}

/**
 * Handle successful payment: assign tier role + welcome DM
 */
export async function handlePaymentSuccess(discordUsername: string, tierName: string, tierId?: string): Promise<void> {
    const userId = await findMemberByUsername(discordUsername);
    if (!userId) {
        await logToModChannel(`⚠️ Could not find Discord user: ${discordUsername} for tier: ${tierName}`);
        return;
    }

    // Dynamically import tiers to get role IDs (avoid circular deps)
    const { tiers } = await import('./tiers');
    const tier = tiers.find(t => t.id === tierId || t.name === tierName);

    if (tier?.discordRoleId) {
        try {
            await addRole(userId, tier.discordRoleId);
            await logToModChannel(`✅ Payment success: ${discordUsername} → ${tierName} | Role assigned: ${tier.discordRoleId}`);
        } catch (error) {
            console.error(`Failed to assign role for ${discordUsername}:`, error);
            await logToModChannel(`⚠️ Payment success but FAILED to assign role for: ${discordUsername} → ${tierName}`);
        }
    } else {
        await logToModChannel(`✅ Payment success: ${discordUsername} → ${tierName} (no role ID configured)`);
    }

    await sendDM(
        userId,
        `💎 **Welcome to Diamond Boys!** 💎\n\nYour **${tierName}** subscription is active! Access granted.\n\n⚾ Your tier channels are now unlocked — daily picks drop there\n💬 #general channel unlocked — chat with the crew\n\nLet's get those W's! 🔥`
    );
}

/**
 * Handle payment failure: remove ALL tier roles (keeps them in server but blocks paid channels)
 */
export async function handlePaymentFailure(discordUsername: string): Promise<void> {
    const userId = await findMemberByUsername(discordUsername);
    if (!userId) {
        await logToModChannel(`⚠️ Payment failed but could not find Discord user: ${discordUsername}`);
        return;
    }

    // Strip all tier roles — Discord permissions will block them from paid channels automatically
    const { tiers } = await import('./tiers');
    let rolesRemoved = 0;
    for (const tier of tiers) {
        if (tier.discordRoleId) {
            try {
                await removeRole(userId, tier.discordRoleId);
                rolesRemoved++;
            } catch {
                // Role may not be assigned — ignore
            }
        }
    }

    await logToModChannel(`🚫 Subscription lapsed: ${discordUsername} — removed ${rolesRemoved} tier role(s). User stays in server.`);
    await sendDM(
        userId,
        `⚠️ **Diamond Boys — Access Paused**\n\nYour subscription has lapsed, so your picks channels have been locked.\n\nYou're still in the server — resubscribe anytime at **diamondboysadvisory.com/pricing** to unlock your channels again! 💎`
    );
}
