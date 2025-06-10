import { getLiveMatches } from '../services/footballServices/basicDataDisplay.js';
import { CACHE_TTL } from '../config/constants.js'; // Add this line
import { getScheduledMatches, getAllMatches, getFinishedMatches, getMatchDetails,} from '../services/footballServices/basicDataDisplay.js';
import cache from 'memory-cache';
import { format } from 'date-fns'; 

// export async function fetchLiveMatches(req, res) {
//   try {
//     // Check cache first
//     const cachedMatches = cache.get('live-matches');
//     if (cachedMatches) {
//       return res.json(filterMatches(cachedMatches, req.query));
//     }

//     // Fetch fresh data
//     const matches = await getLiveMatches();
//     cache.put('live-matches', matches, CACHE_TTL);

//     res.json(filterMatches(matches, req.query));
//   } catch (error) {
//     res.status(500).json({ 
//       error: 'Failed to fetch live matches',
//       details: error.message 
//     });
//   }
// }

// // Helper: Apply query filters
// function filterMatches(matches, { league, country }) {
//   let result = [...matches];
  
//   if (league) {
//     result = result.filter(m => 
//       m.league.toLowerCase().includes(league.toLowerCase())
//     );
//   }

//   if (country) {
//     result = result.filter(m => 
//       m.country.toLowerCase().includes(country.toLowerCase())
//     );
//   }

//   return result;
// }


// // ===================================scheduled match function starts here===========================

// export async function scheduledMatchesController(req, res) {
//   try {
//     const { date } = req.query;  // e.g. 2025-06-07

//     const matches = await getScheduledMatches(date);
    
//     res.status(200).json(matches);
//   } catch (error) {
//     console.error('[Controller] Error fetching scheduled matches:', error.message);
//     res.status(500).json({ error: error.message });
//   }
// }
// ==========================Get Live matches starts here==================================

export const getLiveMatchesController = async (req, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd'); // Use server date (or use plain `new Date().toISOString().slice(0, 10)`)

    console.log(`[CONTROLLER] Fetching live matches for ${today}`);
    const liveMatches = await getLiveMatches(today);
    res.status(200).json({ data: liveMatches });
  } catch (error) {
    console.error('[CONTROLLER] Error fetching live matches:', error.message);
    res.status(500).json({ error: 'Failed to retrieve live matches' });
  }
};

// ==========================Get Live matches starts here==================================


export const getScheduledMatchesController = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Missing required query parameter: date (YYYY-MM-DD)' });
  }

  try {
    console.log(`[CONTROLLER] Fetching scheduled matches for ${date}`);
    const scheduledMatches = await getScheduledMatches(date);
    res.status(200).json({
      success: true,
      date,
      totalLeagues: scheduledMatches.length,
      data: scheduledMatches,
    });
  } catch (error) {
    console.error('[CONTROLLER] Error fetching scheduled matches:', error.message);
    res.status(500).json({ error: 'Failed to retrieve scheduled matches' });
  }
};



// ==========================Get all matches starts here==================================

export async function fetchAllMatchesController(req, res) {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ error: 'Missing required query parameter: date' });
    }

    const data = await getAllMatches(date);
    res.status(200).json({
      success: true,
      date,
      totalLeagues: data.length,
      data,
    });
  } catch (error) {
    console.error('[fetchAllMatchesController] Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all matches. Please try again later.',
    });
  }
}



// ==========================Get FINISHED matches starts here==================================


export const getFinishedMatchesController = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Missing required query parameter: date (YYYY-MM-DD)' });
  }

  try {
    console.log(`[CONTROLLER] Fetching finished matches for ${date}`);
    const finishedMatches = await getFinishedMatches(date);
    res.status(200).json({ data: finishedMatches });
  } catch (error) {
    console.error('[CONTROLLER] Error fetching finished matches:', error.message);
    res.status(500).json({ error: 'Failed to retrieve finished matches' });
  }
};








// ====================Get Full matches details like lineups, stats, and others starts here======================

// import { getMatchDetails } from '../services/footballServices/matchDetails.js';

export async function getMatchDetailsController(req, res) {
  const { fixtureId } = req.query;

  if (!fixtureId) {
    return res.status(400).json({ success: false, error: 'Missing fixtureId in query' });
  }

  try {
    const data = await getMatchDetails(fixtureId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Controller] Match detail error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch match details' });
  }
}

