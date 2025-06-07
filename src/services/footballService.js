import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY
  },
  timeout: 10000
});

export async function getLiveMatches() {
  try {
    console.log('[DEBUG] Starting getLiveMatches()...');

    if (!process.env.API_FOOTBALL_KEY) {
      console.error('[DEBUG] Missing API key:', process.env.API_FOOTBALL_KEY);
      throw new Error('API_FOOTBALL_KEY is missing from environment variables');
    } else {
      console.log('[DEBUG] Loaded API key starts with:', process.env.API_FOOTBALL_KEY.slice(0, 5));
    }

    console.log('[DEBUG] Sending GET request to /fixtures...');
    const response = await api.get('/fixtures', {
      params: {
        live: 'all',
        timezone: 'Africa/Lagos',
        _: process.env.NODE_ENV === 'development' ? Date.now() : undefined
      }
    });

    console.log('[DEBUG] API response received.');

    if (!response.data?.response) {
      console.error('[DEBUG] Invalid API response:', response.data);
      throw new Error('API returned unexpected data structure');
    }

    console.log(`[DEBUG] Matches found: ${response.data.response.length}`);

    const leaguesMap = new Map();

    response.data.response.forEach((match, index) => {
      try {
        if (!match?.league?.name || !match?.teams || !match?.fixture) {
          console.warn(`[DEBUG] Skipping incomplete match at index ${index}`);
          return;
        }

        const leagueKey = `${match.league.name}|${match.league.country || 'International'}`;

        if (!leaguesMap.has(leagueKey)) {
          leaguesMap.set(leagueKey, {
            league: {
              id: match.league.id,
              name: match.league.name,
              country: match.league.country || "International",
              logo: match.league.logo,
              flag: match.league.flag,
              season: match.league.season
            },
            matches: []
          });
        }

        leaguesMap.get(leagueKey).matches.push({
          id: match.fixture.id,
          status: match.fixture.status.short,
          elapsed: match.fixture.status.elapsed || 0,
          venue: match.fixture.venue?.name || 'Unknown venue',
          date: match.fixture.date,
          teams: {
            home: {
              id: match.teams.home.id,
              name: match.teams.home.name,
              logo: match.teams.home.logo,
              winner: match.teams.home.winner
            },
            away: {
              id: match.teams.away.id,
              name: match.teams.away.name,
              logo: match.teams.away.logo,
              winner: match.teams.away.winner
            }
          },
          score: {
            current: {
              home: match.goals.home,
              away: match.goals.away
            },
            halftime: match.score.halftime,
            fulltime: match.score.fulltime
          },
          events: match.events
        });

      } catch (matchError) {
        console.error(`[DEBUG] Error processing match ${index}:`, matchError);
      }
    });

    const result = Array.from(leaguesMap.values())
      .sort((a, b) => a.league.name.localeCompare(b.league.name));

    console.log(`[DEBUG] Successfully processed ${result.length} leagues`);
    return result;

  } catch (error) {
    const errorDetails = {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        params: error.config?.params,
        headers: {
          ...error.config?.headers,
          'x-apisports-key': 'REDACTED'
        }
      },
      response: {
        status: error.response?.status,
        data: error.response?.data
      }
    };

    console.error('[FootballService] Critical API Error:', errorDetails);

    throw new Error(
      error.response?.data?.errors?.token
        ? 'Authentication failed: Check your API key'
        : 'Failed to fetch live matches. Please try again later.'
    );
  }
}


// =====================================Scheduled matches starts here =========================================
export async function getScheduledMatches(date) {
  try {
    const queryDate = date || new Date().toISOString().split('T')[0]; // default to today

    if (!process.env.API_FOOTBALL_KEY) {
      throw new Error('API_FOOTBALL_KEY is missing from environment variables');
    }

    const response = await api.get('/fixtures', {
      params: {
        status: 'NS',
        timezone: 'Africa/Lagos',
        date: queryDate,
        _: process.env.NODE_ENV === 'development' ? Date.now() : undefined
      }
    });

    if (!response.data?.response) {
      throw new Error('API returned unexpected data structure');
    }

    const leaguesMap = new Map();

    response.data.response.forEach((match) => {
      if (!match?.league?.name || !match?.teams || !match?.fixture) return;

      const leagueKey = `${match.league.name}|${match.league.country || 'International'}`;

      if (!leaguesMap.has(leagueKey)) {
        leaguesMap.set(leagueKey, {
          league: {
            id: match.league.id,
            name: match.league.name,
            country: match.league.country || "International",
            logo: match.league.logo,
            flag: match.league.flag,
            season: match.league.season
          },
          matches: []
        });
      }

      leaguesMap.get(leagueKey).matches.push({
        id: match.fixture.id,
        status: match.fixture.status.short,
        elapsed: match.fixture.status.elapsed || 0,
        venue: match.fixture.venue?.name || 'Unknown venue',
        date: match.fixture.date,
        teams: {
          home: {
            id: match.teams.home.id,
            name: match.teams.home.name,
            logo: match.teams.home.logo,
            winner: match.teams.home.winner
          },
          away: {
            id: match.teams.away.id,
            name: match.teams.away.name,
            logo: match.teams.away.logo,
            winner: match.teams.away.winner
          }
        },
        score: {
          current: {
            home: match.goals.home,
            away: match.goals.away
          },
          halftime: match.score.halftime,
          fulltime: match.score.fulltime
        },
        events: match.events || []
      });
    });

    return Array.from(leaguesMap.values())
      .sort((a, b) => a.league.name.localeCompare(b.league.name));

  } catch (error) {
    throw new Error(
      error.response?.data?.errors?.token
        ? 'Authentication failed: Check your API key'
        : 'Failed to fetch scheduled matches. Please try again later.'
    );
  }
}