// ═══════════════════════════════════════════
// api-sports.io v1 Baseball API Types
// ═══════════════════════════════════════════

export interface ApiSportsResponse<T> {
    get: string;
    parameters: Record<string, string>;
    errors: Record<string, string> | string[];
    results: number;
    response: T;
}

// ── Games ──────────────────────────────────

export interface GameTeam {
    id: number;
    name: string;
    logo: string;
}

export interface GameScoreInnings {
    [key: string]: number | null;
}

export interface GameScore {
    hits: number;
    errors: number;
    innings: GameScoreInnings;
    total: number | null;
}

export interface GameStatus {
    long: string;
    short: string;
}

export interface Game {
    id: number;
    date: string;
    time: string;
    timestamp: number;
    timezone: string;
    week: string | null;
    status: GameStatus;
    country: { id: number; name: string; code: string; flag: string };
    league: { id: number; name: string; type: string; logo: string; season: number };
    teams: {
        home: GameTeam;
        away: GameTeam;
    };
    scores: {
        home: GameScore;
        away: GameScore;
    };
}

// ── Team Statistics ────────────────────────

export interface TeamStatsWinLose {
    total: number;
    percentage: string;
}

export interface TeamStats {
    country: { id: number; name: string; code: string; flag: string };
    league: { id: number; name: string; type: string; logo: string; season: number };
    team: { id: number; name: string; logo: string };
    games: {
        played: { home: number; away: number; all: number };
        wins: {
            home: TeamStatsWinLose;
            away: TeamStatsWinLose;
            all: TeamStatsWinLose;
        };
        loses: {
            home: TeamStatsWinLose;
            away: TeamStatsWinLose;
            all: TeamStatsWinLose;
        };
    };
    points: {
        for: {
            total: { home: number; away: number; all: number };
            average: { home: string; away: string; all: string };
        };
        against: {
            total: { home: number; away: number; all: number };
            average: { home: string; away: string; all: string };
        };
    };
}

// ── Standings ──────────────────────────────

export interface Standing {
    position: number;
    stage: string;
    group: { name: string };
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; type: string; logo: string; season: number };
    country: { id: number; name: string; code: string; flag: string };
    games: {
        played: number;
        win: { total: number; percentage: string };
        lose: { total: number; percentage: string };
    };
    points: { for: number; against: number };
    form: string | null;
    description: string | null;
}

// ── Odds ───────────────────────────────────

export interface OddValue {
    value: string;
    odd: string;
}

export interface BookmakerBet {
    id: number;
    name: string;
    values: OddValue[];
}

export interface Bookmaker {
    id: number;
    name: string;
    bets: BookmakerBet[];
}

export interface OddsResponse {
    league: { id: number; name: string; type: string; logo: string; season: number };
    country: { id: number; name: string; code: string; flag: string };
    game: Game;
    bookmakers: Bookmaker[];
}

// ── League ─────────────────────────────────

export interface League {
    id: number;
    name: string;
    type: string;
    logo: string | null;
    country: { id: number; name: string; code: string; flag: string };
    seasons: { season: number; current: boolean; start: string; end: string }[];
}

// ═══════════════════════════════════════════
// MLB Stats API Types (statsapi.mlb.com)
// ═══════════════════════════════════════════

export interface MLBPitcherStats {
    era: string;
    whip: string;
    wins: number;
    losses: number;
    inningsPitched: string;
    strikeOuts: number;
    baseOnBalls: number;
    homeRuns: number;
    avg: string;
    gamesPlayed: number;
    gamesStarted: number;
    saves: number;
    hits: number;
    earnedRuns: number;
}

export interface MLBPlayer {
    id: number;
    fullName: string;
    primaryNumber?: string;
    primaryPosition: { code: string; name: string; type: string; abbreviation: string };
    pitchHand?: { code: string; description: string };
    batSide?: { code: string; description: string };
    stats?: MLBPitcherStats;
}

export interface MLBProbablePitcher {
    id: number;
    fullName: string;
    stats?: MLBPitcherStats;
    pitchHand?: { code: string; description: string };
    lastGameDate?: string;
    restDays?: number;
}

export interface MLBScheduleGame {
    gamePk: number;
    gameDate: string;
    status: { abstractGameState: string; detailedState: string };
    teams: {
        away: { team: { id: number; name: string }; probablePitcher?: { id: number; fullName: string } };
        home: { team: { id: number; name: string }; probablePitcher?: { id: number; fullName: string } };
    };
}

// ── Picks (Supabase) ──────────────────────

export interface Pick {
    id?: string;
    created_at?: string;
    created_by: string;
    game_id: number | null;
    home_team: string;
    away_team: string;
    pick_type: 'ML' | 'O/U' | 'Run Line' | string;
    pick_team: string;
    pick_value?: string;
    confidence: number;
    reason: string;
    notes: string;
    result: 'pending' | 'hit' | 'miss' | 'push';
    game_date: string;
}
