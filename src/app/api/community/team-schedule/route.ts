import { NextRequest, NextResponse } from 'next/server';
import { getMLBTeamGames } from '@/lib/mlb-stats';

/**
 * Team Schedule API — Returns upcoming games for a specific team.
 * Used by the team search feature in the community page.
 */

// All 30 MLB teams with their IDs
const MLB_TEAMS: Array<{ id: number; name: string; abbr: string; city: string }> = [
    { id: 109, name: 'Arizona Diamondbacks', abbr: 'ARI', city: 'Arizona' },
    { id: 144, name: 'Atlanta Braves', abbr: 'ATL', city: 'Atlanta' },
    { id: 110, name: 'Baltimore Orioles', abbr: 'BAL', city: 'Baltimore' },
    { id: 111, name: 'Boston Red Sox', abbr: 'BOS', city: 'Boston' },
    { id: 112, name: 'Chicago Cubs', abbr: 'CHC', city: 'Chicago' },
    { id: 145, name: 'Chicago White Sox', abbr: 'CWS', city: 'Chicago' },
    { id: 113, name: 'Cincinnati Reds', abbr: 'CIN', city: 'Cincinnati' },
    { id: 114, name: 'Cleveland Guardians', abbr: 'CLE', city: 'Cleveland' },
    { id: 115, name: 'Colorado Rockies', abbr: 'COL', city: 'Colorado' },
    { id: 116, name: 'Detroit Tigers', abbr: 'DET', city: 'Detroit' },
    { id: 117, name: 'Houston Astros', abbr: 'HOU', city: 'Houston' },
    { id: 118, name: 'Kansas City Royals', abbr: 'KC', city: 'Kansas City' },
    { id: 108, name: 'Los Angeles Angels', abbr: 'LAA', city: 'Los Angeles' },
    { id: 119, name: 'Los Angeles Dodgers', abbr: 'LAD', city: 'Los Angeles' },
    { id: 146, name: 'Miami Marlins', abbr: 'MIA', city: 'Miami' },
    { id: 158, name: 'Milwaukee Brewers', abbr: 'MIL', city: 'Milwaukee' },
    { id: 142, name: 'Minnesota Twins', abbr: 'MIN', city: 'Minnesota' },
    { id: 121, name: 'New York Mets', abbr: 'NYM', city: 'New York' },
    { id: 147, name: 'New York Yankees', abbr: 'NYY', city: 'New York' },
    { id: 133, name: 'Oakland Athletics', abbr: 'OAK', city: 'Oakland' },
    { id: 143, name: 'Philadelphia Phillies', abbr: 'PHI', city: 'Philadelphia' },
    { id: 134, name: 'Pittsburgh Pirates', abbr: 'PIT', city: 'Pittsburgh' },
    { id: 135, name: 'San Diego Padres', abbr: 'SD', city: 'San Diego' },
    { id: 137, name: 'San Francisco Giants', abbr: 'SF', city: 'San Francisco' },
    { id: 136, name: 'Seattle Mariners', abbr: 'SEA', city: 'Seattle' },
    { id: 138, name: 'St. Louis Cardinals', abbr: 'STL', city: 'St. Louis' },
    { id: 139, name: 'Tampa Bay Rays', abbr: 'TB', city: 'Tampa Bay' },
    { id: 140, name: 'Texas Rangers', abbr: 'TEX', city: 'Texas' },
    { id: 141, name: 'Toronto Blue Jays', abbr: 'TOR', city: 'Toronto' },
    { id: 120, name: 'Washington Nationals', abbr: 'WSH', city: 'Washington' },
];

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')?.toLowerCase() || '';
    const teamId = req.nextUrl.searchParams.get('teamId');

    // If no teamId, return matching teams for autocomplete
    if (!teamId) {
        if (!query || query.length < 2) {
            return NextResponse.json({ teams: MLB_TEAMS });
        }
        const matches = MLB_TEAMS.filter(t =>
            t.name.toLowerCase().includes(query) ||
            t.abbr.toLowerCase().includes(query) ||
            t.city.toLowerCase().includes(query)
        );
        return NextResponse.json({ teams: matches });
    }

    // Fetch team schedule
    try {
        const allGames = await getMLBTeamGames(Number(teamId));
        const today = new Date().toISOString().split('T')[0];

        // Split into recent results (last 5 completed) and upcoming (next 10)
        const completed = allGames.filter(g => g.date < today && g.scores.home.total !== null);
        const upcoming = allGames.filter(g => g.date >= today);

        const team = MLB_TEAMS.find(t => t.id === Number(teamId));

        const formatGame = (g: typeof allGames[0]) => ({
            id: g.id,
            date: g.date,
            time: g.time,
            status: g.status,
            home: { name: g.teams.home.name, logo: g.teams.home.logo, score: g.scores.home.total },
            away: { name: g.teams.away.name, logo: g.teams.away.logo, score: g.scores.away.total },
            isHome: g.teams.home.id === Number(teamId),
        });

        return NextResponse.json({
            team,
            recentResults: completed.slice(-5).reverse().map(formatGame),
            upcoming: upcoming.slice(0, 10).map(formatGame),
        });
    } catch (error) {
        console.error('Team schedule error:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}
