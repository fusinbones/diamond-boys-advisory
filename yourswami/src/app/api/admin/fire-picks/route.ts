import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPickAlert } from '@/lib/email';
import { sendFirePickSms } from '@/lib/ghlSms';
import { getAdminUser } from '@/lib/adminApiAuth';

// Give the post-response notification fan-out (email + SMS) headroom to finish.
export const maxDuration = 60;

// Statuses whose pick details are already public (revealed / graded).
const DECIDED = new Set(['won', 'lost', 'push', 'win', 'loss', 'revealed']);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabaseAdmin
            .from('fire_picks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        // This GET is publicly reachable (the track-record widget reads it), so
        // non-admins must never see UNREVEALED premium picks. Redact the pick
        // details of any pick that isn't decided/revealed yet.
        const admin = await getAdminUser(request);
        let firePicks = data || [];
        if (!admin) {
            firePicks = firePicks.map((p) => {
                if (DECIDED.has(String(p.status || '').toLowerCase())) return p;
                return {
                    id: p.id,
                    status: p.status,
                    result: p.result ?? null,
                    scheduled_at: p.scheduled_at ?? null,
                    created_at: p.created_at ?? null,
                    sport: p.sport ?? null,
                    redacted: true,
                };
            });
        }

        return NextResponse.json({ firePicks });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

interface FirePickBody {
    game_id?: string;
    matchup: string;
    sport: string;
    pick_type: string;
    pick_team: string;
    pick_value: string;
    odds?: string;
    confidence?: number;
    units?: number;
    reasoning?: string;
    pattern_data?: Record<string, unknown>;
    pattern_break_game?: number;
    scheduled_at: string;
}

export async function POST(req: NextRequest) {
    try {
        const body: FirePickBody = await req.json();

        if (!body.matchup || !body.pick_type || !body.pick_team || !body.pick_value || !body.scheduled_at) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('fire_picks')
            .insert({
                game_id: body.game_id || null,
                matchup: body.matchup,
                sport: body.sport || 'MLB',
                pick_type: body.pick_type,
                pick_team: body.pick_team,
                pick_value: body.pick_value,
                odds: body.odds || null,
                confidence: body.confidence || 85,
                units: body.units || 3,
                reasoning: body.reasoning || null,
                pattern_data: body.pattern_data || null,
                pattern_break_game: body.pattern_break_game || 7,
                scheduled_at: body.scheduled_at,
                status: 'scheduled',
            })
            .select()
            .single();

        if (error) throw error;

        const pickData = {
            matchup: body.matchup,
            pickTeam: body.pick_team,
            pickValue: body.pick_value,
            pickType: body.pick_type,
            confidence: body.confidence || 85,
            scheduledAt: body.scheduled_at,
        };

        // Fan out notifications AFTER the response is sent. `after()` keeps the
        // serverless function alive until these settle (a plain fire-and-forget
        // promise can be killed once the response returns on Vercel).
        after(async () => {
            // Email: opted-in emails live in our Supabase pick_subscribers table.
            try {
                const { data: subscribers } = await supabaseAdmin
                    .from('pick_subscribers')
                    .select('email')
                    .eq('active', true);
                const emails = (subscribers || []).map((s: { email: string }) => s.email).filter(Boolean);
                if (emails.length > 0) {
                    await sendPickAlert(emails, pickData);
                }
            } catch (emailErr) {
                console.error('[Email] Pick alert failed:', emailErr);
            }

            // SMS: opted-in phones live in GoHighLevel (chat widget is sole
            // opt-in collector); sendFirePickSms fetches the tagged contacts.
            try {
                // The result used to be discarded, so a blast where every message
                // was rejected by the carrier looked identical to one that landed.
                const r = await sendFirePickSms(pickData);
                if (r.failed > 0) {
                    console.error(
                        `[SMS] Pick alert: ${r.sent}/${r.total} delivered, ${r.failed} FAILED. Check the blast summary above for carrier errors.`,
                    );
                } else if (r.total === 0) {
                    console.warn('[SMS] Pick alert: no entitled opted-in subscribers to text.');
                } else {
                    console.log(`[SMS] Pick alert delivered to ${r.sent}/${r.total} subscribers.`);
                }
            } catch (smsErr) {
                console.error('[SMS] Pick alert failed:', smsErr);
            }
        });

        return NextResponse.json({ firePick: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing fire pick ID' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('fire_picks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ firePick: data });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        let id = searchParams.get('id');

        if (!id) {
            const body = await req.json().catch(() => ({}));
            id = body.id;
        }

        if (!id) {
            return NextResponse.json({ error: 'Missing fire pick ID' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('fire_picks')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
