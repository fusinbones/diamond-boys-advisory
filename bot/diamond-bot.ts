import { Client, GatewayIntentBits, Events, Message, GuildMember, TextChannel } from 'discord.js';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, BOT_CHANNELS_ALLOWLIST, WELCOME_MESSAGE } from './system-prompt';

// ═══════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!DISCORD_BOT_TOKEN) throw new Error('DISCORD_BOT_TOKEN not set');
if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ═══════════════════════════════════════════
// Conversation Memory (per channel, last 10 msgs)
// ═══════════════════════════════════════════

interface ConvoMessage {
    role: 'user' | 'model';
    content: string;
    author?: string;
}

const channelMemory = new Map<string, ConvoMessage[]>();
const MAX_MEMORY = 10;

function getMemory(channelId: string): ConvoMessage[] {
    return channelMemory.get(channelId) || [];
}

function addToMemory(channelId: string, msg: ConvoMessage) {
    const memory = getMemory(channelId);
    memory.push(msg);
    if (memory.length > MAX_MEMORY) memory.shift();
    channelMemory.set(channelId, memory);
}

// ═══════════════════════════════════════════
// Gemini Chat
// ═══════════════════════════════════════════

async function askGemini(channelId: string, userMessage: string, authorName: string): Promise<string> {
    const memory = getMemory(channelId);

    // Build conversation context
    let contextBlock = memory.map(m => {
        if (m.role === 'user') return `${m.author || 'Member'}: ${m.content}`;
        return `TriplePlayz: ${m.content}`;
    }).join('\n');

    const prompt = `${SYSTEM_PROMPT}

## CURRENT CONVERSATION CONTEXT
${contextBlock || '(New conversation)'}

## CURRENT MESSAGE
${authorName}: ${userMessage}

Respond as TriplePlayz. Keep it natural, concise, and baseball-focused.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const reply = response.text || "Having a moment — try me again! ⚾";

        // Save to memory
        addToMemory(channelId, { role: 'user', content: userMessage, author: authorName });
        addToMemory(channelId, { role: 'model', content: reply });

        return reply;
    } catch (error) {
        console.error('Gemini error:', error);
        return "My analysis engine is warming up — give me a sec and try again! 🔧⚾";
    }
}

// ═══════════════════════════════════════════
// Discord Client
// ═══════════════════════════════════════════

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// ═══════════════════════════════════════════
// Event: Ready
// ═══════════════════════════════════════════

client.once(Events.ClientReady, (readyClient) => {
    console.log(`\n💎 TriplePlayz Bot is LIVE!`);
    console.log(`   Logged in as: ${readyClient.user.tag}`);
    console.log(`   Guilds: ${readyClient.guilds.cache.size}`);
    console.log(`   Channel filter: ${BOT_CHANNELS_ALLOWLIST.length > 0 ? BOT_CHANNELS_ALLOWLIST.join(', ') : 'ALL channels'}`);
    console.log(`   Ready to analyze! ⚾\n`);
});

// ═══════════════════════════════════════════
// Event: New Member
// ═══════════════════════════════════════════

client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    try {
        // Find general/welcome channel
        const welcomeChannel = member.guild.channels.cache.find(
            ch => ch.isTextBased() && (ch.name.includes('general') || ch.name.includes('welcome'))
        );

        if (welcomeChannel && 'send' in welcomeChannel) {
            await welcomeChannel.send(`Hey <@${member.id}>! ${WELCOME_MESSAGE}`);
        }
    } catch (error) {
        console.error('Welcome message error:', error);
    }
});

// ═══════════════════════════════════════════
// Event: Message
// ═══════════════════════════════════════════

client.on(Events.MessageCreate, async (message: Message) => {
    // Ignore bots and DMs
    if (message.author.bot) return;
    if (!message.guild) return;

    // Check channel allowlist
    if (BOT_CHANNELS_ALLOWLIST.length > 0 && !BOT_CHANNELS_ALLOWLIST.includes(message.channelId)) {
        return;
    }

    const botMentioned = message.mentions.has(client.user!);
    const content = message.content.replace(/<@!?\d+>/g, '').trim();

    // Only respond when:
    // 1. Bot is @mentioned
    // 2. Message starts with "diamond" or "💎"
    // 3. Message is a reply to the bot
    const isReplyToBot = message.reference?.messageId &&
        (await message.channel.messages.fetch(message.reference.messageId).catch(() => null))?.author?.id === client.user?.id;

    const isTriplePlayzTrigger = content.toLowerCase().startsWith('tripleplayz') || content.startsWith('💎');

    if (!botMentioned && !isTriplePlayzTrigger && !isReplyToBot) return;

    // Don't respond to empty mentions
    if (!content) {
        await message.reply("Yo, what's good? 💎 Ask me about today's games, a matchup, or the alternation system!");
        return;
    }

    // Show typing indicator
    try {
        if ('sendTyping' in message.channel) {
            await (message.channel as TextChannel).sendTyping();
        }
    } catch { /* ignore */ }

    // Get Gemini response
    const reply = await askGemini(
        message.channelId,
        content,
        message.member?.displayName || message.author.username
    );

    // Discord has a 2000 char limit
    if (reply.length > 1900) {
        // Split into chunks
        const chunks = reply.match(/[\s\S]{1,1900}/g) || [reply];
        for (const chunk of chunks) {
            await message.reply(chunk);
        }
    } else {
        await message.reply(reply);
    }
});

// ═══════════════════════════════════════════
// Start
// ═══════════════════════════════════════════

console.log('🚀 Starting TriplePlayz Bot...');
client.login(DISCORD_BOT_TOKEN);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n💎 TriplePlayz Bot shutting down...');
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n💎 TriplePlayz Bot shutting down...');
    client.destroy();
    process.exit(0);
});
