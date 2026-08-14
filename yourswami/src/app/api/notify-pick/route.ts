import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notify-pick
 * Registers a user for pick-drop notification.
 * Stores preference and sends confirmation email.
 */
export async function POST(request: NextRequest) {
    try {
        const { email, sports, pickCount } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const sportsLabel = sports || 'MLB';
        const pickLabel = pickCount && pickCount > 0 ? `${pickCount} upcoming` : 'new';

        // Lazy-init Supabase to avoid build-time env var issues
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        );

        // Store the notification preference (best-effort)
        try {
            await supabase
                .from('pick_notifications')
                .upsert(
                    {
                        email,
                        sports: sportsLabel,
                        pick_count: pickCount || 0,
                        notified_at: new Date().toISOString(),
                        active: true,
                    },
                    { onConflict: 'email' }
                );
        } catch (dbErr) {
            console.log('Notification upsert skipped:', dbErr);
        }

        // Send confirmation email via Supabase Auth (best-effort)
        try {
            const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (supaUrl && svcKey) {
                await fetch(`${supaUrl}/auth/v1/admin/generate_link`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': svcKey,
                        'Authorization': `Bearer ${svcKey}`,
                    },
                    body: JSON.stringify({
                        type: 'magiclink',
                        email,
                        data: { notification_type: 'pick_drop', sports: sportsLabel },
                    }),
                });
            }
        } catch (emailErr) {
            console.log('Email notification best-effort:', emailErr);
        }

        return NextResponse.json({ 
            success: true, 
            message: `You'll be notified when ${pickLabel} ${sportsLabel} picks drop!`,
        });
    } catch (error) {
        console.error('Notify pick error:', error);
        return NextResponse.json(
            { error: 'Failed to set notification' },
            { status: 500 }
        );
    }
}
