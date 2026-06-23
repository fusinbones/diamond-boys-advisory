/**
 * TriplePlayz Pattern System — Detailed Backtest
 * Shows every break event with team, opponent, home/away, game #, and result
 * 
 * Usage: npx tsx scratch/backtest-patterns.ts
 */

const MLB_API = 'https://statsapi.mlb.com/api/v1';

interface GameResult {
    date: string;
    result: 'W' | 'L';
    teamId: number;
    teamName: string;
    opponent: string;
    isHome: boolean;
}

interface BreakEvent {
    teamName: string;
    opponent: string;
    isHome: boolean;
    streakLength: number;
    prediction: 'W' | 'L';
    actual: 'W' | 'L';
    hit: boolean;
    date: string;
    broke: boolean;
}

async function fetchSeason(year: number): Promise<Record<number, GameResult[]>> {
    const startDate = `${year}-03-20`;
    const endDate = `${year}-10-01`;
    
    console.log(`Fetching ${year} season data...`);
    
    const res = await fetch(
        `${MLB_API}/schedule?sportId=1&startDate=${startDate}&endDate=${endDate}&hydrate=linescore,team&gameType=R`
    );
    
    if (!res.ok) throw new Error(`MLB API error: ${res.status}`);
    const data: any = await res.json();
    
    const teamResults: Record<number, GameResult[]> = {};
    
    for (const date of data.dates || []) {
        for (const game of date.games || []) {
            if (game.status?.abstractGameState !== 'Final') continue;
            const ds = game.status?.detailedState;
            if (ds === 'Postponed' || ds === 'Cancelled' || ds === 'Suspended') continue;
            
            const homeId = game.teams?.home?.team?.id;
            const awayId = game.teams?.away?.team?.id;
            const homeRuns = game.teams?.home?.score ?? game.linescore?.teams?.home?.runs ?? 0;
            const awayRuns = game.teams?.away?.score ?? game.linescore?.teams?.away?.runs ?? 0;
            const homeName = game.teams?.home?.team?.name || 'Unknown';
            const awayName = game.teams?.away?.team?.name || 'Unknown';
            
            if (homeRuns === awayRuns) continue;
            
            if (homeId) {
                if (!teamResults[homeId]) teamResults[homeId] = [];
                teamResults[homeId].push({
                    date: game.officialDate || date.date,
                    result: homeRuns > awayRuns ? 'W' : 'L',
                    teamId: homeId,
                    teamName: homeName,
                    opponent: awayName,
                    isHome: true,
                });
            }
            if (awayId) {
                if (!teamResults[awayId]) teamResults[awayId] = [];
                teamResults[awayId].push({
                    date: game.officialDate || date.date,
                    result: awayRuns > homeRuns ? 'W' : 'L',
                    teamId: awayId,
                    teamName: awayName,
                    opponent: homeName,
                    isHome: false,
                });
            }
        }
    }
    
    for (const teamId of Object.keys(teamResults)) {
        teamResults[Number(teamId)].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    }
    
    return teamResults;
}

function findBreakEvents(games: GameResult[]): BreakEvent[] {
    const events: BreakEvent[] = [];
    
    for (let i = 1; i < games.length - 1; i++) {
        // Count alternation streak ending at game i
        let altStreak = 0;
        if (games[i].result !== games[i - 1].result) {
            altStreak = 1;
            for (let j = i; j >= 1; j--) {
                if (games[j].result !== games[j - 1].result) {
                    altStreak++;
                } else {
                    break;
                }
            }
        }
        
        if (altStreak < 4) continue;
        
        // Break prediction: next game = SAME as current (pattern breaks)
        const prediction = games[i].result;
        const nextGame = games[i + 1];
        const actual = nextGame.result;
        const broke = prediction === actual; // pattern broke = hit
        
        events.push({
            teamName: nextGame.teamName,
            opponent: nextGame.opponent,
            isHome: nextGame.isHome,
            streakLength: altStreak,
            prediction,
            actual,
            hit: broke,
            date: nextGame.date,
            broke,
        });
    }
    
    return events;
}

async function main() {
    const allEvents: BreakEvent[] = [];
    
    for (const year of [2022, 2023, 2024, 2025, 2026]) {
        try {
            const teamResults = await fetchSeason(year);
            for (const teamId of Object.keys(teamResults)) {
                const games = teamResults[Number(teamId)];
                const events = findBreakEvents(games);
                allEvents.push(...events);
            }
            console.log(`  ${year}: done (${allEvents.length} total events)`);
        } catch (err) {
            console.log(`  ${year}: skipped (${err instanceof Error ? err.message : 'error'})`);
        }
    }
    
    // Filter to Gm 5-12 only
    const gm5to12 = allEvents.filter(e => e.streakLength >= 5 && e.streakLength <= 12);
    
    console.log(`\n${'═'.repeat(120)}`);
    console.log(`  TRIPLEPLAYZ PATTERN SYSTEM — GM 5-12 DETAILED BREAK LOG`);
    console.log(`  ${gm5to12.length} total events across 2022-2026`);
    console.log(`${'═'.repeat(120)}\n`);
    
    // Summary table by game number
    console.log('  SUMMARY BY GAME #');
    console.log('  ─────────────────────────────────────────────');
    const byGame: Record<number, { hits: number; total: number }> = {};
    for (const e of gm5to12) {
        if (!byGame[e.streakLength]) byGame[e.streakLength] = { hits: 0, total: 0 };
        byGame[e.streakLength].total++;
        if (e.hit) byGame[e.streakLength].hits++;
    }
    
    let totalHits = 0, totalAll = 0;
    for (let gm = 5; gm <= 12; gm++) {
        const d = byGame[gm];
        if (!d) continue;
        const rate = ((d.hits / d.total) * 100).toFixed(1);
        const bar = '█'.repeat(Math.round(d.hits / d.total * 20));
        console.log(`  Gm ${String(gm).padStart(2)} | ${String(d.total).padStart(4)} games | ${String(d.hits).padStart(4)} breaks | ${rate.padStart(5)}% | ${bar}`);
        totalHits += d.hits;
        totalAll += d.total;
    }
    console.log(`  ─────────────────────────────────────────────`);
    console.log(`  TOTAL | ${String(totalAll).padStart(4)} games | ${String(totalHits).padStart(4)} breaks | ${((totalHits/totalAll)*100).toFixed(1).padStart(5)}%`);
    
    // Detailed log sorted by game number, then date
    console.log(`\n\n  DETAILED GAME LOG (Gm 5-12)`);
    console.log(`  ${'─'.repeat(115)}`);
    console.log(`  ${'Date'.padEnd(12)} | ${'Team'.padEnd(24)} | ${'H/A'.padEnd(4)} | ${'Opponent'.padEnd(24)} | ${'Gm#'.padEnd(4)} | ${'Pred'.padEnd(5)} | ${'Actual'.padEnd(6)} | Result`);
    console.log(`  ${'─'.repeat(115)}`);
    
    const sorted = [...gm5to12].sort((a, b) => {
        if (a.streakLength !== b.streakLength) return a.streakLength - b.streakLength;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    let currentGm = 0;
    for (const e of sorted) {
        if (e.streakLength !== currentGm) {
            currentGm = e.streakLength;
            const gmData = byGame[currentGm];
            console.log(`\n  ── GM ${currentGm} (${gmData.hits}/${gmData.total} = ${((gmData.hits/gmData.total)*100).toFixed(1)}%) ──`);
        }
        
        const loc = e.isHome ? 'HOME' : 'AWAY';
        const result = e.hit ? '✅ BROKE' : '❌ HELD';
        const shortName = e.teamName.split(' ').pop() || e.teamName;
        const shortOpp = e.opponent.split(' ').pop() || e.opponent;
        
        console.log(`  ${e.date.padEnd(12)} | ${shortName.padEnd(24)} | ${loc.padEnd(4)} | ${shortOpp.padEnd(24)} | ${String(e.streakLength).padEnd(4)} | ${e.prediction.padEnd(5)} | ${e.actual.padEnd(6)} | ${result}`);
    }
    
    console.log(`\n${'═'.repeat(120)}`);
}

main().catch(console.error);
