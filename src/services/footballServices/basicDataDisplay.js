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
    const queryDate = date || new Date().toISOString().split('T')[0];

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

    // 🔽 Sort matches within each league by kickoff time
    leaguesMap.forEach((leagueData) => {
      leagueData.matches.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // 🥇 Featured leagues by ID (adjust based on your preference)
    const FEATURED_LEAGUE_IDS = [
      39,  // Premier League
      140, // La Liga
      135, // Serie A
      78,  // Bundesliga
      61,  // Ligue 1
      2,   // UEFA Champions League
    ];

    // 🔀 Sort leagues: featured first, then by earliest match time
    return Array.from(leaguesMap.values()).sort((a, b) => {
      const isAFeatured = FEATURED_LEAGUE_IDS.includes(a.league.id);
      const isBFeatured = FEATURED_LEAGUE_IDS.includes(b.league.id);

      if (isAFeatured && !isBFeatured) return -1;
      if (!isAFeatured && isBFeatured) return 1;

      // If both are featured or both are not, sort by earliest kickoff time
      return new Date(a.matches[0].date) - new Date(b.matches[0].date);
    });

  } catch (error) {
    throw new Error(
      error.response?.data?.errors?.token
        ? 'Authentication failed: Check your API key'
        : 'Failed to fetch scheduled matches. Please try again later.'
    );
  }
}





// =====================================Get all  matches starts here =========================================

const topLeagues = [
  "Premier League|England",
  "La Liga|Spain",
  "Bundesliga|Germany",
  "Serie A|Italy",
  "Ligue 1|France",
  "UEFA Champions League|Europe"
];

function groupAndSort(responseData) {
  const leaguesMap = new Map();

  responseData.forEach((match, index) => {
    try {
      if (!match?.league?.name || !match?.teams || !match?.fixture) {
        console.warn(`[DEBUG] Skipping match at index ${index} (incomplete data)`);
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

  return Array.from(leaguesMap.values()).sort((a, b) => {
    const aKey = `${a.league.name}|${a.league.country}`;
    const bKey = `${b.league.name}|${b.league.country}`;
    const aIndex = topLeagues.indexOf(aKey);
    const bIndex = topLeagues.indexOf(bKey);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    return a.league.name.localeCompare(b.league.name);
  });
}

// ------------------ MAIN FUNCTIONS ------------------

export async function getAllMatches(date) {
  try {
    console.log('[DEBUG] Fetching all matches for date:', date);
    const response = await api.get('/fixtures', {
      params: {
        date,
        timezone: 'Africa/Lagos',
      }
    });

    if (!response.data?.response) throw new Error('Unexpected API format');
    return groupAndSort(response.data.response);
  } catch (error) {
    console.error('[getAllMatches] Error:', error);
    throw new Error('Failed to fetch all matches.');
  }
}


// =====================================Get FNISHED  matches starts here =======================================

export async function getFinishedMatches(date) {
  try {
    console.log('[DEBUG] Fetching finished matches for date:', date);
    const statuses = ['FT', 'AET', 'PEN'];
    const promises = statuses.map(status =>
      api.get('/fixtures', {
        params: {
          date,
          timezone: 'Africa/Lagos',
          status
        }
      })
    );

    const responses = await Promise.all(promises);
    const combinedData = responses.flatMap(res => res.data?.response || []);
    return groupAndSort(combinedData);
  } catch (error) {
    console.error('[getFinishedMatches] Error:', error);
    throw new Error('Failed to fetch finished matches.');
  }
}













export async function getMatchDetails(fixtureId) {
  try {
    const [overviewRes, lineupRes, statsRes, oddsRes] = await Promise.all([
      api.get('/fixtures', { params: { id: fixtureId } }),
      api.get('/fixtures/lineups', { params: { fixture: fixtureId } }),
      api.get('/fixtures/statistics', { params: { fixture: fixtureId } }),
      api.get('/odds', { params: { fixture: fixtureId } })
    ]);

    const overviewData = overviewRes.data?.response?.[0];
    if (!overviewData) throw new Error('Fixture not found');

    const team1Id = overviewData.teams.home.id;
    const team2Id = overviewData.teams.away.id;

    const h2hRes = await api.get('/fixtures/headtohead', {
      params: { h2h: `${team1Id}-${team2Id}`, last: 5 }
    });

    return {
      fixture: {
        id: fixtureId,
        date: overviewData.fixture.date,
        venue: overviewData.fixture.venue,
        status: overviewData.fixture.status,
        teams: overviewData.teams,
        goals: overviewData.goals,
        score: overviewData.score,
        league: overviewData.league,
        events: overviewData.events || [],
      },
      lineups: lineupRes.data?.response || [],
      statistics: statsRes.data?.response || [],
      odds: oddsRes.data?.response?.[0] || null,
      h2h: h2hRes.data?.response || []
    };

  } catch (error) {
    console.error('[getMatchDetails] Error:', error.message);
    throw new Error('Failed to fetch match details');
  }
}
