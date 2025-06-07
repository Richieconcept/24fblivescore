import { getLiveMatches } from '../services/footballService.js';
import { CACHE_TTL } from '../config/constants.js'; // Add this line
import { getScheduledMatches } from '../services/footballService.js';
import cache from 'memory-cache';

export async function fetchLiveMatches(req, res) {
  try {
    // Check cache first
    const cachedMatches = cache.get('live-matches');
    if (cachedMatches) {
      return res.json(filterMatches(cachedMatches, req.query));
    }

    // Fetch fresh data
    const matches = await getLiveMatches();
    cache.put('live-matches', matches, CACHE_TTL);

    res.json(filterMatches(matches, req.query));
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch live matches',
      details: error.message 
    });
  }
}

// Helper: Apply query filters
function filterMatches(matches, { league, country }) {
  let result = [...matches];
  
  if (league) {
    result = result.filter(m => 
      m.league.toLowerCase().includes(league.toLowerCase())
    );
  }

  if (country) {
    result = result.filter(m => 
      m.country.toLowerCase().includes(country.toLowerCase())
    );
  }

  return result;
}


// ===================================scheduled match function starts here===========================

export async function scheduledMatchesController(req, res) {
  try {
    const { date } = req.query;  // e.g. 2025-06-07

    const matches = await getScheduledMatches(date);
    
    res.status(200).json(matches);
  } catch (error) {
    console.error('[Controller] Error fetching scheduled matches:', error.message);
    res.status(500).json({ error: error.message });
  }
}

