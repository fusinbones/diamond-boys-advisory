import { NextRequest, NextResponse } from 'next/server';
import { analyzeGame } from '@/lib/gemini';
import { analyzeEdge, type TeamProfile, type OddsInput } from '@/lib/stat-engine';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { awayTeam, homeTeam, gameDate, odds, homeStats, awayStats, pitchers, engine } = body;

        if (!awayTeam || !homeTeam) {
            return NextResponse.json({ error: 'awayTeam and homeTeam required' }, { status: 400 });
        }

        // If engine is 'stats', run the statistical edge engine first
        let edgeReport = undefined;
        if (engine === 'stats' && odds) {
            // Build team profiles from available data
            const homeRecord = (homeStats?.record || '0-0').split('-').map(Number);
            const awayRecord = (awayStats?.record || '0-0').split('-').map(Number);

            const homeProfile: TeamProfile = {
                name: homeTeam,
                record: homeStats?.record || '0-0',
                wins: homeRecord[0] || 0,
                losses: homeRecord[1] || 0,
                recentForm: (homeStats?.recentSequence || '').split('-').filter(Boolean) as string[],
                isHome: true,
                pitcherERA: pitchers?.home?.era,
                pitcherWHIP: pitchers?.home?.whip,
                pitcherName: pitchers?.home?.name,
            };

            const awayProfile: TeamProfile = {
                name: awayTeam,
                record: awayStats?.record || '0-0',
                wins: awayRecord[0] || 0,
                losses: awayRecord[1] || 0,
                recentForm: (awayStats?.recentSequence || '').split('-').filter(Boolean) as string[],
                isHome: false,
                pitcherERA: pitchers?.away?.era,
                pitcherWHIP: pitchers?.away?.whip,
                pitcherName: pitchers?.away?.name,
            };

            const oddsInput: OddsInput = {
                homeML: odds.moneyline?.home || -110,
                awayML: odds.moneyline?.away || -110,
                spreadLine: odds.spread?.line,
                spreadHomeOdds: odds.spread?.homeOdds,
                spreadAwayOdds: odds.spread?.awayOdds,
                totalLine: odds.total?.line,
                overOdds: odds.total?.overOdds,
                underOdds: odds.total?.underOdds,
            };

            edgeReport = analyzeEdge(homeProfile, awayProfile, oddsInput);
        }

        const analysis = await analyzeGame({
            awayTeam,
            homeTeam,
            gameDate: gameDate || new Date().toISOString().split('T')[0],
            odds,
            homeStats,
            awayStats,
            pitchers,
            engine: engine || 'pattern',
            edgeReport,
        });

        return NextResponse.json({
            analysis,
            edgeReport: engine === 'stats' ? edgeReport : undefined,
        });
    } catch (error) {
        console.error('AI analyze error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Analysis failed' },
            { status: 500 }
        );
    }
}
