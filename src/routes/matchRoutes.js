import express from 'express';
import { fetchLiveMatches, scheduledMatchesController,  } from '../controllers/matchController.js';

const router = express.Router();

// GET /matches/live
router.get('/live', fetchLiveMatches);
// router.get('/schedulled', fetchFinishedMatches);
router.get('/scheduled-matches', scheduledMatchesController);


export default router;