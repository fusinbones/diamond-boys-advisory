import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Admin email whitelist for super-admin actions
const ADMIN_EMAILS = [
    'diamondboysadvisory@gmail.com',
    'admin@tripleplayz.com',
];

function isSuperAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// GET — list bans, reports, or presence
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'reports';
    const status = searchParams.get('status') || 'pending';

    try {
        if (view === 'reports') {
            const { data, error } = await supabaseAdmin
                .from('chat_reports')
                .select('*')
                .eq('status', status)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return NextResponse.json({ reports: data || [] });
        }

        if (view === 'bans') {
            const { data, error } = await supabaseAdmin
                .from('chat_bans')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            return NextResponse.json({ bans: data || [] });
        }

        if (view === 'presence') {
            const channelId = searchParams.get('channelId');
            // Clean up stale presence (>60s old)
            const staleTime = new Date(Date.now() - 60000).toISOString();
            await supabaseAdmin
                .from('chat_presence')
                .delete()
                .lt('last_heartbeat', staleTime);

            let query = supabaseAdmin.from('chat_presence').select('*');
            if (channelId) query = query.eq('channel_id', channelId);
            const { data, error } = await query.order('display_name');
            if (error) throw error;
            return NextResponse.json({ users: data || [] });
        }

        return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
    } catch (err) {
        console.error('Moderation GET error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST — moderation actions
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, moderatorEmail } = body;

        if (!moderatorEmail || !isSuperAdmin(moderatorEmail)) {
            // Check if staff
            const { data: modProfile } = await supabaseAdmin
                .from('user_profiles')
                .select('role, is_admin')
                .eq('email', moderatorEmail)
                .single();
            
            const isStaffOrAdmin = modProfile?.role === 'staff' || modProfile?.role === 'admin' || modProfile?.is_admin;
            
            // Staff can mute, kick, warn, suspend — but NOT ban or delete
            if (!isStaffOrAdmin) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
            if (action === 'ban' || action === 'unban') {
                return NextResponse.json({ error: 'Only admins can ban/unban users' }, { status: 403 });
            }
        }

        switch (action) {
            case 'ban': return handleBan(body);
            case 'unban': return handleUnban(body);
            case 'mute': return handleMute(body);
            case 'unmute': return handleUnmute(body);
            case 'suspend': return handleSuspend(body);
            case 'kick': return handleKick(body);
            case 'warn': return handleWarn(body);
            case 'resolve_report': return handleResolveReport(body);
            case 'heartbeat': return handleHeartbeat(body);
            case 'report': return handleReport(body);
            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (err) {
        console.error('Moderation POST error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// ── Ban user (permanent or until date) ──
async function handleBan(body: Record<string, string>) {
    const { userId, reason, moderatorId, moderatorEmail, channelId } = body;

    // Record the ban
    await supabaseAdmin.from('chat_bans').insert({
        user_id: userId,
        action: 'ban',
        reason: reason || 'Banned by admin',
        moderator_id: moderatorId,
        moderator_email: moderatorEmail,
        channel_id: channelId || null,
        is_active: true,
    });

    // Update user profile
    await supabaseAdmin.from('user_profiles').update({
        is_banned: true,
        ban_reason: reason || 'Banned by admin',
    }).eq('id', userId);

    // Remove from presence
    await supabaseAdmin.from('chat_presence').delete().eq('user_id', userId);

    return NextResponse.json({ success: true, message: 'User banned' });
}

// ── Unban user ──
async function handleUnban(body: Record<string, string>) {
    const { userId } = body;

    await supabaseAdmin.from('chat_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('action', 'ban');

    await supabaseAdmin.from('user_profiles').update({
        is_banned: false,
        ban_reason: null,
    }).eq('id', userId);

    return NextResponse.json({ success: true, message: 'User unbanned' });
}

// ── Mute user (timed or permanent) ──
async function handleMute(body: Record<string, string>) {
    const { userId, reason, moderatorId, moderatorEmail, duration, channelId } = body;

    const expiresAt = duration
        ? new Date(Date.now() + parseInt(duration) * 60 * 1000).toISOString()
        : null; // permanent if no duration

    await supabaseAdmin.from('chat_bans').insert({
        user_id: userId,
        action: 'mute',
        reason: reason || 'Muted',
        moderator_id: moderatorId,
        moderator_email: moderatorEmail,
        channel_id: channelId || null,
        expires_at: expiresAt,
        is_active: true,
    });

    await supabaseAdmin.from('user_profiles').update({
        is_muted: true,
        muted_until: expiresAt,
    }).eq('id', userId);

    return NextResponse.json({ success: true, message: `User muted${duration ? ` for ${duration} minutes` : ' permanently'}` });
}

// ── Unmute user ──
async function handleUnmute(body: Record<string, string>) {
    const { userId } = body;

    await supabaseAdmin.from('chat_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('action', 'mute');

    await supabaseAdmin.from('user_profiles').update({
        is_muted: false,
        muted_until: null,
    }).eq('id', userId);

    return NextResponse.json({ success: true, message: 'User unmuted' });
}

// ── Suspend user (timed ban) ──
async function handleSuspend(body: Record<string, string>) {
    const { userId, reason, moderatorId, moderatorEmail, duration, channelId } = body;

    const hours = parseInt(duration || '24');
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    await supabaseAdmin.from('chat_bans').insert({
        user_id: userId,
        action: 'suspend',
        reason: reason || `Suspended for ${hours}h`,
        moderator_id: moderatorId,
        moderator_email: moderatorEmail,
        channel_id: channelId || null,
        expires_at: expiresAt,
        is_active: true,
    });

    await supabaseAdmin.from('user_profiles').update({
        suspended_until: expiresAt,
    }).eq('id', userId);

    // Remove from presence
    await supabaseAdmin.from('chat_presence').delete().eq('user_id', userId);

    return NextResponse.json({ success: true, message: `User suspended for ${hours} hours` });
}

// ── Kick user (remove from channel, no ban) ──
async function handleKick(body: Record<string, string>) {
    const { userId, reason, moderatorId, moderatorEmail, channelId } = body;

    // Record the kick
    await supabaseAdmin.from('chat_bans').insert({
        user_id: userId,
        action: 'kick',
        reason: reason || 'Kicked',
        moderator_id: moderatorId,
        moderator_email: moderatorEmail,
        channel_id: channelId || null,
        is_active: false, // kicks don't persist
    });

    // Remove from presence
    if (channelId) {
        await supabaseAdmin.from('chat_presence').delete()
            .eq('user_id', userId)
            .eq('channel_id', channelId);
    } else {
        await supabaseAdmin.from('chat_presence').delete().eq('user_id', userId);
    }

    return NextResponse.json({ success: true, message: 'User kicked' });
}

// ── Warn user ──
async function handleWarn(body: Record<string, string>) {
    const { userId, reason, moderatorId, moderatorEmail } = body;

    await supabaseAdmin.from('chat_bans').insert({
        user_id: userId,
        action: 'warn',
        reason: reason || 'Warning issued',
        moderator_id: moderatorId,
        moderator_email: moderatorEmail,
        is_active: false, // warnings don't restrict access
    });

    return NextResponse.json({ success: true, message: 'Warning issued' });
}

// ── Resolve a report ──
async function handleResolveReport(body: Record<string, string>) {
    const { reportId, resolution, status, reviewerId } = body;

    await supabaseAdmin.from('chat_reports').update({
        status: status || 'reviewed',
        resolution: resolution || '',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
    }).eq('id', reportId);

    return NextResponse.json({ success: true, message: 'Report resolved' });
}

// ── Heartbeat (presence ping) ──
async function handleHeartbeat(body: Record<string, string>) {
    const { userId, channelId, displayName, avatarColor, role } = body;

    await supabaseAdmin.from('chat_presence').upsert({
        user_id: userId,
        channel_id: channelId,
        display_name: displayName || 'User',
        avatar_color: avatarColor || '#6b7280',
        role: role || 'member',
        last_heartbeat: new Date().toISOString(),
    }, { onConflict: 'user_id,channel_id' });

    return NextResponse.json({ success: true });
}

// ── Report a user ──
async function handleReport(body: Record<string, string>) {
    const { reporterId, reporterEmail, reportedUserId, reportedUserEmail, messageId, messageContent, reason, details } = body;

    await supabaseAdmin.from('chat_reports').insert({
        reporter_id: reporterId,
        reporter_email: reporterEmail,
        reported_user_id: reportedUserId,
        reported_user_email: reportedUserEmail,
        message_id: messageId || null,
        message_content: messageContent || null,
        reason: reason || 'other',
        details: details || null,
        status: 'pending',
    });

    return NextResponse.json({ success: true, message: 'Report submitted' });
}
